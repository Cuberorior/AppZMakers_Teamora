import { useState, useEffect, useRef } from 'react';
import { Clock, Shield, CalendarDays, RefreshCw, Check, Coffee, Plus, Trash2, Building, Gamepad2 } from 'lucide-react';

export function AdminSettingsView({
  settings,
  handleUpdateSetting,
  companies = [],
  employees = [],
  handleToggleEmployeeTeaBreak,
  handleToggleCompanyTeaBreak,
}) {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saveStatus, setSaveStatus] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [allocationTab, setAllocationTab] = useState('companies');
  const [filterQuery, setFilterQuery] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const getMergedOvertimeRules = (departments = [], existingRules = []) => {
    return (departments || []).map(dept => {
      const found = (existingRules || []).find(r => r.department === dept);
      if (found) {
        return {
          department: dept,
          enabled: found.enabled ?? false,
          intervalMinutes: found.intervalMinutes ?? 60,
          timeoutMinutes: found.timeoutMinutes ?? 30,
          emailNotification: found.emailNotification ?? true,
          maxOvertimeHours: found.maxOvertimeHours ?? 4,
        };
      }
      return {
        department: dept,
        enabled: false,
        intervalMinutes: 60,
        timeoutMinutes: 30,
        emailNotification: true,
        maxOvertimeHours: 4,
      };
    });
  };

  const savedOvertimeRulesRef = useRef([]);

  useEffect(() => {
    const cleanNum = (val) => {
      if (val === null || val === undefined) return '';
      const match = String(val).match(/^(-?\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : val;
    };
    const mergedRules = getMergedOvertimeRules(
      settings?.departments || [],
      settings?.departmentOvertimeRules || []
    );
    setLocalSettings({
      ...settings,
      breakTime: cleanNum(settings?.breakTime),
      workHours: cleanNum(settings?.workHours),
      departmentOvertimeRules: mergedRules,
    });
    savedOvertimeRulesRef.current = mergedRules;
  }, [settings]);

  const validateField = (key, val) => {
    let errorMsg = null;
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;

    if (key === 'morningShiftStartTime' || key === 'nightShiftStartTime') {
      const strVal = String(val || '').trim();
      if (!strVal || !timeRegex.test(strVal)) {
        errorMsg = 'Invalid time format. Must be HH:MM (00:00 - 23:59).';
      }
    } else if (key === 'breakTime') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 0 || num > 24) {
        errorMsg = 'Meal break time must be between 0 and 24 hours.';
      }
    } else if (key === 'workHours') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num <= 0 || num > 24) {
        errorMsg = 'Work hours must be between 0.5 and 24 hours.';
      }
    } else if (key === 'mealBreaksMax') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 1 || num > 20) {
        errorMsg = 'Meal breaks limit must be between 1 and 20.';
      }
    } else if (key === 'teaBreaksMax') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 0 || num > 20) {
        errorMsg = 'Tea breaks limit must be between 0 and 20.';
      }
    } else if (key === 'teaBreakDuration') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 1 || num > 480) {
        errorMsg = 'Tea break duration must be between 1 and 480 minutes.';
      }
    } else if (key === 'teaBreakGap') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 0 || num > 1440) {
        errorMsg = 'Gap between tea breaks must be between 0 and 1440 minutes.';
      }
    } else if (key === 'leaveAllocations.medical') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 0 || num > 365) {
        errorMsg = 'Medical leave allocation must be between 0 and 365 days.';
      }
    } else if (key === 'sessionTimeout') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 1 || num > 1440) {
        errorMsg = 'Session timeout must be between 1 and 1440 minutes.';
      }
    } else if (key === 'gameTimeLimitMinutes') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 1 || num > 1440) {
        errorMsg = 'Daily game time limit must be between 1 and 1440 minutes.';
      }
    } else if (key === 'gameCooldownMinutes') {
      const num = Number(val);
      if (val === '' || isNaN(num) || num < 0 || num > 1440) {
        errorMsg = 'Game cooldown must be between 0 and 1440 minutes.';
      }
    }

    setValidationErrors(prev => ({
      ...prev,
      [key]: errorMsg
    }));
    return !errorMsg;
  };

  const handleLocalChange = (key, val) => {
    // Prevent negative numbers for numeric settings
    const numericKeys = ['breakTime', 'workHours', 'mealBreaksMax', 'teaBreaksMax', 'teaBreakDuration', 'teaBreakGap', 'sessionTimeout', 'gameTimeLimitMinutes', 'gameCooldownMinutes'];
    if (numericKeys.includes(key) && val !== '' && Number(val) < 0) {
      return;
    }
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
    setLocalSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleLeaveChange = (key, val) => {
    if (val !== '' && Number(val) < 0) return;
    const fullKey = `leaveAllocations.${key}`;
    if (validationErrors[fullKey]) {
      setValidationErrors(prev => ({ ...prev, [fullKey]: null }));
    }
    setLocalSettings(prev => ({
      ...prev,
      leaveAllocations: {
        ...prev.leaveAllocations,
        [key]: val
      }
    }));
  };

  const saveKey = async (key, val) => {
    if (!validateField(key, val)) {
      return;
    }
    setSaveStatus(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const result = await handleUpdateSetting(key, val);
      if (result && result.success === false) {
        setValidationErrors(prev => ({ ...prev, [key]: result.error || 'Failed to save' }));
        setSaveStatus(prev => ({ ...prev, [key]: 'error' }));
      } else {
        setSaveStatus(prev => ({ ...prev, [key]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [key]: null }));
        }, 1500);
      }
    } catch (err) {
      setSaveStatus(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative z-10">
        <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Configure system-wide preferences, working times, and leave balance parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Configurations Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
          <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 border-b border-white/50 dark:border-slate-800/50 pb-4 text-lg relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>
            Working Times & Hours
          </h2>

          <div className="space-y-4 relative z-10">
            {/* Break Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Daily Standard Meal Break Time (Hours)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="24"
                  value={localSettings.breakTime || ''}
                  onChange={e => handleLocalChange('breakTime', e.target.value)}
                  className={`flex-1 border ${validationErrors.breakTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                  placeholder="hour"
                />
                <button
                  onClick={() => saveKey('breakTime', localSettings.breakTime)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.breakTime === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.breakTime === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.breakTime ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.breakTime}</span>
              ) : (
                <span className="text-slate-400 text-xs">Standard daily target meal break duration in hours</span>
              )}
            </div>

            {/* Meal Break Limit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Daily Allowed Meal Breaks Limit</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={localSettings.mealBreaksMax !== undefined ? localSettings.mealBreaksMax : 5}
                  onChange={e => handleLocalChange('mealBreaksMax', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.mealBreaksMax ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                  placeholder="e.g. 5"
                />
                <button
                  onClick={() => saveKey('mealBreaksMax', localSettings.mealBreaksMax !== undefined ? localSettings.mealBreaksMax : 5)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.mealBreaksMax === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.mealBreaksMax === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.mealBreaksMax ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.mealBreaksMax}</span>
              ) : (
                <span className="text-slate-400 text-xs">Maximum number of times an employee can start a meal break during their shift</span>
              )}
            </div>

            {/* Morning Shift Start Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Morning Shift Start Time</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="HH:MM (24-hour e.g. 09:00)"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={localSettings.morningShiftStartTime || ''}
                  onChange={e => handleLocalChange('morningShiftStartTime', e.target.value)}
                  className={`flex-1 border ${validationErrors.morningShiftStartTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50 font-mono`}
                />
                <button
                  onClick={() => saveKey('morningShiftStartTime', localSettings.morningShiftStartTime)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.morningShiftStartTime === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.morningShiftStartTime === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.morningShiftStartTime ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.morningShiftStartTime}</span>
              ) : (
                <span className="text-slate-400 text-xs">Morning shift start time in 24-hour format (e.g. 09:00)</span>
              )}
            </div>

            {/* Night Shift Start Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Night Shift Start Time</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="HH:MM (24-hour e.g. 21:00)"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  value={localSettings.nightShiftStartTime || ''}
                  onChange={e => handleLocalChange('nightShiftStartTime', e.target.value)}
                  className={`flex-1 border ${validationErrors.nightShiftStartTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50 font-mono`}
                />
                <button
                  onClick={() => saveKey('nightShiftStartTime', localSettings.nightShiftStartTime)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.nightShiftStartTime === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.nightShiftStartTime === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.nightShiftStartTime ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.nightShiftStartTime}</span>
              ) : (
                <span className="text-slate-400 text-xs">Night shift start time in 24-hour format (e.g. 21:00)</span>
              )}
            </div>

            {/* Work Hours */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Standard Daily Work Hours</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="any"
                  min="0.5"
                  max="24"
                  value={localSettings.workHours || ''}
                  onChange={e => handleLocalChange('workHours', e.target.value)}
                  className={`flex-1 border ${validationErrors.workHours ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                  placeholder="hour"
                />
                <button
                  onClick={() => saveKey('workHours', localSettings.workHours)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.workHours === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.workHours === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.workHours ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.workHours}</span>
              ) : (
                <span className="text-slate-400 text-xs">Standard daily target shift duration in hours</span>
              )}
            </div>
          </div>
        </div>

        {/* Tea Break Configurations Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-700"></div>
          <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 border-b border-white/50 dark:border-slate-800/50 pb-4 text-lg relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center border border-amber-100 dark:border-amber-800/50">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            Tea Break Settings
          </h2>

          <div className="space-y-4 relative z-10">
            {/* Enable/Disable Tea Break */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border">
              <div>
                <label className="text-slate-800 text-sm font-semibold">Enable Tea Break</label>
                <span className="block text-slate-400 text-xs mt-0.5">Toggle tea break feature visibility and options on dashboard</span>
              </div>
              <button
                onClick={() => {
                  const nextVal = localSettings.teaBreakEnabled === false ? true : false;
                  handleLocalChange('teaBreakEnabled', nextVal);
                  saveKey('teaBreakEnabled', nextVal);
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  localSettings.teaBreakEnabled !== false ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.teaBreakEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Max Tea Breaks */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Daily Allowed Tea Breaks</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={localSettings.teaBreaksMax !== undefined ? localSettings.teaBreaksMax : 2}
                  onChange={e => handleLocalChange('teaBreaksMax', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.teaBreaksMax ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('teaBreaksMax', localSettings.teaBreaksMax !== undefined ? localSettings.teaBreaksMax : 2)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.teaBreaksMax === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.teaBreaksMax === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.teaBreaksMax && (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.teaBreaksMax}</span>
              )}
            </div>

            {/* Tea Break Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Tea Break Duration (Minutes)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={localSettings.teaBreakDuration !== undefined ? localSettings.teaBreakDuration : 20}
                  onChange={e => handleLocalChange('teaBreakDuration', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.teaBreakDuration ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('teaBreakDuration', localSettings.teaBreakDuration !== undefined ? localSettings.teaBreakDuration : 20)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.teaBreakDuration === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.teaBreakDuration === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.teaBreakDuration && (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.teaBreakDuration}</span>
              )}
            </div>

            {/* Tea Break Cooldown/Gap */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Gap Required Between Tea Breaks (Minutes)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={localSettings.teaBreakGap !== undefined ? localSettings.teaBreakGap : 120}
                  onChange={e => handleLocalChange('teaBreakGap', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.teaBreakGap ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('teaBreakGap', localSettings.teaBreakGap !== undefined ? localSettings.teaBreakGap : 120)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.teaBreakGap === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.teaBreakGap === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.teaBreakGap ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.teaBreakGap}</span>
              ) : (
                <span className="text-slate-400 text-xs">
                  {localSettings.teaBreakGap ? `${localSettings.teaBreakGap} minutes (${(localSettings.teaBreakGap / 60).toFixed(1)} hours)` : 'No waiting gap'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leave Allocations Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
          <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 border-b border-white/50 dark:border-slate-800/50 pb-4 text-lg relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
              <CalendarDays className="w-5 h-5 text-emerald-500" />
            </div>
            Leave Balance Allocations
          </h2>

          <div className="space-y-4 relative z-10">
            {/* Medical Leaves */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Medical Leave Allocation (Days)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={localSettings.leaveAllocations?.medical || 0}
                  onChange={e => handleLeaveChange('medical', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors['leaveAllocations.medical'] ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('leaveAllocations.medical', localSettings.leaveAllocations.medical)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus['leaveAllocations.medical'] === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus['leaveAllocations.medical'] === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Sync'}
                </button>
              </div>
              {validationErrors['leaveAllocations.medical'] ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors['leaveAllocations.medical']}</span>
              ) : (
                <span className="text-slate-400 text-xs">Note: Updating allocations automatically synchronizes leave balances for all active employee files.</span>
              )}
            </div>
          </div>
        </div>

        {/* Relaxation Area / Games Settings Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-colors duration-700"></div>
          <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 border-b border-white/50 dark:border-slate-800/50 pb-4 text-lg relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center border border-rose-100 dark:border-rose-800/50">
              <Gamepad2 className="w-5 h-5 text-rose-500" />
            </div>
            Relaxation Area / Games
          </h2>

          <div className="space-y-4 relative z-10">
            {/* Daily Game Time Limit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Daily Game Time Limit (Minutes)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={localSettings.gameTimeLimitMinutes !== undefined ? localSettings.gameTimeLimitMinutes : 10}
                  onChange={e => handleLocalChange('gameTimeLimitMinutes', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.gameTimeLimitMinutes ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('gameTimeLimitMinutes', localSettings.gameTimeLimitMinutes !== undefined ? localSettings.gameTimeLimitMinutes : 10)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.gameTimeLimitMinutes === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.gameTimeLimitMinutes === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.gameTimeLimitMinutes ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.gameTimeLimitMinutes}</span>
              ) : (
                <span className="text-slate-400 text-xs">How long an employee can play games each time before the timer runs out</span>
              )}
            </div>

            {/* Cooldown Between Sessions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Cooldown Before Next Session (Minutes)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={localSettings.gameCooldownMinutes !== undefined ? localSettings.gameCooldownMinutes : 120}
                  onChange={e => handleLocalChange('gameCooldownMinutes', parseInt(e.target.value) || 0)}
                  className={`flex-1 border ${validationErrors.gameCooldownMinutes ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('gameCooldownMinutes', localSettings.gameCooldownMinutes !== undefined ? localSettings.gameCooldownMinutes : 120)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.gameCooldownMinutes === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.gameCooldownMinutes === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.gameCooldownMinutes ? (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.gameCooldownMinutes}</span>
              ) : (
                <span className="text-slate-400 text-xs">
                  {localSettings.gameCooldownMinutes ? `Once the time limit is used up, employees must wait ${localSettings.gameCooldownMinutes} minutes (${(localSettings.gameCooldownMinutes / 60).toFixed(1)} hours) before playing again. Repeats throughout the day.` : 'No cooldown between sessions'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Department Overtime Rules */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6 lg:col-span-2">
          <div className="absolute -top-16 -right-16 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/50 dark:border-slate-800/50 pb-4 relative z-10">
            <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              Department Overtime Rules
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const restoredRules = getMergedOvertimeRules(
                    localSettings.departments || settings?.departments || [],
                    savedOvertimeRulesRef.current || settings?.departmentOvertimeRules || []
                  );
                  setLocalSettings(prev => ({
                    ...prev,
                    departmentOvertimeRules: restoredRules,
                  }));
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => saveKey('departmentOvertimeRules', localSettings.departmentOvertimeRules)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {saveStatus.departmentOvertimeRules === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save All'}
              </button>
            </div>
          </div>
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold text-center">Enable Confirmation</th>
                  <th className="px-4 py-3 font-semibold">Interval (mins)</th>
                  <th className="px-4 py-3 font-semibold">Timeout (mins)</th>
                  <th className="px-4 py-3 font-semibold text-center">Email Notify</th>
                  <th className="px-4 py-3 rounded-tr-xl font-semibold">Max Hours</th>
                </tr>
              </thead>
              <tbody>
                {(localSettings.departments || []).map(dept => {
                  const currentRules = localSettings.departmentOvertimeRules || [];
                  const ruleIndex = currentRules.findIndex(r => r.department === dept);
                  const rule = ruleIndex >= 0 ? currentRules[ruleIndex] : {
                    department: dept, enabled: false, intervalMinutes: 60, timeoutMinutes: 30, emailNotification: true, maxOvertimeHours: 4
                  };
                  
                  const handleRuleChange = (field, val) => {
                    const existingRules = [...currentRules];
                    const idx = existingRules.findIndex(r => r.department === dept);
                    if (idx >= 0) {
                      existingRules[idx] = { ...existingRules[idx], [field]: val };
                    } else {
                      existingRules.push({ ...rule, [field]: val });
                    }
                    handleLocalChange('departmentOvertimeRules', existingRules);
                  };

                  return (
                    <tr key={dept} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{dept}</td>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={rule.enabled} onChange={e => handleRuleChange('enabled', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" min="1" value={rule.intervalMinutes} onChange={e => handleRuleChange('intervalMinutes', Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" min="1" value={rule.timeoutMinutes} onChange={e => handleRuleChange('timeoutMinutes', Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={rule.emailNotification} onChange={e => handleRuleChange('emailNotification', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-4">
                        <input type="number" min="1" value={rule.maxOvertimeHours} onChange={e => handleRuleChange('maxOvertimeHours', Number(e.target.value))} className="w-20 border border-border rounded-lg px-2 py-1 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50" />
                      </td>
                    </tr>
                  );
                })}
                {(localSettings.departments || []).length === 0 && (
                   <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No departments found. Assign departments to employees first.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & System preferences Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6 lg:col-span-2">
          <div className="absolute -top-16 -right-16 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-colors duration-700"></div>
          <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 border-b border-white/50 dark:border-slate-800/50 pb-4 text-lg relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center border border-violet-100 dark:border-violet-800/50">
              <Shield className="w-5 h-5 text-violet-500" />
            </div>
            Platform & Telemetry
          </h2>

          <div className="max-w-md relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 text-sm font-medium">Session Timeout Duration (Minutes)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={localSettings.sessionTimeout || ''}
                  onChange={e => handleLocalChange('sessionTimeout', e.target.value)}
                  className={`flex-1 border ${validationErrors.sessionTimeout ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border focus:ring-indigo-500/20'} rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50`}
                />
                <button
                  onClick={() => saveKey('sessionTimeout', localSettings.sessionTimeout)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {saveStatus.sessionTimeout === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                   saveStatus.sessionTimeout === 'saved' ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
              {validationErrors.sessionTimeout && (
                <span className="text-rose-500 text-xs font-medium">{validationErrors.sessionTimeout}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client/Lead & Employee Tea Break Allocation Rules Card */}
      {settings.teaBreakEnabled !== false && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6">
          <div className="absolute -top-16 -left-16 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/50 dark:border-slate-800/50 pb-6 relative z-10">
            <div>
              <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                  <Coffee className="w-5 h-5 text-indigo-500" />
                </div>
                Tea Break Access Control
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2">Selectively assign tea break privileges to companies or individual employees</p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-border">
              <button
                onClick={() => { setAllocationTab('companies'); setFilterQuery(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  allocationTab === 'companies'
                    ? 'bg-white text-indigo-600 shadow-sm border border-border/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Companies & Teams
              </button>
              <button
                onClick={() => { setAllocationTab('employees'); setFilterQuery(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  allocationTab === 'employees'
                    ? 'bg-white text-indigo-600 shadow-sm border border-border/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Employees
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={allocationTab === 'companies' ? "Search client/lead companies..." : "Search employees..."}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>

          {/* List Container */}
          <div className="max-h-[350px] overflow-y-auto pr-2 divide-y divide-border scrollbar-thin">
            {allocationTab === 'companies' ? (
              companies
                .filter(co => co.name.toLowerCase().includes(filterQuery.toLowerCase()))
                .map(co => (
                  <div key={co.id} className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-slate-800 text-sm font-semibold">{co.name}</h4>
                      <span className="text-slate-400 text-xs">{co.industry || 'General Industry'} · {co.contact || 'No Contact'}</span>
                    </div>
                    <button
                      onClick={() => handleToggleCompanyTeaBreak(co.id, co.teaBreakAllowed !== false)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        co.teaBreakAllowed !== false ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          co.teaBreakAllowed !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))
            ) : (
              employees
                .filter(emp => emp.name.toLowerCase().includes(filterQuery.toLowerCase()))
                .map(emp => (
                  <div key={emp.id} className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-slate-800 text-sm font-semibold">{emp.name}</h4>
                      <span className="text-slate-400 text-xs">{emp.position} · {emp.department} · <strong className="text-slate-500">{emp.company || 'Our Company'}</strong></span>
                    </div>
                    <button
                      onClick={() => handleToggleEmployeeTeaBreak(emp.id, emp.teaBreakAllowed !== false)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emp.teaBreakAllowed !== false ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          emp.teaBreakAllowed !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))
            )}
            {((allocationTab === 'companies' && companies.filter(co => co.name.toLowerCase().includes(filterQuery.toLowerCase())).length === 0) ||
              (allocationTab === 'employees' && employees.filter(emp => emp.name.toLowerCase().includes(filterQuery.toLowerCase())).length === 0)) && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No matching records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Department Management Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group space-y-6 lg:col-span-2">
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-700"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/50 dark:border-slate-800/50 pb-6 relative z-10">
          <div>
            <h2 className="text-slate-800 dark:text-slate-100 font-bold flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center border border-cyan-100 dark:border-cyan-800/50">
                <Building className="w-5 h-5 text-cyan-500" />
              </div>
              Department Management
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-2">Manage the list of departments available during employee onboarding.</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              value={newDepartment}
              onChange={e => setNewDepartment(e.target.value)}
              placeholder="e.g. Marketing"
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50"
            />
            <button
              onClick={() => {
                if (!newDepartment.trim()) return;
                const updatedDepartments = [...(localSettings.departments || []), newDepartment.trim()];
                handleLocalChange('departments', updatedDepartments);
                saveKey('departments', updatedDepartments);
                setNewDepartment('');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 min-w-[80px] justify-center shadow-sm shadow-indigo-600/20"
            >
              {saveStatus.departments === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Dept</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            {(localSettings.departments || []).map((dept, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/50 hover:shadow-md transition-all group">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{dept}</span>
                <button
                  onClick={() => {
                    const updatedDepartments = localSettings.departments.filter(d => d !== dept);
                    handleLocalChange('departments', updatedDepartments);
                    saveKey('departments', updatedDepartments);
                  }}
                  className="text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(localSettings.departments || []).length === 0 && (
              <div className="col-span-full text-center py-6 text-slate-400 text-sm">
                No departments added yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
