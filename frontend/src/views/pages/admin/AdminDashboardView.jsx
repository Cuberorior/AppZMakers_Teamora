import { useState } from 'react';
import { Users, Building2, ShieldCheck, Clock, AlertTriangle, CheckCircle2, XCircle, ClipboardList, TrendingUp, Activity, FileText } from 'lucide-react';
import { formatDecimalHours, formatBreakMinutes } from '../../../utils/timeFormatter';

export function AdminDashboardView({
  employees,
  hrUsers,
  companies,
  dashboardStats,
  pendingLeaves,
  leaveCounts,
  todayAttendance = [],
}) {
  const activeCount =
    (dashboardStats.activeEmployees ?? employees.filter((e) => e.status === 'active').length) +
    hrUsers.filter((h) => h.status === 'active').length;

  const pending = pendingLeaves || [];

  return (
    <div className="space-y-8 relative" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      
      {/* Spectacular Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-10 shadow-2xl shadow-indigo-900/30">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-10 -right-20 w-80 h-80 bg-fuchsia-500/30 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s' }}></div>
          <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-white flex items-center gap-3 tracking-tight" style={{ fontWeight: 900, fontSize: '2.5rem' }}>
              Super Admin Control
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs tracking-widest uppercase font-black text-indigo-200 backdrop-blur-md">Live</span>
            </h1>
            <p className="text-indigo-200 text-lg mt-2 font-medium max-w-lg">
              Welcome to your command center. Monitor real-time aggregates and manage global platform operations instantly.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-inner">
            <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-white font-black text-xl leading-none">System Healthy</div>
              <div className="text-emerald-300/80 text-xs font-bold uppercase tracking-widest mt-1">All services operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Registered Companies', value: dashboardStats.totalCompanies ?? companies.length, icon: Building2, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', gradient: 'from-fuchsia-500 to-pink-600', sub: `${dashboardStats.activeCompanies ?? companies.filter((c) => c.status === 'active').length} active clients` },
          { label: 'Active Accounts', value: activeCount, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-400 to-teal-500', sub: 'Employees + HR active' },
          { label: 'HR Managers', value: dashboardStats.totalHR ?? hrUsers.length, icon: ShieldCheck, color: 'text-sky-500', bg: 'bg-sky-50', gradient: 'from-sky-400 to-blue-600', sub: `${dashboardStats.activeHR ?? hrUsers.filter((h) => h.status === 'active').length} active` },
          { label: 'Pending Approvals', value: leaveCounts?.pending ?? pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', gradient: 'from-amber-400 to-orange-500', sub: 'Awaiting review' },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-700/60 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-default">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`}></div>
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shadow-lg shadow-${s.color.split('-')[1]}-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                  <TrendingUp className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Live</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="text-slate-800 dark:text-slate-100 text-5xl tracking-tight mb-2" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900 }}>
                  {s.value}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-bold text-lg leading-tight mb-1">{s.label}</div>
                <div className="text-slate-400 dark:text-slate-500 text-sm font-medium">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Platform Overview Grid */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 dark:border-slate-700/50 p-8 lg:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 text-2xl" style={{ fontWeight: 900 }}>Deep Platform Overview</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">A detailed breakdown of all system entities and logs.</p>
          </div>
          <div className="hidden sm:flex p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <ClipboardList className="w-6 h-6 text-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {[
            { label: 'Total Employees Registered', value: dashboardStats.totalEmployees ?? employees.length, color: 'indigo' },
            { label: 'Currently Active Employees', value: dashboardStats.activeEmployees ?? employees.filter((e) => e.status === 'active').length, color: 'emerald' },
            { label: 'Total Hiring Companies', value: dashboardStats.totalCompanies ?? companies.length, color: 'fuchsia' },
          ].map((item, i) => (
            <div key={item.label} className="group bg-white dark:bg-slate-800/80 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-2 h-2 rounded-full bg-${item.color}-500 shadow-[0_0_10px_rgba(0,0,0,0)] group-hover:shadow-${item.color}-500/50 transition-all duration-300`}></div>
                <FileText className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <div className={`text-${item.color}-600 dark:text-${item.color}-400 text-4xl mb-2`} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900 }}>
                  {item.value}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-tight">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
