const BaseService = require('../core-genc/base.service');
const GatePass = require('../../Genc.DAL/models/GatePass');
const AuditLog = require('../../Genc.DAL/models/AuditLog');
const { sendNotification } = require('./notificationService');
const { getISTTimeInMinutes } = require('../utils/timeUtils');

class GatePassService extends BaseService {
  constructor(model) {
    super(model);
  }

  async requestGatePass(payload, studentId) {
    const { destination, reason, selectedApproverId, date_valid_from, date_valid_to, isHalfDay, approverRole } = payload;

    if (!destination || !reason || !selectedApproverId || !date_valid_from || !approverRole) {
      return { success: false, message: 'Please provide all required fields.' };
    }

    return this.executeInTransaction(async (session) => {
      const student = await require('../../Genc.DAL/models/student').findById(studentId).session(session);
      if (!student) {
        throw new Error('Student not found.');
      }

      const selectedApprover = await require('../../Genc.DAL/models/Faculty').findById(selectedApproverId).session(session);
      if (!selectedApprover) {
        throw new Error('Selected approver not found.');
      }

      if (selectedApprover.department !== student.department) {
        throw new Error('Selected approver is not from your department.');
      }

      let faculty_approver_id = null;
      let hod_approver_id = null;
      let faculty_status = 'PENDING';
      let hod_status = 'PENDING';
      let notificationRecipientId = selectedApproverId;
      let notificationMessage = `A new Gate Pass request from ${student.fullName} is awaiting your approval.`;

      if (approverRole === 'HOD') {
        hod_approver_id = selectedApproverId;
        faculty_approver_id = null;
        hod_status = 'PENDING';
        faculty_status = 'APPROVED';
      } else {
        faculty_approver_id = selectedApproverId;
        if (selectedApprover.designation.toUpperCase() === 'HOD') {
          hod_approver_id = selectedApproverId;
          faculty_approver_id = null;
          faculty_status = 'APPROVED';
          hod_status = 'PENDING';
        } else {
          const hod = await require('../../Genc.DAL/models/Faculty').findOne({ department: student.department, designation: 'HOD' }).session(session);
          if (!hod) {
            throw new Error(`No HOD found for ${student.department} department.`);
          }
          hod_approver_id = hod._id;
        }
      }

      const exitDate = new Date(date_valid_from);
      let returnDateObj = date_valid_to ? new Date(date_valid_to) : null;

      if (isNaN(exitDate.getTime())) {
        throw new Error('Invalid exit date/time provided.');
      }
      if (!isHalfDay && returnDateObj && isNaN(returnDateObj.getTime())) {
        throw new Error('Invalid return date/time provided.');
      }

      const collegeStartTimeInMinutes = 9 * 60 + 30;
      const collegeEndTimeInMinutes = 16 * 60;
      const exitTimeInMinutes = getISTTimeInMinutes(exitDate);
      if (exitTimeInMinutes < collegeStartTimeInMinutes || exitTimeInMinutes > collegeEndTimeInMinutes) {
        throw new Error('Requested exit time must be within college hours (9:30 AM - 4:00 PM).');
      }
      if (returnDateObj) {
        const returnTimeInMinutes = getISTTimeInMinutes(returnDateObj);
        if (returnTimeInMinutes < collegeStartTimeInMinutes || returnTimeInMinutes > collegeEndTimeInMinutes) {
          throw new Error('Requested return time must be within college hours (9:30 AM - 4:00 PM).');
        }
      }

      const newPass = new this.model({
        student_id: studentId,
        destination,
        reason,
        pass_type: 'Gate Pass',
        faculty_approver_id,
        hod_approver_id,
        department_id: student.department,
        date_valid_from: exitDate,
        date_valid_to: returnDateObj,
        faculty_status,
        hod_status,
      });

      const savedPass = await newPass.save({ session });
      await AuditLog.create([
        {
          gatepass_id: savedPass._id,
          event_type: 'Request',
          actor_role: 'Student',
          actor_id: studentId,
          event_details: {
            destination,
            reason,
            faculty_approver_id,
            hod_approver_id,
            initial_faculty_status: faculty_status,
            initial_hod_status: hod_status,
          },
        },
      ], { session });

      await sendNotification(notificationRecipientId, notificationMessage, 'New Gate Pass Request');

      return savedPass;
    });
  }
}

module.exports = GatePassService;
