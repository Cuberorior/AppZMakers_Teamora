import React, { useState } from 'react';
import { Search, Users, Mail, Phone, Calendar, Plus, FileText, Download, X, MapPin, ChevronDown } from 'lucide-react';
import { CustomSelect } from '../../components/CustomSelect';

export function HREmployeesView({
  search,
  setSearch,
  deptFilter,
  setDeptFilter,
  statusFilter,
  setStatusFilter,
  shiftFilter,
  setShiftFilter,
  selectedEmployeeId,
  setSelectedEmployeeId,
  departments,
  globalDepartments = [],
  filteredEmployees,
  selectedEmployee,
  selectedAttendance,
  selectedBalance,
  getEmployeeStats,
  clients = [],
  handleAssignClient,
  handleAssignTeam,
  handleUpdateEmployeeStatus,
  showModal,
  setShowModal,
  empForm,
  setEmpForm,
  handleAddEmployee,
  handleAdjustAttendance,
  handleCreateManualAttendance,
  handleAssignShift,
  isSubmitting,
}) {
  const [adjustingRec, setAdjustingRec] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'present',
    reason: '',
    breakMinutes: '',
    tasks: ['', '', '', ''],
    visibleTaskCount: 1,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'present',
    reason: '',
    breakMinutes: '',
    tasks: ['', '', '', ''],
    visibleTaskCount: 1,
  });

  const FormatMultilineName = ({ name }) => {
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    return (
      <div className="flex flex-col">
        {parts.map((p, i) => (
          <span key={i} className="leading-tight capitalize">{p}</span>
        ))}
      </div>
    );
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(getTodayDateString());
  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: '1.375rem' }}>Employees</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">View and manage all employee records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 font-medium"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-[150px]">
            <CustomSelect
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              options={departments.map(d => ({ value: d, label: d === 'All' ? 'All Departments' : d }))}
            />
          </div>
          <div className="w-full sm:w-[130px]">
            <CustomSelect
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>
          <div className="w-full sm:w-[130px]">
            <CustomSelect
              value={shiftFilter}
              onChange={e => setShiftFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Shifts' },
                { value: 'morning', label: 'Morning Shift' },
                { value: 'night', label: 'Night Shift' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${selectedEmployee ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Employee list */}
        <div className={selectedEmployee ? 'lg:col-span-2' : ''}>
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/80 dark:border-slate-700 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none relative group">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-300/20 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-400/30 transition-colors duration-700"></div>
            <div className="p-5 border-b border-white/50 dark:border-slate-800 relative z-10">
              <span className="text-slate-500 dark:text-slate-400 text-base font-medium">{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found</span>
            </div>
            <div className="divide-y divide-border overflow-y-auto max-h-[600px] custom-scrollbar">
              {filteredEmployees.map(emp => {
                const stats = getEmployeeStats(emp.id);
                const isSelected = selectedEmployeeId === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(isSelected ? null : emp.id)}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all relative z-10 ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black overflow-hidden flex-shrink-0 shadow-sm border ${emp.status === 'active' ? 'bg-white/80 text-indigo-600 border-indigo-100 backdrop-blur-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-800 dark:text-slate-100 font-bold text-lg whitespace-nowrap"><FormatMultilineName name={emp.name} /></div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-slate-100 text-slate-500 border border-slate-200/50'}`}>{emp.status}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{emp.position} · {emp.department}</div>
                    </div>
                  </div>
                );
              })}
              {filteredEmployees.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No employees found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee detail panel */}
        {selectedEmployee && (() => {
          const stats = getEmployeeStats(selectedEmployee.id);
          const filteredAttendance = selectedAttendance.filter(rec => {
            if (!attendanceDateFilter) return true;
            return rec.date === attendanceDateFilter;
          });
          const recentRecs = filteredAttendance.slice(0, 5);
          return (
            <div className="space-y-6">
              {/* Profile card */}
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/80 dark:border-slate-700 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-300/40 dark:bg-indigo-900/40 rounded-full blur-3xl group-hover:bg-indigo-400/50 transition-colors duration-700 ease-out pointer-events-none"></div>
                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-fuchsia-300/30 dark:bg-fuchsia-900/30 rounded-full blur-3xl group-hover:bg-fuchsia-400/40 transition-colors duration-700 ease-out pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl overflow-hidden shadow-sm">
                      {selectedEmployee.avatar && selectedEmployee.avatar.startsWith('data:image/') ? (
                        <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedEmployee.avatar
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-xl text-slate-800"><FormatMultilineName name={selectedEmployee.name} /></div>
                      <div className="text-slate-500 text-sm mt-1">{selectedEmployee.position}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEmployeeId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      { icon: Mail, value: selectedEmployee.email },
                      { icon: Phone, value: selectedEmployee.phone || 'N/A' },
                      { icon: Calendar, value: `Joined: ${selectedEmployee.joinDate || 'N/A'}` },
                      { icon: Calendar, value: `DOB: ${selectedEmployee.dateOfBirth || 'N/A'}` },
                      { icon: MapPin, value: `Location: ${selectedEmployee.country || 'N/A'}` },
                      { icon: MapPin, value: `Address: ${selectedEmployee.address || 'N/A'}` },
                    ].map(({ icon: Icon, value }) => (
                      <div key={value} className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate text-xs">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400 font-semibold mb-2">Account Status</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateEmployeeStatus(selectedEmployee.id, 'active')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${selectedEmployee.status === 'active'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-[#5b4cf5]'
                          }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateEmployeeStatus(selectedEmployee.id, 'inactive')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${selectedEmployee.status === 'inactive'
                          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm shadow-red-500/10'
                          : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200 hover:text-red-500'
                          }`}
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>

                  {/* CV section */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400 font-medium mb-2">CV / Resume</div>
                    {selectedEmployee.cvName && selectedEmployee.cvData ? (
                      <div className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const base64Parts = selectedEmployee.cvData.split(',');
                              const byteString = atob(base64Parts[1]);
                              const mimeString = base64Parts[0].split(':')[1].split(';')[0];
                              const ab = new ArrayBuffer(byteString.length);
                              const ia = new Uint8Array(ab);
                              for (let i = 0; i < byteString.length; i++) {
                                ia[i] = byteString.charCodeAt(i);
                              }
                              const blob = new Blob([ab], { type: mimeString });
                              const blobUrl = URL.createObjectURL(blob);
                              window.open(blobUrl, '_blank');
                            } catch (e) {
                              const newWindow = window.open();
                              newWindow.document.write(`<iframe src="${selectedEmployee.cvData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-slate-700 font-semibold text-xs truncate group-hover:text-indigo-600 transition-colors" title={selectedEmployee.cvName}>
                              {selectedEmployee.cvName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">Click to view</div>
                          </div>
                        </button>
                        <a
                          href={selectedEmployee.cvData}
                          download={selectedEmployee.cvName}
                          title="Download CV"
                          className="w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors shadow-sm cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                        <FileText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span>No CV uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Assignment Card */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                  <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">💼</span> Client & Team Assignment
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                    
                    {/* Client Assignment */}
                    <div className="mb-4">
                      <div className="text-xs text-slate-400 font-medium">Current Client</div>
                      <div className="text-slate-800 font-semibold text-sm mt-1 mb-2">{selectedEmployee.company || 'General (Our Company)'}</div>
                      
                      <div className="pt-2 border-t border-slate-200/50">
                        <label className="block text-slate-505 text-[10px] font-semibold mb-1">Assign to Client</label>
                        <select
                          value={selectedEmployee.companyId || 'unassigned'}
                          onChange={(e) => handleAssignClient(selectedEmployee.id, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none bg-white font-medium cursor-pointer"
                        >
                          <option value="unassigned">General (Our Company)</option>
                          {clients.filter(c => !c.isTeam).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Team/Lead Assignment */}
                    <div className="pt-3 border-t border-slate-200/50">
                      <div className="text-xs text-slate-400 font-medium">Current Team / Lead</div>
                      <div className="text-slate-800 font-semibold text-sm mt-1 mb-2">{selectedEmployee.team || 'None'}</div>
                      
                      <div className="pt-2 border-t border-slate-200/50">
                        {clients.some(c => c.isTeam && (c.contact || '').toLowerCase() === selectedEmployee.name.toLowerCase()) ? (
                          <div className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200/50">
                            This employee is already a Team Lead and cannot be assigned to another team.
                          </div>
                        ) : (
                          <>
                            <label className="block text-slate-505 text-[10px] font-semibold mb-1">Assign to Team Lead</label>
                            <select
                              value={selectedEmployee.teamId || 'unassigned'}
                              onChange={(e) => handleAssignTeam(selectedEmployee.id, e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none bg-white font-medium cursor-pointer"
                            >
                              <option value="unassigned">None</option>
                              {clients.filter(c => c.isTeam).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Shift Assignment Card */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm flex items-center gap-2">
                  🌙 Shift Assignment
                </h4>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Current Shift</div>
                    <div className="text-slate-800 font-semibold text-sm mt-1 capitalize">{selectedEmployee.shift || 'morning'} Shift</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50">
                    <label className="block text-slate-505 text-[10px] font-semibold mb-1">Assign to Shift</label>
                    <select
                      value={selectedEmployee.shift || 'morning'}
                      onChange={(e) => handleAssignShift(selectedEmployee.id, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none bg-white font-medium cursor-pointer"
                    >
                      <option value="morning">Morning Shift</option>
                      <option value="night">Night Shift</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm">Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Hours', value: `${stats.hours.toFixed(1)}h`, color: 'text-indigo-600' },
                    { label: 'Extra Hours', value: stats.extraHours ? `+${stats.extraHours.toFixed(1)}h` : '—', color: 'text-emerald-600' },
                    { label: 'Less Hours', value: stats.lessHours ? `${stats.lessHours.toFixed(1)}h` : '—', color: 'text-red-500' },
                    { label: 'Present', value: `${stats.present}`, color: 'text-sky-600' },
                    { label: 'Half Day', value: `${stats.halfDay || 0}`, color: 'text-orange-500' },
                    { label: 'Absent', value: `${stats.absent || 0}`, color: 'text-red-500' },
                  ].map((s, idx) => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                      <div className={`${s.color} font-semibold`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem' }}>{s.value}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave balance */}
              {selectedBalance && (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                  <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-500" />Leave Balance</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Annual', data: selectedBalance.annual, color: 'bg-indigo-400' },
                      { label: 'Casual', data: selectedBalance.casual, color: 'bg-sky-400' },
                      { label: 'Medical', data: selectedBalance.medical, color: 'bg-rose-400' },
                    ].map(({ label, data, color }) => {
                      if (!data) return null;
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{label}</span>
                            <span className="text-slate-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{data.total - data.used}/{data.total}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${((data.total - data.used) / data.total) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent attendance */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm">Recent Attendance</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetDate = attendanceDateFilter || getTodayDateString();
                        setCreateForm({
                          date: targetDate,
                          checkIn: '',
                          checkOut: '',
                          status: 'present',
                          reason: '',
                          breakMinutes: '',
                          tasks: ['', '', '', ''],
                          visibleTaskCount: 1,
                        });
                        setShowCreateModal(true);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold cursor-pointer border border-indigo-100/50 transition-colors"
                    >
                      + Add Missed Log
                    </button>
                    <input
                      type="date"
                      value={attendanceDateFilter}
                      onChange={(e) => setAttendanceDateFilter(e.target.value)}
                      max={getTodayDateString()}
                      className="border border-border rounded-xl px-2.5 py-1 text-xs text-slate-600 focus:outline-none bg-slate-50 font-medium cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {recentRecs.map(rec => {
                    const s = { present: 'text-emerald-600 bg-emerald-50', late: 'text-amber-600 bg-amber-50', absent: 'text-red-500 bg-red-50', 'half-day': 'text-sky-600 bg-sky-50' };
                    return (
                      <div key={rec.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100/70">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-semibold">{new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${s[rec.status] || (rec.status.startsWith('on leave') ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700')}`}>
                            {rec.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-slate-200/50 pt-2">
                          <span className="text-slate-400 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {rec.checkIn || '—'} to {rec.checkOut ? `${rec.checkOutDate && rec.checkOutDate !== rec.date ? `(${rec.checkOutDate}) ` : ''}${rec.checkOut}` : '—'}
                          </span>
                          <span className="text-slate-500 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {rec.totalHours ? `${rec.totalHours.toFixed(1)}h` : '0h'}
                          </span>
                        </div>
                        {rec.adjusted && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100/50 rounded-lg px-2 py-1.5 w-full space-y-0.5">
                            <div className="font-semibold">✏️ Adjusted by {rec.adjustedBy || 'HR'}</div>
                            <div className="text-amber-800">Reason: {rec.adjustedReason || 'Manual entry'}</div>
                          </div>
                        )}

                        {rec.tasks && rec.tasks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-250/30 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              📋 Logged Tasks ({rec.tasks.length})
                            </div>
                            <div className="space-y-1 pl-0.5">
                              {rec.tasks.map((task, tidx) => (
                                <div key={task._id || tidx} className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700 shadow-sm">
                                  <div className="font-semibold text-slate-700 dark:text-slate-200">{task.description}</div>
                                  {task.timeContext && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Context: {task.timeContext}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-end gap-2 mt-1 pt-1.5 border-t border-slate-200/50">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingRec(rec);
                              setAdjustForm({
                                checkIn: rec.checkIn || '09:00:00',
                                checkOut: rec.checkOut || new Date().toTimeString().slice(0, 8),
                                status: rec.status || 'present',
                                reason: '',
                                breakMinutes: rec.breakMinutes || 0,
                                tasks: (rec.tasks && rec.tasks.length > 0)
                                  ? [
                                      rec.tasks[0]?.description || '',
                                      rec.tasks[1]?.description || '',
                                      rec.tasks[2]?.description || '',
                                      rec.tasks[3]?.description || ''
                                    ]
                                  : ['', '', '', ''],
                                visibleTaskCount: Math.max(1, (rec.tasks || []).length),
                              });
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold transition-colors cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg"
                          >
                            {!rec.checkOut ? '⚠️ Force Clock Out' : 'Adjust'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {recentRecs.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-150">
                      No attendance record found for this date.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add Employee Modal - Liquid Glass */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />

            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">Add New Employee</h3>
                  <p className="text-white/70 font-bold text-sm mt-0.5">Enter employee details to onboard them</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-8 space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
                  { key: 'email', label: 'Email', placeholder: 'jane@company.com' },
                  { key: 'position', label: 'Position', placeholder: 'Software Engineer' },
                  { key: 'department', label: 'Department', placeholder: 'Engineering' },
                  { key: 'joinDate', label: 'Join Date', placeholder: '' },
                  { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'email' || f.key === 'name' ? 'col-span-2' : ''}>
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">{f.label}</label>
                    {f.key === 'department' ? (
                      <select
                        required
                        value={empForm[f.key] || ''}
                        onChange={e => setEmpForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10 appearance-none [&>option]:bg-slate-800"
                      >
                        <option value="" disabled>Select Department...</option>
                        {globalDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.key === 'joinDate' || f.key === 'dateOfBirth' ? 'date' : f.key === 'email' ? 'email' : 'text'}
                        value={empForm[f.key] || ''}
                        onChange={e => setEmpForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        required={f.key !== 'dateOfBirth'}
                        max={f.key === 'joinDate' || f.key === 'dateOfBirth' ? new Date().toISOString().split('T')[0] : undefined}
                        minLength={f.key !== 'joinDate' && f.key !== 'dateOfBirth' && f.key !== 'email' ? 2 : undefined}
                        maxLength={['name', 'position', 'department'].includes(f.key) ? 30 : undefined}
                        pattern={
                          f.key === 'name'
                            ? "^[a-zA-Z\\s.\\-]+$"
                            : f.key === 'position' || f.key === 'department'
                              ? "^[a-zA-Z\\s.\\-()&]+$"
                              : f.key === 'email'
                                ? "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
                                : undefined
                        }
                        title={
                          f.key === 'name'
                            ? "Only letters, spaces, dots, and hyphens are allowed."
                            : f.key === 'position' || f.key === 'department'
                              ? "Only letters, spaces, dots, hyphens, brackets, and ampersands are allowed."
                              : f.key === 'email'
                                ? "Please enter a valid email address."
                                : undefined
                        }
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                        style={f.key === 'joinDate' || f.key === 'dateOfBirth' ? { colorScheme: 'dark' } : {}}
                      />
                    )}
                  </div>
                ))}

                <div className="col-span-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">Address</label>
                  <input
                    type="text"
                    value={empForm.address || ''}
                    onChange={e => setEmpForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main St, Colombo"
                    required
                    minLength={5}
                    maxLength={50}
                    pattern="^(?!\s*$).+"
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">Working Location (Country)</label>
                  <select
                    required
                    value={empForm.country || ''}
                    onChange={e => setEmpForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10 appearance-none [&>option]:bg-slate-800"
                  >
                    <option value="" disabled>Choose Location...</option>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] text-sm font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-[14px] text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_0_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'SUBMITTING...' : 'ADD EMPLOYEE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Adjustment Modal */}
      {adjustingRec && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in duration-200 border border-transparent dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg mb-1">Adjust Attendance</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Manually modify the attendance details for <strong className="text-slate-600 dark:text-slate-300 font-semibold">{selectedEmployee.name}</strong> on <strong className="text-slate-600 dark:text-slate-300 font-semibold">{adjustingRec.date}</strong>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!adjustForm.reason.trim()) {
                  alert('Please enter a reason for this adjustment.');
                  return;
                }

                const now = new Date();
                const checkInDate = new Date(`${adjustingRec.date}T${adjustForm.checkIn}`);

                if (checkInDate > now) {
                  alert('Check In time cannot be in the future.');
                  return;
                }

                if (adjustForm.checkOut) {
                  const checkOutDateObj = new Date(`${adjustingRec.date}T${adjustForm.checkOut}`);
                  if (adjustForm.checkOut < adjustForm.checkIn) {
                    checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
                  }
                  if (checkOutDateObj > now) {
                    alert('Check Out time cannot be in the future.');
                    return;
                  }
                }

                const payload = {
                  ...adjustForm,
                  tasks: adjustForm.tasks.filter(t => t.trim()).map(t => ({ description: t, timeContext: '' }))
                };

                const res = await handleAdjustAttendance(adjustingRec.id, payload);
                if (res && res.success) {
                  setAdjustingRec(null);
                } else {
                  alert(res?.error || 'Failed to adjust attendance');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Check In Time <span className="text-slate-400 font-normal">(24-hour format)</span></label>
                <input
                  type="text"
                  placeholder="HH:MM:SS"
                  pattern="^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$"
                  title="24-hour format: HH:MM:SS"
                  value={adjustForm.checkIn}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, checkIn: e.target.value }))}
                  required
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 font-mono"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Check Out Time <span className="text-slate-400 font-normal">(24-hour format)</span></label>
                <input
                  type="text"
                  placeholder="HH:MM:SS"
                  pattern="^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$"
                  title="24-hour format: HH:MM:SS"
                  value={adjustForm.checkOut}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, checkOut: e.target.value }))}
                  required
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 font-mono"
                />
              </div>



              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Attendance Status</label>
                <select
                  value={adjustForm.status}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 focus:outline-none bg-slate-50 dark:bg-slate-800/50"
                >
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Today's Work Log (Tasks) <span className="text-slate-400 font-normal">(Max 4)</span></label>
                <div className="space-y-2">
                  {[...Array(adjustForm.visibleTaskCount || 1)].map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Task ${index + 1} (optional)`}
                      value={adjustForm.tasks[index] || ''}
                      onChange={(e) => {
                        const newTasks = [...adjustForm.tasks];
                        newTasks[index] = e.target.value;
                        setAdjustForm(p => ({ ...p, tasks: newTasks }));
                      }}
                      className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50"
                    />
                  ))}
                  {(adjustForm.visibleTaskCount || 1) < 4 && (
                    <button
                      type="button"
                      onClick={() => setAdjustForm(p => ({ ...p, visibleTaskCount: (p.visibleTaskCount || 1) + 1 }))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Reason for Adjustment</label>
                <textarea
                  placeholder="e.g. Power outage, forgot to clock out, etc."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                  required
                  rows={2}
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Apply Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingRec(null)}
                  className="flex-1 border border-border dark:border-slate-700 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manual Attendance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in duration-200 border border-transparent dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg mb-1">Add Missed Attendance</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Manually create a new attendance record for <strong className="text-slate-600 dark:text-slate-300 font-semibold">{selectedEmployee.name}</strong>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!createForm.reason.trim()) {
                  alert('Please enter a reason for this manual entry.');
                  return;
                }

                const now = new Date();
                const checkInDate = new Date(`${createForm.date}T${createForm.checkIn}`);

                if (checkInDate > now) {
                  alert('Check In time cannot be in the future.');
                  return;
                }

                if (createForm.checkOut) {
                  const checkOutDateObj = new Date(`${createForm.date}T${createForm.checkOut}`);
                  if (createForm.checkOut < createForm.checkIn) {
                    checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
                  }
                  if (checkOutDateObj > now) {
                    alert('Check Out time cannot be in the future.');
                    return;
                  }
                }

                const payload = {
                  ...createForm,
                  tasks: createForm.tasks.filter(t => t.trim()).map(t => ({ description: t, timeContext: '' }))
                };

                const res = await handleCreateManualAttendance(selectedEmployee.id, payload);
                if (res && res.success) {
                  setShowCreateModal(false);
                } else {
                  alert(res?.error || 'Failed to create attendance log');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Date</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setCreateForm({
                      date: newDate,
                      checkIn: '',
                      checkOut: '',
                      status: 'present',
                      reason: '',
                      breakMinutes: '',
                      tasks: ['', '', '', ''],
                      visibleTaskCount: 1,
                    });
                  }}
                  required
                  max={getTodayDateString()}
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Check In Time <span className="text-slate-400 font-normal">(24-hour format)</span></label>
                <input
                  type="text"
                  placeholder="HH:MM:SS"
                  pattern="^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$"
                  title="24-hour format: HH:MM:SS"
                  value={createForm.checkIn}
                  onChange={(e) => setCreateForm((p) => ({ ...p, checkIn: e.target.value }))}
                  required
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 font-mono"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Check Out Time <span className="text-slate-400 font-normal">(24-hour format)</span></label>
                <input
                  type="text"
                  placeholder="HH:MM:SS"
                  pattern="^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$"
                  title="24-hour format: HH:MM:SS"
                  value={createForm.checkOut}
                  onChange={(e) => setCreateForm((p) => ({ ...p, checkOut: e.target.value }))}
                  required
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 font-mono"
                  style={{ colorScheme: 'dark' }}
                />
              </div>



              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Attendance Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 focus:outline-none bg-slate-50 dark:bg-slate-800/50"
                >
                  <option value="present">Present</option>
                  <option value="half-day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Today's Work Log (Tasks) <span className="text-slate-400 font-normal">(Max 4)</span></label>
                <div className="space-y-2">
                  {[...Array(createForm.visibleTaskCount || 1)].map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Task ${index + 1} (optional)`}
                      value={createForm.tasks[index] || ''}
                      onChange={(e) => {
                        const newTasks = [...createForm.tasks];
                        newTasks[index] = e.target.value;
                        setCreateForm(p => ({ ...p, tasks: newTasks }));
                      }}
                      className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50"
                    />
                  ))}
                  {(createForm.visibleTaskCount || 1) < 4 && (
                    <button
                      type="button"
                      onClick={() => setCreateForm(p => ({ ...p, visibleTaskCount: (p.visibleTaskCount || 1) + 1 }))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-semibold mb-1.5">Reason for Creation</label>
                <textarea
                  placeholder="e.g. Employee forgot to clock in"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm((p) => ({ ...p, reason: e.target.value }))}
                  required
                  rows={2}
                  className="w-full border border-border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Create Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-border dark:border-slate-700 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
