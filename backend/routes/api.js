import express from 'express';
import * as employeeController from '../controllers/employeeController.js';
import * as hrController from '../controllers/hrController.js';
import * as companyController from '../controllers/companyController.js';
import * as adminController from '../controllers/adminController.js';
import * as calendarController from '../controllers/calendarController.js';
import * as faqController from '../controllers/faqController.js';

const router = express.Router();

// ==========================================
// EMPLOYEE ROUTES
// ==========================================
router.get('/employees/:id', employeeController.getProfile);
router.get('/employees/:id/attendance', employeeController.getAttendance);
router.post('/employees/:id/attendance', employeeController.logAttendance);
router.post('/employees/:id/attendance/confirm-overtime', employeeController.confirmOvertime);
router.get('/employees/:id/leaves', employeeController.getLeaves);
router.post('/employees/:id/leaves', employeeController.createLeaveRequest);
router.delete('/employees/:id/leaves/:leaveId', employeeController.deleteLeaveRequest);
router.put('/employees/:id/leaves/:leaveId/cancel', employeeController.cancelLeaveRequest);
router.put('/employees/:id/client', employeeController.updateClient);
router.put('/employees/:id/team', employeeController.updateTeam);
router.put('/employees/:id/shift', employeeController.updateShift);
router.put('/employees/:id/profile', employeeController.updateProfile);
router.get('/employees/:id/shift-notices', employeeController.getEmployeeShiftNotices);
router.get('/employees/:id/celebrations', employeeController.getCelebrations);

// ==========================================
// HR / MANAGER ROUTES
// ==========================================
router.get('/hr/dashboard', hrController.getDashboard);
router.get('/hr/reports', hrController.getReports);
router.get('/hr/leaves', hrController.getLeaves);
router.post('/hr/leaves/:id/review', hrController.reviewLeave);
router.delete('/hr/leaves/:id', hrController.deleteLeaveApproval);
router.get('/hr/employees', hrController.getEmployees);
router.get('/hr/employees/:id', hrController.getEmployeeDetail);
router.post('/hr/employees', hrController.createEmployee);
router.put('/hr/employees/:id/status', hrController.updateEmployeeStatus);
router.get('/hr/:id/profile', hrController.getProfile);
router.put('/hr/:id/profile', hrController.updateProfile);
router.put('/hr/attendance/:id', hrController.adjustAttendance);
router.post('/hr/attendance', hrController.createManualAttendance);
router.get('/hr/shift-notices', hrController.getHRShiftNotices);
router.get('/hr/settings', adminController.getSettings);

// ==========================================
// HIRING COMPANY ROUTES
// ==========================================
router.get('/companies/:id/dashboard', companyController.getDashboard);
router.get('/companies/:id/reports', companyController.getReports);
router.get('/companies/:id/profile', companyController.getProfile);
router.put('/companies/:id/profile', companyController.updateProfile);
router.get('/companies/:id/shift-notices', companyController.getCompanyShiftNotices);
router.post('/companies/:id/shift-notices', companyController.createShiftNotice);
router.put('/companies/:id/shift-notices/:noticeId', companyController.updateShiftNotice);
router.delete('/companies/:id/shift-notices/:noticeId', companyController.deleteShiftNotice);

// ==========================================
// SUPERADMIN ROUTES
// ==========================================
router.get('/admin/dashboard', adminController.getDashboard);
router.get('/admin/leaves', adminController.getLeaves);
router.post('/admin/leaves/:id/review', adminController.reviewLeave);
router.delete('/admin/leaves/:id', adminController.deleteLeaveApproval);
router.post('/admin/hr', adminController.createHR);
router.post('/admin/companies', adminController.createCompany);
router.put('/admin/employees/:id', adminController.updateEmployee);
router.put('/admin/employees/:id/status', adminController.updateEmployeeStatus);
router.put('/admin/hr/:id', adminController.updateHR);
router.put('/admin/companies/:id', adminController.updateCompany);
router.delete('/admin/employees/:id', adminController.deleteEmployee);
router.delete('/admin/hr/:id', adminController.deleteHR);
router.delete('/admin/companies/:id', adminController.deleteCompany);
router.get('/admin/settings', adminController.getSettings);
router.post('/admin/settings', adminController.updateSettings);
router.get('/admin/:id/profile', adminController.getProfile);
router.put('/admin/:id/profile', adminController.updateProfile);

// Knowledge Sharing Sessions
router.get('/admin/knowledge-sessions', adminController.getSessions);
router.post('/admin/knowledge-sessions', adminController.createSession);
router.put('/admin/knowledge-sessions/:id', adminController.updateSession);
router.delete('/admin/knowledge-sessions/:id', adminController.deleteSession);
router.get('/employees/:id/knowledge-sessions', adminController.getEmployeeSessions);
router.put('/employees/:id/knowledge-sessions/:sessionId/respond', adminController.respondToSession);

// ==========================================
// CALENDAR & GOOGLE CALENDAR ROUTES
// ==========================================
router.get('/calendar', calendarController.getEvents);
router.post('/calendar', calendarController.createEvent);
router.put('/calendar/:id', calendarController.updateEvent);
router.delete('/calendar/:id', calendarController.deleteEvent);

// ==========================================
// FAQ ROUTES
// ==========================================
router.get('/faqs', faqController.getFaqs);
router.post('/admin/faqs', faqController.createFaq);
router.put('/admin/faqs/:id', faqController.updateFaq);
router.delete('/admin/faqs/:id', faqController.deleteFaq);

export default router;
