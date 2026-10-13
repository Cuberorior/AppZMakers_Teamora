import { CheckCircle2, XCircle, Clock, Calendar, Search, Trash2 } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';

const typeColors = {
  annual: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  casual: 'bg-sky-50 text-sky-700 border-sky-100',
  personal: 'bg-rose-50 text-rose-700 border-rose-100',
  'client-assigned': 'bg-amber-55 text-amber-700 border-amber-150',
};

export function HRLeaveApprovalsView({
  leaveTabFilter,
  setLeaveTabFilter,
  leaveSearch,
  setLeaveSearch,
  selectedLeave,
  setSelectedLeave,
  rejectReason,
  setRejectReason,
  hrNote,
  setHrNote,
  leaveAction,
  setLeaveAction,
  handleConfirmLeaveAction,
  handleDeleteLeaveApproval,
  filteredLeaves,
  leaveCounts,
  leaveMonthFilter,
  setLeaveMonthFilter,
  leaveYearFilter,
  setLeaveYearFilter,
}) {
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
  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Leave Approvals</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-medium mt-1">Review and act on employee leave requests</p>
      </div>

      {/* Filter tabs + search */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-5 flex flex-col xl:flex-row items-start xl:items-center gap-4 shadow-xl shadow-slate-200/40 dark:shadow-none w-full min-w-0">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full xl:w-auto min-w-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto w-full sm:w-auto flex-nowrap" style={{ scrollbarWidth: 'none' }}>
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setLeaveTabFilter(f)}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${leaveTabFilter === f ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                {f} ({leaveCounts[f] || 0})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="w-32 flex-1 sm:flex-none">
              <CustomSelect
                value={leaveYearFilter}
                onChange={(e) => setLeaveYearFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Years' },
                  ...availableYears.map(y => ({ value: String(y), label: String(y) }))
                ]}
              />
            </div>
            <div className="w-36 flex-1 sm:flex-none">
              <CustomSelect
                value={leaveMonthFilter}
                onChange={(e) => setLeaveMonthFilter(e.target.value)}
                options={months}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 relative w-full min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={leaveSearch}
            onChange={e => setLeaveSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 transition-all"
          />
        </div>
      </div>

      {/* Leave cards */}
      <div className="space-y-4">
        {filteredLeaves.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-12 text-center shadow-xl shadow-slate-200/40 dark:shadow-none w-full min-w-0">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-400">No leave requests found</p>
          </div>
        ) : filteredLeaves.map(leave => (
          <div key={leave.id} className="bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none hover:bg-white/90 dark:hover:bg-slate-900 transition-all relative overflow-hidden group w-full min-w-0">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-900/40 rounded-full blur-3xl group-hover:bg-indigo-400/50 transition-colors duration-700 ease-out pointer-events-none"></div>
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-fuchsia-300/30 dark:bg-fuchsia-900/30 rounded-full blur-3xl group-hover:bg-fuchsia-400/40 transition-colors duration-700 ease-out pointer-events-none"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-lg flex-shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-800">
                {leave.employeeName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{leave.employeeName}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 truncate">{leave.department} · Applied {leave.appliedOn}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm flex-shrink-0 ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 dark:border dark:border-red-800/60' :
                        leave.status === 'cancelled' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60'
                    }`}>
                    {leave.status === 'cancelled' && leave.cancelledBy ? `cancelled by ${leave.cancelledBy}` : leave.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border shadow-sm capitalize whitespace-nowrap ${typeColors[leave.type] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                    {leave.type === 'client-assigned' ? 'Client/Lead' : leave.type} Leave
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{leave.startDate}</span>
                    {leave.startDate !== leave.endDate && <><span className="text-slate-400 dark:text-slate-500">→</span><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{leave.endDate}</span></>}
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{leave.days} day{leave.days !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <p className="mt-4 text-slate-700 dark:text-slate-200 text-base font-medium leading-relaxed break-words">{leave.reason}</p>

                {leave.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-xl text-sm text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/60 break-words">
                    <strong>Rejection reason:</strong> {leave.rejectionReason}
                  </div>
                )}
                {leave.hrNote && (
                  <div className="mt-3 p-3 bg-slate-900/90 text-slate-100 dark:bg-slate-800/90 dark:text-slate-100 rounded-xl text-sm border border-slate-700/80 shadow-inner break-words">
                    <strong className="text-emerald-400">HR note:</strong> <span className="text-slate-200">{leave.hrNote}</span>
                  </div>
                )}
              </div>
            </div>

            {leave.status === 'pending' && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
                <button
                  onClick={() => { setSelectedLeave(leave); setLeaveAction('approve'); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />Approve
                </button>
                <button
                  onClick={() => { setSelectedLeave(leave); setLeaveAction('reject'); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />Reject
                </button>
              </div>
            )}
            {(leave.status === 'approved' || leave.status === 'rejected' || leave.status === 'cancelled') && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 relative z-10">
                <button
                  onClick={() => handleDeleteLeaveApproval(leave.id)}
                  className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />Delete History
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action modal */}
      {selectedLeave && leaveAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200 border border-white dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-1">
              {leaveAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {selectedLeave.employeeName} · {selectedLeave.type} leave · {selectedLeave.days} day{selectedLeave.days !== 1 ? 's' : ''}
            </p>

            {leaveAction === 'reject' ? (
              <div className="mb-4">
                <label className="block text-slate-600 text-sm mb-1.5">Rejection Reason <span className="text-red-400">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this leave is being rejected..."
                  rows={3}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-slate-50 resize-none"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-slate-600 text-sm mb-1.5">HR Note (optional)</label>
                <textarea
                  value={hrNote}
                  onChange={e => setHrNote(e.target.value)}
                  placeholder="Add a note for the employee..."
                  rows={2}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmLeaveAction}
                disabled={leaveAction === 'reject' && !rejectReason.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${leaveAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
              >
                Confirm {leaveAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => { setSelectedLeave(null); setRejectReason(''); setHrNote(''); setLeaveAction(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors border border-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
