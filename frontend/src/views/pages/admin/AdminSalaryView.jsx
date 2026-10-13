import { useState } from 'react';
import { DollarSign, CheckCircle2, Clock, AlertCircle, Download, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyTotals = [
  { month: 'Jan', gross: 41200, deductions: 4900, net: 36300 },
  { month: 'Feb', gross: 42000, deductions: 5000, net: 37000 },
  { month: 'Mar', gross: 41800, deductions: 5100, net: 36700 },
  { month: 'Apr', gross: 43200, deductions: 5200, net: 38000 },
  { month: 'May', gross: 43800, deductions: 5500, net: 38300 },
];

export function AdminSalaryView({
  salaries,
  handleProcessSalary,
}) {
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const monthRecords = salaries.filter(r => r.month === selectedMonth);
  const totalGross = monthRecords.reduce((s, r) => s + r.basicSalary + r.overtime, 0);
  const totalDeductions = monthRecords.reduce((s, r) => s + r.deductions, 0);
  const totalNet = monthRecords.reduce((s, r) => s + r.netSalary, 0);

  const statusStyles = {
    paid: { cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
    pending: { cls: 'bg-amber-50 text-amber-600', icon: Clock },
    processing: { cls: 'bg-sky-50 text-sky-600', icon: AlertCircle },
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>Payroll & Salary</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage employee payroll and salary structures</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none bg-white"
          >
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>
          <button type="button" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-500/25 cursor-pointer">
            <Download className="w-5 h-5" />Export
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Payroll', value: `$${totalNet.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, sub: 'Net payout', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Gross Salaries', value: `$${totalGross.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, sub: 'Before deductions', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Deductions', value: `$${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, sub: 'This month', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Pending Payment', value: monthRecords.filter(r => r.status !== 'paid').length, sub: `${monthRecords.filter(r => r.status === 'paid').length} paid`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-shadow relative overflow-hidden group">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-slate-800 mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.25rem' }}>{s.value}</div>
              <div className="text-slate-800 text-sm font-medium">{s.label}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Payroll trend chart */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative z-10">
        <h3 className="text-slate-800 dark:text-slate-100 font-bold mb-6 text-base">Monthly Payroll Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyTotals} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
            <Bar dataKey="gross" name="Gross" fill="#e0e7ff" radius={[3,3,0,0]} />
            <Bar dataKey="net" name="Net" fill="#4338ca" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Salary records table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-slate-800 dark:text-slate-100 font-bold text-base">Salary Records — {selectedMonth === '2026-05' ? 'May 2026' : 'April 2026'}</h3>
          <span className="text-slate-400 text-sm">{monthRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Employee', 'Basic Salary', 'Overtime', 'Deductions', 'Net Salary', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-slate-400 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthRecords.map(rec => {
                const st = statusStyles[rec.status] || { cls: 'bg-slate-100 text-slate-700', icon: Clock };
                const StatusIcon = st.icon;
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                          {rec.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-slate-700 font-medium whitespace-nowrap">{rec.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>${rec.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 pr-4 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {rec.overtime > 0 ? <span className="text-emerald-600">+${rec.overtime.toFixed(2)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-red-500 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>-${rec.deductions.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-800 font-semibold whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>${rec.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 pr-4">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                        <StatusIcon className="w-3 h-3" />{rec.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {rec.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleProcessSalary(rec.id)}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {monthRecords.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No salary records for this month</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals row */}
        {monthRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-8">
            <div className="text-right">
              <div className="text-slate-400 text-xs">Total Net Payroll</div>
              <div className="text-slate-800 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem' }}>${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
