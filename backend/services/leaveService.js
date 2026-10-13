import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { calculateAllocatedCL, calculateAllocatedAL, getCasualLeavePeriodStart } from '../utils/leaveCalculator.js';
import { getSettings } from './settingsService.js';

/**
 * Synchronizes the LeaveBalance document in MongoDB for a given employee.
 * Calculates dynamic totals based on joinDate and sums up approved leave request days.
 * @param {string} employeeId - Legacy ID of the employee
 * @param {string} joinDate - Join date string (YYYY-MM-DD)
 * @returns {Promise<object>} The updated LeaveBalance document
 */
export async function syncLeaveBalance(employeeId, joinDate) {
  if (!employeeId) throw new Error('employeeId is required for syncLeaveBalance');

  // Find all approved and pending leave requests
  const activeLeaves = await LeaveRequest.find({ 
    employeeId, 
    status: { $in: ['approved', 'pending'] } 
  });

  const casualPeriodStart = getCasualLeavePeriodStart(joinDate);
  
  // Calculate total days used per type
  const casualUsed = activeLeaves
    .filter(l => l.type === 'casual' && (!casualPeriodStart || l.startDate >= casualPeriodStart))
    .reduce((sum, l) => sum + Number(l.days), 0);

  const annualUsed = activeLeaves
    .filter(l => l.type === 'annual')
    .reduce((sum, l) => sum + Number(l.days), 0);

  const medicalUsed = activeLeaves
    .filter(l => l.type === 'medical')
    .reduce((sum, l) => sum + Number(l.days), 0);

  // Compute dynamic total allocations based on original join date
  const casualTotal = calculateAllocatedCL(joinDate);
  const annualTotal = calculateAllocatedAL(joinDate);

  const settings = await getSettings();
  const medicalTotal = settings.leaveAllocations?.medical || 10;

  let balance = await LeaveBalance.findOne({ employeeId });
  if (!balance) {
    balance = new LeaveBalance({ employeeId });
  }

  balance.casual = { total: casualTotal, used: casualUsed };
  balance.annual = { total: annualTotal, used: annualUsed };
  balance.medical = { total: medicalTotal, used: medicalUsed };

  // Remove personal balance if it exists
  if (balance.personal) {
    balance.personal = undefined;
  }

  await balance.save();
  return balance;
}

/**
 * Automatically rejects pending leaves whose end dates have already passed.
 * @returns {Promise<boolean>} True if any leaves were updated
 */
export async function autoRejectPassedLeaves() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find leaves that are still pending but the end date is in the past
  const pendingLeaves = await LeaveRequest.find({ 
    status: 'pending', 
    endDate: { $lt: todayStr } 
  });
  
  if (pendingLeaves.length > 0) {
    for (const leave of pendingLeaves) {
      leave.status = 'rejected';
      leave.rejectionReason = 'Expired: Leave date has passed without approval.';
      await leave.save();
    }
    return true;
  }
  
  return false;
}
