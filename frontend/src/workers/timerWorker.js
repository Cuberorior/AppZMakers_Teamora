let checkInSecs = null;
let targetElapsedSecs = null;
let reminderLevel = 0; 
let checkInterval = null;

// Settings for timing (in seconds)
const TWO_HOURS_SECS = 2 * 3600;
const EIGHT_HOURS_SECS = 8 * 3600;
const TEN_MINS_SECS = 10 * 60;

function getSecsFromTimeStr(tStr) {
  if (!tStr) return 0;
  const parts = tStr.split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

function getNowSecs() {
  const now = new Date();
  const nowSecsRaw = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  // If we checked in later in the day than it is now, it means it's the next day (wrapped around midnight)
  return nowSecsRaw < checkInSecs ? nowSecsRaw + 86400 : nowSecsRaw;
}

function checkTime() {
    if (checkInSecs === null || targetElapsedSecs === null) return;
    const elapsed = getNowSecs() - checkInSecs;
    if (elapsed >= targetElapsedSecs) {
        if (reminderLevel === 0) {
            self.postMessage({ type: 'SHOW_CONFIRM' });
            reminderLevel = 1;
            targetElapsedSecs = elapsed + TEN_MINS_SECS;
        } else if (reminderLevel === 1) {
            self.postMessage({ type: 'REMINDER_1' });
            reminderLevel = 2;
            targetElapsedSecs = elapsed + TEN_MINS_SECS;
        } else if (reminderLevel === 2) {
            self.postMessage({ type: 'REMINDER_2' });
            reminderLevel = 3;
            targetElapsedSecs = elapsed + TEN_MINS_SECS;
        } else if (reminderLevel === 3) {
            self.postMessage({ type: 'AUTO_CHECKOUT' });
            // Stop checking until restarted or stopped
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }
}

self.onmessage = function(e) {
    const { action, payload } = e.data;
    
    if (action === 'START') {
        checkInSecs = getSecsFromTimeStr(payload.checkInTime);
        const elapsed = getNowSecs() - checkInSecs;
        
        // Determine the next target
        if (elapsed < EIGHT_HOURS_SECS) {
            targetElapsedSecs = EIGHT_HOURS_SECS;
        } else {
            // Calculate how many 2-hour blocks past 8 hours
            const hoursPast8 = (elapsed - EIGHT_HOURS_SECS) / 3600;
            const nextEvenHourPast8 = Math.ceil(hoursPast8 / 2) * 2;
            targetElapsedSecs = EIGHT_HOURS_SECS + (nextEvenHourPast8 * 3600);
            
            if (targetElapsedSecs <= elapsed) {
                targetElapsedSecs = elapsed + TWO_HOURS_SECS;
            }
        }
        reminderLevel = 0;
        
        if (checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(checkTime, 1000); // Check every second
        
    } else if (action === 'RESET_INTERVAL') {
        // User clicked "Yes, Continue" - we reset for another 2 hours
        const elapsed = getNowSecs() - checkInSecs;
        const hoursPast8 = Math.max(0, (elapsed - EIGHT_HOURS_SECS) / 3600);
        const nextEvenHourPast8 = Math.ceil(hoursPast8 / 2) * 2;
        targetElapsedSecs = EIGHT_HOURS_SECS + (nextEvenHourPast8 * 3600);
        
        if (targetElapsedSecs <= elapsed) {
             targetElapsedSecs = elapsed + TWO_HOURS_SECS;
        }
        
        reminderLevel = 0;
        if (!checkInterval) {
            checkInterval = setInterval(checkTime, 1000);
        }
        
    } else if (action === 'STOP') {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        checkInSecs = null;
        targetElapsedSecs = null;
    }
};
