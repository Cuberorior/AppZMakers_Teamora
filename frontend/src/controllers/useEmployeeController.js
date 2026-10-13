import { useState, useEffect } from 'react';

import { BACKEND_URL } from '../config';

const parseBreakSeconds = (breakTimeSetting) => {
  let allowedBreakMin = 60;
  if (breakTimeSetting) {
    const match = breakTimeSetting.match(/(\d+)\s*(hour|minute|min)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      allowedBreakMin = unit.startsWith('hour') ? val * 60 : val;
    }
  }
  return allowedBreakMin * 60;
};

export function useEmployeeController(userId, updateAuth, handleLogout) {
  const getLocalTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Real HTTP state stores
  const [employee, setEmployee] = useState(null);
  const [balance, setBalance] = useState({
    annual: { total: 0, used: 0 },
    casual: { total: 0, used: 0 },
    medical: { total: 0, used: 0 }
  });
  const [myAttendance, setMyAttendance] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [mySalary, setMySalary] = useState(null);
  const [settings, setSettings] = useState({
    workHours: '8 hours',
    breakTime: '1 hour'
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Timers and checkin/checkout states
  const [checkedIn, setCheckedIn] = useState(false);
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [sessionConfirmLevel, setSessionConfirmLevel] = useState(0); // 0=none, 1=10h, 2=reminder1, 3=reminder2
  const [workerRef, setWorkerRef] = useState(null);
  const [onBreak, setOnBreak] = useState(false);
  const [onTeaBreak, setOnTeaBreak] = useState(false);
  const [sessionSecs, setSessionSecs] = useState(0);
  const [breakSecs, setBreakSecs] = useState(0);
  const [teaBreakSecs, setTeaBreakSecs] = useState(0);
  const [teaExceedSecs, setTeaExceedSecs] = useState(0);
  const [onTeaExceed, setOnTeaExceed] = useState(false);
  const [showTeaExceedPopup, setShowTeaExceedPopup] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [currentBreakStart, setCurrentBreakStart] = useState(null);
  const [teaBreakGapRemainingSecs, setTeaBreakGapRemainingSecs] = useState(0);
  const [todayTasks, setTodayTasks] = useState([]);
  const [shiftNotices, setShiftNotices] = useState([]);
  const [overtimeState, setOvertimeState] = useState({ status: 'idle', confirmedHours: 0, nextConfirmDueAt: null });
  const [nextShiftStartInfo, setNextShiftStartInfo] = useState(null);
  
  // Checkout Summary State
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [todaySummary, setTodaySummary] = useState(null);

  // Leave form states
  const [showForm, setShowForm] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('all');
  const [leaveMonthFilter, setLeaveMonthFilter] = useState('all');
  const [leaveYearFilter, setLeaveYearFilter] = useState(() => String(new Date().getFullYear()));
  const [leaveForm, setLeaveForm] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false
  });
  const [leaveError, setLeaveError] = useState('');

  // Attendance history selection state
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [selectedMonthNum, setSelectedMonthNum] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const selectedMonth = `${selectedYear}-${selectedMonthNum}`;
  const [filterType, setFilterType] = useState('monthly'); // 'monthly', 'weekly', 'custom'
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Chart month filter state
  const [chartMonth, setChartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Load all user profile, leave, and attendance data from backend
  const fetchData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      let localEmployee = null;
      let localSettings = null;
      // Fetch Employee Profile & Leave Balance
      const empRes = await fetch(`${BACKEND_URL}/employees/${userId}`);
      if (empRes.ok) {
        const empData = await empRes.json();
        localEmployee = empData.employee;
        setEmployee(empData.employee);
        setBalance(empData.leaveBalance);
        if (empData.settings) {
          localSettings = empData.settings;
          setSettings(empData.settings);
        }
      }

      // Fetch Attendance Log
      const attRes = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`);
      if (attRes.ok) {
        const attData = await attRes.json();
        setMyAttendance(attData);

        // Detect if already clocked in or active session exists
        const todayStr = getLocalTodayStr();
        let todayRecord = attData.find(a => a.checkIn && !a.checkOut);
        
        let isSessionOverCooldown = false;
        if (!todayRecord && attData.length > 0) {
          const lastRecord = attData[0];
          if (lastRecord && lastRecord.date) {
            let empShift = localEmployee?.shift || 'morning';
            let startTimeStr = empShift === 'night' 
              ? (localSettings?.nightShiftStartTime || '21:00') 
              : (localSettings?.morningShiftStartTime || '09:00');
            
            const [yr, mo, da] = lastRecord.date.split('-');
            const nextShiftDate = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, parseInt(da, 10));
            nextShiftDate.setDate(nextShiftDate.getDate() + 1);
            
            const [sh, sm] = startTimeStr.split(':').map(Number);
            nextShiftDate.setHours(sh || 0, sm || 0, 0, 0);
            
            if (new Date() < nextShiftDate) {
              isSessionOverCooldown = true;
              todayRecord = lastRecord;
              setNextShiftStartInfo(nextShiftDate);
            } else {
              setNextShiftStartInfo(null);
            }
          }
        }

        if (!todayRecord && !isSessionOverCooldown) {
          todayRecord = attData.find(a => a.date === todayStr);
        }

        if (todayRecord || isSessionOverCooldown) {
          setHasAttendedToday(true);
          setCheckInTime(todayRecord.checkIn);
          setCheckInDate(todayRecord.date);
          setCheckedIn(!!todayRecord.checkIn && !todayRecord.checkOut);
          setTodayTasks(todayRecord.tasks || []);
          setOvertimeState(todayRecord.overtimeState || { status: 'idle', confirmedHours: 0, nextConfirmDueAt: null });
          const recBreaks = todayRecord.breaks || [];
          const recOnBreak = !!todayRecord.onBreak;
          const recOnTeaBreak = !!todayRecord.onTeaBreak;
          const recOnTeaExceed = !!todayRecord.onTeaExceed;
          setBreaks(recBreaks);
          setOnBreak(recOnBreak);
          setOnTeaBreak(recOnTeaBreak);
          setOnTeaExceed(recOnTeaExceed);
          if (recOnTeaExceed) {
            setShowTeaExceedPopup(true);
          }

          if (todayRecord.checkIn && !todayRecord.checkOut) {


            const now = new Date();
            const getSecsFromTime = (tStr) => {
              if (!tStr) return 0;
              const parts = tStr.split(':').map(Number);
              const h = parts[0] || 0;
              const m = parts[1] || 0;
              const s = parts[2] || 0;
              return h * 3600 + m * 60 + s;
            };
            const checkInSecs = getSecsFromTime(todayRecord.checkIn);
            const nowSecsRaw = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            const nowSecs = nowSecsRaw < checkInSecs ? (nowSecsRaw + 86400) : nowSecsRaw;

            const getAdjustedSecs = (tStr) => {
              const secs = getSecsFromTime(tStr);
              if (secs < checkInSecs) {
                return secs + 86400;
              }
              return secs;
            };

            let accumulatedBreakSecs = 0;
            let accumulatedTeaSecs = 0;
            let accumulatedTeaExceedSecs = 0;
            recBreaks.forEach(b => {
              if (b.type === 'tea') {
                if (b.start && b.end) {
                  accumulatedTeaSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
                } else if (b.start && !b.end) {
                  accumulatedTeaSecs += (nowSecs - getAdjustedSecs(b.start));
                }
              } else if (b.type === 'tea_exceed') {
                if (b.start && b.end) {
                  accumulatedTeaExceedSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
                } else if (b.start && !b.end) {
                  accumulatedTeaExceedSecs += (nowSecs - getAdjustedSecs(b.start));
                }
              } else {
                if (b.start && b.end) {
                  accumulatedBreakSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
                } else if (b.start && !b.end) {
                  accumulatedBreakSecs += (nowSecs - getAdjustedSecs(b.start));
                }
              }
            });

            setBreakSecs(Math.max(0, accumulatedBreakSecs));
            setTeaBreakSecs(Math.max(0, accumulatedTeaSecs));
            setTeaExceedSecs(Math.max(0, accumulatedTeaExceedSecs));

            // Net work secs = elapsed total secs since check-in minus extra break secs and excess tea secs
            const totalElapsedSecs = nowSecs - checkInSecs;
            const netWorkSecs = totalElapsedSecs - accumulatedBreakSecs - accumulatedTeaExceedSecs;
            setSessionSecs(Math.max(0, netWorkSecs));
          }
        }
      }

      // Fetch Leaves
      const leavesRes = await fetch(`${BACKEND_URL}/employees/${userId}/leaves`);
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setAllLeaves(leavesData);
      }

      // Fetch Shift Notices
      const noticesRes = await fetch(`${BACKEND_URL}/employees/${userId}/shift-notices`);
      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        setShiftNotices(noticesData || []);
      }

    } catch (err) {
      console.error('Error fetching employee telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener('refresh_attendance', handleRefresh);
    return () => {
      window.removeEventListener('refresh_attendance', handleRefresh);
    };
  }, [userId]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Sync timers dynamically relative to absolute check-in time and actual breaks
  useEffect(() => {
    if (!checkedIn || !checkInTime) {
      return;
    }

    const updateTimers = () => {
      // Auto-logout check: 24h limit
      if (checkInDate && checkInTime) {
        const checkInDateObj = new Date(`${checkInDate}T${checkInTime}`);
        if (!isNaN(checkInDateObj.getTime())) {
          const elapsedMs = Date.now() - checkInDateObj.getTime();
          if (elapsedMs > 24 * 60 * 60 * 1000) {
            if (handleLogout) {
              handleLogout();
            } else {
              window.location.href = '/login';
            }
            return;
          }
        }
      }

      const now = new Date();
      const getSecsFromTime = (tStr) => {
        if (!tStr) return 0;
        const parts = tStr.split(':').map(Number);
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        const s = parts[2] || 0;
        return h * 3600 + m * 60 + s;
      };

      const checkInSecs = getSecsFromTime(checkInTime);
      const nowSecsRaw = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const nowSecs = nowSecsRaw < checkInSecs ? (nowSecsRaw + 86400) : nowSecsRaw;

      const getAdjustedSecs = (tStr) => {
        const secs = getSecsFromTime(tStr);
        if (secs < checkInSecs) {
          return secs + 86400;
        }
        return secs;
      };

      let accumulatedBreakSecs = 0;
      let accumulatedTeaSecs = 0;
      let accumulatedTeaExceedSecs = 0;
      const recBreaks = breaks || [];

      recBreaks.forEach(b => {
        if (b.type === 'tea') {
          if (b.start && b.end) {
            accumulatedTeaSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
          } else if (b.start && !b.end) {
            accumulatedTeaSecs += (nowSecs - getAdjustedSecs(b.start));
          }
        } else if (b.type === 'tea_exceed') {
          if (b.start && b.end) {
            accumulatedTeaExceedSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
          } else if (b.start && !b.end) {
            accumulatedTeaExceedSecs += (nowSecs - getAdjustedSecs(b.start));
          }
        } else {
          if (b.start && b.end) {
            accumulatedBreakSecs += (getAdjustedSecs(b.end) - getAdjustedSecs(b.start));
          } else if (b.start && !b.end) {
            accumulatedBreakSecs += (nowSecs - getAdjustedSecs(b.start));
          }
        }
      });

      setBreakSecs(Math.max(0, accumulatedBreakSecs));
      setTeaBreakSecs(Math.max(0, accumulatedTeaSecs));
      setTeaExceedSecs(Math.max(0, accumulatedTeaExceedSecs));

      const totalElapsedSecs = nowSecs - checkInSecs;
      const netWorkSecs = totalElapsedSecs - accumulatedBreakSecs - accumulatedTeaExceedSecs;
      setSessionSecs(Math.max(0, netWorkSecs));
    };

    // Initial update
    updateTimers();

    const interval = setInterval(updateTimers, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateTimers);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateTimers);
    };
  }, [checkedIn, checkInTime, checkInDate, breaks, handleLogout]);


  // Sync gap/cooldown remaining seconds
  useEffect(() => {
    let timer = null;
    const calculateGap = () => {
      const teaBreaksMax = settings.teaBreaksMax !== undefined ? settings.teaBreaksMax : 2;
      const teaBreakGap = settings.teaBreakGap !== undefined ? settings.teaBreakGap : 120; // in minutes
      const teaBreaksList = breaks.filter(b => b.type === 'tea');
      const completedTeaCount = teaBreaksList.filter(b => b.end).length;

      if (teaBreaksList.length > 0 && teaBreaksList.length < teaBreaksMax && !onTeaBreak && !onTeaExceed) {
        // Find the last tea break or tea_exceed break end time
        const lastRelevant = [...breaks]
          .reverse()
          .find(b => (b.type === 'tea' || b.type === 'tea_exceed') && b.end);
        if (lastRelevant && lastRelevant.end) {
          const parts = lastRelevant.end.split(':').map(Number);
          const lastEndSecs = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);

          const now = new Date();
          const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

          let elapsedSecs = nowSecs - lastEndSecs;
          if (elapsedSecs < 0) elapsedSecs += 86400; // Handle midnight crossover

          const requiredGapSecs = teaBreakGap * 60;
          const remaining = Math.max(0, requiredGapSecs - elapsedSecs);
          setTeaBreakGapRemainingSecs(remaining);
          return;
        }
      }
      setTeaBreakGapRemainingSecs(0);
    };

    if (checkedIn) {
      calculateGap();
      timer = setInterval(calculateGap, 1000);
    } else {
      setTeaBreakGapRemainingSecs(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [checkedIn, breaks, onTeaBreak, settings]);

  // Auto-end Tea Break when duration is reached
  useEffect(() => {
    const duration = settings.teaBreakDuration !== undefined ? settings.teaBreakDuration : 15; // in minutes
    const limitSecs = duration * 60;
    let interval = null;

    if (onTeaBreak) {
      const checkAndEndBreak = () => {
        const activeTeaBreak = breaks.find(b => b.type === 'tea' && !b.end);
        if (activeTeaBreak && activeTeaBreak.start) {
          const parts = activeTeaBreak.start.split(':').map(Number);
          const startSecsRaw = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);

          const getSecsFromTime = (tStr) => {
            if (!tStr) return 0;
            const p = tStr.split(':').map(Number);
            return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
          };
          const checkInSecs = getSecsFromTime(checkInTime);
          const startSecs = startSecsRaw < checkInSecs ? startSecsRaw + 86400 : startSecsRaw;

          const now = new Date();
          const nowSecsRaw = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
          const nowSecs = nowSecsRaw < checkInSecs ? nowSecsRaw + 86400 : nowSecsRaw;

          const currentBreakDurationSecs = nowSecs - startSecs;

          if (currentBreakDurationSecs >= limitSecs) {
            // Trigger fetchData which will cause the backend to auto-end the tea break
            // and transition to tea_exceed, thereby showing the popup.
            fetchData();
          }
        }
      };
      
      // Check immediately
      checkAndEndBreak();
      // Then check every second
      interval = setInterval(checkAndEndBreak, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onTeaBreak, breaks, checkInTime, settings]);

  // Helpers
  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTimeString = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const [showTaskWarning, setShowTaskWarning] = useState(false);

  const handleCancelLeave = async (leaveId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/leaves/${leaveId}/cancel`, {
        method: 'PUT',
      });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to cancel leave request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/leaves/${leaveId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to remove leave history');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Session Over Modal State
  const [showSessionOverModal, setShowSessionOverModal] = useState(false);
  const [sessionOverModalType, setSessionOverModalType] = useState('cooldown'); // 'cooldown' | 'tooEarly'

  // Actions
  const handleCheckIn = async () => {
    if (hasAttendedToday) {
      setSessionOverModalType('cooldown');
      setShowSessionOverModal(true);
      return;
    }

    // Local validation for early checkin
    const empShift = employee?.shift || 'morning';
    const startTimeStr = empShift === 'night' 
      ? (settings?.nightShiftStartTime || '21:00') 
      : (settings?.morningShiftStartTime || '09:00');
    
    const now = new Date();
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const startSecs = (sh * 3600) + ((sm || 0) * 60);
    const nowSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    
    let isTooEarly = false;
    if (empShift === 'night') {
      if (nowSecs < startSecs && nowSecs > 43200) { // Afternoon/evening check
        isTooEarly = true;
      }
    } else {
      if (nowSecs < startSecs) {
        isTooEarly = true;
      }
    }

    if (isTooEarly) {
      const shiftDate = new Date();
      shiftDate.setHours(sh, sm || 0, 0, 0);
      setNextShiftStartInfo(shiftDate);
      setSessionOverModalType('tooEarly');
      setShowSessionOverModal(true);
      return;
    }

    const todayStr = getLocalTodayStr();
    const timeNow = getTimeString();

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock-in', time: timeNow, date: todayStr })
      });
      if (res.ok) {
        setCheckedIn(true);
        setHasAttendedToday(true);
        setCheckInTime(timeNow);
        setSessionSecs(0);
        setBreakSecs(0);
        setTeaBreakSecs(0);
        setBreaks([]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = () => {
    if (todayTasks.length === 0) {
      setShowTaskWarning(true);
      return;
    }

    // Show the checkout confirmation modal in all cases.
    // If they are on a break, the modal will warn them that checking out ends the break.
    setShowCheckoutConfirm(true);
  };

  const confirmCheckOut = async () => {
    setShowCheckoutConfirm(false);
    const todayStr = getLocalTodayStr();
    const timeNow = getTimeString();

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock-out',
          time: timeNow,
          date: todayStr
        })
      });
      if (res.ok) {
        setCheckedIn(false);
        setOnBreak(false);
        setOnTeaBreak(false);
        
        // Show goodbye summary for 30s
        setTodaySummary({
            sessionSecs,
            breakSecs,
            teaBreakSecs,
            teaExceedSecs,
            tasks: todayTasks,
            checkInTime,
            checkOutTime: timeNow
        });
        setShowGoodbye(true);
        setTimeout(() => {
            setShowGoodbye(false);
            setTodaySummary(null);
        }, 30000);

        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOvertime = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance/confirm-overtime`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setOvertimeState(data.record.overtimeState || { status: 'idle', confirmedHours: 0, nextConfirmDueAt: null });
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to confirm overtime');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSessionContinue = () => {
      setSessionConfirmLevel(0);
      setShowCheckoutConfirm(false);
      if (workerRef) {
          workerRef.postMessage({ action: 'RESET_INTERVAL' });
      }
  };

  const handleBreak = async () => {
    const todayStr = getLocalTodayStr();
    const timeNow = getTimeString();
    const newOnBreak = !onBreak;

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newOnBreak ? 'start-break' : 'end-break',
          time: timeNow,
          date: todayStr
        })
      });
      if (res.ok) {
        setOnBreak(newOnBreak);
        if (newOnBreak) {
          setCurrentBreakStart(timeNow);
          setBreaks(prev => [...prev, { start: timeNow, end: null, type: 'meal' }]);
        } else {
          setBreaks(prev => prev.map((b, i) => i === prev.length - 1 ? { ...b, end: timeNow } : b));
          setCurrentBreakStart(null);
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTeaBreak = async () => {
    const todayStr = getLocalTodayStr();
    const timeNow = getTimeString();
    const newOnTeaBreak = !onTeaBreak;

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newOnTeaBreak ? 'start-tea-break' : 'end-tea-break',
          time: timeNow,
          date: todayStr
        })
      });
      if (res.ok) {
        setOnTeaBreak(newOnTeaBreak);
        if (newOnTeaBreak) {
          setBreaks(prev => [...prev, { start: timeNow, end: null, type: 'tea' }]);
        } else {
          setBreaks(prev => prev.map((b, i) => i === prev.length - 1 ? { ...b, end: timeNow } : b));
        }
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to toggle Tea Break');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndTeaExceed = async () => {
    const todayStr = getLocalTodayStr();
    const timeNow = getTimeString();

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-tea-exceed',
          time: timeNow,
          date: todayStr
        })
      });
      if (res.ok) {
        setOnTeaExceed(false);
        setShowTeaExceedPopup(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to end excess tea break time');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveSubmit = async (e) => {
    if (e) e.preventDefault();
    setLeaveError('');
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    let days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    if (leaveForm.halfDay) {
      days = 0.5;
    }

    // 1. Balance validation
    const leaveBal = balance[leaveForm.type];
    const available = leaveBal ? (leaveBal.total - leaveBal.used) : 0;
    if (available <= 0) {
      setLeaveError(`You have 0 ${leaveForm.type} leave balance remaining.`);
      return;
    }
    if (days > available) {
      setLeaveError(`You cannot apply for ${days} days. You only have ${available} ${leaveForm.type} leave days remaining.`);
      return;
    }

    // 2. Duplicate date validation
    const newStart = start.getTime();
    const newEnd = end.getTime();

    const hasOverlap = allLeaves.some(l => {
      if (l.status === 'rejected' || l.status === 'cancelled') return false; // Rejected/cancelled leaves don't block new ones
      const existingStart = new Date(l.startDate).getTime();
      const existingEnd = new Date(l.endDate).getTime();
      return (newStart <= existingEnd && newEnd >= existingStart);
    });

    if (hasOverlap) {
      setLeaveError('You already have a pending or approved leave scheduled for these dates. Please choose different dates.');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: leaveForm.type,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          days,
          reason: leaveForm.reason
        })
      });

      if (res.ok) {
        setLeaveForm({ type: 'casual', startDate: '', endDate: '', reason: '', halfDay: false });
        setShowForm(false);
        fetchData();
      } else {
        const errData = await res.json();
        setLeaveError(errData.error || 'Failed to submit leave application');
      }
    } catch (err) {
      console.error(err);
      setLeaveError('Server error while submitting application.');
    }
  };

  const handleAddTask = async (description, timeContext) => {
    const todayStr = getLocalTodayStr();
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-task',
          description,
          timeContext,
          date: todayStr
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record && data.record.tasks) {
          setTodayTasks(data.record.tasks);
        }
        fetchData();
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Failed to add task' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Server error' };
    }
  };

  const handleEditTask = async (taskId, description, timeContext) => {
    const todayStr = getLocalTodayStr();
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit-task',
          taskId,
          description,
          timeContext,
          date: todayStr
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record && data.record.tasks) {
          setTodayTasks(data.record.tasks);
        }
        fetchData();
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Failed to edit task' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Server error' };
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        fetchData();
        if (profileData.avatar !== undefined || profileData.name) {
          if (updateAuth) {
            updateAuth({
              avatar: data.employee.avatar || '',
              name: data.employee.name,
            });
          }
        }
        return { success: true, message: data.message || 'Profile updated successfully' };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || 'Failed to update profile' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message || 'Server error updating profile' };
    }
  };

  // Filter for current month's records for dashboard stats
  const currentMonthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthRecords = myAttendance.filter(a => a.date && a.date.startsWith(currentMonthPrefix));

  const presentDays = currentMonthRecords.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentDays = currentMonthRecords.filter(a => a.status === 'absent').length;
  const totalWorkingDays = currentMonthRecords.length;
  const attendancePct = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;
  const monthlyHours = currentMonthRecords.reduce((sum, a) => sum + (a.totalHours || 0), 0);

  const today = new Date();
  const day = today.getDay();
  const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const formatDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const startOfWeekStr = formatDateStr(startOfWeek);
  const endOfWeekStr = formatDateStr(endOfWeek);

  const currentWeekRecords = myAttendance.filter(a => a.date && a.date >= startOfWeekStr && a.date <= endOfWeekStr);
  const weeklyHours = currentWeekRecords.reduce((sum, a) => sum + (a.totalHours || 0), 0);

  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekLabel = `${shortMonthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${shortMonthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}`;
  const totalLeaveUsed = (balance.annual?.used || 0) + (balance.casual?.used || 0) + (balance.medical?.used || 0);
  const totalLeave = (balance.annual?.total || 0) + (balance.casual?.total || 0) + (balance.medical?.total || 0);

  // Parse allowed break limits
  let allowedBreakMin = 60;
  if (settings && settings.breakTime) {
    const match = settings.breakTime.match(/(\d+)\s*(hour|minute|min)/i);
    if (match) {
      const val = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      allowedBreakMin = unit.startsWith('hour') ? val * 60 : val;
    }
  }
  const allowedBreakSecs = allowedBreakMin * 60;
  const remainingBreakSecs = Math.max(0, allowedBreakSecs - breakSecs);
  const isBreakOver = breakSecs > allowedBreakSecs;

  // Parse standard target work hours
  let stdHours = 8;
  if (settings && settings.workHours) {
    const match = settings.workHours.match(/(\d+)/);
    if (match) stdHours = parseInt(match[1]);
  }
  const targetWorkSecs = stdHours * 3600;

  const totalExtraHours = currentMonthRecords.reduce((sum, a) => sum + (a.extraHours || 0), 0);
  const totalLessHours = currentMonthRecords.reduce((sum, a) => sum + (a.lessHours || 0), 0);

  const isDateInCompanyMonth = (dateStr, companyMonthStr) => {
    const [yr, mo] = companyMonthStr.split('-').map(Number);
    let prevYr = yr;
    let prevMo = mo - 1;
    if (prevMo === 0) {
      prevMo = 12;
      prevYr -= 1;
    }
    const startStr = `${prevYr}-${String(prevMo).padStart(2, '0')}-28`;
    const endStr = `${yr}-${String(mo).padStart(2, '0')}-27`;
    return dateStr >= startStr && dateStr <= endStr;
  };

  const getWeekRange = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dayVal = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayVal}`;
    };
    return { mondayStr: format(monday), sundayStr: format(sunday) };
  };

  const leavesForMonthYear = allLeaves.filter(l => {
    if (leaveMonthFilter !== 'all') {
      const leaveDate = l.startDate || l.appliedOn;
      if (!leaveDate) return false;
      const [y, m] = leaveDate.split('-');
      if (y !== leaveYearFilter || m !== leaveMonthFilter) return false;
    } else if (leaveYearFilter !== 'all') {
      const leaveDate = l.startDate || l.appliedOn;
      if (leaveDate && !leaveDate.startsWith(leaveYearFilter)) return false;
    }
    return true;
  });

  const leaveCounts = {
    all: leavesForMonthYear.length,
    pending: leavesForMonthYear.filter(l => l.status === 'pending').length,
    approved: leavesForMonthYear.filter(l => l.status === 'approved').length,
    rejected: leavesForMonthYear.filter(l => l.status === 'rejected').length,
    cancelled: leavesForMonthYear.filter(l => l.status === 'cancelled').length,
  };

  const filteredLeaves = leavesForMonthYear.filter(l => {
    if (leaveFilter !== 'all' && l.status !== leaveFilter) return false;
    return true;
  });

  let filteredAttendance = [];
  let targetWeeklyHours = (targetWorkSecs || 28800) * 5 / 3600; // defaults to 40

  if (filterType === 'monthly') {
    filteredAttendance = myAttendance.filter(a => isDateInCompanyMonth(a.date, selectedMonth));
  } else if (filterType === 'weekly') {
    const { mondayStr, sundayStr } = getWeekRange(selectedWeekDate);
    filteredAttendance = myAttendance.filter(a => a.date >= mondayStr && a.date <= sundayStr);

    let overlapDays = 0;
    const approvedLeavesInWeek = allLeaves.filter(l => l.status === 'approved' && l.startDate && l.endDate);
    approvedLeavesInWeek.forEach(l => {
      let d = new Date(l.startDate);
      const endD = new Date(l.endDate);
      while (d <= endD) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${day}`;
        const dayOfWeek = d.getDay();
        // Only count weekdays
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          if (dStr >= mondayStr && dStr <= sundayStr) {
            overlapDays += (l.halfDay ? 0.5 : 1);
          }
        }
        d.setDate(d.getDate() + 1);
      }
    });

    targetWeeklyHours -= overlapDays * ((targetWorkSecs || 28800) / 3600);
    if (targetWeeklyHours < 0) targetWeeklyHours = 0;

  } else if (filterType === 'custom') {
    filteredAttendance = myAttendance.filter(a => a.date >= customStartDate && a.date <= customEndDate);
  }

  // Calculate dynamic weeklyHoursChartData based on chartMonth
  const weeklyHoursChartData = [];
  if (chartMonth) {
    const [yr, mo] = chartMonth.split('-').map(Number);
    const lastDayOfMonth = new Date(yr, mo, 0); // Last day of the selected month
    for (let i = 3; i >= 0; i--) {
      const d = new Date(lastDayOfMonth);
      d.setDate(d.getDate() - i * 7);
      
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const startW = new Date(d);
      startW.setDate(diffToMonday);
      startW.setHours(0, 0, 0, 0);
      
      const endW = new Date(startW);
      endW.setDate(startW.getDate() + 6);
      endW.setHours(23, 59, 59, 999);
      
      const startStr = formatDateStr(startW);
      const endStr = formatDateStr(endW);
      
      const weekRecords = myAttendance.filter(a => a.date && a.date >= startStr && a.date <= endStr);
      const wHours = weekRecords.reduce((sum, a) => sum + (a.totalHours || 0), 0);
      
      weeklyHoursChartData.push({
        week: `W${4 - i}`,
        hours: Number(wHours.toFixed(1))
      });
    }
  }

  const joinDateSafe = employee ? employee.joinDate : '2023-01-01';
  const yearsTenure = Math.floor((new Date().getTime() - new Date(joinDateSafe).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) || 0;
  const monthsTenure = Math.floor(((new Date().getTime() - new Date(joinDateSafe).getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)) || 0;

  // Use a fallback empty object for loading state
  const currentEmployee = employee || {
    name: 'Sarah Johnson',
    email: 'sarah.j@techventures.com',
    position: 'Senior Developer',
    department: 'Engineering',
    company: 'TechVentures Ltd',
    phone: '+1 (555) 234-5678',
    address: '142 Oak Street, Austin TX 78701',
    avatar: 'SJ',
    country: 'United States'
  };

  return {
    employee: currentEmployee,
    myAttendance,
    balance,
    mySalary,
    checkedIn,
    hasAttendedToday,
    onBreak,
    onTeaBreak,
    sessionSecs,
    breakSecs,
    teaBreakSecs,
    checkInTime,
    breaks,
    currentBreakStart,
    showForm,
    setShowForm,
    leaveFilter,
    setLeaveFilter,
    leaveMonthFilter,
    setLeaveMonthFilter,
    leaveYearFilter,
    setLeaveYearFilter,
    leaveForm,
    setLeaveForm,
    filteredLeaves,
    leaveCounts,
    handleLeaveSubmit,
    leaveError,
    setLeaveError,
    selectedMonth,
    selectedYear,
    setSelectedYear,
    selectedMonthNum,
    setSelectedMonthNum,
    loading,
    settings,
    allowedBreakSecs,
    remainingBreakSecs,
    isBreakOver,
    targetWorkSecs,
    targetWeeklyHours,
    totalExtraHours,
    totalLessHours,
    showGoodbye,
    todaySummary,
    showSessionOverModal,
    setShowSessionOverModal,
    sessionOverModalType,
    nextShiftStartInfo,

    // Calculated statistics
    presentDays,
    absentDays,
    totalWorkingDays,
    attendancePct,
    monthlyHours,
    weeklyHours,
    weeklyHoursChartData,
    weekLabel,
    totalLeaveUsed,
    totalLeave,
    filteredLeaves,
    filteredAttendance,
    yearsTenure,
    monthsTenure,

    // Formatting & actions
    formatDuration,
    handleCheckIn,
    handleCheckOut,
    confirmCheckOut,
    showCheckoutConfirm,
    setShowCheckoutConfirm,
    sessionConfirmLevel,
    handleSessionContinue,
    handleBreak,
    handleTeaBreak,
    handleLeaveSubmit,
    handleDeleteLeave,
    handleUpdateProfile,
    handleAddTask,
    handleEditTask,
    todayTasks,
    showTaskWarning,
    setShowTaskWarning,
    overtimeState,
    handleConfirmOvertime,
    showTeaExceedPopup,
    handleEndTeaExceed,
    teaExceedSecs,

    // Tea break helpers
    teaBreakEnabled: settings.teaBreakEnabled !== false,
    teaBreakAllowed: currentEmployee.teaBreakAllowed !== false && currentEmployee.companyTeaBreakAllowed !== false,
    teaBreakLimitReached: (breaks.filter(b => b.type === 'tea' && b.end).length >= (settings.teaBreaksMax !== undefined ? settings.teaBreaksMax : 2)) && !onTeaBreak,
    teaBreakGapRemainingSecs,
    teaBreakDuration: settings.teaBreakDuration !== undefined ? settings.teaBreakDuration : 15,
    isTeaBreakOver: teaBreakSecs >= (((settings.teaBreaksMax !== undefined ? settings.teaBreaksMax : 2) * (settings.teaBreakDuration !== undefined ? settings.teaBreakDuration : 15)) * 60),

    // Meal break helpers
    mealBreakCount: breaks.filter(b => b.type === 'meal').length,
    mealBreakMax: settings.mealBreaksMax !== undefined ? settings.mealBreaksMax : 5,
    mealBreakLimitReached: breaks.filter(b => b.type === 'meal').length >= (settings.mealBreaksMax !== undefined ? settings.mealBreaksMax : 5),

    // Filter properties
    filterType,
    setFilterType,
    selectedWeekDate,
    setSelectedWeekDate,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    chartMonth,
    setChartMonth,
    getWeekRange,
    shiftNotices,
    handleCancelLeave
  };
}
