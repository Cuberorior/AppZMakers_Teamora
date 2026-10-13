import { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CompanyDashboardView({
  company,
  myEmployees,
  todayRecs,
  weeklyData,
  presentCount,
  absentCount,
  pendingLeaves,
  onLeaveCount = 0,
  totalHours,
  shiftNotices = [],
  handleCreateShiftNotice,
  handleUpdateShiftNotice,
  handleDeleteShiftNotice,
}) {
  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Hero / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-xl shadow-indigo-500/20 group">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100">
              {company.name}
            </h1>
            <p className="text-indigo-100 font-medium text-lg flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-md border border-white/10">{company.industry}</span>
              <span className="opacity-70">•</span>
              <span className="opacity-90">{myEmployees.length} employees managed</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Employees', value: myEmployees.length, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800', sub: `${myEmployees.filter(e => e.status === 'active').length} active` },
          { label: 'Present Today', value: presentCount, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', sub: `${myEmployees.length > 0 ? Math.round((presentCount / myEmployees.length) * 100) : 0}% attendance` },
          { label: 'On Leave Today', value: onLeaveCount, icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800', sub: `${pendingLeaves} leaves pending` },
          { label: 'Absent Today', value: absentCount, icon: Clock, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-rose-200 dark:border-rose-800', sub: `${myEmployees.length > 0 ? Math.round((absentCount / myEmployees.length) * 100) : 0}% absent` },
          { label: 'Total Hours', value: `${totalHours.toFixed(0)}h`, icon: TrendingUp, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', border: 'border-sky-200 dark:border-sky-800', sub: 'This period' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-none relative overflow-hidden group">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${s.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out`}></div>
              <div className="relative z-10">
                <div className={`w-12 h-12 ${s.bg} border ${s.border} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div className="text-slate-800 dark:text-slate-100 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.75rem' }}>{s.value}</div>
                <div className="text-slate-700 dark:text-slate-300 text-sm font-bold">{s.label}</div>
                <div className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly attendance chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-6 flex items-center gap-2">
            Weekly Attendance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData || []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.5} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc', opacity: 0.1 }} contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: 13, fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="onLeave" name="On Leave" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee attendance status */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-6 flex items-center gap-2">
            Today's Status
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {myEmployees.map(emp => {
              const rec = todayRecs.find(r => r.employeeId === emp.id);
              const status = rec?.status || 'absent';
              const statusCls = {
                present: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400',
                late: 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400',
                absent: 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800/50 dark:text-rose-400',
                'half-day': 'text-sky-700 bg-sky-50 border-sky-100 dark:bg-sky-900/30 dark:border-sky-800/50 dark:text-sky-400',
              };
              return (
                <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-sm font-black overflow-hidden flex-shrink-0">
                      {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                      )}
                    </div>
                    <div>
                      <div className="text-slate-800 dark:text-slate-100 text-base font-bold">{emp.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{emp.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {rec?.checkIn && <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:block font-bold tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{rec.checkIn}</span>}
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusCls[status] || 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
        <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-6">Company Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { label: 'Company Name', value: company.name },
            { label: 'Industry', value: company.industry },
            { label: 'Contact Person', value: company.contact },
            { label: 'Email', value: company.email },
            { label: 'Phone', value: company.phone },
            { label: 'Member Since', value: new Date(company.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) },
          ].map(({ label, value }) => (
            <div key={label} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5">{label}</div>
              <div className="text-slate-800 dark:text-slate-100 font-bold text-base leading-tight">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
