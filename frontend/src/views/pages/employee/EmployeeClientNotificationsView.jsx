import React, { useState, useEffect } from 'react';
import { Bell, CalendarDays, CheckCircle2, Trash2, Building2, User, Video, Clock, Users, XCircle } from 'lucide-react';
import { BACKEND_URL } from '../../../config';

const formatNoticeDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return '';
  try {
    const dateObj = new Date(`${dateStr}T00:00:00`);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${hours}:${minutesStr} ${ampm}`;

    return `${formattedDate} at ${formattedTime}`;
  } catch (err) {
    return `${dateStr} @ ${timeStr}`;
  }
};

export function EmployeeClientNotificationsView({ employee, shiftNotices = [], allLeaves = [] }) {
  const userId = employee?.id || employee?._id || 'employee_default';

  const [readIds, setReadIds] = React.useState([]);
  const [deletedIds, setDeletedIds] = React.useState([]);

  const [activeTab, setActiveTab] = useState('client');
  const [companyNotices, setCompanyNotices] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    if (userId !== 'employee_default') {
      try {
        setReadIds(JSON.parse(localStorage.getItem(`readNoticeIds_${userId}`) || '[]'));
        setDeletedIds(JSON.parse(localStorage.getItem(`deletedNoticeIds_${userId}`) || '[]'));
      } catch {
        setReadIds([]);
        setDeletedIds([]);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId !== 'employee_default') {
      const fetchCompanyNotices = async () => {
        setLoadingCompany(true);
        try {
          const [resKss, resCeleb] = await Promise.all([
            fetch(`${BACKEND_URL}/employees/${userId}/knowledge-sessions`),
            fetch(`${BACKEND_URL}/employees/${userId}/celebrations`)
          ]);
          let data = [];
          if (resKss.ok) {
            const kssData = await resKss.json();
            data = [...data, ...kssData];
          }
          if (resCeleb.ok) {
            const celebData = await resCeleb.json();
            data = [...data, ...celebData];
          }
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setCompanyNotices(data);
        } catch (err) {
          console.error('Failed to fetch company notices:', err);
        } finally {
          setLoadingCompany(false);
        }
      };
      fetchCompanyNotices();
    }
  }, [userId]);

  const handleMarkAsRead = (id, updatedAt) => {
    const key = `${id}_${updatedAt}`;
    const updated = [...readIds, key];
    setReadIds(updated);
    localStorage.setItem(`readNoticeIds_${userId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = (id) => {
    const updated = [...deletedIds, id];
    setDeletedIds(updated);
    localStorage.setItem(`deletedNoticeIds_${userId}`, JSON.stringify(updated));
  };

  const [respondingId, setRespondingId] = useState(null);

  const handleRespond = async (sessionId, status) => {
    setRespondingId(sessionId);
    try {
      const res = await fetch(`${BACKEND_URL}/employees/${userId}/knowledge-sessions/${sessionId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCompanyNotices((prev) =>
          prev.map((n) => (n._id === sessionId ? { ...n, myResponseStatus: status } : n))
        );
      }
    } catch (err) {
      console.error('Failed to submit session response:', err);
    } finally {
      setRespondingId(null);
    }
  };

  const visibleNotices = shiftNotices.filter(n => !deletedIds.includes(n._id));

  const unreadClientCount = visibleNotices.filter(n => {
    const readKey = `${n._id}_${n.updatedAt || n.createdAt}`;
    return !readIds.includes(readKey);
  }).length;

  const unreadCompanyCount = companyNotices.filter(session => {
    const readKey = `${session._id}_${session.updatedAt || session.createdAt}`;
    return !readIds.includes(readKey);
  }).length;

  const formatNoticeDateOnly = (dateStr) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(`${dateStr}T00:00:00`);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Alerts, shift instructions, leaves, and knowledge sharing sessions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-px relative z-10">
        <button
          onClick={() => setActiveTab('client')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'client'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" /> Client Notifications
            {unreadClientCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{unreadClientCount}</span>
            )}
          </div>
          {activeTab === 'client' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full shadow-[0_-2px_8px_rgba(16,185,129,0.5)]"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'company'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Company Notifications
            {unreadCompanyCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{unreadCompanyCount}</span>
            )}
          </div>
          {activeTab === 'company' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_8px_rgba(99,102,241,0.5)]"></div>
          )}
        </button>
      </div>

      <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/80 dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-emerald-100/50 dark:shadow-none min-h-[400px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-8 flex items-center gap-3 tracking-tight border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm relative ${activeTab === 'client' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 border-emerald-100 dark:border-emerald-800/60' : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/70 dark:to-blue-950/70 border-indigo-100 dark:border-indigo-800/60'}`}>
              <Bell className={`w-6 h-6 ${activeTab === 'client' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              {activeTab === 'client' && unreadClientCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                  {unreadClientCount}
                </span>
              )}
              {activeTab === 'company' && unreadCompanyCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                  {unreadCompanyCount}
                </span>
              )}
            </div>
            Activity Feed
          </h3>

          {activeTab === 'client' && (
            visibleNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 relative">
                <Bell className="w-10 h-10 opacity-30 text-emerald-500 dark:text-emerald-400" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-50"></div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">You're all caught up!</p>
              <p className="text-sm font-medium mt-1">No new client/lead notifications at the moment.</p>
            </div>
          ) : (
            <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-[27px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 pl-2">
              {visibleNotices.map((notice, idx) => {
                const readKey = `${notice._id}_${notice.updatedAt || notice.createdAt}`;
                const isUnread = !readIds.includes(readKey);
                const isLeave = notice.noticeType === 'leave';

                let cardStyle = 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 shadow-sm dark:shadow-none';
                let iconWrapperStyle = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                let iconStyle = 'text-slate-400 dark:text-slate-400';

                if (isUnread) {
                  if (isLeave) {
                    cardStyle = 'border-amber-200 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/80 to-white dark:from-amber-950/40 dark:to-slate-900 shadow-md shadow-amber-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-amber-400/20';
                    iconWrapperStyle = 'bg-amber-100 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60 shadow-md shadow-amber-200/50 dark:shadow-none animate-pulse';
                    iconStyle = 'text-amber-600 dark:text-amber-300';
                  } else {
                    cardStyle = 'border-emerald-200 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-950/40 dark:to-slate-900 shadow-md shadow-emerald-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-emerald-400/20';
                    iconWrapperStyle = 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60 shadow-md shadow-emerald-200/50 dark:shadow-none animate-pulse';
                    iconStyle = 'text-emerald-600 dark:text-emerald-300';
                  }
                } else {
                  if (isLeave) {
                    cardStyle = 'border-amber-100 dark:border-amber-900/40 bg-amber-50/10 dark:bg-amber-950/20 shadow-sm dark:shadow-none';
                    iconWrapperStyle = 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40';
                    iconStyle = 'text-amber-500 dark:text-amber-400';
                  } else if (notice.informHR) {
                    cardStyle = 'border-rose-100 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/20 shadow-sm dark:shadow-none';
                    iconWrapperStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40';
                    iconStyle = 'text-rose-500 dark:text-rose-400';
                  }
                }

                let matchedLeave = null;
                if (isLeave) {
                  matchedLeave = allLeaves.find(l => 
                    l.type === 'client-assigned' && 
                    l.startDate === notice.date && 
                    (l.endDate === notice.endDate || (!l.endDate && !notice.endDate))
                  );
                }

                return (
                  <div key={notice._id || idx} className="relative flex gap-6 pl-12 group">
                    <div className="absolute left-0 top-6 -translate-y-1/2 z-10">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${iconWrapperStyle}`}>
                        <CalendarDays className={`w-5 h-5 ${iconStyle}`} />
                      </div>
                    </div>

                    <div className={`flex-1 border rounded-2xl p-6 transition-all duration-300 ${cardStyle}`}>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {notice.companyName}
                              </span>

                              {isLeave ? (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Leave Notice
                                </span>
                              ) : (
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Shift Message
                                </span>
                              )}

                              {!isLeave && notice.informHR && (
                                <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span> Urgent / Late
                                </span>
                              )}

                              {isUnread && (
                                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 ${isLeave ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700'
                                  }`}>
                                  ✨ New Activity
                                </span>
                              )}
                            </div>

                            <h4 className="text-slate-800 dark:text-slate-100 font-black text-base md:text-lg tracking-tight">
                              {isLeave ? (
                                <span>Leave Period: <span className="text-amber-600 dark:text-amber-400 font-mono text-sm ml-1">{formatNoticeDateOnly(notice.date)} — {formatNoticeDateOnly(notice.endDate)}</span></span>
                              ) : (
                                <span>Shift Scheduled: <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm ml-1">{formatNoticeDateTime(notice.date, notice.time)}</span></span>
                              )}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 self-start">
                            {isUnread ? (
                              <button
                                onClick={() => handleMarkAsRead(notice._id, notice.updatedAt || notice.createdAt)}
                                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 ${isLeave
                                    ? 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 border-amber-200 dark:border-amber-800/60 shadow-amber-200/50'
                                    : 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 border-emerald-200 dark:border-emerald-800/60 shadow-emerald-200/50'
                                  }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark Read
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(notice._id)}
                                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/60 hover:border-rose-600 transition-all cursor-pointer shadow-sm active:scale-95 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className={`text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border p-4 rounded-xl shadow-inner ${isLeave ? 'border-amber-100/50 dark:border-amber-800/50' : 'border-slate-100 dark:border-slate-700/50'
                          }`}>
                          <span className="text-slate-400 font-serif text-lg leading-none mr-1">&ldquo;</span>
                          {notice.reason}
                          <span className="text-slate-400 font-serif text-lg leading-none ml-1">&rdquo;</span>
                        </div>

                        {isLeave && matchedLeave && matchedLeave.status !== 'pending' && (
                          <div className={`mt-2 p-3 rounded-xl border flex items-start gap-3 ${
                            matchedLeave.status === 'approved' 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' 
                              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50'
                          }`}>
                            {matchedLeave.status === 'approved' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center mt-0.5"><div className="w-2 h-0.5 bg-rose-600 dark:bg-rose-400"></div></div>
                            )}
                            <div>
                              <p className={`text-sm font-bold ${
                                matchedLeave.status === 'approved' 
                                  ? 'text-emerald-800 dark:text-emerald-300' 
                                  : 'text-rose-800 dark:text-rose-300'
                              }`}>
                                HR Status: {matchedLeave.status.toUpperCase()}
                              </p>
                              {matchedLeave.status === 'rejected' && matchedLeave.rejectionReason && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                                  Reason: {matchedLeave.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                          Received {new Date(notice.createdAt || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {activeTab === 'company' && (
            loadingCompany ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : companyNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 relative">
                  <Video className="w-10 h-10 opacity-30 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">No Company Notifications</p>
                <p className="text-sm font-medium mt-1">There are no knowledge sharing sessions or celebrations scheduled for you.</p>
              </div>
            ) : (
              <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-[27px] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 pl-2">
                {companyNotices.map((session, idx) => {
                  const readKey = `${session._id}_${session.updatedAt || session.createdAt}`;
                  const isUnread = !readIds.includes(readKey);

                  const isBirthday = session.type === 'birthday';
                  const isAnniversary = session.type === 'anniversary';
                  const isMentorSession = session.sessionType === 'mentor-session';
                  const isKss = !isBirthday && !isAnniversary && !isMentorSession;

                  let cardStyle = 'border-indigo-200/80 dark:border-indigo-800 bg-white/70 dark:bg-slate-900/80 shadow-sm dark:shadow-none';
                  let iconWrapperStyle = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                  let iconStyle = 'text-slate-400 dark:text-slate-400';
                  let IconComponent = isBirthday || isAnniversary ? CalendarDays : (isMentorSession ? Users : Video);
                  let typeLabel = isBirthday ? 'Birthday Celebration' : isAnniversary ? 'Work Anniversary' : (isMentorSession ? 'Mentor Session' : 'Knowledge Sharing Session');
                  let typeColorClass = isBirthday ? 'text-pink-700 dark:text-pink-300 bg-pink-100/80 dark:bg-pink-950/70 border-pink-200 dark:border-pink-800/60' :
                                       isAnniversary ? 'text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60' :
                                       isMentorSession ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800/60' :
                                       'text-cyan-700 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-950/70 border-cyan-200 dark:border-cyan-800/60';
                  let typeDotColor = isBirthday ? 'bg-pink-500' : isAnniversary ? 'bg-amber-500' : (isMentorSession ? 'bg-indigo-500' : 'bg-cyan-500');

                  if (isUnread) {
                    if (isBirthday) {
                      cardStyle = 'border-pink-200 dark:border-pink-700/60 bg-gradient-to-r from-pink-50/80 to-white dark:from-pink-950/40 dark:to-slate-900 shadow-md shadow-pink-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-pink-400/20';
                      iconWrapperStyle = 'bg-pink-100 dark:bg-pink-950/70 border-pink-200 dark:border-pink-800/60 shadow-md shadow-pink-200/50 dark:shadow-none animate-pulse';
                      iconStyle = 'text-pink-600 dark:text-pink-300';
                    } else if (isAnniversary) {
                      cardStyle = 'border-amber-200 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/80 to-white dark:from-amber-950/40 dark:to-slate-900 shadow-md shadow-amber-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-amber-400/20';
                      iconWrapperStyle = 'bg-amber-100 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60 shadow-md shadow-amber-200/50 dark:shadow-none animate-pulse';
                      iconStyle = 'text-amber-600 dark:text-amber-300';
                    } else if (isMentorSession) {
                      cardStyle = 'border-indigo-200 dark:border-indigo-700/60 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/40 dark:to-slate-900 shadow-md shadow-indigo-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-indigo-400/20';
                      iconWrapperStyle = 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800/60 shadow-md shadow-indigo-200/50 dark:shadow-none animate-pulse';
                      iconStyle = 'text-indigo-600 dark:text-indigo-300';
                    } else {
                      cardStyle = 'border-cyan-200 dark:border-cyan-700/60 bg-gradient-to-r from-cyan-50/80 to-white dark:from-cyan-950/40 dark:to-slate-900 shadow-md shadow-cyan-100/50 dark:shadow-none scale-[1.01] z-10 relative ring-1 ring-cyan-400/20';
                      iconWrapperStyle = 'bg-cyan-100 dark:bg-cyan-950/70 border-cyan-200 dark:border-cyan-800/60 shadow-md shadow-cyan-200/50 dark:shadow-none animate-pulse';
                      iconStyle = 'text-cyan-600 dark:text-cyan-300';
                    }
                  }

                  return (
                    <div key={session._id || idx} className="relative flex gap-6 pl-12 group">
                      <div className="absolute left-0 top-6 -translate-y-1/2 z-10">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${iconWrapperStyle}`}>
                          <IconComponent className={`w-5 h-5 ${iconStyle}`} />
                        </div>
                      </div>

                      <div className={`flex-1 border rounded-2xl p-6 transition-all duration-300 ${cardStyle}`}>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 ${typeColorClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${typeDotColor}`}></span> {typeLabel}
                                </span>
                                {isUnread && (
                                  <span className="text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700">
                                    ✨ New Activity
                                  </span>
                                )}
                              </div>

                              <h4 className="text-slate-800 dark:text-slate-100 font-black text-base md:text-lg tracking-tight">
                                {session.title}
                              </h4>
                              <p className="text-slate-500 text-sm font-medium">Conducted by: <strong className="text-slate-700 dark:text-slate-300">{session.conductor}</strong></p>
                            </div>

                            <div className="flex items-center gap-2 self-start flex-wrap justify-end">
                              {(isKss || isMentorSession) && (
                                session.myResponseStatus === 'accepted' ? (
                                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60">
                                    <CheckCircle2 className="w-4 h-4" /> Accepted
                                  </span>
                                ) : session.myResponseStatus === 'rejected' ? (
                                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60">
                                    <XCircle className="w-4 h-4" /> Declined
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleRespond(session._id, 'accepted')}
                                      disabled={respondingId === session._id}
                                      className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 border-emerald-200 dark:border-emerald-800/60"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRespond(session._id, 'rejected')}
                                      disabled={respondingId === session._id}
                                      className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/80 border-rose-200 dark:border-rose-800/60"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                  </>
                                )
                              )}
                              {isUnread && (
                                <button
                                  onClick={() => handleMarkAsRead(session._id, session.updatedAt || session.createdAt)}
                                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-100 bg-cyan-100 dark:bg-cyan-950/60 hover:bg-cyan-200 dark:hover:bg-cyan-900/80 border-cyan-200 dark:border-cyan-800/60 shadow-cyan-200/50"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <CalendarDays className="w-4 h-4 text-indigo-500" />
                              {formatNoticeDateOnly(session.date)}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              {formatNoticeDateTime(session.date, session.time).split(' at ')[1] || session.time}
                            </div>
                          </div>

                          {session.meetingLink && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-2 px-5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                              >
                                🎥 Join Teams Meeting
                              </a>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            Created {new Date(session.createdAt || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
