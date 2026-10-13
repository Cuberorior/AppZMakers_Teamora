import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import SystemSettings from '../models/SystemSettings.js';
import { sendEmail } from './emailService.js';
import { finalizeClockOut } from '../utils/attendanceMath.js';

export const startCronJobs = () => {
  // Run every minute (60000 ms)
  setInterval(async () => {
    try {
      // Find all active attendances (not checked out)
      const activeAttendances = await Attendance.find({ checkOut: null, status: { $ne: 'absent' } });
      if (activeAttendances.length === 0) return;

      // Get system settings to read rules
      const settings = await SystemSettings.findOne();
      const departmentRules = settings?.departmentOvertimeRules || [];

      const now = new Date();
      const nowMs = now.getTime();

      for (const attendance of activeAttendances) {
        try {
          let employee = null;
          if (mongoose.Types.ObjectId.isValid(attendance.employeeId)) {
            employee = await Employee.findOne({ $or: [{ _id: attendance.employeeId }, { legacyId: attendance.employeeId }] });
          } else {
            employee = await Employee.findOne({ legacyId: attendance.employeeId });
          }
          if (!employee) continue;

          // Find rule for this department
          const rule = departmentRules.find(r => 
            r.department && employee.department && 
            r.department.trim() === employee.department.trim()
          );
          if (!rule || !rule.enabled) continue; // Skip if no rule or disabled

          // Calculate elapsed hours (excluding breaks)
          let sessionSecs = 0;
          if (attendance.checkIn) {
             const checkInDate = new Date(attendance.date + 'T' + attendance.checkIn);
             let totalElapsed = (nowMs - checkInDate.getTime()) / 1000;
             if (totalElapsed < 0) totalElapsed = 0;

             let totalBreakSecs = attendance.breakMinutes * 60;
             sessionSecs = totalElapsed - totalBreakSecs;
             if (sessionSecs < 0) sessionSecs = 0;
          } else {
             continue;
          }
          
          const elapsedHours = sessionSecs / 3600;

          const baseWorkHoursStr = settings?.workHours || '8';
          const match = String(baseWorkHoursStr).match(/^(-?\d+(\.\d+)?)/);
          const baseWorkHours = match ? parseFloat(match[1]) : 8;

          const confirmedHours = attendance.overtimeState?.confirmedHours || 0;
          const intervalHours = rule.intervalMinutes / 60;
          
          // Target threshold for next confirmation prompt
          const targetThreshold = baseWorkHours + confirmedHours + intervalHours;

          // Checking if employee has reached the next interval
          if (elapsedHours >= targetThreshold) {
            // Check if they reached max overtime
            if (confirmedHours >= rule.maxOvertimeHours) {
               // Reached max overtime, maybe we don't prompt anymore or auto-checkout?
               // Let's assume we just auto-checkout if they exceed the absolute maximum
               const checkOutTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
               attendance.onBreak = false;
               attendance.onTeaBreak = false;
               attendance.onTeaExceed = false;
               if (attendance.breaks) {
                 attendance.breaks.forEach((b) => {
                   if (!b.end) b.end = checkOutTimeStr;
                 });
               }
               attendance.adjusted = true;
               attendance.adjustedReason = 'Maximum overtime limit reached';
               finalizeClockOut(attendance, checkOutTimeStr, settings);
               await attendance.save();
               continue;
            }

            if (attendance.overtimeState.status !== 'pending') {
               // It's time to prompt!
               attendance.overtimeState.status = 'pending';
               attendance.overtimeState.nextConfirmDueAt = new Date(nowMs + rule.timeoutMinutes * 60000);
               await attendance.save();

               // Send email if enabled
               if (rule.emailNotification && employee.email) {
                 const subject = 'Overtime Work Confirmation Required';
                 const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <p>Hello ${employee.name},</p>
                      <p>You have completed your additional working hour.</p>
                      <p>Please confirm that you are still working.</p>
                      <p><strong>You must confirm within ${rule.timeoutMinutes} minutes.</strong></p>
                      <p>If no confirmation is received, your attendance session will be automatically checked out.</p>
                      <p>Thank you.</p>
                    </div>
                 `;
                 sendEmail(employee.email, subject, html).catch(err => console.error('Failed to send overtime email:', err));
               }
            } else if (attendance.overtimeState.status === 'pending') {
               // Check if timeout has expired
               const nextDueMs = new Date(attendance.overtimeState.nextConfirmDueAt).getTime();
               if (nowMs >= nextDueMs) {
                 // Auto-checkout
                 const checkOutTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                 attendance.onBreak = false;
                 attendance.onTeaBreak = false;
                 attendance.onTeaExceed = false;
                 if (attendance.breaks) {
                   attendance.breaks.forEach((b) => {
                     if (!b.end) b.end = checkOutTimeStr;
                   });
                 }
                 attendance.adjusted = true;
                 attendance.adjustedReason = 'Overtime confirmation not received';
                 finalizeClockOut(attendance, checkOutTimeStr, settings);
                 await attendance.save();
               }
            }
          }
        } catch (innerErr) {
           console.error('Error processing attendance for overtime cron:', innerErr);
        }
      }
    } catch (error) {
      console.error('Cron job error [Overtime Confirmation]:', error);
    }
  }, 60000); // end setInterval

  console.log('✅ Overtime Check Cron Job Started');
};
