const Student = require('../models/student');
const SpecialPass = require('../models/SpecialPass');
const LateEntry = require('../models/LateEntry');
const GatePass = require('../models/GatePass');
const dayjs = require('dayjs');
const { generateStudentActivityReportPDF } = require('../services/pdfGenerationService');
const fs = require('fs'); // Required for fs.unlink if you uncomment the deletion part

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    student.profilePictureUrl = `/static/uploads/profile-pictures/${req.file.filename}`;
    await student.save();

    res.json({ success: true, filePath: student.profilePictureUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStudentProfile = async (req, res) => {
    try {
        const { fullName, department, year, email } = req.body;
        const student = await Student.findById(req.user.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        student.fullName = fullName;
        student.department = department;
        student.year = year;
        student.email = email;

        await student.save();

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating profile:', error);
        // Check for Mongoose duplicate key error (email uniqueness)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ success: false, message: 'Email already in use. Please use a different email.' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStudentActivityReport = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;
        const authenticatedUserId = req.user.id;
        const authenticatedUserRole = req.user.role;
        const authenticatedUserDepartment = req.user.department;

        // Authorization Check
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        if (authenticatedUserRole === 'student') {
            // A student can only view their own report
            if (student._id.toString() !== authenticatedUserId) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own activity report.' });
            }
        } else if (authenticatedUserRole === 'faculty' || authenticatedUserRole === 'HOD') {
            // Faculty/HOD can only view reports for students in their department
            if (student.department !== authenticatedUserDepartment) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only view reports for students in your department.' });
            }
        } else {
            // Other roles (e.g., Security) are not authorized for this report
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view student activity reports.' });
        }

        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = dayjs(startDate).startOf('day').toDate();
        }
        if (endDate) {
            dateFilter.$lte = dayjs(endDate).endOf('day').toDate();
        }

        // Special Passes
        const specialPassesQuery = { student_id: studentId, status: 'Approved' };
        if (startDate || endDate) {
            specialPassesQuery.approved_at = dateFilter;
        }
        const specialPasses = await SpecialPass.find(specialPassesQuery)
            .populate('hod_approver_id', 'fullName')
            .sort({ approved_at: -1 });

        // Late Entries
        const lateEntriesQuery = { studentId: studentId, status: 'Approved' };
        if (startDate || endDate) {
            lateEntriesQuery.date = dateFilter;
        }
        const lateEntries = await LateEntry.find(lateEntriesQuery)
            .populate('facultyId', 'fullName')
            .populate('HODId', 'fullName')
            .sort({ date: -1 });

        // Gate Passes
        const gatePassesQuery = { student_id: studentId, faculty_status: 'APPROVED', hod_status: 'APPROVED' };
        if (startDate || endDate) {
            gatePassesQuery.createdAt = dateFilter; // Assuming createdAt is the relevant date for gate passes
        }
        const gatePasses = await GatePass.find(gatePassesQuery)
            .populate('faculty_approver_id', 'fullName')
            .populate('hod_approver_id', 'fullName')
            .sort({ createdAt: -1 });

        const report = {
            specialPasses,
            lateEntries,
            gatePasses,
        };

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        console.error('Error fetching student activity report:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.downloadStudentActivityReportPDF = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;
        const authenticatedUserRole = req.user.role;
        const authenticatedUserDepartment = req.user.department;

        // Fetch student details
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // Authorization Check (only Faculty/HOD can download, and only for their department)
        if (authenticatedUserRole === 'faculty' || authenticatedUserRole === 'HOD') {
            if (student.department !== authenticatedUserDepartment) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only download reports for students in your department.' });
            }
        } else {
            // Other roles (e.g., Student, Security) are not authorized to download this report
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to download student activity reports.' });
        }

        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = dayjs(startDate).startOf('day').toDate();
        }
        if (endDate) {
            dateFilter.$lte = dayjs(endDate).endOf('day').toDate();
        }

        // Special Passes
        const specialPassesQuery = { student_id: studentId, status: 'Approved' };
        if (startDate || endDate) {
            specialPassesQuery.approved_at = dateFilter;
        }
        const specialPasses = await SpecialPass.find(specialPassesQuery)
            .populate('hod_approver_id', 'fullName')
            .sort({ approved_at: -1 });

        // Late Entries
        const lateEntriesQuery = { studentId: studentId, status: 'Approved' };
        if (startDate || endDate) {
            lateEntriesQuery.date = dateFilter;
        }
        const lateEntries = await LateEntry.find(lateEntriesQuery)
            .populate('facultyId', 'fullName')
            .populate('HODId', 'fullName')
            .sort({ date: -1 });

        // Gate Passes
        const gatePassesQuery = { student_id: studentId, faculty_status: 'APPROVED', hod_status: 'APPROVED' };
        if (startDate || endDate) {
            gatePassesQuery.createdAt = dateFilter;
        }
        const gatePasses = await GatePass.find(gatePassesQuery)
            .populate('faculty_approver_id', 'fullName')
            .populate('hod_approver_id', 'fullName')
            .sort({ createdAt: -1 });

        const reportData = {
            specialPasses,
            lateEntries,
            gatePasses,
        };

        const studentDetails = {
            fullName: student.fullName,
            studentId: student.studentId,
            department: student.department,
            year: student.year,
        };

        res.download(pdfPath, `Student_Activity_Report_${student.studentId}.pdf`, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
                res.status(500).json({ success: false, message: 'Error downloading PDF.' });
            }
            // Optionally, delete the file after sending
            fs.unlink(pdfPath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting PDF:', unlinkErr);
            });
        });

    } catch (error) {
        console.error('Error generating student activity report PDF:', error);
        res.status(500).json({ success: false, message: 'Server error generating PDF.' });
    }
};

// New function to add a student (by faculty/HOD)
exports.addStudent = async (req, res) => {
  try {
    console.log("📩 studentController.addStudent hit");
    console.log("Request body:", { studentId: req.body.studentId, fullName: req.body.fullName, email: req.body.email });

    const { studentId, fullName, email, department, year, password } = req.body;
    const userDepartment = req.user.department; // Department of the authenticated faculty/HOD

    if (!studentId || !fullName || !password || !department || !year) {
      return res.status(400).json({ message: "All required fields (studentId, fullName, password, department, year) are needed." });
    }

    // CRITICAL FIX: Department Isolation Check
    if (department !== userDepartment) {
        return res.status(403).json({ success: false, message: 'You can only add students to your own department.' });
    }

    // Check if studentId already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
        return res.status(400).json({ success: false, message: 'Student with this ID already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      studentId,
      fullName,
      email,
      department,
      year,
      password: hashedPassword,
    });

    await newStudent.save();
    console.log("✅ Student saved:", newStudent);

    const { password: _, ...studentResponse } = newStudent.toObject();
    res.status(201).json({ message: "Student added successfully", student: studentResponse });
  } catch (error) {
    console.error("❌ Error adding student:", error);
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ success: false, message: 'Email already in use. Please use a different email.' });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};