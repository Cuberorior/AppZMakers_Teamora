import { Plus, CheckCircle2, XCircle, Clock, Calendar, FileText, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const leaveTypes = ['annual', 'casual', 'medical'];
const typeColors = {
  annual: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50',
  casual: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-800/50',
  medical: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
  'client-assigned': 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
};

export function EmployeeLeaveView({
  balance,
  showForm,
  setShowForm,
  leaveFilter,
  setLeaveFilter,
  leaveForm,
  setLeaveForm,
  leaveError,
  setLeaveError,
  leaveMonthFilter,
  setLeaveMonthFilter,
  leaveYearFilter,
  setLeaveYearFilter,
  filteredLeaves,
  leaveCounts,
  handleLeaveSubmit,
  handleDeleteLeave,
  handleCancelLeave
}) {
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const availableYears = [];
  for (let y = 2030; y >= 2024; y--) {
    availableYears.push(y);
  }

  const months = [
    { value: 'all', label: 'All Months' },
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
  const balanceItems = [
    { key: 'annual', label: 'Annual Leave', data: balance.annual, color: 'bg-indigo-500', ring: 'border-indigo-200' },
    { key: 'casual', label: 'Casual Leave', data: balance.casual, color: 'bg-sky-500', ring: 'border-sky-200' },
    { key: 'medical', label: 'Medical Leave', data: balance.medical, color: 'bg-rose-500', ring: 'border-rose-200' },
  ].filter(item => item.data);

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Leave Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Apply for leave and track your requests seamlessly</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 tracking-wide"
        >
          {showForm ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel Application' : 'Apply Leave'}
        </button>
      </div>

      {/* Leave balance cards - Glassmorphism Redesign */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {balanceItems.map(({ key, label, data, color }) => {
          const remaining = data.total - data.used;
          const pct = data.total > 0 ? (remaining / data.total) * 100 : 0;

          // Map color strings to gradients for premium look
          const gradientMap = {
            'bg-indigo-500': 'from-indigo-500 to-blue-600',
            'bg-sky-500': 'from-sky-400 to-cyan-500',
            'bg-rose-500': 'from-rose-500 to-orange-500'
          };

          const bgGradient = gradientMap[color] || 'from-indigo-500 to-blue-600';

          return (
            <div key={key} className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all duration-300 hover:-translate-y-1">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradient} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>

              <div className="p-6 md:p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-xs">{label}</span>
                  <div className={`w-12 h-12 bg-gradient-to-br ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex items-end gap-3 mb-2">
                  <div className="text-slate-800 dark:text-slate-100 leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: '3rem' }}>{remaining}</div>
                  <div className="text-slate-400 dark:text-slate-500 font-bold mb-2 uppercase tracking-wider text-xs">Days Left</div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  <span>{data.used} Used</span>
                  <span>{data.total} Total</span>
                </div>

                <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                  <div className={`h-full bg-gradient-to-r ${bgGradient} rounded-full transition-all duration-1000 relative`} style={{ width: `${pct}%` }}>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:10px_10px] animate-[stripe_1s_linear_infinite] opacity-50"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply form - Glassmorphism Redesign */}
      {showForm && (
        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white dark:border-slate-700/50 p-6 md:p-8 shadow-2xl shadow-indigo-100/50 dark:shadow-[0_0_40px_rgba(99,102,241,0.1)] animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-blue-600"></div>

          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            New Leave Application
          </h3>

          {leaveError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl text-sm font-bold flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>{leaveError}</span>
              </div>
              <button onClick={() => setLeaveError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleLeaveSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Leave Type</label>
                <div className="relative">
                  <select
                    value={leaveForm.type}
                    onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-inner dark:shadow-black/20 transition-all cursor-pointer appearance-none"
                  >
                    {leaveTypes.map(t => <option key={t} value={t} className="capitalize font-bold">{t} Leave</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end pb-1 space-y-2">
                <label className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold text-sm cursor-pointer select-none bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 p-3.5 rounded-2xl transition-all shadow-sm group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={leaveForm.halfDay || false}
                      onChange={e => {
                        const checked = e.target.checked;
                        setLeaveForm(prev => ({
                          ...prev,
                          halfDay: checked,
                          endDate: checked ? prev.startDate : prev.endDate
                        }));
                      }}
                      className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 cursor-pointer appearance-none checked:bg-indigo-600 dark:checked:bg-indigo-500 checked:border-indigo-600 dark:checked:border-indigo-500 transition-colors"
                    />
                    {leaveForm.halfDay && <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none" />}
                  </div>
                  Apply for Half Day (0.5 days)
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: prev.halfDay ? e.target.value : prev.endDate
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-inner dark:shadow-black/20 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {!leaveForm.halfDay && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">End Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                    </div>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      min={leaveForm.startDate}
                      required
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-inner transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Reason</label>
                <span className={`text-xs font-bold uppercase tracking-wider ${leaveForm.reason.trim().split(/\s+/).filter(Boolean).length >= 100 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {leaveForm.reason.trim().split(/\s+/).filter(Boolean).length} / 100 words
                </span>
              </div>
              <textarea
                value={leaveForm.reason}
                onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
                rows={3}
                placeholder="Please provide a brief reason for your leave request..."
                className="w-full border border-slate-200 dark:border-slate-700/50 rounded-2xl px-5 py-4 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-inner dark:shadow-black/20 transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3.5 rounded-2xl text-sm font-black tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
                SUBMIT APPLICATION
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto text-slate-600 dark:text-slate-300 font-bold px-8 py-3.5 rounded-2xl text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 uppercase tracking-widest">
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave history - Glassmorphism Redesign */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/50 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700/50">
              <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">Leave History</h3>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 w-full xl:w-auto min-w-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <select
                  value={leaveYearFilter}
                  onChange={(e) => setLeaveYearFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
                >
                  <option value="all">All Years</option>
                  {availableYears.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
              </div>
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <select
                  value={leaveMonthFilter}
                  onChange={(e) => setLeaveMonthFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto w-full sm:w-auto flex-nowrap" style={{ scrollbarWidth: 'none' }}>
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setLeaveFilter(f)}
                  className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${leaveFilter === f
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                    }`}
                >
                  {f} {leaveCounts && leaveCounts[f] !== undefined ? `(${leaveCounts[f]})` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700/50 flex flex-col items-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-bold text-slate-500 dark:text-slate-400 text-lg">No leave requests found</p>
            <p className="text-sm font-medium mt-1">Try changing the filter or apply for a new leave.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeaves.map((leave) => {
              const stMap = {
                approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
                rejected: { bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/50', text: 'text-rose-700 dark:text-rose-400', icon: <XCircle className="w-6 h-6 text-rose-500" /> },
                pending: { bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: <Clock className="w-6 h-6 text-amber-500" /> },
                cancelled: { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: <XCircle className="w-6 h-6 text-slate-500" /> }
              };
              const st = stMap[leave.status] || stMap.pending;

              return (
                <div key={leave.id} className={`group border rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-md ${leave.status === 'pending' ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50'}`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${typeColors[leave.type] || 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'}`}>
                          {leave.type === 'client-assigned' ? 'Client/Lead' : leave.type} Leave
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${st.bg} ${st.text}`}>
                          {st.icon && <span className="scale-75">{st.icon}</span>}
                          {leave.status === 'cancelled' && leave.cancelledBy ? `cancelled by ${leave.cancelledBy}` : leave.status}
                        </span>
                        <span className="text-slate-800 dark:text-slate-100 font-black text-sm bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                          {leave.days} day{leave.days !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900/50 w-fit px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{leave.startDate}</span>
                        {leave.startDate !== leave.endDate && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">→</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{leave.endDate}</span>
                          </>
                        )}
                      </div>

                      <div className="bg-white dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">{leave.reason}</p>
                      </div>

                      {(leave.rejectionReason || (leave.hrNote && leave.status === 'approved')) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {leave.rejectionReason && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-xl text-sm">
                              <div className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">Rejection Reason</div>
                              <div className="text-rose-800 dark:text-rose-200 font-medium">{leave.rejectionReason}</div>
                            </div>
                          )}
                          {leave.hrNote && leave.status === 'approved' && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-sm">
                              <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">HR Note</div>
                              <div className="text-emerald-800 dark:text-emerald-200 font-medium">{leave.hrNote}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 flex-shrink-0 pt-1">
                      <div className="hidden md:block">
                        {st.icon}
                      </div>

                      {(leave.status === 'pending' || leave.status === 'approved') && handleCancelLeave && (
                        <button
                          onClick={() => setConfirmCancelId(leave._id || leave.id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                          title="Cancel leave request"
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="md:hidden">Cancel</span>
                        </button>
                      )}

                      {leave.status !== 'pending' && handleDeleteLeave && (
                        <button
                          onClick={() => setConfirmDeleteId(leave._id || leave.id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                          title="Remove leave history"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="md:hidden">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Applied on {leave.appliedOn}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Confirmation Modals */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Cancel Leave</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Are you sure you want to cancel this leave request? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                No, keep it
              </button>
              <button
                onClick={() => {
                  handleCancelLeave(confirmCancelId);
                  setConfirmCancelId(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-all"
              >
                Yes, cancel leave
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Remove Leave</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Are you sure you want to hide this leave entry from your dashboard?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                No, keep it
              </button>
              <button
                onClick={() => {
                  handleDeleteLeave(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

