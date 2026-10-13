import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ClipboardList, Calendar, LogIn, LogOut, Coffee, Utensils, RotateCcw, ChevronDown } from 'lucide-react';
import { formatDecimalHours, formatBreakMinutes } from '../../../utils/timeFormatter';
import { CustomSelect } from '../../components/CustomSelect';

export function TodayAttendanceView({
  employees = [],
  todayAttendance = [],
  selectedDate,
  setSelectedDate,
  settings,
  globalDepartments,
}) {
  const FormatMultilineName = ({ name }) => {
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    return (
      <div className="flex flex-col">
        {parts.map((p, i) => (
          <span key={i} className="leading-tight capitalize">{p}</span>
        ))}
      </div>
    );
  };

  const [selectedTasks, setSelectedTasks] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const hasActiveFilters = statusFilter !== 'all' || departmentFilter !== 'all' || activityFilter !== 'all' || employeeFilter !== 'all' || (selectedDate && selectedDate !== getTodayString());

  const resetFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('all');
    setActivityFilter('all');
    setEmployeeFilter('all');
    if (setSelectedDate) setSelectedDate(getTodayString());
  };

  const activeDepts = [...new Set((employees || []).filter(e => e.status === 'active').map(e => e.department))].filter(Boolean).sort();
  const departments = settings?.departments || globalDepartments || activeDepts;


  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, select, a')) return;
    isDown.current = true;
    containerRef.current.classList.add('cursor-grabbing');
    containerRef.current.classList.remove('cursor-grab');
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
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
    return `${count}-${totalMins} min`;
  };

  const getMealBreakDetails = (breaks = [], fallbackMins = 0, checkOutStr = null) => {
    const mealBreaks = breaks?.filter(b => b.type !== 'tea') || [];
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
      return `${count}-${h}h ${m}m`;
    }
    return `${count}-${m} min`;
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative z-10">
        <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>Today's Attendance Status</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Real-time attendance telemetry log for the organization</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-sky-100 dark:bg-sky-900/30 rounded-full blur-2xl opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Telemetry Log</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Viewing records for the selected date</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">Department:</span>
                <div className="flex-1 sm:flex-none w-full sm:w-auto min-w-[130px]">
                  <CustomSelect
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Departments' },
                      ...departments.map(d => ({ value: d, label: d }))
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">Status:</span>
                <div className="flex-1 sm:flex-none w-full sm:w-auto min-w-[120px]">
                  <CustomSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'present', label: 'Present' },
                      { value: 'absent', label: 'Absent' },
                      { value: 'half-day', label: 'Half Day' }
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">Activity:</span>
                <div className="flex-1 sm:flex-none w-full sm:w-auto min-w-[125px]">
                  <CustomSelect
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Activities' },
                      { value: 'active', label: 'Active' },
                      { value: 'meal-break', label: 'Meal Break' },
                      { value: 'tea-break', label: 'Tea Break' }
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">Employee:</span>
                <div className="flex-1 sm:flex-none w-full sm:w-auto min-w-[140px]">
                  <CustomSelect
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Employees' },
                      ...(employees || []).filter(e => e.status === 'active').sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(e => ({
                        value: String(e.id || e._id),
                        label: e.name
                      }))
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 lg:border-l lg:border-slate-200 lg:pl-3 w-full sm:w-auto">
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">Date:</span>
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate && setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto border border-border rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 cursor-pointer font-medium"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer w-full sm:w-auto"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="overflow-auto max-h-[600px] border border-slate-100 rounded-xl relative cursor-grab select-none"
          >
            <table className="w-full text-sm border-collapse">
              <thead className="z-30 bg-slate-50/80">
                <tr className="border-b border-border">
                  {['Employee', 'Department', 'Check In / Out', 'Meal Break', 'Tea Break', 'Net Hrs', 'Extra Hrs', 'Less Hrs', 'Status', 'Tasks'].map((h, i) => {
                    const minWidths = [
                      'min-w-[180px]', // Employee
                      'min-w-[120px]', // Department
                      'min-w-[150px]', // Check In / Out
                      'min-w-[110px]', // Meal Break
                      'min-w-[110px]', // Tea Break
                      'min-w-[100px]', // Net Hrs
                      'min-w-[100px]', // Extra Hrs
                      'min-w-[100px]', // Less Hrs
                      'min-w-[95px]',  // Status
                      'min-w-[80px]',  // Tasks
                    ];
                    return (
                      <th key={h} className={`sticky top-0 text-left text-slate-500 font-semibold py-3 px-4 bg-slate-50 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] text-xs tracking-wider uppercase ${minWidths[i]}`}>{h}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(employees || [])
                  .filter((e) => {
                    const normalizedValue = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
                    const employeeId = String(e.id || e._id || '');
                    const selectedEmpFilter = String(employeeFilter || 'all');

                    if (e.status !== 'active') return false;
                    if (departmentFilter !== 'all' && String(e.department || '').trim().toLowerCase() !== String(departmentFilter).trim().toLowerCase()) return false;
                    if (selectedEmpFilter !== 'all' && employeeId !== selectedEmpFilter) return false;

                    const rec = todayAttendance.find((a) => String(a.employeeId || a.employee?._id || a.employee?.id || '') === employeeId);
                    const status = rec?.status || 'absent';
                    const isAbsent = status === 'absent';

                    const isOnMealBreak = rec?.onBreak || (rec?.breaks?.some(b => b.type !== 'tea' && !b.end));
                    const isOnTeaBreak = rec?.onTeaBreak || (rec?.breaks?.some(b => b.type === 'tea' && !b.end));

                    const normalizedStatus = normalizedValue(statusFilter);
                    if (normalizedStatus === 'present' && status !== 'present' && status !== 'late') return false;
                    if (normalizedStatus === 'absent' && !isAbsent) return false;
                    if (normalizedStatus === 'half-day' && status !== 'half-day') return false;

                    const normalizedActivity = normalizedValue(activityFilter);
                    if (normalizedActivity !== 'all') {
                      if (isAbsent || !rec?.checkIn || rec?.checkOut) return false;
                      if (normalizedActivity === 'meal-break' && !isOnMealBreak) return false;
                      if (normalizedActivity === 'tea-break' && !isOnTeaBreak) return false;
                      if (normalizedActivity === 'active' && (isOnMealBreak || isOnTeaBreak)) return false;
                    }

                    return true;
                  })
                  .sort((empA, empB) => {
                    const recA = todayAttendance.find((a) => a.employeeId === empA.id);
                    const recB = todayAttendance.find((a) => a.employeeId === empB.id);
                    const isPresentA = recA && recA.status !== 'absent';
                    const isPresentB = recB && recB.status !== 'absent';
                    if (isPresentA && !isPresentB) return -1;
                    if (!isPresentA && isPresentB) return 1;
                    if (isPresentA && isPresentB) {
                      const timeA = recA.checkIn || '99:99:99';
                      const timeB = recB.checkIn || '99:99:99';
                      return timeA.localeCompare(timeB);
                    }
                    return empA.name.localeCompare(empB.name);
                  })
                  .map((emp) => {
                    const rec = todayAttendance.find((a) => a.employeeId === emp.id);
                    const status = rec?.status || 'absent';
                    const isAbsent = status === 'absent';

                    const isOnMealBreak = rec?.onBreak || (rec?.breaks?.some(b => b.type !== 'tea' && !b.end));
                    const isOnTeaBreak = rec?.onTeaBreak || (rec?.breaks?.some(b => b.type === 'tea' && !b.end));
                    const statusCls = {
                      present: 'bg-emerald-50 text-emerald-700',
                      late: 'bg-amber-50 text-amber-700',
                      absent: 'bg-red-50 text-red-600',
                      'half-day': 'bg-sky-50 text-sky-700',
                    };
                    return (
                      <tr key={emp.id} className="group even:bg-slate-50/60 dark:even:bg-slate-800/30 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors border-b border-border dark:border-slate-800/50 last:border-0">
                        <td className="py-3 px-4 min-w-[200px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0 overflow-hidden">
                              {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                              )}
                            </div>
                            <div>
                              <div
                                className="text-slate-800 font-bold whitespace-nowrap cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => { if (rec) setSelectedRecord({ ...rec, employeeName: emp.name }) }}
                              >
                                <FormatMultilineName name={emp.name} />
                              </div>
                              <div className="text-slate-500 text-xs">{emp.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{emp.department}</td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black"><LogIn className="w-3.5 h-3.5" /></span>
                              <span className="text-slate-700 font-mono font-bold">{isAbsent ? '—' : (rec?.checkIn || '—')}</span>
                            </div>
                            {!isAbsent && (rec?.checkOut ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-black"><LogOut className="w-3.5 h-3.5" /></span>
                                <span className="text-slate-700 font-mono font-bold">
                                  {rec.checkOutDate && rec.checkOutDate !== rec.date && (
                                    <span className="text-[10px] text-slate-400 mr-1">{rec.checkOutDate}</span>
                                  )}
                                  {rec.checkOut}
                                </span>
                              </div>
                            ) : rec?.checkIn ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black"><Clock className="w-3.5 h-3.5 animate-pulse" /></span>
                                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider animate-pulse">
                                  {isOnMealBreak ? 'Meal Break' : isOnTeaBreak ? 'Tea Break' : 'Active'}
                                </span>
                              </div>
                            ) : null)}
                          </div>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-xs border border-amber-100">
                            <Utensils className="w-3.5 h-3.5 opacity-70" /> {isAbsent || !rec?.checkIn ? '—' : getMealBreakDetails(rec?.breaks, rec?.breakMinutes, rec?.checkOut)}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-100">
                            <Coffee className="w-3.5 h-3.5 opacity-70" /> {isAbsent || !rec?.checkIn ? '—' : getTeaBreakDetails(rec?.breaks, rec?.checkOut)}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="text-indigo-700 font-black text-base bg-indigo-50 px-3 py-1.5 rounded-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {isAbsent || !rec?.checkIn ? '—' : formatDecimalHours(rec?.totalHours)}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap text-emerald-600 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {isAbsent || !rec?.checkIn ? '—' : (rec?.extraHours > 0 ? `+${formatDecimalHours(rec.extraHours)}` : <span className="text-slate-300">—</span>)}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap text-rose-500 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {isAbsent || !rec?.checkIn ? '—' : (rec?.lessHours > 0 ? `-${formatDecimalHours(rec.lessHours)}` : <span className="text-slate-300">—</span>)}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              status === 'late' ? 'bg-amber-100 text-amber-700' :
                                status === 'absent' ? 'bg-rose-100 text-rose-700' :
                                  'bg-sky-100 text-sky-700'
                            }`}>{status}</span>
                        </td>
                        <td className="py-4 px-5 text-slate-400" onClick={(e) => e.stopPropagation()}>
                          {!isAbsent && rec?.tasks?.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedTasks({ name: emp.name, date: rec.date || 'Today', tasks: rec.tasks })}
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
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tasks Modal */}
      {selectedTasks && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-slate-800 font-bold text-base">Completed Tasks</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{selectedTasks.name} • {selectedTasks.date !== 'Today' ? new Date(selectedTasks.date).toLocaleDateString() : 'Today'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTasks(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedTasks.tasks.map((task, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-3">
                    <div className="mt-0.5 text-indigo-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 text-sm font-medium">{task.description}</p>
                      <p className="text-slate-400 text-xs mt-1 font-mono">{task.timeContext}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTasks(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Selected Record Detail Modal */}
      {selectedRecord && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-slate-800 font-bold text-base">Attendance Details - {selectedRecord.employeeName}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{new Date(selectedRecord.date || selectedDate || new Date()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-3">
                  <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>Check In</span>
                    {selectedRecord.checkIn && <span className="text-xs text-indigo-700 dark:text-indigo-300 font-black bg-indigo-100/80 dark:bg-indigo-800/50 px-2 py-0.5 rounded shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 tracking-wide font-mono">{selectedRecord.date || selectedDate}</span>}
                  </div>
                  <div className="font-mono text-indigo-900 dark:text-indigo-100 font-bold text-base">{selectedRecord.checkIn || '—'}</div>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-3">
                  <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>Check Out</span>
                    {selectedRecord.checkOut && <span className="text-xs text-indigo-700 dark:text-indigo-300 font-black bg-indigo-100/80 dark:bg-indigo-800/50 px-2 py-0.5 rounded shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 tracking-wide font-mono">{selectedRecord.checkOutDate || selectedRecord.date || selectedDate}</span>}
                  </div>
                  <div className="font-mono text-indigo-900 dark:text-indigo-100 font-bold text-base">{selectedRecord.checkOut || (selectedRecord.checkIn ? 'Active' : '—')}</div>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3">
                  <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Meal Break</div>
                  <div className="font-mono text-amber-900 dark:text-amber-100 font-bold text-base">{getMealBreakDetails(selectedRecord.breaks, selectedRecord.breakMinutes, selectedRecord.checkOut)}</div>
                  {selectedRecord.breaks && selectedRecord.breaks.filter(b => b.type !== 'tea' && b.type !== 'tea_exceed').length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedRecord.breaks.filter(b => b.type !== 'tea' && b.type !== 'tea_exceed').map((b, i) => (
                        <div key={i} className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400 flex items-center gap-1.5">
                          {i + 1}{['st', 'nd', 'rd'][i] || 'th'} meal: {b.start} - {b.end || 'Ongoing'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-teal-50/50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800/50 rounded-xl p-3">
                  <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>Tea Break</div>
                  <div className="font-mono text-teal-900 dark:text-teal-100 font-bold text-base">{getTeaBreakDetails(selectedRecord.breaks)}</div>
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
                            <div className="text-[11px] font-bold text-teal-700/80 dark:text-teal-400 flex items-center gap-1.5">
                              {idx + 1}{['st', 'nd', 'rd'][idx] || 'th'} tea: {teaData.start} - {teaData.end}
                            </div>
                            {teaData.hasExtra && (
                              <div className="text-[11px] font-bold text-rose-700/80 dark:text-rose-400 flex items-center gap-1.5">
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
                <div className="bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3">
                  <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>Net Hours</div>
                  <div className="font-mono text-blue-900 dark:text-blue-100 font-bold text-base">{formatDecimalHours(selectedRecord.totalHours)}</div>
                </div>
                <div className={`border rounded-xl p-3 ${selectedRecord.status === 'present' ? 'bg-emerald-50/50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50' :
                    selectedRecord.status === 'absent' ? 'bg-rose-50/50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/50' :
                      selectedRecord.status === 'late' ? 'bg-amber-50/50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50' :
                        'bg-sky-50/50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800/50'
                  }`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${selectedRecord.status === 'present' ? 'text-emerald-500' :
                      selectedRecord.status === 'absent' ? 'text-rose-500' :
                        selectedRecord.status === 'late' ? 'text-amber-500' :
                          'text-sky-500'
                    }`}><span className={`w-1.5 h-1.5 rounded-full ${selectedRecord.status === 'present' ? 'bg-emerald-500' :
                        selectedRecord.status === 'absent' ? 'bg-rose-500' :
                          selectedRecord.status === 'late' ? 'bg-amber-500' :
                            'bg-sky-500'
                      }`}></span>Status</div>
                  <div className={`capitalize font-bold text-base ${selectedRecord.status === 'present' ? 'text-emerald-900 dark:text-emerald-100' :
                      selectedRecord.status === 'absent' ? 'text-rose-900 dark:text-rose-100' :
                        selectedRecord.status === 'late' ? 'text-amber-900 dark:text-amber-100' :
                          'text-sky-900 dark:text-sky-100'
                    }`}>{selectedRecord.status}</div>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-3">
                  <div className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Extra Hours</div>
                  <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-base">{selectedRecord.extraHours > 0 ? `+${formatDecimalHours(selectedRecord.extraHours)}` : '—'}</div>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-xl p-3">
                  <div className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>Less Hours</div>
                  <div className="font-mono text-rose-600 dark:text-rose-400 font-bold text-base">{formatDecimalHours(selectedRecord.lessHours)}</div>
                </div>
              </div>

              {/* Tasks Section within Details Modal */}
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  Completed Tasks
                </h4>
                {selectedRecord.tasks && selectedRecord.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRecord.tasks.map((task, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/50 flex items-start gap-2.5">
                        <div className="mt-0.5 text-indigo-500 dark:text-indigo-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">{task.description}</p>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-mono">{task.timeContext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 dark:text-slate-500 text-xs italic bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 text-center">No tasks recorded for this day.</p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
