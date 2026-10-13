import React, { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Briefcase, Building2, DollarSign, TrendingUp, Edit2, X, Lock, Save, Loader2, AlertCircle, CheckCircle2, FileText, UploadCloud, Trash2, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export function EmployeeProfileView({
  employee,
  mySalary,
  balance,
  attendancePct,
  presentDays,
  absentDays,
  myAttendance,
  yearsTenure,
  monthsTenure,
  handleUpdateProfile,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      const result = await handleUpdateProfile({ avatar: base64Data });
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

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 2.5MB limit');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      const result = await handleUpdateProfile({
        cvName: file.name,
        cvData: base64Data
      });
      setIsUploading(false);
      if (result && result.success) {
        showToast('success', 'CV uploaded successfully');
      } else {
        showToast('error', result?.error || 'Failed to upload CV');
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('error', 'Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const handleCvDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your CV?')) return;
    setIsUploading(true);
    const result = await handleUpdateProfile({
      cvName: '',
      cvData: ''
    });
    setIsUploading(false);
    if (result && result.success) {
      showToast('success', 'CV deleted successfully');
    } else {
      showToast('error', result?.error || 'Failed to delete CV');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showToast('error', 'Phone number must be between 7 and 15 digits');
        return;
      }
    }
    if (address && address.replace(/\s/g, '').length > 50) {
      showToast('error', 'Address cannot exceed 50 characters (excluding spaces)');
      return;
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
    const updateData = { phone, address };
    if (password) {
      updateData.password = password;
    }

    const result = await handleUpdateProfile(updateData);
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

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${toast.type === 'success'
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

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Your personal information and employment details</p>
        </div>
      </div>

      {/* Unique Bento Box Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main ID Card */}
        <div className="lg:col-span-1 relative rounded-[2rem] overflow-hidden shadow-sm group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500 bg-[length:200%_200%] animate-gradient opacity-10 dark:opacity-20"></div>
          <div className="relative p-8 flex flex-col items-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl h-full">

            <div className="relative w-32 h-32 mb-6 group/avatar">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400 to-blue-500 rounded-3xl rotate-6 group-hover/avatar:rotate-12 transition-transform duration-500 blur-md opacity-60"></div>
              <div className="relative w-full h-full bg-white rounded-3xl p-1 shadow-xl">
                <div className="w-full h-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-indigo-700 font-bold text-3xl">
                  {employee.avatar && employee.avatar.startsWith('data:image/') ? (
                    <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                  ) : (
                    employee.avatar || employee.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  )}
                </div>
              </div>
              <label className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 cursor-pointer hover:scale-110 hover:-rotate-6 transition-transform text-indigo-600">
                <UploadCloud className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">{employee.name}</h2>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                <Briefcase className="w-4 h-4" />
                {employee.position}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border shadow-sm transition-colors ${employee.shift === 'night' ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'}`}>
                {employee.shift === 'night' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {employee.shift === 'night' ? 'Night Shift' : 'Morning Shift'}
              </div>
            </div>

            <button
              onClick={() => {
                setPhone(employee.phone || '');
                setAddress(employee.address || '');
                setPassword('');
                setConfirmPassword('');
                setIsEditing(true);
              }}
              className="w-full mt-auto flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-medium shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Info Tiles Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Building2 className="w-32 h-32 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Company</p>
            <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.company}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900 border border-blue-100 dark:border-blue-900/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Mail className="w-32 h-32 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 shadow-sm">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Email Address</p>
            <p className="text-slate-800 dark:text-slate-100 font-bold text-lg truncate">{employee.email}</p>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900 border border-sky-100 dark:border-sky-900/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Phone className="w-32 h-32 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-6 border border-sky-100 dark:border-sky-800 shadow-sm">
              <Phone className="w-6 h-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Phone</p>
            <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.phone || 'Not set'}</p>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-50 to-white dark:from-fuchsia-950/40 dark:to-slate-900 border border-fuchsia-100 dark:border-fuchsia-900/50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <MapPin className="w-32 h-32 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl flex items-center justify-center mb-6 border border-fuchsia-100 dark:border-fuchsia-800 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Address</p>
            <p className="text-slate-800 dark:text-slate-100 font-bold text-lg break-words">{employee.address || 'Not set'}</p>
          </div>
        </div>
      </div>

      {employee.companyDetails && (
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-indigo-100/50 dark:shadow-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Working Company Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Company Name</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-lg">{employee.companyDetails.name || employee.company}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Industry</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.companyDetails.industry || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Primary Contact</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.companyDetails.contact || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Email Address</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg truncate">{employee.companyDetails.email || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Phone</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.companyDetails.phone || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Location</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg break-words">{employee.companyDetails.address || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Country</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.companyDetails.country || 'Not set'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Status</p>
              <p className={`font-black text-lg capitalize ${employee.companyDetails.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {employee.companyDetails.status || 'active'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Joined Date</p>
              <p className="text-slate-800 dark:text-slate-100 font-bold text-lg">{employee.companyDetails.joinedDate || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment details */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-indigo-100/50 dark:shadow-none hover:shadow-indigo-200/50 transition-shadow lg:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Employment Details
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Employee ID', value: employee.id ? employee.id.toUpperCase() : 'N/A' },
              { label: 'Position', value: employee.position },
              { label: 'Department', value: employee.department },
              ...(employee.team && employee.team !== 'None' ? [
                { label: 'Team', value: employee.team },
                { label: 'Team Lead', value: employee.teamLead || 'Not Assigned' }
              ] : []),
              ...(employee.leadsTeams ? [
                { label: 'Leads Team', value: employee.leadsTeams }
              ] : []),
              { label: 'Join Date', value: new Date(employee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Date of Birth', value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
              { label: 'Tenure', value: `${yearsTenure} yr${yearsTenure !== 1 ? 's' : ''} ${monthsTenure} mo${monthsTenure !== 1 ? 's' : ''}` },
              { label: 'Working Country', value: employee.country || 'N/A' },
              { label: 'Employment Status', value: employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : 'Active' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg px-2 transition-colors">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                <span className="text-slate-800 dark:text-slate-100 text-sm font-black text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>



        {/* Leave summary */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-sky-100/50 dark:shadow-none hover:shadow-sky-200/50 transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center border border-sky-100 dark:border-sky-800 shadow-sm">
              <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            Leave Summary
          </h3>
          <div className="space-y-5">
            {[
              { label: 'Annual Leave', data: balance.annual, from: 'from-indigo-500', to: 'to-blue-600' },
              { label: 'Casual Leave', data: balance.casual, from: 'from-sky-400', to: 'to-cyan-500' },
              { label: 'Medical Leave', data: balance.medical, from: 'from-rose-500', to: 'to-orange-500' },
            ].map(({ label, data, from, to }) => {
              if (!data) return null;
              const used = data.used || 0;
              const total = data.total || 0;
              const remaining = total - used;
              const pct = total > 0 ? (remaining / total) * 100 : 0;
              return (
                <div key={label} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                    <span className="text-slate-800 dark:text-slate-100" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 800 }}>{remaining} <span className="text-slate-400 text-xs">/ {total}</span></span>
                  </div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full bg-gradient-to-r ${from} ${to} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CV / Resume Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 p-6 md:p-8 shadow-2xl shadow-rose-100/50 dark:shadow-none hover:shadow-rose-200/50 transition-shadow flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-black text-xl mb-2 flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/50 flex items-center justify-center border border-rose-100 dark:border-rose-800 shadow-sm">
                <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              CV / Resume
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">Upload your CV to let HR view your professional background</p>
          </div>

          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-8 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Processing CV...</span>
            </div>
          ) : employee.cvName && employee.cvData ? (
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-red-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:-translate-y-1 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Uploaded Document</div>
                  <div className="text-slate-800 dark:text-slate-100 font-bold text-sm truncate mt-1" title={employee.cvName}>
                    {employee.cvName}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <a
                  href={employee.cvData}
                  download={employee.cvName}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Download CV
                </a>
                <button
                  onClick={handleCvDelete}
                  className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group mt-auto">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 font-bold transition-colors">Click to upload CV</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">PDF or DOCX (Max 2.5MB)</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleCvUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Edit Profile Modal - Glassmorphism */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
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
                  <p className="text-white/70 font-bold text-sm mt-0.5">Edit your contact details or password</p>
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
                  <span className="w-8 h-px bg-white/20"></span> Contact Info
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="phone">Phone Number</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all shadow-inner hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="address">Address</label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-4 top-4 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <textarea
                      id="address"
                      rows="2"
                      value={address}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nonSpaceCount = val.replace(/\s/g, '').length;
                        if (nonSpaceCount <= 50 || val.length < (address || '').length) {
                          setAddress(val);
                        }
                      }}
                      placeholder="123 Main St, City, Country"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] text-white text-base font-bold placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all resize-none shadow-inner hover:bg-white/10"
                    />
                  </div>
                  <div className="text-right text-[10px] font-bold text-white/50 pr-1 mt-1 drop-shadow-sm">
                    {address?.replace(/\s/g, '').length || 0}/50
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
