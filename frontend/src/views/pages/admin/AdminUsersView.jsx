import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Users, Building2, ShieldCheck, UserPlus, Mail, Phone, Calendar, FileText, Download, User, X, MapPin, ChevronDown } from 'lucide-react';

export const AdminUsersView = React.memo(function AdminUsersView({
  employees,
  hrUsers,
  companies,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  shiftFilter,
  setShiftFilter,
  showModal,
  setShowModal,
  empForm,
  setEmpForm,
  filteredEmployees,
  filteredHR,
  filteredCompanies,
  handleDeleteEmployee,
  handleDeleteHR,
  handleDeleteCompany,
  handleAddEmployee,
  handleAssignClient,
  handleAssignTeam,
  hrForm,
  setHrForm,
  handleAddHR,
  coForm,
  setCoForm,
  handleAddCompany,
  editingItem,
  handleEditClick,
  handleAddClick,
  selectedEmployeeId,
  setSelectedEmployeeId,
  selectedAttendance,
  selectedBalance,
  handleAdjustAttendance,
  handleCreateManualAttendance,
  getEmployeeStats,
  handleAssignShift,
  selectedEmployeeDetail,
  handleUpdateEmployeeStatus,
  isSubmitting,
  settings,
}) {
  const [assigningCompany, setAssigningCompany] = useState(null);
  const [companyAddMode, setCompanyAddMode] = useState('client');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [selectedHRId, setSelectedHRId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const selectedHR = hrUsers.find(h => h.id === selectedHRId) || null;
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

  const containerRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, select, a')) return;
    isDown.current = true;
    containerRef.current.classList.add('cursor-grabbing');
    containerRef.current.classList.remove('cursor-grab');
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeft.current = containerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove('cursor-grabbing');
      containerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

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

  const selectedEmployee = selectedEmployeeDetail || (selectedEmployeeId
    ? employees.find((e) => e.id === selectedEmployeeId)
    : null);

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users, count: employees.length },
    { id: 'hr', label: 'HR Managers', icon: ShieldCheck, count: hrUsers.length },
    { id: 'companies', label: 'Clients', icon: Building2, count: companies.length },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage all employees, HR managers, and clients in the platform</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-500/25 cursor-pointer"
        >
          <Plus className="w-5 h-5" />Add {activeTab === 'employees' ? 'Employee' : activeTab === 'hr' ? 'HR Manager' : 'Client'}
        </button>
      </div>

      {/* Tabs */}
      {/* Tabs */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 p-3 shadow-lg shadow-slate-200/40 dark:shadow-none flex flex-col sm:flex-row gap-4 relative z-10">
        <div className="flex w-full sm:w-auto items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.5rem] p-1.5 border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto hide-scrollbar">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSearchQuery(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === id ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />{label} <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        {activeTab === 'employees' && (
          <select
            value={shiftFilter}
            onChange={e => setShiftFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800/50 transition-all"
          >
            <option value="All">All Shifts</option>
            <option value="morning">Morning Shift</option>
            <option value="night">Night Shift</option>
          </select>
        )}
      </div>

      {/* Employees table */}
      {activeTab === 'employees' && (
        <div className={`grid gap-6 ${selectedEmployee ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} relative z-10 min-w-0`}>
          <div className={`min-w-0 ${selectedEmployee ? 'lg:col-span-2' : ''}`}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="overflow-x-auto max-h-[530px] overflow-y-auto cursor-grab select-none"
              >
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="z-10">
                    <tr className="border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      {['Employee', 'Position', 'Department', 'Client', 'Status', 'Actions'].map((h, i) => {
                        const minWidths = ['min-w-[200px]', 'min-w-[150px]', 'min-w-[150px]', 'min-w-[150px]', 'min-w-[100px]', 'min-w-[100px]'];
                        return (
                          <th key={h} className={`sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)] ${minWidths[i]}`}>{h}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedEmployeeId === emp.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                        <td className={`py-3 px-4 cursor-pointer ${selectedEmployeeId === emp.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : 'bg-transparent'} group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 min-w-[200px]`} onClick={() => setSelectedEmployeeId(selectedEmployeeId === emp.id ? null : emp.id)}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold overflow-hidden flex-shrink-0">
                              {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                              )}
                            </div>
                            <div>
                              <div className="text-slate-700 dark:text-slate-200 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all break-words"><FormatMultilineName name={emp.name} /></div>
                              <div className="text-slate-400 dark:text-slate-500 text-xs break-all break-words">{emp.email}</div>
                              <div className="text-slate-400 dark:text-slate-500 text-[10px] whitespace-nowrap">Joined: {emp.joinDate || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div className="break-all break-words">{emp.position}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div className="break-all break-words">{emp.department}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div className="break-all break-words">{emp.company || 'General (Our Company)'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{emp.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleEditClick(emp, 'employee')} className="w-7 h-7 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 rounded-lg flex items-center justify-center transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteEmployee(emp.id)} className="w-7 h-7 bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 rounded-lg flex items-center justify-center transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No employees found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {selectedEmployee && (() => {
            const stats = getEmployeeStats(selectedEmployee.id);
            const filteredAttendance = selectedAttendance.filter(rec => {
              if (!attendanceDateFilter) return true;
              return rec.date === attendanceDateFilter;
            });
            const recentRecs = filteredAttendance.slice(0, 5);
            return (
              <div className="lg:col-span-1 space-y-4 min-w-0">
                {/* Profile card */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                  <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                      {selectedEmployee.avatar && selectedEmployee.avatar.startsWith('data:image/') ? (
                        <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedEmployee.avatar
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate"><FormatMultilineName name={selectedEmployee.name} /></div>
                      <div className="text-slate-400 text-xs truncate">{selectedEmployee.position}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEmployeeId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
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
                          {companies.filter(c => !c.isTeam).map(c => (
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
                        {companies.some(c => c.isTeam && (c.contact || '').toLowerCase() === selectedEmployee.name.toLowerCase()) ? (
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
                              {companies.filter(c => c.isTeam).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Shift Assignment Card */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none">
                  <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">🌙</span> Shift Assignment
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
                  <div className="grid grid-cols-2 gap-3">
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
                    <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-sm flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      Leave Balance
                    </h4>
                    <div className="space-y-2.5">
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
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s[rec.status] || 'bg-slate-100 text-slate-700'} capitalize`}>
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
                            <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-1.5">
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
                                  checkIn: rec.checkIn || '',
                                  checkOut: rec.checkOut || '',
                                  status: rec.status || 'present',
                                  reason: '',
                                  breakMinutes: rec.breakMinutes || '',
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
      )}

      {/* HR table */}
      {activeTab === 'hr' && (
        <div className={`grid gap-6 ${selectedHRId ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} relative z-10 min-w-0`}>
          <div className={`min-w-0 ${selectedHRId ? 'lg:col-span-2' : ''}`}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none relative z-10 min-w-0">
              <div className="overflow-x-auto max-h-[530px] overflow-y-auto">
                <table className="w-full text-sm min-w-[650px]">
                  <thead className="z-10">
                    <tr className="border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      {['Manager Name', 'Status', 'Actions'].map((h, i) => {
                        const minWidths = ['min-w-[250px]', 'min-w-[100px]', 'min-w-[100px]'];
                        return (
                          <th key={h} className={`sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)] ${minWidths[i]}`}>{h}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredHR.map(mgr => (
                      <tr key={mgr.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedHRId === mgr.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                        <td className={`py-3 px-4 cursor-pointer ${selectedHRId === mgr.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : 'bg-transparent'} group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 min-w-[200px]`} onClick={() => setSelectedHRId(selectedHRId === mgr.id ? null : mgr.id)}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold flex-shrink-0 overflow-hidden">
                              {mgr.avatar && mgr.avatar.startsWith('data:image/') ? (
                                <img src={mgr.avatar} alt={mgr.name} className="w-full h-full object-cover" />
                              ) : (
                                mgr.avatar || (mgr.name ? mgr.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                              )}
                            </div>
                            <div>
                              <div className="text-slate-700 dark:text-slate-200 font-medium break-all break-words">{mgr.name}</div>
                              <div className="text-slate-400 dark:text-slate-500 text-xs break-all break-words">{mgr.email}</div>
                              <div className="text-slate-400 dark:text-slate-500 text-[10px] whitespace-nowrap">Joined: {mgr.joinDate || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mgr.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{mgr.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleEditClick(mgr, 'hr')} className="w-7 h-7 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 rounded-lg flex items-center justify-center transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => handleDeleteHR(mgr.id)} className="w-7 h-7 bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 rounded-lg flex items-center justify-center transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredHR.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No HR accounts found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {selectedHR && (
            <div className="lg:col-span-1 space-y-4 min-w-0">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold overflow-hidden flex-shrink-0">
                    {selectedHR.avatar && selectedHR.avatar.startsWith('data:image/') ? (
                      <img src={selectedHR.avatar} alt={selectedHR.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedHR.avatar || (selectedHR.name ? selectedHR.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">{selectedHR.name}</div>
                    <div className="text-slate-400 text-xs truncate">{selectedHR.department || 'Human Resources'}</div>
                  </div>
                  <button onClick={() => setSelectedHRId(null)} className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100">
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-sm relative z-10">
                  <div className="flex items-center gap-2 text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">{selectedHR.email}</span></div>
                  <div className="flex items-center gap-2 text-slate-500"><Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">Joined: {selectedHR.joinDate || 'N/A'}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 relative z-10">
                  <div className="text-xs text-slate-400 font-semibold mb-2">Account Status</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedHR.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{selectedHR.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clients/Leads table */}
      {activeTab === 'companies' && (
        <div className={`grid gap-6 ${selectedCompanyId ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} relative z-10 min-w-0`}>
          <div className={`min-w-0 ${selectedCompanyId ? 'lg:col-span-2' : ''}`}>
            <div className="space-y-8">
              {[
                { title: 'Clients', items: filteredCompanies.filter(c => !c.isTeam), type: 'client' },
                { title: 'Leads / Teams', items: filteredCompanies.filter(c => c.isTeam), type: 'lead' }
              ].map(group => (
                <div key={group.title}>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">{group.title}</h3>
                  <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none relative z-10 min-w-0">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm min-w-[800px]">
                        <thead className="z-10">
                          <tr className="border-b border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[200px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">{group.type === 'client' ? 'Client' : 'Lead'}</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[150px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">{group.type === 'client' ? 'Industry' : 'Department'}</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[150px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">Contact</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[100px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">Employees</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[120px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">Joined</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[100px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">Status</th>
                            <th className="sticky top-0 text-left text-slate-600 dark:text-slate-300 font-bold py-3 px-4 min-w-[120px] bg-slate-50 dark:bg-slate-800/90 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-slate-700/50">
                          {group.items.map(co => (
                            <tr key={co.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedCompanyId === co.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : ''}`}>
                              <td className={`py-3 px-4 cursor-pointer ${selectedCompanyId === co.id ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : 'bg-transparent'} group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 min-w-[200px]`} onClick={() => setSelectedCompanyId(selectedCompanyId === co.id ? null : co.id)}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0 overflow-hidden">
                                    {(co.avatar || co.logo) && (co.avatar || co.logo).startsWith('data:image/') ? (
                                      <img src={co.avatar || co.logo} alt={co.name} className="w-full h-full object-cover" />
                                    ) : (
                                      (co.avatar || co.logo) || (co.name ? co.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                                    )}
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-200 font-medium break-all break-words">{co.name}</div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                <div className="break-all break-words">{co.industry === 'General' && group.type === 'lead' ? 'Internal Team' : co.industry}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                <div className="break-all break-words">{co.contact}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {employees.filter(e => co.isTeam ? e.teamId === co.id : e.companyId === co.id).length}
                              </td>
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{co.joinedDate}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${co.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{co.status}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => setAssigningCompany(co)} title="Assign Employees" className="w-7 h-7 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 text-slate-400 rounded-lg flex items-center justify-center transition-colors">
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                  <button type="button" onClick={() => handleEditClick(co, 'company')} className="w-7 h-7 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 rounded-lg flex items-center justify-center transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button type="button" onClick={() => handleDeleteCompany(co.id)} className="w-7 h-7 bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 rounded-lg flex items-center justify-center transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {group.items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No {group.title.toLowerCase()} found</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {selectedCompany && (
            <div className="lg:col-span-1 space-y-4 min-w-0">
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors duration-500"></div>
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold overflow-hidden flex-shrink-0">
                    {(selectedCompany.avatar || selectedCompany.logo) && (selectedCompany.avatar || selectedCompany.logo).startsWith('data:image/') ? (
                      <img src={selectedCompany.avatar || selectedCompany.logo} alt={selectedCompany.name} className="w-full h-full object-cover" />
                    ) : (
                      (selectedCompany.avatar || selectedCompany.logo) || (selectedCompany.name ? selectedCompany.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate">{selectedCompany.name}</div>
                    <div className="text-slate-400 text-xs truncate">{selectedCompany.industry}</div>
                  </div>
                  <button onClick={() => setSelectedCompanyId(null)} className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100">
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-sm relative z-10">
                  <div className="flex items-center gap-2 text-slate-500"><User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">{selectedCompany.contact}</span></div>
                  <div className="flex items-center gap-2 text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">{selectedCompany.email}</span></div>
                  <div className="flex items-center gap-2 text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">{selectedCompany.phone || 'N/A'}</span></div>
                  <div className="flex items-center gap-2 text-slate-500"><Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" /><span className="truncate text-xs">Joined: {selectedCompany.joinedDate || 'N/A'}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 relative z-10">
                  <div className="text-xs text-slate-400 font-semibold mb-2">Account Status</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedCompany.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{selectedCompany.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Employee Modal - Liquid Glass */}
      {showModal && activeTab === 'employees' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />

            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">{editingItem ? 'Edit Employee' : 'Add New Employee'}</h3>
                  <p className="text-white/70 font-bold text-sm mt-0.5">{editingItem ? 'Update employee details' : 'Enter employee details to onboard them'}</p>
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
                      <div className="relative">
                        <div
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold cursor-pointer flex items-center justify-between"
                          onClick={() => setOpenDropdowns(p => ({ ...p, empDept: !p.empDept }))}
                        >
                          <span className={empForm[f.key] ? 'truncate' : 'truncate text-white/50'}>
                            {empForm[f.key] || 'Select Department...'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                        </div>
                        {openDropdowns.empDept && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-slate-900 border border-white/10 rounded-[14px] shadow-2xl z-[9999] py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {(settings.departments || []).map(dept => (
                              <div
                                key={dept}
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white truncate"
                                onClick={() => {
                                  setEmpForm(p => ({ ...p, [f.key]: dept }));
                                  setOpenDropdowns(p => ({ ...p, empDept: false }));
                                }}
                              >
                                {dept}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                  <div className="relative">
                    <div
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold cursor-pointer flex items-center justify-between"
                      onClick={() => setOpenDropdowns(p => ({ ...p, empCountry: !p.empCountry }))}
                    >
                      <span className={empForm.country ? 'truncate' : 'truncate text-white/50'}>
                        {empForm.country || 'Choose Location...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                    </div>
                    {openDropdowns.empCountry && (
                      <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-slate-900 border border-white/10 rounded-[14px] shadow-2xl z-[9999] py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {['Sri Lanka', 'USA', 'UK', 'Canada', 'Australia'].map(c => (
                          <div
                            key={c}
                            className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white truncate"
                            onClick={() => {
                              setEmpForm(p => ({ ...p, country: c }));
                              setOpenDropdowns(p => ({ ...p, empCountry: false }));
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="w-full sm:w-auto px-8 py-3.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] text-sm font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-[14px] text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_0_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : editingItem ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && activeTab === 'hr' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />

            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">{editingItem ? 'Edit HR Manager' : 'Add New HR Manager'}</h3>
                  <p className="text-white/70 font-bold text-sm mt-0.5">{editingItem ? 'Update manager details' : 'Enter details to onboard new manager'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHR} className="p-8 space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Amanda Foster', type: 'text' },
                  { key: 'email', label: 'Email', placeholder: 'amanda@company.com', type: 'email' },
                  { key: 'joinDate', label: 'Join Date', placeholder: '', type: 'date' },
                  { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '', type: 'date' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'email' || f.key === 'name' ? 'col-span-2' : ''}>
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">{f.label}</label>
                    {f.key === 'department' ? (
                      <div className="relative">
                        <div
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold cursor-pointer flex items-center justify-between"
                          onClick={() => setOpenDropdowns(p => ({ ...p, hrDept: !p.hrDept }))}
                        >
                          <span className={hrForm[f.key] ? 'truncate' : 'truncate text-white/50'}>
                            {hrForm[f.key] || 'Select Department...'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                        </div>
                        {openDropdowns.hrDept && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-slate-900 border border-white/10 rounded-[14px] shadow-2xl z-[9999] py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {(settings.departments || []).map(dept => (
                              <div
                                key={dept}
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white truncate"
                                onClick={() => {
                                  setHrForm(p => ({ ...p, [f.key]: dept }));
                                  setOpenDropdowns(p => ({ ...p, hrDept: false }));
                                }}
                              >
                                {dept}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={f.type}
                        value={hrForm[f.key] || ''}
                        onChange={e => setHrForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        required={f.key !== 'dateOfBirth'}
                        max={f.key === 'joinDate' || f.key === 'dateOfBirth' ? new Date().toISOString().split('T')[0] : undefined}
                        minLength={f.key !== 'joinDate' && f.key !== 'dateOfBirth' && f.key !== 'email' ? 2 : undefined}
                        maxLength={['name'].includes(f.key) ? 40 : undefined}
                        pattern={
                          f.key === 'name'
                            ? "^[a-zA-Z\\s.\\-]+$"
                            : f.key === 'email'
                              ? "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
                              : undefined
                        }
                        title={
                          f.key === 'name'
                            ? "Only letters, spaces, dots, and hyphens are allowed."
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
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="w-full sm:w-auto px-8 py-3.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] text-sm font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-[14px] text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_0_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : editingItem ? 'Update HR Manager' : 'Add HR Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && activeTab === 'companies' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl min-h-[550px] max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Subtle emerald liquid glow for companies */}
            <div className="absolute -inset-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />

            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">
                    {editingItem
                      ? 'Edit Details'
                      : (companyAddMode === 'client' ? 'Add New Client' : 'Add New Lead')}
                  </h3>
                  <p className="text-white/70 font-bold text-sm mt-0.5">
                    {editingItem
                      ? 'Update details'
                      : (companyAddMode === 'client' ? 'Enter details to add new client' : 'Enter details to add new lead')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleAddCompany(e, companyAddMode === 'team')} noValidate className="p-8 space-y-6 relative z-10">
              {!editingItem && (
                <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] p-1.5 mb-2">
                  <button type="button" onClick={() => { setCompanyAddMode('client'); setCoForm(p => ({ ...p, isTeam: false })); }} className={`flex-1 py-2 text-sm font-bold rounded-[10px] transition-all ${companyAddMode === 'client' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>Client</button>
                  <button type="button" onClick={() => { setCompanyAddMode('team'); setCoForm(p => ({ ...p, isTeam: true })); }} className={`flex-1 py-2 text-sm font-bold rounded-[10px] transition-all ${companyAddMode === 'team' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>Lead</button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                {(companyAddMode === 'client' ? [
                  { key: 'name', label: 'Company Name', placeholder: 'TechVentures Ltd', type: 'text' },
                  { key: 'industry', label: 'Industry', placeholder: 'Technology', type: 'text' },
                  { key: 'contact', label: 'Contact Person', placeholder: 'Mark Reynolds', type: 'text' },
                  { key: 'email', label: 'Email', placeholder: 'mark@techventures.com', type: 'email' },
                  { key: 'phone', label: 'Phone Number', placeholder: '+1 (555) 100-2000', type: 'text' },
                  { key: 'joinedDate', label: 'Joined Date', placeholder: '', type: 'date' },
                ] : [
                  { key: 'name', label: 'Team Name', placeholder: 'e.g. Frontend Team', type: 'text' },
                  { key: 'contact', label: 'Lead Employee', type: 'select_employee' },
                  { key: 'joinedDate', label: 'Join Date', placeholder: '', type: 'date' },
                ]).map(f => (
                  <div key={f.key} className={f.key === 'name' || f.key === 'email' ? 'col-span-2' : ''}>
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">{f.label}</label>
                    {f.type === 'select_employee' ? (
                      <div className="relative">
                        <div
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold cursor-pointer flex items-center justify-between"
                          onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}
                        >
                          <span className="truncate">{coForm.contact || 'Select a Lead...'}</span>
                          <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                        </div>
                        {leadDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-80 overflow-y-auto overflow-x-hidden bg-slate-900 border border-white/10 rounded-[14px] shadow-2xl z-[9999] py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            <div
                              className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white/50 truncate"
                              onClick={() => {
                                setCoForm(p => ({ ...p, contact: '', email: '', phone: '' }));
                                setLeadDropdownOpen(false);
                              }}
                            >
                              Select a Lead...
                            </div>
                            {employees.map(emp => (
                              <div
                                key={emp.id}
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white truncate"
                                onClick={() => {
                                  setCoForm(p => ({
                                    ...p,
                                    contact: emp.name,
                                    email: emp.email || '',
                                    phone: emp.phone || ''
                                  }));
                                  setLeadDropdownOpen(false);
                                }}
                                title={`${emp.name} ${emp.department ? `(${emp.department})` : ''}`}
                              >
                                {emp.name} {emp.department ? `(${emp.department})` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={f.type}
                        value={coForm[f.key] || ''}
                        onChange={e => setCoForm(p => ({
                          ...p,
                          [f.key]: f.key === 'phone' ? e.target.value.replace(/[^0-9+\s\-()]/g, '') : e.target.value
                        }))}
                        placeholder={f.placeholder}
                        required
                        max={f.key === 'joinedDate' ? new Date().toISOString().split('T')[0] : undefined}
                        minLength={['name', 'industry', 'contact'].includes(f.key) ? 2 : undefined}
                        maxLength={['name', 'industry', 'contact'].includes(f.key) ? 30 : undefined}
                        pattern={
                          f.key === 'name'
                            ? "^[a-zA-Z0-9\\s.\\-()&]+$"
                            : f.key === 'industry'
                              ? "^[a-zA-Z\\s.\\-()&]+$"
                              : f.key === 'contact'
                                ? "^[a-zA-Z\\s.\\-]+$"
                                : f.key === 'email'
                                  ? "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
                                  : f.key === 'phone'
                                    ? "^\\+?[0-9\\s\\-()]{7,20}$"
                                    : undefined
                        }
                        title={
                          f.key === 'name'
                            ? "Only letters, numbers, spaces, dots, hyphens, brackets, and ampersands are allowed."
                            : f.key === 'industry'
                              ? "Only letters, spaces, dots, hyphens, brackets, and ampersands are allowed."
                              : f.key === 'contact'
                                ? "Only letters, spaces, dots, and hyphens are allowed."
                                : f.key === 'email'
                                  ? "Please enter a valid email address."
                                  : f.key === 'phone'
                                    ? "Please enter a valid phone number (7-20 digits)."
                                    : undefined
                        }
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                        style={f.key === 'joinedDate' ? { colorScheme: 'dark' } : {}}
                      />
                    )}
                  </div>
                ))}

                {companyAddMode === 'client' && (
                  <>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">Address</label>
                      <input
                        type="text"
                        value={coForm.address || ''}
                        onChange={e => setCoForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="123 Main St, Colombo"
                        required
                        minLength={5}
                        maxLength={40}
                        pattern="^(?!\s*$).+"
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm mb-1.5 block">Country</label>
                      <div className="relative">
                        <div
                          className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-sm font-bold cursor-pointer flex items-center justify-between"
                          onClick={() => setOpenDropdowns(p => ({ ...p, coCountry: !p.coCountry }))}
                        >
                          <span className={coForm.country ? 'truncate' : 'truncate text-white/50'}>
                            {coForm.country || 'Choose Location...'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
                        </div>
                        {openDropdowns.coCountry && (
                          <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-slate-900 border border-white/10 rounded-[14px] shadow-2xl z-[9999] py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {['Sri Lanka', 'USA', 'UK', 'Canada', 'Australia'].map(c => (
                              <div
                                key={c}
                                className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm font-medium text-white truncate"
                                onClick={() => {
                                  setCoForm(p => ({ ...p, country: c }));
                                  setOpenDropdowns(p => ({ ...p, coCountry: false }));
                                }}
                              >
                                {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="w-full sm:w-auto px-8 py-3.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] text-sm font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-[14px] text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_0_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : editingItem ? 'Update Details' : (companyAddMode === 'client' ? 'Add Client' : 'Add Lead')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Assign Employees Modal */}
      {assigningCompany && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center pb-4 border-b border-border dark:border-slate-800">
              <div>
                <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Assign Workers to Client</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Manage workforce assigned to <strong className="text-slate-700 dark:text-slate-200">{assigningCompany.name}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningCompany(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto my-4 flex-1 divide-y divide-border dark:divide-slate-800 pr-1">
              {employees.filter(emp => {
                if (!assigningCompany.isTeam) return true;
                const isLeadOfAnyTeam = companies.some(c => c.isTeam && (c.contact || '').toLowerCase() === emp.name.toLowerCase());
                return !isLeadOfAnyTeam;
              }).map(emp => {
                const isAssigned = assigningCompany.isTeam ? emp.teamId === assigningCompany.id : emp.companyId === assigningCompany.id;
                return (
                  <div key={emp.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-slate-700 dark:text-slate-200 text-sm font-medium">{emp.name}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-xs">{emp.position} · {emp.department}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
                        Current: <span className="font-medium text-slate-600 dark:text-slate-400">
                          {assigningCompany.isTeam ? (emp.team || 'None') : (emp.company || 'General (Our Company)')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {
                          if (assigningCompany.isTeam) {
                            handleAssignTeam(emp.id, isAssigned ? '' : assigningCompany.id);
                          } else {
                            handleAssignClient(emp.id, isAssigned ? '' : assigningCompany.id);
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 border-gray-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer dark:bg-slate-700"
                      />
                    </div>
                  </div>
                );
              })}
              {employees.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm py-8 text-center">No employees available</p>
              )}
            </div>

            <div className="pt-4 border-t border-border dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningCompany(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
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
                  style={{ colorScheme: 'dark' }}
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
});
