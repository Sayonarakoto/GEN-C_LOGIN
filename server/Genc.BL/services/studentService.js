const BaseService = require('../../core-genc/base.service');
const Student = require('../../Genc.DAL/models/student');
const SpecialPass = require('../../Genc.DAL/models/SpecialPass');
const LateEntry = require('../../Genc.DAL/models/LateEntry');
const GatePass = require('../../Genc.DAL/models/GatePass');
const dayjs = require('dayjs');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const { generateStudentActivityReportPDF } = require('./pdfGenerationService');


class StudentService extends BaseService {
  constructor() {
    super(Student, 'StudentService');
  }

  /**
   * Upload and save student profile picture path.
   * @param {string} studentObjectId 
   * @param {string} relativePath 
   * @returns {Promise<object>}
   */
  async uploadProfilePicture(studentObjectId, relativePath) {
    const startTime = Date.now();
    logger.logMethodCall('StudentService', 'uploadProfilePicture', { studentObjectId, relativePath });

    try {
      const student = await this.model.findById(studentObjectId);
      if (!student) {
        logger.logMethodError('StudentService', 'uploadProfilePicture', new Error('Student not found'), Date.now() - startTime);
        return { success: false, statusCode: 404, message: 'Student not found.' };
      }

      student.profile_picture_url = relativePath;
      await student.save();

      logger.logMethodSuccess('StudentService', 'uploadProfilePicture', Date.now() - startTime);
      return { success: true, filePath: student.profile_picture_url };
    } catch (error) {
      logger.logMethodError('StudentService', 'uploadProfilePicture', error, Date.now() - startTime);
      return { success: false, statusCode: 500, message: 'Server error updating profile picture.' };
    }
  }

  /**
   * Update student profile fields with duplicate check.
   * @param {string} studentObjectId 
   * @param {object} updateBody 
   * @returns {Promise<object>}
   */
  async updateStudentProfile(studentObjectId, updateBody) {
    const startTime = Date.now();
    logger.logMethodCall('StudentService', 'updateStudentProfile', { studentObjectId, updateBody });

    try {
      const student = await this.model.findById(studentObjectId);
      if (!student) {
        logger.logMethodError('StudentService', 'updateStudentProfile', new Error('Student not found'), Date.now() - startTime);
        return { success: false, statusCode: 404, message: 'Student not found.' };
      }

      if (updateBody.fullName) student.full_name = updateBody.fullName;
      if (updateBody.year) student.year = updateBody.year;
      if (updateBody.profilePictureUrl) student.profile_picture_url = updateBody.profilePictureUrl;
      if (updateBody.email) student.email = updateBody.email.trim().toLowerCase();

      await student.save();

      logger.logMethodSuccess('StudentService', 'updateStudentProfile', Date.now() - startTime);
      return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
      logger.logMethodError('StudentService', 'updateStudentProfile', error, Date.now() - startTime);
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return { success: false, statusCode: 400, message: 'Email already in use. Please use a different email.' };
      }
      return { success: false, statusCode: 500, message: 'Server error updating student profile.' };
    }
  }

  /**
   * Create a new student with department isolation check.
   * @param {object} payload 
   * @param {string} userDepartment 
   * @returns {Promise<object>}
   */
  async addStudentWithDepartmentCheck(payload, userDepartment) {
    const startTime = Date.now();
    logger.logMethodCall('StudentService', 'addStudentWithDepartmentCheck', { payload, userDepartment });

    try {
      const { studentId, fullName, email, department: rawDepartment, year, password } = payload;
      const department = (rawDepartment || '').toUpperCase();

      if (!studentId || !fullName || !password || !department || !year) {
        return { success: false, statusCode: 400, message: 'All required fields (studentId, fullName, password, department, year) are needed.' };
      }

      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return { success: false, statusCode: 400, message: 'Invalid email format.' };
      }

      if (department !== userDepartment) {
        return { success: false, statusCode: 403, message: 'You can only add students to your own department.' };
      }

      const existingStudent = await this.model.findOne({ student_id: studentId });
      if (existingStudent) {
        return { success: false, statusCode: 400, message: 'Student with this ID already exists.' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newStudent = new this.model({
        student_id: studentId,
        full_name: fullName,
        email: email ? email.trim().toLowerCase() : '',
        department,
        year,
        password: hashedPassword,
      });

      await newStudent.save();

      logger.logMethodSuccess('StudentService', 'addStudentWithDepartmentCheck', Date.now() - startTime);
      return { success: true, statusCode: 201, student: newStudent };
    } catch (error) {
      logger.logMethodError('StudentService', 'addStudentWithDepartmentCheck', error, Date.now() - startTime);
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return { success: false, statusCode: 400, message: 'Email already in use. Please use a different email.' };
      }
      return { success: false, statusCode: 500, message: 'Server error adding student.' };
    }
  }

  /**
   * Generate aggregated activity report for a student.
   * @param {string} studentId 
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Promise<object>}
   */
  async getStudentActivityReport(studentId, startDate, endDate) {
    const startTime = Date.now();
    logger.logMethodCall('StudentService', 'getStudentActivityReport', { studentId, startDate, endDate });

    try {
      const student = await this.model.findOne({ _id: studentId });
      if (!student) {
        return { success: false, statusCode: 404, message: 'Student not found.' };
      }

      const dateFilter = {};
      if (startDate) dateFilter.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) dateFilter.$lte = dayjs(endDate).endOf('day').toDate();

      const specialPassesQuery = { student_id: studentId, status: 'Approved' };
      if (Object.keys(dateFilter).length > 0) specialPassesQuery.approved_at = dateFilter;

      const lateEntriesQuery = { studentId: studentId, status: 'Approved' };
      if (Object.keys(dateFilter).length > 0) lateEntriesQuery.date = dateFilter;

      const gatePassesQuery = { student_id: studentId, faculty_status: 'APPROVED', hod_status: 'APPROVED' };
      if (Object.keys(dateFilter).length > 0) gatePassesQuery.createdAt = dateFilter;

      const [specialPasses, lateEntries, gatePasses] = await Promise.all([
        SpecialPass.find(specialPassesQuery).populate('hod_approver_id', 'fullName').sort({ approved_at: -1 }),
        LateEntry.find(lateEntriesQuery).populate('facultyId', 'fullName').populate('HODId', 'fullName').sort({ date: -1 }),
        GatePass.find(gatePassesQuery).populate('faculty_approver_id', 'fullName').populate('hod_approver_id', 'fullName').sort({ createdAt: -1 }),
      ]);

      logger.logMethodSuccess('StudentService', 'getStudentActivityReport', Date.now() - startTime);
      return {
        success: true,
        student,
        data: { specialPasses, lateEntries, gatePasses },
      };
    } catch (error) {
      logger.logMethodError('StudentService', 'getStudentActivityReport', error, Date.now() - startTime);
      return { success: false, statusCode: 500, message: 'Server error fetching activity report.' };
    }
  }

  /**
   * Generate PDF Bytes for Student Activity Report.
   * @param {string} studentId 
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Promise<object>}
   */
  async generateStudentActivityPDF(studentId, startDate, endDate) {
    const startTime = Date.now();
    logger.logMethodCall('StudentService', 'generateStudentActivityPDF', { studentId, startDate, endDate });

    try {
      const reportResult = await this.getStudentActivityReport(studentId, startDate, endDate);
      if (!reportResult.success) return reportResult;

      const { student, data: reportData } = reportResult;
      const studentDetails = {
        fullName: student.full_name || student.fullName,
        studentId: student.student_id || student.studentId,
        department: student.department,
        year: student.year,
      };

      const pdfBytes = await generateStudentActivityReportPDF(studentDetails, reportData, startDate, endDate);
      logger.logMethodSuccess('StudentService', 'generateStudentActivityPDF', Date.now() - startTime);
      return { success: true, pdfBytes, studentId: studentDetails.studentId };
    } catch (error) {
      logger.logMethodError('StudentService', 'generateStudentActivityPDF', error, Date.now() - startTime);
      return { success: false, statusCode: 500, message: 'Server error generating PDF report.' };
    }
  }
}

module.exports = new StudentService();
