const GatePass = require('../models/GatePass');
const SpecialPass = require('../models/SpecialPass');
const LateEntry = require('../models/LateEntry');

const getGatePassStats = async (req, res) => {
  try {
    const { department } = req.user; // Assuming department is stored in the user object
    const { role } = req.query; // Get role from query parameters

    let pendingQuery = { department_id: department };

    if (role === 'HOD') {
      pendingQuery.hod_status = 'PENDING';
    } else if (role === 'faculty') {
      pendingQuery.faculty_status = 'PENDING';
    } else {
      // Default or error case if role is not specified or invalid
      // For now, we'll return an error, but a default behavior could be implemented
      return res.status(400).json({ success: false, message: 'Invalid or missing role for gate pass stats.' });
    }

    const pending = await GatePass.countDocuments(pendingQuery);
    const approved = await GatePass.countDocuments({ department_id: department, hod_status: 'APPROVED' });
    const rejected = await GatePass.countDocuments({ department_id: department, hod_status: 'REJECTED' });
    const total = await GatePass.countDocuments({ department_id: department });

    res.json({ success: true, data: { pending, approved, rejected, total } });
  } catch (error) {
    console.error("Error fetching gate pass stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getSpecialPassStats = async (req, res) => {
  try {
    const { department } = req.user;

    const pending = await SpecialPass.countDocuments({ department, status: 'Pending' });
    const approved = await SpecialPass.countDocuments({ department, status: 'Approved' });
    const rejected = await SpecialPass.countDocuments({ department, status: 'Rejected' });
    const used = await SpecialPass.countDocuments({ department, status: 'Used' });
    const total = await SpecialPass.countDocuments({ department });

    res.json({ success: true, data: { pending, approved, rejected, used, total } });
  } catch (error) {
    console.error("Error fetching special pass stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getLateEntryStats = async (req, res) => {
  try {
    const { department } = req.user;

    const pendingFaculty = await LateEntry.countDocuments({ department, status: 'Pending Faculty' });
    const pendingHOD = await LateEntry.countDocuments({ department, status: 'Pending HOD' });
    const approved = await LateEntry.countDocuments({ department, status: 'Approved' });
    const rejected = await LateEntry.countDocuments({ department, status: 'Rejected' });
    const total = await LateEntry.countDocuments({ department });

    res.json({ success: true, data: { pendingFaculty, pendingHOD, approved, rejected, total } });
  } catch (error) {
    console.error("Error fetching late entry stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getGatePassStats,
  getSpecialPassStats,
  getLateEntryStats,
};
