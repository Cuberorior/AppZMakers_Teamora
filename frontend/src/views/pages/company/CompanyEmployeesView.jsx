import { useState } from 'react';
import { Search, Users, Mail, Phone, Calendar, Briefcase, Building2, MapPin, X } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';

export function CompanyEmployeesView({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filteredEmployees,
}) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Hired Employees</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Directory roster of staff assigned to your company projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 p-6 flex flex-col sm:flex-row gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-white/60 dark:border-slate-700/60 rounded-2xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md placeholder:text-slate-400 transition-all font-medium relative z-10"
          />
        </div>
        <div className="w-full sm:w-48 relative z-10">
          <CustomSelect
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
      </div>

      <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>
        <div className="p-6 border-b border-white/40 dark:border-slate-700/40 bg-white/20 dark:bg-slate-800/20 relative z-10">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{filteredEmployees.length} staff found</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 relative z-10">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl border border-white/60 dark:border-slate-600/50 p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-xl flex-shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                    {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                      <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-slate-800 dark:text-slate-100 text-base truncate tracking-tight">{emp.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${emp.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{emp.status}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{emp.position} · {emp.department}</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-600/50 space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span>{emp.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span>Hired since {emp.joinDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20 text-slate-500" />
              <p className="text-sm font-bold uppercase tracking-widest">No employees match this selection criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-3xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-3xl overflow-hidden shadow-lg flex-shrink-0">
                  {selectedEmployee.avatar && selectedEmployee.avatar.startsWith('data:image/') ? (
                    <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedEmployee.avatar || selectedEmployee.name?.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{selectedEmployee.name}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold">
                      {selectedEmployee.position}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium">
                      {selectedEmployee.department}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider ${selectedEmployee.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Email</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-100 font-medium truncate">{selectedEmployee.email}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Phone</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-100 font-medium">{selectedEmployee.phone || 'Not provided'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Join Date</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-100 font-medium">{selectedEmployee.joinDate || 'N/A'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Shift</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-100 font-medium capitalize">{selectedEmployee.shift || 'morning'} Shift</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 sm:col-span-2">
                  <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Location / Country</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-100 font-medium">{selectedEmployee.country || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

