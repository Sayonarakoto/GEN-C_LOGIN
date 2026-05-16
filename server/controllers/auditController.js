const AuditLog = require('../models/AuditLog');
const json2csv = require('json2csv').parse;
const SpecialPass = require('../models/SpecialPass'); // Import SpecialPass model
const GatePass = require('../models/GatePass');     // Import GatePass model
const dayjs = require('dayjs'); // Import dayjs
const PDFDocument = require('pdfkit'); // Import pdfkit
const logger = require('../utils/logger'); // Import logger

// -------------------------------------------------------------
// 🔧 Helper: Build audit log filter for the user's department
// -------------------------------------------------------------
async function buildDepartmentFilter(department, query) {
  const { studentId, eventType, startDate, endDate } = query;

  const departmentSpecialPassIds = await SpecialPass.find({ department }).distinct('_id');
  const departmentGatePassIds = await GatePass.find({ department_id: department }).distinct('_id');

  const filter = {
    $or: [
      { pass_id: { $in: departmentSpecialPassIds } },
      { gatepass_id: { $in: departmentGatePassIds } }
    ]
  };

  if (studentId) filter.actor_id = studentId;
  if (eventType) filter.event_type = eventType;

  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = dayjs(startDate).startOf('day').toDate();
    if (endDate) filter.timestamp.$lte = dayjs(endDate).endOf('day').toDate();
  }

  return filter;
}

// @desc    Get filtered audit logs for HODs
// @route   GET /api/audit/logs
// @access  Private (HOD)
exports.getAuditLogs = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ success: false, message: 'User department is missing.' });

    const filter = await buildDepartmentFilter(department, req.query);

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role') // Populate actor details
      .populate('pass_id', 'pass_type status') // Populate pass details
      .populate('gatepass_id', 'pass_type status') // ✅ CRITICAL: Fetches GatePass details
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({ success: true, data: logs, meta: { total, page, limit } });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Export filtered audit logs as CSV
// @route   GET /api/audit/logs/export
// @access  Private (HOD)
exports.exportAuditLogs = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ success: false, message: 'User department is missing.' });

    const filter = await buildDepartmentFilter(department, req.query);

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role')
      .populate('pass_id', 'pass_type status')
      .populate('gatepass_id', 'pass_type status') // ✅ CRITICAL: Fetches GatePass details
      .sort({ timestamp: -1 });

    const fields = [
      { label: 'Log ID', value: '_id' },
      { label: 'Timestamp', value: row => dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') },
      { label: 'Event Type', value: 'event_type' },
      { label: 'Actor Name', value: 'actor_id.fullName' },
      { label: 'Actor Role', value: 'actor_id.role' },
      { label: 'Pass Type', value: row => row.pass_id?.pass_type || row.gatepass_id?.pass_type || 'N/A' },
      { label: 'Pass Status', value: row => row.pass_id?.status || row.gatepass_id?.status || 'N/A' },
      { label: 'Details', value: row => JSON.stringify(row.event_details) },
    ];

    const csv = json2csv(logs, { fields });

    res.header('Content-Type', 'text/csv');
    res.attachment('audit_logs.csv');
    res.send(csv);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get successful verification logs for Security Dashboard
// @route   GET /api/security/logs
// @access  Private (Security)
exports.getSecurityVerificationLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      event_type: 'Verified',
      'event_details.result': { $regex: /^SUCCESS/i }
    })
    .populate({
        path: 'pass_id', // For SpecialPass
        select: 'pass_type request_reason hod_approver_id date_valid_to student_id department',
        populate: [
            { path: 'hod_approver_id', select: 'fullName' },
            { path: 'student_id', select: 'fullName department' }
        ]
    })
    .populate({
        path: 'gatepass_id', // For GatePass
        select: 'pass_type reason hod_approver_id date_valid_to student_id department_id',
        populate: [
            { path: 'hod_approver_id', select: 'fullName' },
            { path: 'student_id', select: 'fullName department' }
        ]
    })
    .sort({ timestamp: -1 })
    .limit(50);
    
    const formattedLogs = logs.map(log => {
        // 🔑 Check which reference field successfully linked to a document
        const pass = log.pass_id || log.gatepass_id; 
        
        if (!pass) {
            const eventDetailsPassType = log.event_details.pass_type || 'Unknown';
            const eventDetailsReason = log.event_details.reason || log.event_details.request_reason || 'N/A (Pass Missing)';
            return {
                _id: log._id,
                studentName: log.event_details.student_name || 'N/A',
                passType: eventDetailsPassType,
                reason: eventDetailsReason,
                approver: 'N/A',
                department: 'N/A', // Cannot determine department if pass is missing
                date: log.timestamp.toLocaleDateString(),
                day: log.timestamp.toLocaleDateString('en-US', { weekday: 'long' }),
                time: log.timestamp.toLocaleTimeString(),
                returnTime: 'N/A',
            };
        }

        // 🔑 Determine if it's a GatePass based on the pass object's structure/type
        // If the linked document came from gatepass_id, it will have the GatePass fields.
        const isGatePass = !!log.gatepass_id; 
        
        // 🔑 Use the correct reason field based on the pass type
        const requestReason = isGatePass 
            ? pass.reason // Use 'reason' if it's a GatePass
            : pass.request_reason; // Use 'request_reason' if it's a SpecialPass

        const approverName = pass.hod_approver_id?.fullName || 'N/A';
        const studentName = pass.student_id?.fullName || log.event_details.student_name || 'N/A';
        const passType = pass.pass_type || (isGatePass ? 'Gate Pass' : 'Special Pass');
        
        let passDepartment;
        if (isGatePass) {
            passDepartment = pass.department_id || pass.student_id?.department;
        } else {
            passDepartment = pass.department || pass.student_id?.department; // Also use student's department as fallback for SpecialPass
        }

        return {
            _id: log._id, // Include the AuditLog _id
            studentName: studentName,
            passType: passType,
            reason: requestReason || 'N/A', // Now derived correctly
            approver: approverName, // Now derived correctly
            department: passDepartment || 'N/A', // Added this line
            date: log.timestamp.toLocaleDateString(),
            day: log.timestamp.toLocaleDateString('en-US', { weekday: 'long' }),
            time: log.timestamp.toLocaleTimeString(),
            returnTime: pass.date_valid_to ? pass.date_valid_to.toLocaleTimeString() : 'N/A',
        };
    });

    res.status(200).json({ success: true, data: formattedLogs });

  } catch (error) {
    logger.error('Error fetching security verification logs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get audit logs for the current user's department
// @route   GET /api/audit/department-logs
// @access  Private (Faculty, HOD)
exports.getDepartmentAuditLogs = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ success: false, message: 'User department is missing.' });

    const filter = await buildDepartmentFilter(department, req.query);

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role')
      .populate('pass_id', 'pass_type status')
      .populate('gatepass_id', 'pass_type status') // ✅ CRITICAL: Fetches GatePass details
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({ success: true, data: logs, meta: { total, page, limit } });
  } catch (error) {
    logger.error('Error fetching department audit logs:', error);
    res.status(500).json({ success: false, message: 'Error fetching department audit logs' });
  }
};

// @desc    Export filtered audit logs as PDF
// @route   GET /api/audit/logs/pdf
// @access  Private (HOD)
exports.exportAuditLogsPdf = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ success: false, message: 'User department is missing.' });

    const filter = await buildDepartmentFilter(department, req.query);

    const logs = await AuditLog.find(filter)
      .populate('actor_id', 'fullName role')
      .populate('pass_id', 'pass_type status')
      .populate('gatepass_id', 'pass_type status') // ✅ CRITICAL: Fetches GatePass details
      .sort({ timestamp: -1 });

    const doc = new PDFDocument();
    let filename = 'audit_logs.pdf';
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res); // Pipe the PDF to the response

    doc.fontSize(18).text('Audit Logs Report', { align: 'center' }).moveDown();

    if (logs.length === 0) {
      doc.fontSize(12).text('No audit logs found for the selected filters.', { align: 'center' });
    } else {
      logs.forEach(log => {
        doc.fontSize(10).text(`Timestamp: ${dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}`);
        doc.text(`Event Type: ${log.event_type}`);
        doc.text(`Actor: ${log.actor_id?.fullName || 'N/A'} (${log.actor_id?.role || 'N/A'})`);
        // Determine pass type and status from either pass_id or gatepass_id
        const pass = log.pass_id || log.gatepass_id;
        if (pass) {
          doc.text(`Pass Type: ${pass.pass_type}, Status: ${pass.status}`);
        } else {
          doc.text(`Pass Type: N/A, Status: N/A`);
        }
        if (log.event_details) {
          doc.text(`Details: ${JSON.stringify(log.event_details)}`);
        }
        doc.moveDown();
      });
    }

    doc.end(); // Finalize the PDF
  } catch (error) {
    logger.error('Error exporting audit logs to PDF:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 🛑 EXPORT ALL FUNCTIONS
module.exports = {
  getAuditLogs: exports.getAuditLogs,
  exportAuditLogs: exports.exportAuditLogs,
  getSecurityVerificationLogs: exports.getSecurityVerificationLogs,
  getDepartmentAuditLogs: exports.getDepartmentAuditLogs,
  exportAuditLogsPdf: exports.exportAuditLogsPdf
};