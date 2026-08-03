const BaseController = require('../../core-genc/base.controller');
const studentService = require('../services/studentService');
const StudentViewModel = require('../viewmodels/StudentViewModel');
const dayjs = require('dayjs');
const logger = require('../../utils/logger');


/**
 * Helper function for authorization checks
 */
function isAuthorizedForStudent(reqUser, student) {
  if (reqUser.role === 'student') {
    return student._id.toString() === reqUser.id;
  }
  if (['faculty', 'HOD', 'hod'].includes(reqUser.role)) {
    return student.department === reqUser.department;
  }
  return false;
}

class StudentController extends BaseController {
  constructor() {
    super(studentService, StudentViewModel, 'StudentController');

    this.uploadProfilePicture = this.uploadProfilePicture.bind(this);
    this.updateStudentProfile = this.updateStudentProfile.bind(this);
    this.getStudentActivityReport = this.getStudentActivityReport.bind(this);
    this.downloadStudentActivityReportPDF = this.downloadStudentActivityReportPDF.bind(this);
    this.addStudent = this.addStudent.bind(this);
  }

  async uploadProfilePicture(req, res) {
    const startTime = Date.now();
    logger.logMethodCall('StudentController', 'uploadProfilePicture', { user: req.user?.id });

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const relativePath = `/uploads/profile-pictures/${req.file.filename}`;
      const result = await studentService.uploadProfilePicture(req.user.id, relativePath);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({ success: false, message: result.message });
      }

      logger.logMethodSuccess('StudentController', 'uploadProfilePicture', Date.now() - startTime);
      return res.json({ success: true, filePath: result.filePath });
    } catch (error) {
      logger.logMethodError('StudentController', 'uploadProfilePicture', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error uploading profile picture.' });
    }
  }

  async updateStudentProfile(req, res) {
    const startTime = Date.now();
    logger.logMethodCall('StudentController', 'updateStudentProfile', { user: req.user?.id });

    try {
      const result = await studentService.updateStudentProfile(req.user.id, req.body);
      if (!result.success) {
        return res.status(result.statusCode || 400).json({ success: false, message: result.message });
      }

      logger.logMethodSuccess('StudentController', 'updateStudentProfile', Date.now() - startTime);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      logger.logMethodError('StudentController', 'updateStudentProfile', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error updating student profile.' });
    }
  }

  async getStudentActivityReport(req, res) {
    const startTime = Date.now();
    logger.logMethodCall('StudentController', 'getStudentActivityReport', { params: req.params, query: req.query });

    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      if (startDate && !dayjs(startDate).isValid()) {
        return res.status(400).json({ success: false, message: 'Invalid start date format.' });
      }
      if (endDate && !dayjs(endDate).isValid()) {
        return res.status(400).json({ success: false, message: 'Invalid end date format.' });
      }

      const reportResult = await studentService.getStudentActivityReport(studentId, startDate, endDate);
      if (!reportResult.success) {
        return res.status(reportResult.statusCode || 400).json({ success: false, message: reportResult.message });
      }

      if (!isAuthorizedForStudent(req.user, reportResult.student)) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view this student\'s activity report.' });
      }

      logger.logMethodSuccess('StudentController', 'getStudentActivityReport', Date.now() - startTime);
      return res.status(200).json({ success: true, data: reportResult.data });
    } catch (error) {
      logger.logMethodError('StudentController', 'getStudentActivityReport', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error generating activity report.' });
    }
  }

  async downloadStudentActivityReportPDF(req, res) {
    const startTime = Date.now();
    logger.logMethodCall('StudentController', 'downloadStudentActivityReportPDF', { params: req.params });

    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      const pdfResult = await studentService.generateStudentActivityPDF(studentId, startDate, endDate);
      if (!pdfResult.success) {
        return res.status(pdfResult.statusCode || 400).json({ success: false, message: pdfResult.message });
      }

      logger.logMethodSuccess('StudentController', 'downloadStudentActivityReportPDF', Date.now() - startTime);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Activity_Report_${pdfResult.studentId}.pdf"`);
      return res.send(Buffer.from(pdfResult.pdfBytes));
    } catch (error) {
      logger.logMethodError('StudentController', 'downloadStudentActivityReportPDF', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error generating PDF report.' });
    }
  }

  async addStudent(req, res) {
    const startTime = Date.now();
    logger.logMethodCall('StudentController', 'addStudent', { userDepartment: req.user?.department });

    try {
      const userDepartment = req.user.department;
      const result = await studentService.addStudentWithDepartmentCheck(req.body, userDepartment);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({ success: false, message: result.message });
      }

      const dto = StudentViewModel.toDTO(result.student);
      logger.logMethodSuccess('StudentController', 'addStudent', Date.now() - startTime);
      return res.status(201).json({ success: true, message: 'Student added successfully', student: dto });
    } catch (error) {
      logger.logMethodError('StudentController', 'addStudent', error, Date.now() - startTime);
      return res.status(500).json({ success: false, message: 'Server error adding student.' });
    }
  }
}

const controllerInstance = new StudentController();

// Export object with functions for backwards compatibility with route declarations
module.exports = {
  getById: controllerInstance.getById,
  list: controllerInstance.list,
  create: controllerInstance.create,
  update: controllerInstance.update,
  remove: controllerInstance.remove,
  uploadProfilePicture: controllerInstance.uploadProfilePicture,
  updateStudentProfile: controllerInstance.updateStudentProfile,
  getStudentActivityReport: controllerInstance.getStudentActivityReport,
  downloadStudentActivityReportPDF: controllerInstance.downloadStudentActivityReportPDF,
  addStudent: controllerInstance.addStudent,
  StudentController,
};
