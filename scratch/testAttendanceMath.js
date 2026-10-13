import { finalizeClockOut, getSecsFromTime, getTimeStringFromSecs, parseStdHours, parseBreakMinutes } from '../backend/utils/attendanceMath.js';

// Mock system settings
const systemSettings = {
  workHours: 8, // 8 hours standard
  teaBreakDuration: 15,
};

const runTest = (name, record, checkOutTime) => {
  console.log(`\n--- Test: ${name} ---`);
  console.log(`Check In: ${record.checkIn}`);
  console.log(`Check Out: ${checkOutTime}`);
  console.log(`Breaks:`, record.breaks);
  
  finalizeClockOut(record, checkOutTime, systemSettings);
  
  console.log(`Results:`);
  console.log(`  Total Hours: ${record.totalHours} (Net Hours)`);
  console.log(`  Extra Hours: ${record.extraHours}`);
  console.log(`  Less Hours: ${record.lessHours}`);
  console.log(`  Break Minutes: ${record.breakMinutes}`);
  console.log(`  Check Out Date: ${record.checkOutDate}`);
};

// Scenario 1: Normal 8 hour day, no breaks
runTest('Normal 8 hour day (09:00 to 17:00)', {
  date: '2026-06-20',
  checkIn: '09:00:00',
  breaks: []
}, '17:00:00');

// Scenario 2: Normal 8 hour day, 1 hour meal break (09:00 to 18:00)
runTest('Normal day + 1hr meal break (09:00 to 18:00)', {
  date: '2026-06-20',
  checkIn: '09:00:00',
  breaks: [
    { type: 'meal', start: '13:00:00', end: '14:00:00' }
  ]
}, '18:00:00');

// Scenario 3: Less hours (09:00 to 15:00)
runTest('Less Hours (09:00 to 15:00)', {
  date: '2026-06-20',
  checkIn: '09:00:00',
  breaks: []
}, '15:00:00');

// Scenario 4: Extra hours (09:00 to 20:00, 1 hr break)
runTest('Extra Hours (09:00 to 20:00, 1 hr break)', {
  date: '2026-06-20',
  checkIn: '09:00:00',
  breaks: [
    { type: 'meal', start: '13:00:00', end: '14:00:00' }
  ]
}, '20:00:00');

// Scenario 5: Night Shift spanning midnight (21:00 to 06:00, 1 hr break)
runTest('Night Shift (21:00 to 06:00, 1 hr break)', {
  date: '2026-06-20',
  checkIn: '21:00:00',
  breaks: [
    { type: 'meal', start: '01:00:00', end: '02:00:00' }
  ]
}, '06:00:00');

// Scenario 6: Multiple breaks (Meal + Tea)
runTest('Multiple Breaks (09:00 to 17:30)', {
  date: '2026-06-20',
  checkIn: '09:00:00',
  breaks: [
    { type: 'tea', start: '11:00:00', end: '11:15:00' }, // 15 mins tea
    { type: 'meal', start: '13:00:00', end: '13:45:00' }, // 45 mins meal
    { type: 'tea', start: '15:30:00', end: '15:45:00' }  // 15 mins tea
  ]
}, '17:30:00');

// Scenario 7: Night Shift with break crossing midnight (21:00 to 06:00, break 23:30 to 00:30)
runTest('Night Shift Break Crossing Midnight', {
  date: '2026-06-20',
  checkIn: '21:00:00',
  breaks: [
    { type: 'meal', start: '23:30:00', end: '00:30:00' } // 1 hr break crossing midnight
  ]
}, '06:00:00');
