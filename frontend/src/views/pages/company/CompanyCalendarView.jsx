import React, { useState, useEffect, useRef } from 'react';
import { useCalendarController } from '../../../controllers/useCalendarController';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Globe,
  MapPin,
  Loader2,
  Trash2,
  Edit2,
  Info
} from 'lucide-react';

const EVENT_TYPE_COLORS = {
  holiday: 'bg-yellow-100 text-red-700 border-yellow-300 font-bold',
  'bank-holiday': 'bg-amber-50 text-amber-700 border-amber-100',
  festival: 'bg-orange-50 text-orange-700 border-orange-100',
  'company-holiday': 'bg-red-50 text-red-700 border-red-100',
  'team-event': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  meeting: 'bg-blue-50 text-blue-700 border-blue-100',
  training: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'day-off': 'bg-violet-50 text-violet-700 border-violet-100',
  special: 'bg-purple-50 text-purple-700 border-purple-100',
  'annual-leave': 'bg-indigo-50 text-indigo-750 text-indigo-700 border-indigo-200 font-bold shadow-sm shadow-indigo-500/5',
  'casual-leave': 'bg-sky-50 text-sky-750 text-sky-700 border-sky-200 font-bold shadow-sm shadow-sky-500/5',
  'medical-leave': 'bg-rose-50 text-rose-750 text-rose-700 border-rose-200 font-bold shadow-sm shadow-rose-500/5',
  birthday: 'bg-pink-50 text-pink-700 border-pink-200 font-bold shadow-sm shadow-pink-500/5',
  anniversary: 'bg-yellow-50 text-yellow-700 border-yellow-200 font-bold shadow-sm shadow-yellow-500/5',
  'knowledge-session': 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold shadow-sm shadow-cyan-500/10',
};

const EVENT_TYPE_DOTS = {
  holiday: 'bg-rose-500',
  'bank-holiday': 'bg-amber-500',
  festival: 'bg-orange-500',
  'company-holiday': 'bg-red-500',
  'team-event': 'bg-emerald-500',
  meeting: 'bg-blue-500',
  training: 'bg-indigo-500',
  'day-off': 'bg-violet-500',
  special: 'bg-purple-500',
  'annual-leave': 'bg-indigo-600',
  'casual-leave': 'bg-sky-500',
  'medical-leave': 'bg-rose-500',
  birthday: 'bg-pink-500',
  anniversary: 'bg-yellow-500',
  'knowledge-session': 'bg-cyan-500',
};

const COUNTRY_STYLES = {
  'sri lanka': { code: 'lk', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-sm shadow-emerald-500/5' },
  'usa': { code: 'us', color: 'bg-blue-50 text-blue-800 border-blue-300 font-bold shadow-sm shadow-blue-500/5' },
  'united states': { code: 'us', color: 'bg-blue-50 text-blue-800 border-blue-300 font-bold shadow-sm shadow-blue-500/5' },
  'uk': { code: 'gb', color: 'bg-purple-50 text-purple-800 border-purple-300 font-bold shadow-sm shadow-purple-500/5' },
  'united kingdom': { code: 'gb', color: 'bg-purple-50 text-purple-800 border-purple-300 font-bold shadow-sm shadow-purple-500/5' },
  'canada': { code: 'ca', color: 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-sm shadow-rose-500/5' },
  'australia': { code: 'au', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-sm shadow-amber-500/5' }
};

const getEventStyle = (event) => {
  if (event.type === 'annual-leave') {
    return { flag: '🌴', color: EVENT_TYPE_COLORS['annual-leave'] };
  }
  if (event.type === 'casual-leave') {
    return { flag: '🏠', color: EVENT_TYPE_COLORS['casual-leave'] };
  }
  if (event.type === 'medical-leave') {
    return { flag: '🤒', color: EVENT_TYPE_COLORS['medical-leave'] };
  }
  if (event.type === 'birthday') {
    return { flag: '🎂', color: EVENT_TYPE_COLORS['birthday'] };
  }
  if (event.type === 'anniversary') {
    return { flag: '🎉', color: EVENT_TYPE_COLORS['anniversary'] };
  }

  if (event.type === 'knowledge-session') {
    return { flag: '🎥', color: EVENT_TYPE_COLORS['knowledge-session'] };
  }
  if (event.type === 'holiday' || event.type === 'bank-holiday' || event.type === 'festival') {
    let countryKey = '';
    if (event.targetValue) {
      countryKey = event.targetValue.toLowerCase().trim();
    } else {
      const match = event.title.match(/^\[(.*?)\]/);
      if (match) {
        countryKey = match[1].toLowerCase().trim();
      }
    }
    if (countryKey && COUNTRY_STYLES[countryKey]) {
      return COUNTRY_STYLES[countryKey];
    }
    return { code: '', color: 'bg-teal-50 text-teal-800 border-teal-300 font-bold' };
  }
  return { code: '', color: EVENT_TYPE_COLORS[event.type] || 'bg-slate-50 text-slate-700 border-slate-200' };
};

const limitWords = (text, limit) => {
  const words = text.split(/(\s+)/);
  let wordCount = 0;
  const result = [];

  for (let token of words) {
    if (token.trim() !== '') {
      wordCount++;
    }
    if (wordCount > limit) {
      break;
    }
    result.push(token);
  }
  return result.join('');
};

export function CompanyCalendarView({ role, employeeId, companyId }) {
  const {
    events,
    loading,
    importing,
    currentDate,
    setCurrentDate,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  } = useCalendarController(role, employeeId, companyId);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [validationError, setValidationError] = useState('');

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    type: '',
    targetLocation: 'all',
    targetValue: '',
  });

  const titleWordsCount = eventForm.title.trim().split(/\s+/).filter(Boolean).length;
  const descWordsCount = eventForm.description.trim().split(/\s+/).filter(Boolean).length;
  const todayStr = new Date().toISOString().split('T')[0];

  const todayRef = useRef(null);

  useEffect(() => {
    if (!loading && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [loading, currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dayEvents = getEventsForDay(day);
    setSelectedDayEvents({ day, events: dayEvents });
  };

  // Calendar Math Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prefixArray = Array.from({ length: firstDayIndex }, (_, i) => null);

  const calendarDays = [...prefixArray, ...daysArray];

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      if (e.start > dateStr || e.end < dateStr) return false;
      return true;
    });
  };



  const isReadOnlyEvent = (event) => {
    return event.type === 'holiday' ||
      event.type === 'bank-holiday' ||
      event.type === 'festival' ||
      event.type === 'annual-leave' ||
      event.type === 'casual-leave' ||
      event.type === 'medical-leave' ||
      event.type === 'birthday' ||
      event.type === 'anniversary' ||
      event.type === 'knowledge-session' ||
      event.type.endsWith('-leave');
  };

  const canManageEvents = role === 'hr' || role === 'superadmin';
  const canEditOrDelete = role === 'superadmin';

  const openAddEvent = (day) => {
    if (!canManageEvents) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEventForm({
      title: '',
      description: '',
      start: dateStr,
      end: dateStr,
      type: '',
      targetLocation: 'all',
      targetValue: '',
    });
    setEditingEventId(null);
    setValidationError('');
    setShowEventModal(true);
  };

  const openEditEvent = (event, e) => {
    e.stopPropagation();
    if (!canEditOrDelete || isReadOnlyEvent(event)) {
      setSelectedEvent(event);
      return;
    }
    setEventForm({
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      type: event.type,
      targetLocation: event.targetLocation,
      targetValue: event.targetValue || '',
    });
    setEditingEventId(event._id || event.id);
    setValidationError('');
    setShowEventModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setValidationError('');

    const titleText = eventForm.title.trim();
    if (!titleText) {
      setValidationError('Title is required.');
      return;
    }

    // Words only validation (alphabetic, spaces, & common punctuation)
    if (!/^[a-zA-Z\s&'-]+$/.test(titleText)) {
      setValidationError('Title must contain words only (letters, spaces and simple punctuation like &, \', -).');
      return;
    }

    // Title character limit 100
    if (titleText.length > 100) {
      setValidationError('Title cannot exceed 100 characters.');
      return;
    }

    // Title word limit 20
    const titleWords = titleText.split(/\s+/).filter(Boolean).length;
    if (titleWords > 20) {
      setValidationError('Title word limit is 20 words.');
      return;
    }

    // Check if any word in Title is too long (to prevent pasting long strings as one word)
    const hasLongWord = titleText.split(/\s+/).some(word => word.length > 20);
    if (hasLongWord) {
      setValidationError('Individual words in the title cannot exceed 20 characters.');
      return;
    }

    // Description character limit 300
    const descText = eventForm.description.trim();
    if (descText.length > 300) {
      setValidationError('Description cannot exceed 300 characters.');
      return;
    }

    // Description word limit 50
    const descWords = descText.split(/\s+/).filter(Boolean).length;
    if (descWords > 50) {
      setValidationError('Description word limit is 50 words.');
      return;
    }

    // Check if any word in Description is too long
    const hasLongDescWord = descText.split(/\s+/).some(word => word.length > 25);
    if (hasLongDescWord) {
      setValidationError('Individual words in the description cannot exceed 25 characters.');
      return;
    }

    // Date validation: can't select passed date
    const todayStr = new Date().toISOString().split('T')[0];
    if (!editingEventId && eventForm.start < todayStr) {
      setValidationError('Start date cannot be in the past.');
      return;
    }
    if (!editingEventId && eventForm.end < todayStr) {
      setValidationError('End date cannot be in the past.');
      return;
    }

    // Event type validation: must select one
    if (!eventForm.type) {
      setValidationError('Please select an event type.');
      return;
    }

    if (editingEventId) {
      const res = await handleUpdateEvent(editingEventId, eventForm);
      if (res.success) {
        setShowEventModal(false);
      } else {
        setValidationError(res.error || 'Failed to update event.');
      }
    } else {
      const res = await handleCreateEvent(eventForm);
      if (res.success) {
        setShowEventModal(false);
      } else {
        setValidationError(res.error || 'Failed to create event.');
      }
    }
  };

  const handleDelete = async (eventId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      await handleDeleteEvent(eventId);
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
            {canManageEvents
              ? 'Manage company events'
              : 'View company holidays, team events, and meetings'
            }
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {canManageEvents && (
            <button
              onClick={() => {
                const todayStr = new Date().toISOString().split('T')[0];
                setEventForm({
                  title: '',
                  description: '',
                  start: todayStr,
                  end: todayStr,
                  type: '',
                  targetLocation: 'all',
                  targetValue: '',
                });
                setEditingEventId(null);
                setShowEventModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-500/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white/40 backdrop-blur-3xl rounded-[32px] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden relative isolate dark:bg-slate-900/40 dark:border-slate-700/60">
        <div className="absolute -inset-24 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 blur-3xl -z-10 pointer-events-none" />

        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-5 border-b border-white/40 bg-white/30 relative z-10 dark:border-slate-700/40 dark:bg-slate-800/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center border border-white/50 shadow-sm dark:bg-slate-800/60 dark:border-slate-700/50 flex-shrink-0">
              <CalendarIcon className="w-5 h-5 text-indigo-600 drop-shadow-sm" />
            </div>
            <span className="text-slate-800 font-black text-xl tracking-tight drop-shadow-sm dark:text-slate-100 whitespace-nowrap">
              {monthNames[month]} {year}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white/50 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-5 py-2 bg-white/60 hover:bg-white/80 border border-white/50 text-slate-800 rounded-[12px] text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 dark:border-slate-700/50 dark:text-slate-100"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white/50 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:block relative z-10">
          <div className="grid grid-cols-7 border-b border-white/40 text-center bg-white/20 backdrop-blur-sm text-indigo-900/60 text-[10px] font-black uppercase tracking-widest py-4 shadow-[0_1px_0_0_rgba(255,255,255,0.4)] dark:border-slate-700/40 dark:bg-slate-800/20 dark:text-indigo-200/60 dark:shadow-none">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/20 dark:bg-slate-800/20">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <span className="text-sm text-slate-500 font-bold tracking-wider uppercase">Loading calendar...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 grid-rows-5 bg-white/30 gap-[1px] dark:bg-slate-700/30">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isToday = day &&
                  day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                const isSunday = idx % 7 === 0;
                const isSaturday = idx % 7 === 6;
                const isWeekend = isSunday || isSaturday;

                return (
                  <div
                    key={idx}
                    onClick={() => day && handleDayClick(day)}
                    className={`min-h-[140px] p-3 flex flex-col justify-between transition-all duration-300 relative ${day ? 'cursor-pointer' : ''} ${!day ? 'bg-white/20 backdrop-blur-sm dark:bg-slate-800/20' : isToday ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 z-10 shadow-[0_4px_20px_rgba(16,185,129,0.2)] dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:border-emerald-500' : isWeekend ? 'bg-white/40 hover:bg-white/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60' : 'bg-white/60 hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-800/80'} group`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-110' : isSunday ? 'text-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30' : isSaturday ? 'text-slate-500 group-hover:bg-slate-200 dark:text-slate-400 dark:group-hover:bg-slate-700' : 'text-slate-700 group-hover:bg-slate-200 dark:text-slate-300 dark:group-hover:bg-slate-700'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-lg border border-white dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-[96px]">
                      {dayEvents.slice(0, 3).map((event) => {
                        const style = getEventStyle(event);
                        return (
                          <div
                            key={event._id || event.id}
                            onClick={(e) => openEditEvent(event, e)}
                            className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-semibold truncate transition-all ${style.color}`}
                            title={event.title}
                          >
                            {style.code ? (
                              <img
                                src={`https://flagcdn.com/16x12/${style.code}.png`}
                                alt=""
                                className="inline-block mr-1 w-3.5 h-2.5 object-cover rounded-sm align-middle mb-0.5"
                              />
                            ) : style.flag ? (
                              <span className="mr-1">{style.flag}</span>
                            ) : (
                              (event.type === 'holiday' || event.type === 'bank-holiday' || event.type === 'festival') && (
                                <span className="mr-1">🌐</span>
                              )
                            )}
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-slate-400 font-bold pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Agenda View */}
        <div className="block md:hidden relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/30 dark:bg-slate-800/30">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
              <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">Loading calendar...</span>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/40 bg-white/40 max-h-[65vh] overflow-y-auto dark:divide-slate-700/40 dark:bg-slate-800/40">
              {calendarDays.filter(day => day).map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const dateObj = new Date(year, month, day);
                const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div
                    key={day}
                    ref={isToday ? todayRef : null}
                    onClick={() => handleDayClick(day)}
                    className={`flex gap-4 p-4 transition-colors cursor-pointer ${isToday ? 'bg-emerald-50 hover:bg-emerald-100 border-l-[4px] border-emerald-500 shadow-sm dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40' : 'hover:bg-white/60 border-l-[4px] border-transparent dark:hover:bg-slate-800/60'}`}
                  >
                    <div className="flex flex-col items-center w-12 flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>{weekdayStr}</span>
                      <span className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-black mt-1 transition-all ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-110' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      {dayEvents.length === 0 ? (
                        <div className="text-sm text-slate-400 font-medium italic mt-1.5 opacity-60">No events</div>
                      ) : (
                        <div className="space-y-2">
                          {dayEvents.map(event => {
                            const style = getEventStyle(event);
                            return (
                              <div
                                key={event._id || event.id}
                                onClick={(e) => openEditEvent(event, e)}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold ${style.color} flex items-center gap-2.5 transition-all shadow-sm active:scale-95 cursor-pointer`}
                              >
                                {style.code ? (
                                  <img
                                    src={`https://flagcdn.com/16x12/${style.code}.png`}
                                    alt=""
                                    className="w-4 h-3 object-cover rounded shadow-sm flex-shrink-0"
                                  />
                                ) : style.flag ? (
                                  <span className="flex-shrink-0 text-sm">{style.flag}</span>
                                ) : (
                                  (event.type === 'holiday' || event.type === 'bank-holiday' || event.type === 'festival') && (
                                    <span className="flex-shrink-0 text-sm">🌐</span>
                                  )
                                )}
                                <span className="truncate flex-1">{event.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Add / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg tracking-tight">
                  {editingEventId ? 'Edit Calendar Event' : 'Add New Event'}
                </h3>
                {editingEventId && canEditOrDelete && (
                  <button
                    onClick={(e) => handleDelete(editingEventId, e)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitEvent} className="space-y-5">
                {validationError && (
                  <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                    {validationError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      const wordsCount = val.trim().split(/\s+/).filter(Boolean).length;
                      if (wordsCount <= 20) {
                        setEventForm((p) => ({ ...p, title: val }));
                      }
                    }}
                    required
                    placeholder="e.g. Sinhala & Tamil New Year"
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all"
                  />
                  <div className="flex justify-between items-center mt-1 px-1">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${titleWordsCount > 20 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {titleWordsCount}/20 words
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      const wordsCount = val.trim().split(/\s+/).filter(Boolean).length;
                      if (wordsCount <= 50) {
                        setEventForm((p) => ({ ...p, description: val }));
                      }
                    }}
                    placeholder="Details about the event"
                    rows={2}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-medium transition-all resize-none"
                  />
                  <div className="flex justify-between items-center mt-1 px-1">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${descWordsCount > 50 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {descWordsCount}/50 words
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={eventForm.start}
                      min={!editingEventId ? todayStr : undefined}
                      onChange={(e) => setEventForm((p) => ({ ...p, start: e.target.value }))}
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={eventForm.end}
                      min={eventForm.start || (!editingEventId ? todayStr : undefined)}
                      onChange={(e) => setEventForm((p) => ({ ...p, end: e.target.value }))}
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Event Type</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm((p) => ({ ...p, type: e.target.value }))}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Event Type</option>
                      <option value="company-holiday">Company Holiday</option>
                      <option value="team-event">Team Event</option>
                      <option value="meeting">Meeting</option>
                      <option value="training">Training Session</option>
                      <option value="day-off">Employee Day-Off</option>
                      <option value="special">Special Event</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-500/30 active:scale-95"
                  >
                    {editingEventId ? 'Save Changes' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 py-3 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Display Modal (Employee View/Read Only click) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-3 h-3 rounded-full shadow-sm ${EVENT_TYPE_DOTS[selectedEvent.type] || 'bg-slate-400'}`} />
              <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight flex items-center gap-2">
                {(() => {
                  const style = getEventStyle(selectedEvent);
                  if (style.code) {
                    return (
                      <img
                        src={`https://flagcdn.com/16x12/${style.code}.png`}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded shadow-sm inline-block"
                      />
                    );
                  }
                  if (style.flag) {
                    return <span className="text-2xl drop-shadow-sm">{style.flag}</span>;
                  }
                  if (selectedEvent.type === 'holiday' || selectedEvent.type === 'bank-holiday' || selectedEvent.type === 'festival') {
                    return <span className="drop-shadow-sm">🌐</span>;
                  }
                  return null;
                })()}
                {selectedEvent.type === 'knowledge-session' ? selectedEvent.rawTitle || selectedEvent.title : selectedEvent.title}
              </h3>
            </div>

            {/* KSS-specific detail card */}
            {selectedEvent.type === 'knowledge-session' ? (
              <div className="space-y-4 mb-6">
                <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest">Conductor</div>
                      <div className="text-slate-800 dark:text-slate-100 font-bold">{selectedEvent.conductor}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-2xl">🕐</span>
                    <div>
                      <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest">Date & Time</div>
                      <div className="text-slate-800 dark:text-slate-100 font-bold">{selectedEvent.start}{selectedEvent.time ? ` at ${selectedEvent.time}` : ''}</div>
                    </div>
                  </div>
                  {selectedEvent.meetingLink && (
                    <div className="pt-3 border-t border-cyan-200 dark:border-cyan-800/50">
                      <a
                        href={selectedEvent.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/30 active:scale-95"
                      >
                        🎥 Join Teams Meeting
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 font-medium">
                {selectedEvent.description || 'No description provided.'}
              </p>
            )}

            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-5 font-black uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
                </div>
                <span>Date: {selectedEvent.start} {selectedEvent.end !== selectedEvent.start && `to ${selectedEvent.end}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Info className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="capitalize">Type: {selectedEvent.type === 'knowledge-session' ? 'Knowledge Sharing Session' : selectedEvent.type.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              {canEditOrDelete && (!isReadOnlyEvent(selectedEvent)) && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(selectedEvent._id || selectedEvent.id, e)}
                  className="flex-1 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Day Events Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white dark:border-slate-800 shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg tracking-tight">
                  Events on {monthNames[month]} {selectedDayEvents.day}, {year}
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1 block">
                  {selectedDayEvents.events.length} event{selectedDayEvents.events.length !== 1 ? 's' : ''} listed
                </span>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-black p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-95 bg-slate-50 dark:bg-slate-800/50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {selectedDayEvents.events.map((event) => {
                const style = getEventStyle(event);
                return (
                  <div
                    key={event._id || event.id}
                    onClick={(e) => {
                      setSelectedDayEvents(null);
                      openEditEvent(event, e);
                    }}
                    className={`p-4 rounded-2xl border text-sm font-bold cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md relative group ${style.color}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {style.code ? (
                        <img
                          src={`https://flagcdn.com/16x12/${style.code}.png`}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded shadow-sm inline-block"
                        />
                      ) : style.flag ? (
                        <span className="text-lg drop-shadow-sm">{style.flag}</span>
                      ) : (
                        (event.type === 'holiday' || event.type === 'bank-holiday' || event.type === 'festival') && (
                          <span className="text-lg drop-shadow-sm">🌐</span>
                        )
                      )}
                      <span className="font-black text-base tracking-tight">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs font-medium opacity-80 leading-relaxed bg-white/50 dark:bg-black/10 p-2.5 rounded-xl border border-white/20 dark:border-black/20">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
              {selectedDayEvents.events.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  No events scheduled for this day.
                </div>
              )}
            </div>

            {canManageEvents && (
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    const day = selectedDayEvents.day;
                    setSelectedDayEvents(null);
                    openAddEvent(day);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Add New Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
