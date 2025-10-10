const AuditLog = require('../models/AuditLog');
const json2csv = require('json2csv').parse;
const SpecialPass = require('../models/SpecialPass'); // Import SpecialPass model
const GatePass = require('../models/GatePass');     // Import GatePass model

// @desc    Get filtered audit logs for HODs
// @route   GET /api/audit/logs
// @access  Private (HOD)
exports.getAuditLogs = async (req, res) => {
  try {
    const { studentId, eventType, startDate, endDate } = req.query;
    const filter = {};

    if (studentId) {
      filter.actor_id = studentId; // Assuming actor_id can be studentId
    }
    if (eventType) {
      filter.event_type = eventType;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role') // Populate actor details
      .populate('pass_id', 'pass_type status') // Populate pass details
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Export filtered audit logs as CSV
// @route   GET /api/audit/logs/export
// @access  Private (HOD)
exports.exportAuditLogs = async (req, res) => {
  try {
    const { studentId, eventType, startDate, endDate } = req.query;
    const filter = {};

    if (studentId) {
      filter.actor_id = studentId;
    }
    if (eventType) {
      filter.event_type = eventType;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role')
      .populate('pass_id', 'pass_type status')
      .sort({ timestamp: -1 });

    const fields = [
      { label: 'Log ID', value: '_id' },
      { label: 'Timestamp', value: 'timestamp' },
      { label: 'Event Type', value: 'event_type' },
      { label: 'Actor Name', value: 'actor_id.fullName' },
      { label: 'Actor Role', value: 'actor_id.role' },
      { label: 'Pass Type', value: 'pass_id.pass_type' },
      { label: 'Pass Status', value: 'pass_id.status' },
      { label: 'Details', value: 'event_details' },
    ];

    const csv = json2csv(logs, { fields });

    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get successful verification logs for Security Dashboard
// @route   GET /api/security/logs
// @access  Private (Security)
exports.getSecurityVerificationLogs = async (req, res) => {
  try {
    // Find logs for successful verification events
    const logs = await AuditLog.find({
      event_type: 'Verified',
      'event_details.result': { $regex: /^SUCCESS/ } // Find where result starts with SUCCESS
    })
    .sort({ timestamp: -1 }) // Show newest first
    .limit(50); // Limit to the last 50 verified passes for performance
    
    res.status(200).json({ success: true, data: logs });

  } catch (error) {
    console.error('Error fetching security verification logs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get audit logs for the current user's department
// @route   GET /api/audit/department-logs
// @access  Private (Faculty, HOD)
exports.getDepartmentAuditLogs = async (req, res) => {
  try {
    const { department } = req.user; // Get department from the authenticated user

    if (!department) {
      return res.status(400).json({ success: false, message: 'User department is missing.' });
    }

    // Find all audit logs where the associated pass (SpecialPass or GatePass) belongs to this department
    const departmentSpecialPassIds = await SpecialPass.find({ department: department }).distinct('_id'); // Query by 'department' field
        const departmentGatePassIds = await GatePass.find({ $where: `this.department_id == '${department}'` }).distinct('_id'); // Query by 'department_id' field

    const allDepartmentPassIds = [...departmentSpecialPassIds, ...departmentGatePassIds];

    const logs = await AuditLog.find({ pass_id: { $in: allDepartmentPassIds } })
      .populate('actor_id', 'fullName role email employeeId')
      .populate('pass_id', 'pass_type status') // Populate pass details
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching department audit logs:', error);
    res.status(500).json({ success: false, message: 'Error fetching department audit logs' });
  }
};