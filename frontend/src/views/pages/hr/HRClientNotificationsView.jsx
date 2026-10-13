import React from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

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

export function HRClientNotificationsView({ hrProfile, shiftNotices = [] }) {
  const userId = hrProfile?.legacyId || hrProfile?._id || 'hr_default';

  const [readIds, setReadIds] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`readNoticeIds_${userId}`) || '[]');
    } catch {
      return [];
    }
  });

  const [deletedIds, setDeletedIds] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`deletedNoticeIds_${userId}`) || '[]');
    } catch {
      return [];
    }
  });

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

  const visibleNotices = shiftNotices.filter(n => !deletedIds.includes(n._id));

  // Sort visible shift notices: informHR (urgent) first, then by date/creation descending
  const sortedNotices = [...visibleNotices].sort((a, b) => {
    if (a.informHR && !b.informHR) return -1;
    if (!a.informHR && b.informHR) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

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
      <div>
        <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: '1.375rem' }}>Client/Lead Notifications</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Telemetry log of shift start messages and leave assignments sent from clients/leads to employees</p>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white/80 dark:border-slate-800 p-8 flex flex-col shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-100 dark:bg-emerald-900/30 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-2xl opacity-50"></div>
        
        <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6 flex items-center gap-2 relative z-10">
          <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          All Client/Lead Messages & Leaves ({sortedNotices.length})
        </h3>

        {sortedNotices.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 animate-bounce text-emerald-500 dark:text-emerald-400" />
            <p className="font-medium text-slate-500 dark:text-slate-400">No client/lead notifications recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNotices.map((notice, idx) => {
              const readKey = `${notice._id}_${notice.updatedAt || notice.createdAt}`;
              const isUnread = !readIds.includes(readKey);
              const isLeave = notice.noticeType === 'leave';

              let cardStyle = 'border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/80';
              let iconStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
              
              if (isUnread) {
                if (isLeave) {
                  cardStyle = 'border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 shadow-amber-100/30 dark:shadow-none';
                  iconStyle = 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300';
                } else {
                  cardStyle = 'border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-emerald-100/30 dark:shadow-none';
                  iconStyle = 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300';
                }
              } else {
                if (isLeave) {
                  cardStyle = 'border-amber-200/40 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20';
                  iconStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
                } else if (notice.informHR) {
                  cardStyle = 'border-rose-200/50 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30';
                  iconStyle = 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300';
                }
              }

              return (
                <div
                  key={notice._id || idx}
                  className={`border backdrop-blur-md rounded-2xl p-6 hover:shadow-lg transition-all shadow-sm relative z-10 ${cardStyle}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${iconStyle} flex-shrink-0`}>
                      {isLeave ? (
                        <Clock className="w-5 h-5" />
                      ) : notice.informHR ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                            Client/Lead: {notice.companyName}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 text-xs">|</span>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800/60">
                            Target Employee: {notice.employeeName}
                          </span>
                          {isLeave ? (
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full font-bold uppercase">
                              🍁 Client/Lead Leave
                            </span>
                          ) : notice.informHR ? (
                            <span className="bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 dark:border-rose-800/60 shadow-sm animate-pulse">
                              ⚠️ Urgent (&lt; 6h)
                            </span>
                          ) : null}
                          {isUnread && (
                            <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold animate-pulse ${
                              isLeave
                                ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border-amber-250 dark:border-amber-800/80'
                                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border-emerald-250 dark:border-emerald-800/80'
                            }`}>
                              New / Edited Leave Assignment
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isUnread ? (
                            <button
                              onClick={() => handleMarkAsRead(notice._id, notice.updatedAt || notice.createdAt)}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-sm ${
                                isLeave
                                  ? 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800/60'
                                  : 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark as Read
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(notice._id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900/60 transition-all cursor-pointer shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm mt-2">
                        {isLeave ? (
                          <span>Assigned Leave Period: <span className="text-amber-600 dark:text-amber-400 font-mono text-xs">{formatNoticeDateOnly(notice.date)} to {formatNoticeDateOnly(notice.endDate)}</span></span>
                        ) : (
                          <span>Scheduled Shift: <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{formatNoticeDateTime(notice.date, notice.time)}</span></span>
                        )}
                      </h4>

                      <div className={`text-sm text-slate-700 dark:text-slate-200 leading-relaxed mt-3 bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm border p-4 rounded-xl italic ${
                        isLeave ? 'border-amber-100/50 dark:border-amber-800/40' : 'border-slate-200/60 dark:border-slate-700/60'
                      }`}>
                        &ldquo;{notice.reason}&rdquo;
                      </div>

                      <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        Sent at: {new Date(notice.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
