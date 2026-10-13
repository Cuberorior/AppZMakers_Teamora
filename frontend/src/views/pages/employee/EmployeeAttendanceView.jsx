import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { LogIn, LogOut, Coffee, Utensils, Clock, Calendar, ChevronLeft, ChevronRight, AlertCircle, ClipboardList, Plus, ChevronDown, ChevronUp, CheckCircle2, Timer } from 'lucide-react';
import { WelcomeAnimation } from '../../components/WelcomeAnimation';
import { CustomSelect } from '../../components/CustomSelect';
import sessionVideo from '../../../assets/Video_Generation_Successful.mp4';
import teaRobImg from '../../../assets/Tea.png';
import mealRobImg from '../../../assets/Meal.png';
import checkoutRobImg from '../../../assets/welcome.png';
import nightRobImg from '../../../assets/night.png';
import { formatDecimalHours, formatBreakMinutes } from '../../../utils/timeFormatter';

const statusStyles = {
  present: { label: 'Present', cls: 'bg-emerald-50 text-emerald-700' },
  late: { label: 'Late', cls: 'bg-amber-50 text-amber-700' },
  absent: { label: 'Absent', cls: 'bg-red-50 text-red-700' },
  'half-day': { label: 'Half Day', cls: 'bg-sky-50 text-sky-700' },
};

export function EmployeeAttendanceView({ mySalary,
  checkedIn,
  hasAttendedToday,
  onBreak,
  onTeaBreak,
  sessionSecs,
  breakSecs,
  teaBreakSecs,
  checkInTime,
  breaks,
  selectedMonth,
  setSelectedMonth,
  filteredAttendance,
  formatDuration,
  handleCheckIn,
  handleCheckOut,
  confirmCheckOut,
  showCheckoutConfirm,
  setShowCheckoutConfirm,
  handleBreak,
  handleTeaBreak,
  sessionConfirmLevel = 0,
  handleSessionContinue,
  todayTasks = [],
  handleAddTask,
  handleEditTask,
  // New props
  settings,
  targetWorkSecs,
  targetWeeklyHours,
  totalExtraHours,
  totalLessHours,
  remainingBreakSecs,
  isBreakOver,
  teaBreakEnabled,
  teaBreakAllowed,
  mealBreakCount,
  mealBreakMax,
  mealBreakLimitReached,
  teaBreakLimitReached,
  teaBreakGapRemainingSecs,
  teaBreakDuration,
  isTeaBreakOver,
  // Filter props
  filterType,
  setFilterType,
  selectedWeekDate,
  setSelectedWeekDate,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  getWeekRange,
  selectedYear,
  setSelectedYear,
  selectedMonthNum,
  setSelectedMonthNum,
  showGoodbye,
  todaySummary,
  showSessionOverModal,
  setShowSessionOverModal,
  sessionOverModalType = 'cooldown',
  nextShiftStartInfo,
  showTeaExceedPopup,
  handleEndTeaExceed,
  teaExceedSecs,
}) {
  const [showTeaAnimation, setShowTeaAnimation] = useState(false);
  const [showMealAnimation, setShowMealAnimation] = useState(false);
  const [showCheckoutAnim, setShowCheckoutAnim] = useState(false);
  const [isTaskBoxExpanded, setIsTaskBoxExpanded] = useState(false);
  const [taskDesc, setTaskDesc] = useState('');

  const onCheckoutProceedClick = () => {
    setShowCheckoutConfirm(false);
    setShowCheckoutAnim(true);
  };

  useEffect(() => {
    if (showTeaAnimation) {
      const timer = setTimeout(() => setShowTeaAnimation(false), 120000);
      return () => clearTimeout(timer);
    }
  }, [showTeaAnimation]);

  useEffect(() => {
    if (showMealAnimation) {
      const timer = setTimeout(() => setShowMealAnimation(false), 120000);
      return () => clearTimeout(timer);
    }
  }, [showMealAnimation]);

  const startMealBreak = () => {
    setShowMealAnimation(true);
    handleBreak();
  };

  const startTeaBreak = () => {
    setShowTeaAnimation(true);
    handleTeaBreak();
  };
  const [taskTime, setTaskTime] = useState('');
  const [taskError, setTaskError] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.expandWorkLog) {
      setIsTaskBoxExpanded(true);
      setTimeout(() => {
        const el = document.getElementById('work-log-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.state]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskTime, setEditTaskTime] = useState('');
  const [editTaskError, setEditTaskError] = useState('');

  const wordCount = taskDesc.trim().split(/\s+/).filter(Boolean).length;
  const editWordCount = editTaskDesc.trim().split(/\s+/).filter(Boolean).length;

  const startEditTask = (task) => {
    setEditingTaskId(task._id || task.id);
    setEditTaskDesc(task.description || '');
    setEditTaskTime(task.timeContext || '');
    setEditTaskError('');
  };

  const submitEditTask = async () => {
    setEditTaskError('');
    if (!editTaskDesc.trim()) {
      setEditTaskError('Task description is required.');
      return;
    }
    if (editWordCount > 50) {
      setEditTaskError('Task description must not exceed 50 words.');
      return;
    }
    const res = await handleEditTask(editingTaskId, editTaskDesc.trim(), editTaskTime.trim());
    if (res.success) {
      setEditingTaskId(null);
      setEditTaskDesc('');
      setEditTaskTime('');
    } else {
      setEditTaskError(res.error || 'Failed to save task.');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskError('');
    if (!taskDesc.trim()) {
      setTaskError('Task description is required.');
      return;
    }
    if (wordCount > 50) {
      setTaskError('Task description must not exceed 50 words.');
      return;
    }
    const res = await handleAddTask(taskDesc.trim(), taskTime.trim());
    if (res.success) {
      setTaskDesc('');
      setTaskTime('');
    } else {
      setTaskError(res.error || 'Failed to save task.');
    }
  };

  const formatGapTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const getTeaBreakDetails = (breaks = [], checkOutStr = null) => {
    const teaBreaks = breaks?.filter(b => b.type === 'tea') || [];
    const count = teaBreaks.length;
    if (count === 0) return '—';

    const getSecsFromTime = (tStr) => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return h * 3600 + m * 60 + s;
    };

    let totalSecs = 0;
    teaBreaks.forEach(b => {
      if (b.start) {
        let bIn = getSecsFromTime(b.start);
        let endStr = b.end;
        if (!endStr) {
          if (checkOutStr) {
            endStr = checkOutStr;
          } else {
            const now = new Date();
            endStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          }
        }
        let bOut = getSecsFromTime(endStr);
        if (bOut < bIn) bOut += 86400;
        totalSecs += (bOut - bIn);
      }
    });

    const totalMins = Math.round(totalSecs / 60);
    return `${totalMins} min (${count} break${count !== 1 ? 's' : ''})`;
  };

  const getMealBreakDetails = (breaks = [], fallbackMins = 0, checkOutStr = null) => {
    const mealBreaks = breaks?.filter(b => b.type === 'meal' || (b.type !== 'tea' && b.type !== 'tea_exceed')) || [];
    const count = mealBreaks.length;
    if (count === 0) {
      if (fallbackMins > 0) {
        const h = Math.floor(fallbackMins / 60);
        const m = Math.round(fallbackMins % 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}min`;
      }
      return '—';
    }

    const getSecsFromTime = (tStr) => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return h * 3600 + m * 60 + s;
    };

    let totalSecs = 0;
    mealBreaks.forEach(b => {
      if (b.start) {
        let bIn = getSecsFromTime(b.start);
        let endStr = b.end;
        if (!endStr) {
          if (checkOutStr) {
            endStr = checkOutStr;
          } else {
            const now = new Date();
            endStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          }
        }
        let bOut = getSecsFromTime(endStr);
        if (bOut < bIn) bOut += 86400;
        totalSecs += (bOut - bIn);
      }
    });

    const totalMins = Math.round(totalSecs / 60);

    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;

    if (h > 0) {
      return `${h}h ${m}m (${count} break${count !== 1 ? 's' : ''})`;
    }
    return `${m} min (${count} break${count !== 1 ? 's' : ''})`;
  };

  const netWork = sessionSecs;
  const currentTarget = targetWorkSecs || 28800;
  const progress = Math.min(100, (netWork / currentTarget) * 100);

  const weeklyTotalHours = filterType === 'weekly'
    ? filteredAttendance.reduce((sum, r) => sum + (r.totalHours || 0), 0)
    : 0;

  const handlePrevWeek = () => {
    if (!selectedWeekDate) return;
    const [y, m, d] = selectedWeekDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    setSelectedWeekDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextWeek = () => {
    if (!selectedWeekDate) return;
    const [y, m, d] = selectedWeekDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 7);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    setSelectedWeekDate(`${newY}-${newM}-${newD}`);
  };

  const availableYears = [];
  for (let y = 2030; y >= 2024; y--) {
    availableYears.push(y);
  }

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const getCompanyMonthRangeLabel = (yearStr, monthNumStr) => {
    const yr = Number(yearStr);
    const mo = Number(monthNumStr);
    let prevYr = yr;
    let prevMo = mo - 1;
    if (prevMo === 0) {
      prevMo = 12;
      prevYr -= 1;
    }
    const formatMonthName = (m) => {
      const dates = new Date(2000, m - 1, 1);
      return dates.toLocaleDateString('en-US', { month: 'short' });
    };
    return `${formatMonthName(prevMo)} 28, ${prevYr} - ${formatMonthName(mo)} 27, ${yr}`;
  };



  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div>
        <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.375rem' }}>Attendance</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your daily check-in, check-out, and breaks</p>
      </div>

      {/* Main clock - Glassmorphism Redesign */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl shadow-indigo-900/20 group">

        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen pointer-events-none z-0"
        >
          <source src={sessionVideo} type="video/mp4" />
        </video>

        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000 z-0"></div>

        <div className="relative z-10 p-10 text-center">
          <p className="text-indigo-300 font-bold tracking-widest text-xs uppercase mb-4">Current Session Timer</p>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white mb-4 drop-shadow-lg text-5xl sm:text-6xl md:text-[4.5rem] leading-none md:leading-[4.5rem] tracking-normal md:tracking-[0.05em]" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
            {formatDuration(sessionSecs)}
          </div>
          <div className="flex items-center justify-center gap-3 text-indigo-200 text-sm font-medium bg-white/5 w-max mx-auto px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            {checkedIn ? (
              <>
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                Session active {checkInTime ? `since ${checkInTime}` : ''}
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
                Not checked in
              </>
            )}
          </div>

          {/* Progress ring area */}
          {checkedIn && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex justify-between text-xs text-indigo-300 font-bold mb-3 uppercase tracking-wider">
                <span>0h</span>
                <span className="text-white bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">{Math.round(progress)}% of {Math.round(currentTarget / 3600)}h target</span>
                <span>{Math.round(currentTarget / 3600)}h</span>
              </div>
              <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%`, background: progress >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #4f46e5, #818cf8)' }}
                >
                  <div className="w-full h-full opacity-30 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] animate-[stripe_1s_linear_infinite]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - Glassmorphism */}
        <div className="relative z-10 p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-4 rounded-2xl font-black transition-all duration-300 transform active:scale-95 shadow-xl shadow-indigo-500/30 tracking-wide text-lg"
              >
                <LogIn className="w-6 h-6" />
                MARK CHECK-IN
              </button>
            ) : (
              <>
                <div className="relative flex-1">
                  <button
                    onClick={onBreak ? handleBreak : startMealBreak}
                    disabled={onTeaBreak || (!onBreak && (mealBreakLimitReached || isBreakOver))}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 border-2 shadow-lg ${onBreak
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : (mealBreakLimitReached || isBreakOver)
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40 shadow-white/5'
                      }`}
                  >
                    <Utensils className={`w-5 h-5 ${onBreak ? 'text-amber-400' : (mealBreakLimitReached || isBreakOver) ? 'text-slate-500' : 'text-indigo-300'}`} />
                    {onBreak ? `End Meal Break (${mealBreakCount}-${mealBreakMax})` : (mealBreakLimitReached || isBreakOver) ? `Meal Limit Reached` : `Start Meal Break (${mealBreakCount}-${mealBreakMax})`}
                  </button>
                  {showMealAnimation && onBreak && (
                    <img 
                      src={mealRobImg} 
                      alt="Meal Time" 
                      className="absolute -top-14 -right-8 w-28 h-auto animate-bounce pointer-events-none drop-shadow-xl z-[100]"
                    />
                  )}
                </div>
                {teaBreakEnabled && teaBreakAllowed && (
                  <>
                    {onTeaBreak ? (
                      <div className="relative flex-1">
                        <button
                          onClick={handleTeaBreak}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 border-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/20"
                        >
                          <Coffee className="w-5 h-5 text-emerald-400" />
                          End Tea Break
                        </button>
                        {showTeaAnimation && (
                          <img 
                            src={teaRobImg} 
                            alt="Tea Time" 
                            className="absolute -top-14 -right-8 w-28 h-auto animate-bounce pointer-events-none drop-shadow-xl z-[100]"
                          />
                        )}
                      </div>
                    ) : teaBreakLimitReached || isTeaBreakOver ? (
                      <span className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold bg-slate-800 text-slate-500 border-2 border-dashed border-slate-700">
                        Tea Limit Reached
                      </span>
                    ) : teaBreakGapRemainingSecs > 0 ? (
                      <span className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold bg-amber-900/30 text-amber-400 border-2 border-dashed border-amber-700/50 animate-pulse">
                        Next Tea: {formatGapTime(teaBreakGapRemainingSecs)}
                      </span>
                    ) : (
                      <button
                        onClick={startTeaBreak}
                        disabled={onBreak}
                        className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-95 border-2 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                      >
                        <Coffee className="w-5 h-5 text-emerald-400" />
                        Tea Break ({teaBreakDuration}m)
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleCheckOut}
                  className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-4 rounded-2xl font-black transition-all duration-300 transform active:scale-95 shadow-xl shadow-red-500/30 tracking-wide"
                >
                  <LogOut className="w-5 h-5" />
                  CHECK-OUT
                </button>
              </>
            )}
          </div>

          {checkedIn && (
            <div className={`grid grid-cols-2 ${teaBreakEnabled && teaBreakAllowed ? (teaExceedSecs > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4') : 'sm:grid-cols-3'} gap-4 mt-6 pt-6 border-t border-white/10`}>
              {[
                { label: 'Work Time', value: formatDuration(netWork), color: 'text-emerald-400' },
                { label: 'Meal Break', value: formatDuration(breakSecs), color: 'text-amber-400' },
                ...(teaBreakEnabled && teaBreakAllowed ? [{ label: 'Tea Break', value: formatDuration(teaBreakSecs), color: 'text-emerald-300' }] : []),
                ...(teaExceedSecs > 0 ? [{ label: 'Tea Extra', value: formatDuration(teaExceedSecs), color: 'text-rose-400' }] : []),
                { label: 'Remaining', value: formatDuration(Math.max(0, currentTarget - netWork)), color: 'text-indigo-300' },
              ].map(s => (
                <div key={s.label} className="text-center bg-black/20 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                  <div className={`${s.color} font-black text-xl`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breaks today */}
      {breaks.length > 0 && (
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-4 flex items-center gap-2"><Coffee className="w-4 h-4 text-amber-500" />Today's Breaks</h3>
          <div className="space-y-2">
            {breaks.map((b, i) => {
              const isTea = b.type === 'tea';
              const isExceed = b.type === 'tea_exceed';
              const bgStyle = isTea
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                : isExceed
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50'
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50';
              const label = isTea ? 'Tea Break' : isExceed ? 'Tea Extra' : 'Meal Break';
              const pulseStyle = isTea
                ? 'text-emerald-600 dark:text-emerald-400 animate-pulse'
                : isExceed
                ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                : 'text-amber-600 dark:text-amber-400 animate-pulse';

              return (
                <div key={i} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${bgStyle}`}>
                  <span className="font-medium capitalize">{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }} className="text-slate-500 dark:text-slate-400">
                    {b.start} → {b.end || <span className={pulseStyle}>ongoing</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Tasks Section - Glassmorphism */}
      <div id="work-log-section" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300">
        <button
          onClick={() => setIsTaskBoxExpanded(!isTaskBoxExpanded)}
          className={`w-full flex items-center justify-between p-6 md:p-8 transition-all text-left cursor-pointer ${isTaskBoxExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
            }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center transform transition-transform group-hover:scale-105">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">Today's Work Log</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Log completed tasks for transparency and productivity tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs tracking-wider uppercase">
              {todayTasks.length} Logged
            </span>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isTaskBoxExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {isTaskBoxExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>

        {isTaskBoxExpanded && (
          <div className="p-6 md:p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
            {hasAttendedToday ? (
              <form onSubmit={handleTaskSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 md:p-8 space-y-6 shadow-md dark:shadow-none hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  Log New Task
                </div>
                <div>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => {
                      setTaskDesc(e.target.value);
                      if (taskError) setTaskError('');
                    }}
                    placeholder="Describe what you accomplished... (Max 50 words)"
                    rows={2}
                    className="w-full text-base border border-slate-200 focus:border-indigo-500 rounded-2xl px-5 py-4 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium placeholder:text-slate-400 transition-all shadow-inner"
                  />
                  <div className="flex justify-between items-center mt-2 px-1 text-xs">
                    <span className={wordCount > 50 ? 'text-rose-500 font-bold' : 'text-slate-400 font-bold uppercase tracking-wider'}>
                      {wordCount} / 50 words
                    </span>
                    {taskError && <span className="text-rose-500 font-bold">{taskError}</span>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      placeholder="Time context (e.g. 10:00 AM) - Optional"
                      className="w-full text-base border border-slate-200 focus:border-indigo-500 rounded-2xl pl-11 pr-5 py-3.5 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium placeholder:text-slate-400 transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 px-8 rounded-2xl text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-600/30 tracking-wider"
                  >
                    <Plus className="w-5 h-5" />
                    LOG TASK
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 text-amber-800 dark:text-amber-400 text-sm font-bold flex items-center gap-3 shadow-md">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <span>You can only log tasks on days you have attended. Please Check-In first.</span>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <div className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 bg-slate-300 rounded-full" />
                Logged Tasks Today
              </div>
              {todayTasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {todayTasks.map((task, idx) => (
                    <div key={task._id || idx} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
                      {editingTaskId === (task._id || task.id) ? (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <textarea
                            value={editTaskDesc}
                            onChange={(e) => {
                              setEditTaskDesc(e.target.value);
                              if (editTaskError) setEditTaskError('');
                            }}
                            rows={2}
                            className="w-full text-base border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all"
                          />
                          <div className="flex justify-between items-center text-xs px-1">
                            <span className={editWordCount > 50 ? 'text-rose-500 font-bold' : 'text-slate-400 font-bold uppercase'}>
                              {editWordCount} / 50 words
                            </span>
                            {editTaskError && <span className="text-rose-500 font-bold">{editTaskError}</span>}
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <input
                              type="text"
                              value={editTaskTime}
                              onChange={(e) => setEditTaskTime(e.target.value)}
                              placeholder="Time/Duration context"
                              className="flex-1 text-base border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium transition-all"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingTaskId(null)}
                                className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-sm transition-colors active:scale-95"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={submitEditTask}
                                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors active:scale-95 shadow-md shadow-indigo-600/20"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-3 flex-1">
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-base leading-relaxed">{task.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/50 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-1.5 font-mono shadow-sm">
                                <Clock className="w-3.5 h-3.5" />
                                {task.timeContext || new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => startEditTask(task)}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
                          >
                            EDIT
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 font-medium flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <ClipboardList className="w-8 h-8" />
                  </div>
                  No tasks logged for today's session yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Attendance history - Glassmorphism */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
              <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">Attendance History</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">View and filter your past records</p>
            </div>
          </div>

          {/* Filter Type Swapper - Pill shape */}
          <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl items-center shadow-inner self-start lg:self-auto border border-slate-200/50 dark:border-slate-700/50">
            {[
              { id: 'monthly', label: 'Monthly' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer ${filterType === tab.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Filter Input Panel */}
        <div className="flex flex-wrap items-center gap-6 bg-slate-50/50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 mb-8 shadow-inner">
          {filterType === 'monthly' && (
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-4 sm:gap-6 w-full">
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">Year</label>
                <div className="w-full sm:w-[140px]">
                  <CustomSelect
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    options={availableYears.map(y => ({ value: String(y), label: String(y) }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">Month</label>
                <div className="w-full sm:w-[180px]">
                  <CustomSelect
                    value={selectedMonthNum}
                    onChange={e => setSelectedMonthNum(e.target.value)}
                    options={months.map(m => ({ value: m.value, label: m.label }))}
                  />
                </div>
              </div>
              <div className="text-sm text-indigo-800 dark:text-indigo-300 font-medium pb-2.5 bg-indigo-50/80 dark:bg-indigo-900/40 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Period: <strong className="font-bold">{getCompanyMonthRangeLabel(selectedYear, selectedMonthNum)}</strong>
              </div>
            </div>
          )}

          {filterType === 'weekly' && (
            <div className="flex flex-wrap items-end gap-6 w-full">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">Select Day in Week</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-95"
                    title="Previous Week"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <input
                    type="date"
                    value={selectedWeekDate}
                    onChange={e => setSelectedWeekDate(e.target.value)}
                    className="text-base border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold cursor-pointer shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleNextWeek}
                    className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-95"
                    title="Next Week"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {(() => {
                const { mondayStr, sundayStr } = getWeekRange(selectedWeekDate);
                const format = (s) => {
                  const [y, m, d] = s.split('-');
                  const date = new Date(y, m - 1, d);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                };
                return (
                  <div className="text-sm text-indigo-800 dark:text-indigo-300 font-medium pb-2.5 bg-indigo-50/80 dark:bg-indigo-900/40 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Resolved Week: <strong className="font-bold">{format(mondayStr)}</strong> to <strong className="font-bold">{format(sundayStr)}</strong>
                  </div>
                );
              })()}
            </div>
          )}

          {filterType === 'custom' && (
            <div className="flex flex-wrap gap-6 w-full">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="text-base border border-slate-200 rounded-2xl px-5 py-3 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="text-base border border-slate-200 rounded-2xl px-5 py-3 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {filterType === 'weekly' && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6 lg:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm dark:shadow-none">
            <div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-2">Weekly Requirement Progress</div>
              <div className="flex items-baseline gap-3">
                <span className="text-indigo-900 dark:text-indigo-100 font-black text-4xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {weeklyTotalHours.toFixed(2)}h
                </span>
                <span className="text-indigo-400 dark:text-indigo-500 font-bold text-lg">/ {targetWeeklyHours.toFixed(1)}h</span>
              </div>
            </div>
            <div className="w-full md:w-auto flex-1 max-w-md">
              <div className="h-4 bg-white/60 dark:bg-slate-800/80 rounded-full overflow-hidden border border-indigo-100 dark:border-slate-700 mb-3 shadow-inner">
                <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-400 to-blue-500 relative" style={{ width: `${targetWeeklyHours > 0 ? Math.min(100, (weeklyTotalHours / targetWeeklyHours) * 100) : 100}%` }}>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px] animate-[stripe_1s_linear_infinite] opacity-50"></div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                {weeklyTotalHours >= targetWeeklyHours ? (
                  <span className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Goal Met
                  </span>
                ) : (
                  <span className="text-amber-600 text-sm font-bold flex items-center gap-2 animate-pulse">
                    <Timer className="w-4 h-4" /> {Math.max(0, targetWeeklyHours - weeklyTotalHours).toFixed(2)}h remaining
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Table UI */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {['Date', 'Check In / Out', 'Meal Break', ...(teaBreakEnabled && teaBreakAllowed ? ['Tea Break'] : []), 'Net Hrs', 'Extra Hrs', 'Less Hrs', 'Status', 'Tasks'].map(h => (
                  <th key={h} className="text-left text-slate-500 dark:text-slate-400 font-bold py-4 px-5 whitespace-nowrap text-xs tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredAttendance.map((rec) => {
                const st = statusStyles[rec.status] || { label: rec.status, cls: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedRecord(rec)}>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">{new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black"><LogIn className="w-3.5 h-3.5" /></span>
                          <span className="text-slate-700 font-mono font-bold">{rec.checkIn || '—'}</span>
                        </div>
                        {rec.checkOut ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-black"><LogOut className="w-3.5 h-3.5" /></span>
                            <span className="text-slate-700 font-mono font-bold">{rec.checkOut}</span>
                          </div>
                        ) : rec.checkIn ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black"><Clock className="w-3.5 h-3.5 animate-pulse" /></span>
                            <span className="text-blue-500 text-xs font-bold uppercase tracking-wider animate-pulse">Active</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-[11px] border border-amber-100">
                        <Utensils className="w-3.5 h-3.5 opacity-70" /> {getMealBreakDetails(rec.breaks, rec.breakMinutes, rec.checkOut)}
                      </span>
                    </td>
                    {teaBreakEnabled && teaBreakAllowed && (
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-100">
                          <Coffee className="w-3.5 h-3.5 opacity-70" /> {getTeaBreakDetails(rec.breaks, rec.checkOut)}
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="text-indigo-700 font-black text-base bg-indigo-50 px-3 py-1.5 rounded-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDecimalHours(rec.totalHours)}
                      </span>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-emerald-600 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {rec.extraHours > 0 ? `+${formatDecimalHours(rec.extraHours)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap text-rose-500 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {rec.lessHours > 0 ? `-${formatDecimalHours(rec.lessHours)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="py-4 px-5 text-slate-400" onClick={(e) => e.stopPropagation()}>
                      {rec.tasks && rec.tasks.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedTasks({ name: 'My tasks', date: rec.date || 'Today', tasks: rec.tasks })}
                          className="px-3 py-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center font-bold text-xs gap-2"
                          title="View Completed Tasks"
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>{rec.tasks.length}</span>
                        </button>
                      ) : <span className="text-slate-300 ml-4">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={teaBreakEnabled && teaBreakAllowed ? 9 : 8} className="py-12 text-center text-slate-400 text-sm font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Calendar className="w-10 h-10 text-slate-200" />
                      No records found for the selected period.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        {filteredAttendance.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present Days', value: filteredAttendance.filter(r => r.status === 'present' || r.status === 'late').length },
              { label: 'Total Hours', value: formatDecimalHours(filteredAttendance.reduce((s, r) => s + r.totalHours, 0)) },
              { label: 'Extra Hours', value: formatDecimalHours(filteredAttendance.reduce((s, r) => s + (r.extraHours || 0), 0)) },
              { label: 'Less Hours', value: formatDecimalHours(filteredAttendance.reduce((s, r) => s + (r.lessHours || 0), 0)) },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-slate-800 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Record Detail Modal - Glassmorphism */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl dark:shadow-none max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center border border-transparent dark:border-indigo-800/50">
                    <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">Attendance Details</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-0.5">{new Date(selectedRecord.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5" /> Check In
                    </div>
                    {selectedRecord.checkIn && <span className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-300 font-black bg-indigo-100/80 dark:bg-indigo-800/50 px-2 py-0.5 rounded shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 tracking-wide font-mono">{selectedRecord.date}</span>}
                  </div>
                  <div className="font-mono text-slate-800 dark:text-slate-100 font-black text-lg sm:text-xl">{selectedRecord.checkIn || '—'}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-800 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5" /> Check Out
                    </div>
                    {selectedRecord.checkOut && <span className="text-[10px] sm:text-xs text-rose-700 dark:text-rose-300 font-black bg-rose-100/80 dark:bg-rose-800/50 px-2 py-0.5 rounded shadow-sm border border-rose-200/50 dark:border-rose-700/50 tracking-wide font-mono">{selectedRecord.checkOutDate || selectedRecord.date}</span>}
                  </div>
                  <div className="font-mono text-slate-800 dark:text-slate-100 font-black text-lg sm:text-xl">{selectedRecord.checkOut || (selectedRecord.checkIn ? <span className="text-blue-500 animate-pulse">Active</span> : '—')}</div>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
                  <div className="text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" /> Meal Break
                  </div>
                  <div className="font-mono text-amber-900 dark:text-amber-100 font-bold text-base sm:text-lg">{getMealBreakDetails(selectedRecord.breaks, selectedRecord.breakMinutes, selectedRecord.checkOut)}</div>
                  {selectedRecord.breaks && selectedRecord.breaks.filter(b => b.type !== 'tea' && b.type !== 'tea_exceed').length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedRecord.breaks.filter(b => b.type !== 'tea' && b.type !== 'tea_exceed').map((b, i) => (
                        <div key={i} className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          {i + 1}{['st', 'nd', 'rd'][i] || 'th'} meal: {b.start} - {b.end || 'Ongoing'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {teaBreakEnabled && teaBreakAllowed && (
                  <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
                    <div className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5" /> Tea Break
                    </div>
                    <div className="font-mono text-emerald-900 dark:text-emerald-100 font-bold text-base sm:text-lg">{getTeaBreakDetails(selectedRecord.breaks)}</div>
                    {selectedRecord.breaks && selectedRecord.breaks.filter(b => b.type === 'tea' || b.type === 'tea_exceed').length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(() => {
                          const teaBreaksList = [];
                          for (let i = 0; i < selectedRecord.breaks.length; i++) {
                            const b = selectedRecord.breaks[i];
                            if (b.type === 'tea') {
                              const teaStart = b.start;
                              let teaEnd = b.end || 'Ongoing';
                              let extraSecs = 0;
                              let hasExtra = false;
                              
                              const nextB = selectedRecord.breaks[i + 1];
                              if (nextB && nextB.type === 'tea_exceed') {
                                hasExtra = true;
                                if (nextB.end) {
                                  teaEnd = nextB.end;
                                  const startParts = nextB.start.split(':').map(Number);
                                  const endParts = nextB.end.split(':').map(Number);
                                  const startSecs = (startParts[0]||0)*3600 + (startParts[1]||0)*60 + (startParts[2]||0);
                                  let endSecs = (endParts[0]||0)*3600 + (endParts[1]||0)*60 + (endParts[2]||0);
                                  if (endSecs < startSecs) endSecs += 24 * 3600;
                                  extraSecs = endSecs - startSecs;
                                } else {
                                  teaEnd = 'Ongoing';
                                }
                              }
                              
                              teaBreaksList.push({ start: teaStart, end: teaEnd, hasExtra, extraSecs, isExceedOngoing: hasExtra && !nextB.end });
                            }
                          }

                          return teaBreaksList.map((teaData, idx) => (
                            <div key={`tea-group-${idx}`} className="flex flex-col gap-1">
                              <div className="text-[11px] font-bold text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                {idx + 1}{['st', 'nd', 'rd'][idx] || 'th'} tea: {teaData.start} - {teaData.end}
                              </div>
                              {teaData.hasExtra && (
                                <div className="text-[11px] font-bold text-rose-700/80 dark:text-rose-400/80 flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                                  Extra time: {teaData.isExceedOngoing ? 'Ongoing' : (() => {
                                    const h = Math.floor(teaData.extraSecs / 3600);
                                    const m = Math.floor((teaData.extraSecs % 3600) / 60);
                                    if (h > 0) return `${h}h ${m}min`;
                                    if (m === 0 && teaData.extraSecs > 0) return `< 1min`;
                                    return `${m}min`;
                                  })()}
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-3.5 sm:p-4">
                  <div className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Net Hours</div>
                  <div className="font-mono text-blue-900 dark:text-blue-100 font-black text-base sm:text-lg">{formatDecimalHours(selectedRecord.totalHours)}</div>
                </div>
                <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-3.5 sm:p-4">
                  <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Extra Hrs</div>
                  <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-base sm:text-lg">{selectedRecord.extraHours > 0 ? `+${formatDecimalHours(selectedRecord.extraHours)}` : '—'}</div>
                </div>
                <div className="bg-rose-50/80 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-3.5 sm:p-4">
                  <div className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Less Hrs</div>
                  <div className="font-mono text-rose-700 dark:text-rose-400 font-bold text-base sm:text-lg">{formatDecimalHours(selectedRecord.lessHours)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-center items-start overflow-hidden">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Status</div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap truncate max-w-full ${selectedRecord.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    selectedRecord.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                      selectedRecord.status === 'late' ? 'bg-amber-100 text-amber-700' :
                        'bg-sky-100 text-sky-700'
                    }`}>
                    {selectedRecord.status}
                  </span>
                </div>

                {/* Completed Tasks Card */}
                {selectedRecord.tasks && selectedRecord.tasks.length > 0 && (
                  <div className="col-span-2 sm:col-span-4 bg-white/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-5 mt-2">
                    <div className="text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Completed Tasks ({selectedRecord.tasks.length})
                    </div>
                    <div className="space-y-3">
                      {selectedRecord.tasks.map((task, idx) => (
                        <div key={task._id || idx} className="p-3.5 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm shadow-sm transition-all hover:shadow-md">
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-xs sm:text-sm">{task.description}</p>
                          {task.timeContext && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {task.timeContext}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Confirmation Modal - Glassmorphism */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto border border-transparent dark:border-amber-800/50">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-100 text-2xl font-black text-center mb-2 tracking-tight">
                {sessionConfirmLevel > 0 ? "Session Confirmation" : "Almost done!"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 font-medium">
                {sessionConfirmLevel === 1 && "You have been working for 8 hours. Are you still working?"}
                {sessionConfirmLevel === 2 && "Reminder: Are you still working? (1st warning)"}
                {sessionConfirmLevel === 3 && "Final Reminder: You will be automatically checked out in 10 minutes."}
                {sessionConfirmLevel === 0 && ((onBreak || onTeaBreak)
                  ? "You are currently on a break. Checking out now will automatically end your break. Are you sure you want to proceed?"
                  : "Would you like to take a break before leaving, or proceed directly to check-out?")}
              </p>

              <div className="space-y-4">
                {sessionConfirmLevel > 0 && (
                  <button
                    onClick={handleSessionContinue}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition-all text-sm cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-95 tracking-widest uppercase"
                  >
                    YES, CONTINUE WORKING
                  </button>
                )}
                {/* Take Meal Break button */}
                {checkedIn && !onBreak && !mealBreakLimitReached && !isBreakOver && sessionConfirmLevel === 0 && (
                  <button
                    onClick={() => {
                      setShowCheckoutConfirm(false);
                      handleBreak();
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold py-4 px-6 rounded-2xl border border-amber-200 dark:border-amber-800/50 transition-all text-sm cursor-pointer shadow-sm active:scale-95 uppercase tracking-wider"
                  >
                    <Utensils className="w-5 h-5" />
                    TAKE A MEAL BREAK
                  </button>
                )}

                {/* Take Tea Break button */}
                {checkedIn && !onBreak && !teaBreakLimitReached && !isTeaBreakOver && teaBreakGapRemainingSecs <= 0 && teaBreakEnabled && teaBreakAllowed && (
                  <button
                    onClick={() => {
                      setShowCheckoutConfirm(false);
                      handleTeaBreak();
                    }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 text-sm font-bold uppercase tracking-wider transition-all transform active:scale-95 shadow-sm"
                  >
                    <Coffee className="w-5 h-5" />
                    TAKE A TEA BREAK
                  </button>
                )}

                {/* Proceed to Check-out */}
                <button
                  onClick={onCheckoutProceedClick}
                  className={`w-full flex items-center justify-center gap-3 ${sessionConfirmLevel > 0 ? 'bg-rose-100 hover:bg-rose-200 text-rose-700' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25'} font-black py-4 px-6 rounded-2xl transition-all text-sm cursor-pointer active:scale-95 tracking-widest uppercase`}
                >
                  <LogOut className="w-5 h-5" />
                  {sessionConfirmLevel > 0 ? 'CHECK OUT' : 'PROCEED TO CHECK-OUT'}
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold py-4 px-6 rounded-2xl transition-all text-sm cursor-pointer active:scale-95 mt-2 border border-transparent dark:border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Tasks Modal - Glassmorphism */}
      {selectedTasks && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl dark:shadow-none max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">Completed Tasks</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-0.5">{selectedTasks.name} · {selectedTasks.date}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTasks(null)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {selectedTasks.tasks && selectedTasks.tasks.length > 0 ? (
                  selectedTasks.tasks.map((task, idx) => (
                    <div key={task._id || idx} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm space-y-3 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-slate-700 dark:text-slate-300 font-medium text-base leading-relaxed">{task.description}</p>
                      {task.timeContext && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1.5 font-mono shadow-sm w-fit">
                            <Clock className="w-3.5 h-3.5" />
                            {task.timeContext}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 font-medium flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    No tasks logged for this day.
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTasks(null)}
                  className="px-8 py-3.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-black tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-slate-800/20 dark:shadow-none active:scale-95 uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tea Exceed Modal */}
      {showTeaExceedPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-amber-200 dark:border-amber-800">
                <Coffee className="w-8 h-8 text-amber-500 dark:text-amber-400" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-100 text-xl font-black tracking-tight mb-4">
                Your tea break ended
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Your allowed tea break time is over. The session timer has been paused. Please continue your work to restart the timer.
              </p>
              <button
                onClick={handleEndTeaExceed}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all duration-200 text-sm active:scale-95"
              >
                CONTINUE WORK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Over Modal */}
      {showSessionOverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-blue-200 dark:border-blue-800">
                <AlertCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-100 text-xl font-black tracking-tight mb-4">
                Thank you for attempting to check in. Your check-in is not available at this time
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Your shift is currently inactive. Contact HR if you need to check in outside your assigned hours.
                {nextShiftStartInfo && (
                  <span className="block mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/50">
                    Your next shift starts on {nextShiftStartInfo.toLocaleDateString()} at {nextShiftStartInfo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}.
                    <br />
                    Starts in: {(() => {
                      const diffMs = nextShiftStartInfo.getTime() - new Date().getTime();
                      if (diffMs <= 0) return 'Any moment now';
                      const h = Math.floor(diffMs / 3600000);
                      const m = Math.floor((diffMs % 3600000) / 60000);
                      if (h > 0) return `${h}h ${m}m`;
                      return `${m}m`;
                    })()}
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowSessionOverModal(false)}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm active:scale-95"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      <WelcomeAnimation
        isOpen={showCheckoutAnim}
        robotImage={(() => {
          const hour = new Date().getHours();
          if (hour >= 21 || hour < 4) return nightRobImg;
          return checkoutRobImg;
        })()}
        title="Checking out?"
        subtitle="See you next time!"
        onComplete={() => {
          setShowCheckoutAnim(false);
          confirmCheckOut();
        }}
      />
    </div>
  );
}

