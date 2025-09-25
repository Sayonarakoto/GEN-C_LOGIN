const LateEntry = require('../models/LateEntry');
// Controller to get dashboard statistics for faculty
const getDashboardStats = async (req, res) => {
  try {
    // Get the start and end of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Perform all counts in parallel
    const [pendingCount, todayEntryCount, approvedCount] = await Promise.all([
      LateEntry.countDocuments({ status: 'Pending' }),
      LateEntry.countDocuments({ entryTime: { $gte: todayStart, $lte: todayEnd } }),
      LateEntry.countDocuments({ status: 'Approved' })
    ]);

    // For now, alerts are static as there's no clear model for it
    const alertsCount = 0;

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        todayEntry: todayEntryCount,
        approved: approvedCount,
        alerts: alertsCount,
      },
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
    // This part is commented out for now, as the primary use case is faculty's own department
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

module.exports = { getDashboardStats, getDistinctDepartments };
