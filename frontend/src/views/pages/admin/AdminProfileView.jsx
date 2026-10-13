import React, { useState } from 'react';
import { Mail, ShieldCheck, Edit2, X, Lock, Save, Loader2, AlertCircle, CheckCircle2, User, UploadCloud, Eye, EyeOff } from 'lucide-react';

export function AdminProfileView({
  adminProfile,
  handleUpdateProfile,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2 || name.trim().length > 30) {
      showToast('error', 'Name must be between 2 and 30 characters long.');
      return;
    }
    if (!/^[a-zA-Z\s.\-]+$/.test(name)) {
      showToast('error', 'Name contains invalid characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showToast('error', 'Please enter a valid email address.');
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
    const updateData = { name, email };
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

  if (!adminProfile) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const avatarText = adminProfile.name
    ? adminProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
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

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 800, fontSize: '1.75rem' }}>My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Your personal information and system administrator settings</p>
        </div>
      </div>

      {/* Unique Bento Box Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main ID Card */}
        <div className="lg:col-span-1 relative rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none group border border-white dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg">
           <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 bg-[length:200%_200%] animate-gradient opacity-10 dark:opacity-20"></div>
           <div className="relative p-8 flex flex-col items-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl h-full">
              
              <div className="relative w-32 h-32 mb-6 group/avatar">
                 <div className="absolute inset-0 bg-gradient-to-tr from-violet-400 to-indigo-500 rounded-3xl rotate-6 group-hover/avatar:rotate-12 transition-transform duration-500 blur-md opacity-60"></div>
                 <div className="relative w-full h-full bg-white rounded-3xl p-1 shadow-xl">
                    <div className="w-full h-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-violet-700 font-bold text-3xl">
                      {adminProfile.avatar && adminProfile.avatar.startsWith('data:image/') ? (
                        <img src={adminProfile.avatar} alt={adminProfile.name} className="w-full h-full object-cover" />
                      ) : (
                        avatarText
                      )}
                    </div>
                 </div>
                 <label className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 cursor-pointer hover:scale-110 hover:-rotate-6 transition-transform text-violet-600">
                    <UploadCloud className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                 </label>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{adminProfile.name}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-sm font-medium border border-violet-100 mb-8">
                 <ShieldCheck className="w-4 h-4" />
                 Super Admin
              </div>

              <button
                onClick={() => {
                  setName(adminProfile.name || '');
                  setEmail(adminProfile.email || '');
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
           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-shadow relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <ShieldCheck className="w-32 h-32 text-violet-600" />
              </div>
              <div className="w-12 h-12 bg-white text-violet-600 rounded-2xl flex items-center justify-center mb-6 border border-violet-100 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Permissions</p>
              <p className="text-slate-800 font-bold text-lg">All System Controls</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-shadow relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Mail className="w-32 h-32 text-indigo-600" />
              </div>
              <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Email Address</p>
              <p className="text-slate-800 font-bold text-lg truncate">{adminProfile.email}</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-shadow relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <User className="w-32 h-32 text-fuchsia-600" />
              </div>
              <div className="w-12 h-12 bg-white text-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 border border-fuchsia-100 shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Account Type</p>
              <p className="text-slate-800 font-bold text-lg">Super Admin</p>
           </div>

           <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-shadow relative overflow-hidden flex flex-col justify-center items-center group">
              <div className="text-center transform transition-transform group-hover:scale-105 duration-300">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-emerald-100 mb-4 relative shadow-sm">
                    <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-20"></div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                 </div>
                 <p className="text-slate-500 text-sm font-medium mb-1">Account Status</p>
                 <p className="text-emerald-600 font-bold text-xl capitalize">Active</p>
              </div>
           </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95">
            {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl opacity-50 transition-opacity duration-1000 -z-10 pointer-events-none" />
            
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
                  <span className="w-8 h-px bg-white/20"></span> Personal Info
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1 drop-shadow-sm" htmlFor="name">Full Name</label>
                  <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Admin User"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@system.com"
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
                    {(password || confirmPassword) && (
                      <p className={`text-[10px] font-black uppercase tracking-widest pl-1 transition-colors ${passwordsMatch ? 'text-emerald-400' : 'text-rose-300'}`}>
                        {passwordsMatch ? '(Match)' : '(Not match)'}
                      </p>
                    )}
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
