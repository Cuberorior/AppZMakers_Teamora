import { useState } from 'react';
import { Users, CheckCircle2, XCircle, Clock, AlertTriangle, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatDecimalHours, formatBreakMinutes } from '../../../utils/timeFormatter';

const deptColors = {
  Engineering: '#6366f1',
  Design: '#0ea5e9',
  Product: '#10b981',
  Operations: '#f59e0b',
  Analytics: '#8b5cf6',
  IT: '#ec4899',
  QA: '#f43f5e',
  HR: '#14b8a6',
  Finance: '#22c55e',
  Admin: '#64748b',
  Marketing: '#a855f7',
  Sales: '#e11d48',
  Support: '#06b6d4',
};

const fallbackColors = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#f43f5e', '#14b8a6', '#22c55e', '#a855f7',
  '#06b6d4', '#e11d48', '#3b82f6', '#f97316', '#84cc16'
];

export function HRDashboardView({
  employeesList,
  todayAttendance,
  weeklyAttendanceData,
  deptData,
  todayLabel,
  leaveCounts,
  leavesList,
  selectedDate,
  setSelectedDate,
  shiftNotices = [],
  onLeaveToday = 0,
}) {
  const present = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absent = todayAttendance.filter((a) => a.status === 'absent').length;
  const pendingLeaves = leavesList.filter((l) => l.status === 'pending');

  const pieData = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Absent', value: absent, color: '#ef4444' },
    { name: 'On Leave', value: onLeaveToday, color: '#3b82f6' },
  ];

  // Compute department distribution from active employees
  const activeEmployees = employeesList.filter((e) => e.status === 'active');
  const deptCounts = {};
  activeEmployees.forEach((emp) => {
    if (emp.department) {
      const deptName = emp.department.trim();
      if (deptName) {
        const upper = deptName.toUpperCase();
        let normalized = deptName.charAt(0).toUpperCase() + deptName.slice(1);
        if (upper === 'IT') normalized = 'IT';
        if (upper === 'QA') normalized = 'QA';
        if (upper === 'HR') normalized = 'HR';

        deptCounts[normalized] = (deptCounts[normalized] || 0) + 1;
      }
    }
  });

  const departmentData = Object.keys(deptCounts).map((dept, idx) => ({
    name: dept,
    value: deptCounts[dept],
    color: deptColors[dept] || fallbackColors[idx % fallbackColors.length],
  }));

  // Separate and sort shift notices so urgent ones (informHR) appear first
  const sortedShiftNotices = [...shiftNotices].sort((a, b) => {
    if (a.informHR && !b.informHR) return -1;
    if (!a.informHR && b.informHR) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-xl shadow-indigo-500/20 group">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100">HR Dashboard</h1>
          <p className="text-indigo-100 font-medium text-lg">Workforce overview for today, {todayLabel || 'today'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Employees', value: employeesList.filter((e) => e.status === 'active').length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: `${employeesList.length} total incl. inactive` },
          { label: 'Present Today', value: present, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${employeesList.length > 0 ? Math.round((present / employeesList.length) * 100) : 0}% of workforce` },
          { label: 'On Leave Today', value: onLeaveToday, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Approved leaves today' },
          { label: 'Absent Today', value: absent, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', sub: 'Total absentees' },
          { label: 'Pending Approvals', value: leaveCounts.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Leave requests pending' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-none relative overflow-hidden group">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${s.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out`}></div>
              <div className="relative z-10">
                <div className={`w-12 h-12 ${s.bg} border border-white/50 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-4">Weekly Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyAttendanceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="onLeave" name="On Leave" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-4">Today's Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-slate-500">{p.name}</span>
                </div>
                <span className="text-slate-700 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-4">Attendance by Department</h3>
          <div className="space-y-4">
            {deptData.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600 text-sm">{d.name}</span>
                  <span className="text-slate-400 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{d.present}/{d.total}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.total > 0 ? (d.present / d.total) * 100 : 0}%`, background: deptColors[d.name] || '#4338ca' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 lg:p-8 flex flex-col items-center justify-between">
          <h3 className="text-slate-800 dark:text-slate-100 text-lg font-black tracking-tight mb-2 self-start">Department Distribution</h3>
          {departmentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-2 mt-4 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                {departmentData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm my-auto">No department distribution details available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
