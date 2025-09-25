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

module.exports = { getDashboardStats };
