import { useState, useEffect } from 'react';

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

export function CompanyShiftNoticesView({
  myEmployees,
  shiftNotices = [],
  handleCreateShiftNotice,
  handleUpdateShiftNotice,
  handleDeleteShiftNotice,
}) {
  const [formData, setFormData] = useState({
    employeeId: 'all',
    date: '',
    time: '08:00',
    reason: '',
    noticeType: 'shift',
    endDate: '',
    leaveType: 'annual',
  });

  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Get tomorrow's date string for input 'min' attribute validation
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleReasonChange = (e) => {
    const text = e.target.value;
    const words = getWordCount(text);
    if (words <= 75 || text === '') {
      setFormData({ ...formData, reason: text });
    }
  };

  const handleEditClick = (notice) => {
    setEditingId(notice._id);
    setFormData({
      employeeId: notice.employeeId,
      date: notice.date,
      time: notice.time || '08:00',
      reason: notice.reason,
      noticeType: notice.noticeType || 'shift',
      endDate: notice.endDate || '',
      leaveType: notice.leaveType || 'annual',
    });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      employeeId: 'all',
      date: '',
      time: '08:00',
      reason: '',
      noticeType: 'shift',
      endDate: '',
      leaveType: 'annual',
    });
  };

  useEffect(() => {
    if (formData.noticeType === 'shift' && formData.date && formData.time) {
      const shiftStart = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      const diffMs = shiftStart - now;
      const diffHrs = diffMs / (1000 * 60 * 60);
      setIsUrgent(diffHrs < 6);
    } else {
      setIsUrgent(false);
    }
  }, [formData.date, formData.time, formData.noticeType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.noticeType === 'leave') {
      if (!formData.date || !formData.endDate || !formData.reason.trim()) {
        setErrorMsg('Please fill in all leave fields (start date, end date, and reason).');
        return;
      }
      if (new Date(formData.endDate) < new Date(formData.date)) {
        setErrorMsg('End date cannot be earlier than start date.');
        return;
      }
    } else {
      if (!formData.date || !formData.time || !formData.reason.trim()) {
        setErrorMsg('Please fill in all shift notification fields.');
        return;
      }
    }

    setLoading(true);
    let result;
    if (editingId) {
      result = await handleUpdateShiftNotice(editingId, formData);
    } else {
      result = await handleCreateShiftNotice(formData);
    }
    setLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Notification saved successfully.');
      setFormData({
        employeeId: 'all',
        date: '',
        time: '08:00',
        reason: '',
        noticeType: 'shift',
        endDate: '',
        leaveType: 'annual',
      });
      setEditingId(null);
      setIsUrgent(false);
    } else {
      setErrorMsg(result.error || 'Failed to save notification.');
    }
  };

  const formatNoticeDate = (dateStr) => {
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
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Shift & Leave Messages</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Send work start instructions or assign leaves to employees, and manage history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Message Form Box */}
        <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 p-8 flex flex-col justify-between shadow-2xl shadow-indigo-500/10 dark:shadow-none">
          {/* Liquid Theme Background Blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-30">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-fuchsia-400/50 to-purple-500/50 dark:from-fuchsia-600/40 dark:to-purple-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] animate-pulse" style={{ animationDuration: '7s' }}></div>
            <div className="absolute top-1/4 -right-24 w-80 h-80 bg-gradient-to-bl from-cyan-400/50 to-blue-500/50 dark:from-cyan-600/40 dark:to-blue-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[70px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
            <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-gradient-to-tr from-indigo-400/50 to-violet-500/50 dark:from-indigo-600/40 dark:to-violet-700/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '4s' }}></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight mb-2 flex items-center gap-2">
              {editingId
                ? (formData.noticeType === 'leave' ? '🍁 Edit Leave Assignment' : '✏️ Edit Shift Start Notice')
                : (formData.noticeType === 'leave' ? '🍁 Assign Leave' : '💬 Schedule Start Shift Message')}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              {formData.noticeType === 'leave'
                ? 'Assign approved leave period to target employees.'
                : 'Inform your employees when their work starts, with reasons.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Message Type Selector */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Message Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, noticeType: 'shift' })}
                    className={`py-3 px-4 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all cursor-pointer shadow-sm ${formData.noticeType === 'shift'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                  >
                    💬 Shift
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, noticeType: 'leave' })}
                    className={`py-3 px-4 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all cursor-pointer shadow-sm ${formData.noticeType === 'leave'
                        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                      }`}
                  >
                    🍁 Leave
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Target Employees</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                >
                  <option value="all">All Employees</option>
                  {myEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              </div>

              {formData.noticeType === 'leave' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-amber-500/30 transition-all cursor-pointer shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">End Date</label>
                      <input
                        type="date"
                        min={formData.date}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-amber-500/30 transition-all cursor-pointer shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Start Date</label>
                    <input
                      type="date"
                      min={editingId ? undefined : getTomorrowStr()}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all cursor-pointer shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all cursor-pointer shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Reason / Instructions</label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-white/50 dark:border-slate-700/50">
                    {getWordCount(formData.reason)}/75 words
                  </span>
                </div>
                <textarea
                  value={formData.reason}
                  onChange={handleReasonChange}
                  rows={4}
                  placeholder={formData.noticeType === 'leave' ? 'Reason for assigning this leave...' : 'Reason why the employee should login at this time...'}
                  className="w-full border border-white/60 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400 resize-none custom-scrollbar shadow-sm hover:bg-white/80 dark:hover:bg-slate-800/80"
                />
              </div>

              {isUrgent && formData.noticeType === 'shift' && (
                <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 text-xs text-rose-700 dark:text-rose-400 font-black tracking-widest flex items-start gap-2 animate-pulse shadow-sm">
                  <span>⚠️ WARNING: Notice scheduled for less than 6 hours from now. HR will be automatically notified.</span>
                </div>
              )}

              {errorMsg && <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50">{errorMsg}</div>}
              {successMsg && <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">{successMsg}</div>}

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] py-3 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl cursor-pointer disabled:opacity-50 active:scale-95 ${formData.noticeType === 'leave'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 shadow-orange-500/40 bg-[length:200%_auto] hover:bg-right'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-600 hover:via-purple-600 hover:to-fuchsia-600 shadow-indigo-500/40 bg-[length:200%_auto] hover:bg-right'
                    }`}
                >
                  {loading ? 'Saving...' : editingId ? 'Update Notice' : formData.noticeType === 'leave' ? 'Assign Leave' : 'Send Shift Message'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Log Box */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-8 flex flex-col shadow-xl shadow-slate-200/40 dark:shadow-none">
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight mb-2 flex items-center gap-2">📋 Notice Sent History</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">View previous shift messages and leave assignments sent to your employees.</p>

          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4 custom-scrollbar">
            {shiftNotices.length > 0 ? (
              shiftNotices.map((n, idx) => (
                <div
                  key={n._id || idx}
                  className={`p-6 border rounded-3xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${n.noticeType === 'leave'
                      ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-xl">
                        {n.employeeName}
                      </span>
                      {n.noticeType === 'leave' ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-3 py-1 rounded-xl font-black uppercase tracking-widest">
                          🍁 Client/Lead Leave
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-800/50 px-3 py-1 rounded-xl font-black uppercase tracking-widest">
                          💬 Shift
                        </span>
                      )}
                      {n.informHR && n.noticeType !== 'leave' && (
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 px-3 py-1 rounded-xl font-black uppercase tracking-widest animate-pulse">
                          ⚠️ HR Notified (&lt; 6h)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                      <strong className="text-slate-800 dark:text-slate-100 font-black tracking-tight mr-2 block mb-1">Reason:</strong>
                      {n.reason}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-4 flex-shrink-0 min-w-[140px]">
                    <div className="text-left sm:text-right">
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${n.noticeType === 'leave' ? 'text-amber-600 dark:text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {n.noticeType === 'leave' ? 'Leave Period:' : 'Start Time:'}
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 inline-block">
                        {n.noticeType === 'leave'
                          ? `${formatNoticeDate(n.date)} to ${formatNoticeDate(n.endDate)}`
                          : formatNoticeDateTime(n.date, n.time)}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center w-full sm:w-auto">
                      <button
                        onClick={() => handleEditClick(n)}
                        className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm ${n.noticeType === 'leave'
                            ? 'text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200/50 dark:border-amber-800/50'
                            : 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200/50 dark:border-indigo-800/50'
                          }`}
                        title="Edit Notice"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          const confirmMsg = n.noticeType === 'leave'
                            ? 'Are you sure you want to delete this leave assignment? This will also remove the approved leave request.'
                            : 'Are you sure you want to delete this shift notice?';
                          if (window.confirm(confirmMsg)) {
                            setErrorMsg('');
                            setSuccessMsg('');
                            const res = await handleDeleteShiftNotice(n._id);
                            if (res.success) {
                              setSuccessMsg('Notice deleted successfully.');
                            } else {
                              setErrorMsg(res.error || 'Failed to delete notice.');
                            }
                          }
                        }}
                        className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-4 py-2 rounded-xl border border-rose-200/50 dark:border-rose-800/50 transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Delete Notice"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 h-full">
                <span className="text-4xl mb-4 opacity-50">📋</span>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-black uppercase tracking-widest">No notices sent yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
