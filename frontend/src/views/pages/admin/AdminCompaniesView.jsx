import React, { useState } from 'react';
import { Building2, Users, Mail, Phone, Briefcase, ChevronRight, User, MapPin } from 'lucide-react';

export function AdminCompaniesView({ companies = [], employees = [] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('clients');

  const clientCompanies = companies.filter(c => !c.isTeam);
  const teamCompanies = companies.filter(c => c.isTeam);
  const displayedCompanies = activeTab === 'clients' ? clientCompanies : teamCompanies;

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

  // If no company is selected, select the first one by default if list is not empty
  const activeCompanyId = selectedCompanyId || (displayedCompanies[0]?.id || null);
  const selectedCompany = companies.find(c => c.id === activeCompanyId);

  // Get employees assigned to the active company
  const companyEmployees = selectedCompany
    ? employees.filter(e => selectedCompany.isTeam ? e.teamId === selectedCompany.id : e.companyId === selectedCompany.id)
    : [];

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="relative z-10">
        <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>Clients & Teams</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">View client companies and the employees assigned to them</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Companies List */}
        <div className="md:col-span-1 space-y-3">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-white dark:border-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none relative z-10">
            <h3 className="text-slate-800 dark:text-slate-100 font-bold text-base mb-4">Companies</h3>
            <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-border">
              <button
                onClick={() => { setActiveTab('clients'); setSelectedCompanyId(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'clients'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                Clients
              </button>
              <button
                onClick={() => { setActiveTab('teams'); setSelectedCompanyId(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'teams'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-border/50'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                Internal Teams
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="space-y-2">
                {displayedCompanies.map(co => {
                  const isSelected = co.id === activeCompanyId;
                  const empCount = employees.filter(e => co.isTeam ? e.teamId === co.id : e.companyId === co.id).length;
                  return (
                    <div
                      key={co.id}
                      onClick={() => {
                        setSelectedCompanyId(co.id);
                        setSelectedEmployee(null);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group hover:-translate-y-0.5 ${isSelected
                        ? 'border-indigo-300 dark:border-indigo-500/50 bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-blue-50/50 dark:to-blue-900/20 shadow-md shadow-indigo-100/50 dark:shadow-none'
                        : 'border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-50/50 dark:hover:shadow-none hover:bg-white dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm overflow-hidden ${isSelected ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}>
                          {co.avatar && co.avatar.startsWith('data:image/') ? (
                            <img src={co.avatar} alt={co.name} className="w-full h-full object-cover" />
                          ) : (
                            co.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-bold text-base truncate transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-700'}`}>{co.name}</div>
                          <div className={`text-xs font-medium truncate mt-0.5 ${isSelected ? 'text-indigo-600/80' : 'text-slate-400 group-hover:text-slate-500'}`}>{co.industry}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`text-sm px-3 py-1 rounded-full font-black ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                          {empCount}
                        </span>
                        <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1'}`} />
                      </div>
                    </div>
                  );
                })}
                {displayedCompanies.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm">No companies found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Company Info & Assigned Employees */}
        <div className="md:col-span-2 space-y-6">
          {selectedCompany ? (
            <>
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-emerald-500/5 to-transparent opacity-50"></div>
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>

                <div className="p-8 relative z-10">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-xl shadow-indigo-100/50 dark:shadow-none text-indigo-700 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl border-4 border-white dark:border-slate-700 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                        {selectedCompany.avatar && selectedCompany.avatar.startsWith('data:image/') ? (
                          <img src={selectedCompany.avatar} alt={selectedCompany.name} className="w-full h-full object-cover" />
                        ) : (
                          selectedCompany.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2 className="text-slate-800 font-black text-2xl tracking-tight mb-1 drop-shadow-sm">{selectedCompany.name}</h2>
                        <div className="flex items-center gap-2">
                          <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100/50">{selectedCompany.industry}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${selectedCompany.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 'bg-slate-100 text-slate-500 border-slate-200/50'}`}>
                            {selectedCompany.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-slate-100/80">
                    {[
                      { icon: User, label: 'Contact Person', value: selectedCompany.contact },
                      { icon: Mail, label: 'Email', value: selectedCompany.email },
                      { icon: Phone, label: 'Phone', value: selectedCompany.phone || 'N/A' },
                      { icon: MapPin, label: 'Address', value: selectedCompany.address || 'N/A' },
                      { icon: MapPin, label: 'Country', value: selectedCompany.country || 'N/A' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md dark:hover:shadow-none transition-all">
                        <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </div>
                        <div className="text-slate-800 dark:text-slate-200 text-base font-bold truncate">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assigned Employees */}
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2.5rem] border border-white dark:border-slate-800 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-3 text-xl tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 shadow-inner">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    Assigned Employees ({companyEmployees.length})
                  </h3>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {companyEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/30 bg-white dark:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-none cursor-pointer transition-all flex items-center gap-4 group"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 dark:from-indigo-900/50 to-blue-50 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-400 rounded-[1rem] flex items-center justify-center font-black text-lg overflow-hidden flex-shrink-0 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50 group-hover:scale-110 transition-transform">
                          {emp.avatar && emp.avatar.startsWith('data:image/') ? (
                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.avatar || (emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '')
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-800 dark:text-slate-200 text-base truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors"><FormatMultilineName name={emp.name} /></div>
                          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium truncate mt-0.5">{emp.position}</div>
                          <div className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-1.5 uppercase tracking-widest">{emp.department}</div>
                        </div>
                      </div>
                    ))}
                    {companyEmployees.length === 0 && (
                      <div className="sm:col-span-2 lg:col-span-3 py-16 text-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                        <p className="text-base font-bold">No employees assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-400 relative z-10">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-40 text-slate-400" />
              <p className="text-sm">Select a company from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white dark:border-slate-800 shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full font-bold text-lg cursor-pointer transition-colors"
            >
              &times;
            </button>
            <div className="flex flex-col items-center text-center pb-4 border-b border-border">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-xl mb-3 shadow-sm overflow-hidden flex-shrink-0">
                {selectedEmployee.avatar && selectedEmployee.avatar.startsWith('data:image/') ? (
                  <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                ) : (
                  selectedEmployee.avatar
                )}
              </div>
              <h3 className="text-slate-800 font-bold text-lg"><FormatMultilineName name={selectedEmployee.name} /></h3>
              <p className="text-slate-400 text-xs mt-0.5">{selectedEmployee.position}</p>
              <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {selectedEmployee.status}
              </span>
            </div>
            <div className="py-4 space-y-3.5">
              {[
                { icon: Mail, label: 'Email', value: selectedEmployee.email },
                { icon: Phone, label: 'Phone', value: selectedEmployee.phone || 'N/A' },
                { icon: Briefcase, label: 'Department', value: selectedEmployee.department || 'General' },
                { icon: Building2, label: 'Company / Client', value: selectedEmployee.company || 'General (Our Company)' },
                { icon: MapPin, label: 'Address', value: selectedEmployee.address || 'N/A' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">{label}</div>
                    <div className="text-slate-700 text-sm font-medium mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
