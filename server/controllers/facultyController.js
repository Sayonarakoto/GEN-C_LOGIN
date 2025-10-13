const mongoose = require('mongoose');
const LateEntry = require('../models/LateEntry');
const Faculty = require('../models/Faculty');
const Student = require('../models/student'); // Import Student model

// Controller to get dashboard statistics for faculty
const getDashboardStats = async (req, res) => {
  console.log('--- DEBUG: Entering getDashboardStats ---');
  try {
    console.log('DEBUG: req.user object in getDashboardStats:', JSON.stringify(req.user, null, 2));
    const { department, role, id } = req.user; // Get department, role, and id from JWT

    if (!department) {
        throw new Error('User department is missing for stats calculation.');
    }

    // Base query must always include the department filter
    const baseQuery = { department: department };

    // Determine what "Pending" means for this user
    let pendingFilter = { ...baseQuery };

    if (role === 'faculty') {
        pendingFilter.facultyId = new mongoose.Types.ObjectId(id); // ✅ Add the assignment filter for the count
        // Faculty's pending queue (excluding HOD queue)
        pendingFilter.status = { $in: ['Pending Faculty', 'Resubmitted'] };
    } else if (role === 'HOD') {
        // HOD's pending queue
        pendingFilter.status = { $in: ['Pending HOD', 'Pending Faculty', 'Resubmitted'] };
    } else {
        // Student or other roles shouldn't be here, but handle defensively
        pendingFilter.status = 'N/A';
    }


    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [pendingCount, todayEntryCount, approvedCount, alertsCount] = await Promise.all([
        // 1. Pending Count (Filtered by Role/Department)
        LateEntry.countDocuments(pendingFilter),

        // 2. Today Entry Count (Filtered by Department)
        LateEntry.countDocuments({ 
            ...baseQuery,
            date: { $gte: todayStart, $lte: todayEnd } 
        }),

        // 3. Approved Count (Filtered by Department - Show all final approvals)
        LateEntry.countDocuments({ ...baseQuery, status: 'Approved' }),

        // 4. Alerts Count (Resubmitted entries for this faculty)
        LateEntry.countDocuments({ 
            ...baseQuery,
            facultyId: new mongoose.Types.ObjectId(id),
            status: 'Resubmitted'
        })
    ]);

    const statsData = {
        pending: pendingCount,
        todayEntry: todayEntryCount,
        approved: approvedCount,
        alerts: alertsCount,
    };

    console.log('DEBUG: getDashboardStats returning:', JSON.stringify(statsData, null, 2));

    res.json({
      success: true,
      data: statsData,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// Controller to get distinct departments based on user role
const getDistinctDepartments = async (req, res) => {
  try {
    const { role, department } = req.user; // Get role and department from the verified token

    if (role === 'faculty' || role === 'hod') {
      // Faculty/HOD can only see their own department for filtering
      return res.json({ success: true, data: [department] });
    }
    // If a Super-Admin/HOD needs to see all departments for a high-level view
    /*
    if (role === 'superadmin') {
        const departments = await Student.distinct('department');
        return res.json({ success: true, data: departments });
    }
    */

    // Default: return nothing if role is not authorized for department viewing
    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching distinct departments:', error);
    res.status(500).json({ success: false, message: 'Error fetching distinct departments' });
  }
};

const getFacultyByDepartment = async (req, res) => {
  try {
    const { department } = req.params; // e.g., 'CT' from the URL
    
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    // CRITICAL FIX: Use a case-insensitive regex query
    const departmentRegex = new RegExp(`^${department}`, 'i');

    const facultyList = await Faculty.find({ 
        department: departmentRegex 
    })
    .select('_id fullName employeeId'); // Selects minimal data for efficiency
    
    // Check if any faculty were found
    if (facultyList.length === 0) {
         console.log(`Warning: No faculty found for department '${department}' using case-insensitive search.`);
    }

    res.json({ success: true, data: facultyList });
  } catch (error) {
    console.error('Error fetching faculty by department:', error);
    res.status(500).json({ success: false, message: 'Error fetching faculty' });
  }
};

const getHODByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    console.log(`[getHODByDepartment] Received department param: ${department}`); // DEBUG: Log entry

    if (!department) {
      console.log('[getHODByDepartment] Department param is missing.');
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    // ✅ FIX 1: Department Regex (case-insensitive and exact match)
    const departmentRegex = new RegExp(`^${department}`, 'i'); 
    console.log(`[getHODByDepartment] Using department regex: ${departmentRegex}`); // DEBUG: Log regex

    // ✅ FIX 2: Designation Regex (case-insensitive and exact match)
    const designationRegex = new RegExp('^HOD', 'i');
    
    const hod = await Faculty.findOne({
      department: departmentRegex,
      designation: designationRegex, // Use the new case-insensitive regex
    }).select('_id fullName employeeId');

    console.log(`[getHODByDepartment] Query result for HOD: ${hod ? hod.fullName : 'Not Found'}`); // DEBUG: Log result

    if (!hod) {
      // This is the source of the 404 if the route is successfully hit but no HOD is found in the DB.
      return res.status(404).json({ success: false, message: 'HOD not found for this department.' });
    }

    res.json({ success: true, data: hod });
  } catch (error) {
    console.error('[getHODByDepartment] Error fetching HOD by department:', error);
    res.status(500).json({ success: false, message: 'Error fetching HOD' });
  }
};


const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find({}).select('_id fullName designation department');
    res.json({ success: true, data: facultyList });
  } catch (error) {
    console.error('Error fetching all faculty:', error);
    res.status(500).json({ success: false, message: 'Error fetching all faculty' });
  }
};

// @desc    Get all faculty members (including HODs) in the current user's department
// @route   GET /api/faculty/department-members
// @access  Private (Faculty, HOD)
const getDepartmentMembers = async (req, res) => {
  try {
    const { department } = req.user; // Get department from the authenticated user

    if (!department) {
      return res.status(400).json({ success: false, message: 'User department is missing.' });
    }

    const departmentMembers = await Faculty.find({ department: department })
      .select('_id fullName designation email profilePictureUrl'); // Select relevant fields

    res.json({ success: true, data: departmentMembers });
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({ success: false, message: 'Error fetching department members' });
  }
};

// @desc    Get students by department with search and pagination
// @route   GET /api/faculty/students
// @access  Private (Faculty, HOD)
const getStudentsByDepartment = async (req, res) => {
  try {
    const { department, search, page = 1, limit = 5 } = req.query;

    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }

    const query = { department: department };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.find(query)
      .select('_id fullName studentId department year')
      .skip(skip)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments(query);

    res.json({ success: true, students, totalStudents });
  } catch (error) {
    console.error('Error fetching students by department:', error);
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
};

const updateFacultyProfile = async (req, res) => {
  try {
    const { fullName, department, designation, email, profilePictureUrl } = req.body;
    const faculty = await Faculty.findById(req.user.id);

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    faculty.fullName = fullName;
    faculty.department = department;
    faculty.designation = designation;
    faculty.email = email;
    faculty.profilePictureUrl = profilePictureUrl;

    await faculty.save();

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating faculty profile:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ success: false, message: 'Email already in use. Please use a different email.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  getDashboardStats, 
  getDistinctDepartments, 
  getFacultyByDepartment, 
  getHODByDepartment, 
  getAllFaculty, 
  getDepartmentMembers, 
  getStudentsByDepartment, // Export the new function
  updateFacultyProfile
};