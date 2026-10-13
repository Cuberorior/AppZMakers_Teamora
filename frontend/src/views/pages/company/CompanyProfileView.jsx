import React, { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Briefcase, Building2, Edit2, X, Lock, Save, Loader2, AlertCircle, CheckCircle2, User, Landmark, UploadCloud, Eye, EyeOff } from 'lucide-react';

export function CompanyProfileView({
  company,
  handleUpdateCompanyProfile,
  isTeam,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      showToast('error', 'Image size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      const result = await handleUpdateCompanyProfile({ avatar: base64Data });
      if (result && result.success) {
        showToast('success', 'Profile photo updated successfully');
      } else {
        showToast('error', result?.error || 'Failed to update profile photo');
      }
    };
    reader.onerror = () => {
      showToast('error', 'Error reading image file');
    };
    reader.readAsDataURL(file);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      showToast('error', 'Company name must be between 2 and 30 characters long.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }
    if (!industry || industry.trim().length < 2 || industry.trim().length > 30) {
      showToast('error', 'Industry sector must be between 2 and 30 characters long.');
      return;
    }
    if (!contact || contact.trim().length < 2 || contact.trim().length > 30) {
      showToast('error', 'Contact person must be between 2 and 30 characters long.');
      return;
    }
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showToast('error', 'Phone number must be between 7 and 15 digits');
        return;
      }
    }
    if (password || confirmPassword) {
      if (!password || !confirmPassword) {
        showToast('error', 'Please fill in both password fields to change your password');
        return;
      }
      if (password !== confirmPassword) {
        showToast('error', 'Passwords do not match');
        return;
      }
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongRegex.test(password)) {
        showToast('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters');
        return;
      }
    }

    setIsSaving(true);
    const updateData = { name, email, industry, contact, phone, address, country };
    if (password) {
      updateData.password = password;
    }

    const result = await handleUpdateCompanyProfile(updateData);
    setIsSaving(false);

    if (result && result.success) {
      showToast('success', result.message || 'Profile updated successfully');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } else {
      showToast('error', result?.error || 'Failed to update profile');
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const avatarText = company.name
    ? company.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CP';

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>{isTeam ? 'My Lead Profile' : 'My Client Profile'}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{isTeam ? 'Your team lead details and account settings' : 'Your business details and partner account settings'}</p>
        </div>
      </div>

      {/* Unique Bento Box Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main ID Card */}
        <div className="lg:col-span-1 relative rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none group border border-white dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-[length:200%_200%] animate-gradient opacity-10 dark:opacity-20"></div>
           <div className="relative p-8 flex flex-col items-center text-center h-full">
              
              <div className="relative w-32 h-32 mb-6 group/avatar">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-3xl rotate-6 group-hover/avatar:rotate-12 transition-transform duration-500 blur-md opacity-60"></div>
                 <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-xl">
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-3xl">
                      {company.avatar && company.avatar.startsWith('data:image/') ? (
                        <img src={company.avatar} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        avatarText
                      )}
                    </div>
                 </div>
                 <label className="absolute -bottom-3 -right-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 cursor-pointer hover:scale-110 hover:-rotate-6 transition-transform text-indigo-600 dark:text-indigo-400">
                    <UploadCloud className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                 </label>
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">{company.name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50 mb-8">
                 <Building2 className="w-4 h-4" />
                 {isTeam ? 'Team Lead' : 'Client Partner'}
              </div>

              <button
                onClick={() => {
                  setName(company.name || '');
                  setEmail(company.email || '');
                  setIndustry(company.industry || '');
                  setContact(company.contact || '');
                  setPhone(company.phone || '');
                  setAddress(company.address || '');
                  setCountry(company.country || '');
                  setPassword('');
                  setConfirmPassword('');
                  setIsEditing(true);
                }}
                className="w-full mt-auto flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1 active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
           </div>
        </div>

        {/* Info Tiles Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Landmark className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Landmark className="w-7 h-7" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Industry</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">{company.industry || 'Not set'}</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Mail className="w-32 h-32 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Email Address</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight truncate">{company.email}</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Phone className="w-32 h-32 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="w-14 h-14 bg-cyan-50 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Phone className="w-7 h-7" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Phone</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">{company.phone || 'Not set'}</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <User className="w-32 h-32 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="w-14 h-14 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Contact Person</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight">{company.contact || 'Not set'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business details */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white dark:border-slate-800 p-8 shadow-xl shadow-slate-200/40 dark:shadow-none lg:col-span-2">
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl tracking-tight mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {isTeam ? 'Lead Details' : 'Business Details'}
          </h3>
          <div className="space-y-2">
            {[
              { label: isTeam ? 'Lead/Team ID' : 'Client/Lead ID', value: company.id ? company.id.toUpperCase() : 'N/A' },
              { label: 'Industry Sector', value: company.industry || 'General' },
              { label: 'Primary Contact', value: company.contact || 'N/A' },
              { label: 'Location', value: company.address || 'N/A' },
              { label: 'Country', value: company.country || 'N/A' },
              { label: 'Joined Date', value: company.joinedDate ? new Date(company.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
              { label: 'Assigned Employees Count', value: `${company.employeeCount || 0} active employees` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{label}</span>
                <span className="text-slate-800 dark:text-slate-100 text-sm font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95">
            {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />
            
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">Update Profile</h3>
                  <p className="text-white/70 font-bold text-sm mt-0.5">Edit your business details or password</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 relative z-10">
              {toast && toast.type === 'error' && (
                <div className="flex items-center gap-3 p-4 text-sm font-bold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl animate-in slide-in-from-top-2 duration-200 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>{toast.text}</span>
                </div>
              )}

              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  <span className="w-8 h-px bg-white/20"></span> Business Info
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="name">Company Name</label>
                  <div className="relative group/input">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="name"
                      type="text"
                      required
                      maxLength={30}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Company LLC"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="email">Email Address</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={50}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@company.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="industry">Industry Sector</label>
                    <div className="relative group/input">
                      <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                      <input
                        id="industry"
                        type="text"
                        maxLength={30}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Technology"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="contact">Contact Person</label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                      <input
                        id="contact"
                        type="text"
                        maxLength={30}
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="phone">Phone Number</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="phone"
                      type="text"
                      maxLength={15}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                      placeholder="+1 (555) 012-3456"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="address">Location</label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="address"
                      type="text"
                      maxLength={100}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="City"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="country">Country</label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="country"
                      type="text"
                      maxLength={50}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Sri Lanka"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-5">
                <h4 className="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                  <span className="w-8 h-px bg-white/20"></span> Change Password (Optional)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="password">New Password</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && (
                      <div className="text-[10px] space-y-1 mt-2 pl-1 font-bold">
                        <div className={`flex items-center gap-1.5 transition-colors ${password.length >= 8 ? 'text-emerald-400' : 'text-white/40'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" /> At least 8 characters
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-white/40'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(password) ? 'text-emerald-400' : 'text-white/40'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${/\d/.test(password) ? 'text-emerald-400' : 'text-white/40'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" /> Number
                        </div>
                        <div className={`flex items-center gap-1.5 transition-colors ${/[@$!%*?&]/.test(password) ? 'text-emerald-400' : 'text-white/40'}`}>
                           <CheckCircle2 className="w-3.5 h-3.5" /> Special character (@$!%*?&)
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-white/50 text-xs font-bold drop-shadow-sm">Leave password fields blank if you do not want to change your password.</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] text-sm font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-[14px] text-sm font-black uppercase tracking-widest shadow-[0_4px_16px_0_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      SAVE CHANGES
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
