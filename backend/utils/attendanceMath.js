import Attendance from '../models/Attendance.js';

export const getSecsFromTime = (tStr) => {
  if (!tStr) return 0;
  const parts = tStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
};

export const getTimeStringFromSecs = (secs) => {
  const s = secs % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const autoEndOverdueTeaBreaks = async (records, settings) => {
  if (!records) return;
  const list = Array.isArray(records) ? records : [records];
  const teaDuration = settings.teaBreakDuration !== undefined ? settings.teaBreakDuration : 15; // in minutes
  const limitMs = teaDuration * 60 * 1000;

  for (const record of list) {
    if (record.onTeaBreak && record.breaks) {
      const activeTeaBreak = record.breaks.find(b => b.type === 'tea' && !b.end);
      
      if (activeTeaBreak) {
        let elapsedMs = 0;
        
        // Safely use absolute UTC timestamp (Timezone agnostic)
        if (activeTeaBreak.startTimestamp) {
          elapsedMs = Date.now() - activeTeaBreak.startTimestamp;
        } else if (activeTeaBreak.start) {
          // Fallback for older records
          const startSecs = getSecsFromTime(activeTeaBreak.start);
          const tz = process.env.TIMEZONE || 'Asia/Colombo';
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
          const parts = formatter.formatToParts(new Date());
          const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
          const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
          const s = parseInt(parts.find(p => p.type === 'second').value, 10);
          const nowSecsRaw = h * 3600 + m * 60 + s;
          const nowSecs = nowSecsRaw < startSecs ? (nowSecsRaw + 86400) : nowSecsRaw;
          elapsedMs = (nowSecs - startSecs) * 1000;
        }

        if (elapsedMs >= limitMs) {
          // Calculate the end time exactly relative to the original client string
          // This keeps the display strings visually correct for the user's local timezone
          let endString;
          if (activeTeaBreak.start) {
             const startSecs = getSecsFromTime(activeTeaBreak.start);
             const endSecs = startSecs + (teaDuration * 60);
             endString = getTimeStringFromSecs(endSecs);
          } else {
             endString = getTimeStringFromSecs(getSecsFromTime('00:00:00') + (teaDuration * 60));
          }
          activeTeaBreak.end = endString;
          record.onTeaBreak = false;
          
          // Immediately start a tea_exceed break
          record.onTeaExceed = true;
          const exceedStartTimestamp = activeTeaBreak.startTimestamp ? (activeTeaBreak.startTimestamp + limitMs) : Date.now();
          record.breaks.push({
             start: endString,
             end: null,
             type: 'tea_exceed',
             startTimestamp: exceedStartTimestamp
          });

          await Attendance.updateOne(
            { _id: record._id },
            { $set: { onTeaBreak: false, onTeaExceed: true, breaks: record.breaks } }
          );
        }
      }
    }
  }
};

export const parseBreakMinutes = (breakTime) => {
  if (breakTime === null || breakTime === undefined || breakTime === '') return 60;
  const val = parseFloat(breakTime);
  if (!isNaN(val)) {
    return val * 60;
  }
  const match = String(breakTime).match(/(-?\d+(\.\d+)?)\s*(hour|minute|min)/i);
  if (match) {
    const numericVal = parseFloat(match[1]);
    const unit = match[3].toLowerCase();
    return unit.startsWith('hour') ? numericVal * 60 : numericVal;
  }
  return 60;
};

export const parseStdHours = (workHours) => {
  if (workHours === null || workHours === undefined || workHours === '') return 8;
  const val = parseFloat(workHours);
  if (!isNaN(val)) return val;
  const match = String(workHours).match(/(-?\d+(\.\d+)?)/);
  if (match) return parseFloat(match[1]);
  return 8;
};

export const addOneDay = (dateStr) => {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const finalizeClockOut = (record, checkOutTime, systemSettings) => {
  let totalBreakSecs = 0;
  let totalTeaBreakSecs = 0;
  let totalTeaExceedSecs = 0;
  if (record.breaks) {
    record.breaks.forEach((b) => {
      if (b.start && b.end) {
        const bIn = getSecsFromTime(b.start);
        let bOut = getSecsFromTime(b.end);
        if (bOut < bIn) {
          bOut += 86400; // Crossed midnight
        }
        if (b.type === 'tea') {
          totalTeaBreakSecs += (bOut - bIn);
        } else if (b.type === 'tea_exceed') {
          totalTeaExceedSecs += (bOut - bIn);
        } else {
          totalBreakSecs += (bOut - bIn);
        }
      }
    });
  }

  const actualBreakMin = Math.round(totalBreakSecs / 60);
  record.breakMinutes = actualBreakMin;
  record.checkOut = checkOutTime;

  const inSecs = getSecsFromTime(record.checkIn);
  let outSecs = getSecsFromTime(checkOutTime);
  
  if (outSecs < inSecs) {
    outSecs += 86400; // Checked out next day
    record.checkOutDate = addOneDay(record.date);
  } else {
    record.checkOutDate = record.date;
  }

  const stdHours = parseStdHours(systemSettings.workHours);

  let elapsedHrs = (outSecs - inSecs) / 3600;
  let totalHr = elapsedHrs - (totalBreakSecs + totalTeaExceedSecs) / 3600;
  totalHr = Math.max(0, Math.round(totalHr * 100) / 100);
  record.totalHours = totalHr;

  let targetHours = stdHours;

  if (totalHr > targetHours) {
    record.extraHours = Math.round((totalHr - targetHours) * 100) / 100;
    record.lessHours = 0;
  } else {
    record.extraHours = 0;
    record.lessHours = Math.round((targetHours - totalHr) * 100) / 100;
  }
};
