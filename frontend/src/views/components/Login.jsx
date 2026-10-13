import { useState, useEffect } from 'react';
import {
  User, IdCard, Briefcase, Shield, Users, Building2,
  Activity, CalendarDays, Mail, Lock, Eye, EyeOff, LogIn
} from 'lucide-react';
import logoImg from '../../assets/AppZLogo.png';
import appzMakersLogo from '../../assets/APPZ New Logo.png';
import bgVideo from '../../assets/Employee_Enters_Office_Lobby_GIF.mp4';
import eveningRobImg from '../../assets/EveningRob.png';

const roles = [
  { id: 'employee', label: 'Employee', icon: User },
  { id: 'hr', label: 'HR Manager', icon: IdCard },
  { id: 'company', label: 'Client/Lead', icon: Briefcase },
  { id: 'superadmin', label: 'Super Admin', icon: Shield },
];

const roleContents = {
  employee: {
    title: <>Your daily workspace<br /> in a single platform.</>,
    description: "Access your dashboard, log attendance, request leaves, and view your schedule all in one place."
  },
  hr: {
    title: <>Manage your workforce<br /> seamlessly.</>,
    description: "Oversee employee records, approve leaves, monitor attendance, and generate reports."
  },
  company: {
    title: <>Client & Lead<br /> operations portal.</>,
    description: "Stay connected with real-time sync, manage your team accounts, and monitor progress securely."
  },
  superadmin: {
    title: <>Complete system<br /> administration control.</>,
    description: "Configure portal settings, manage user access across all roles, and oversee platform operations."
  },
  default: {
    title: <>Unified workforce<br /> operations in a single platform.</>,
    description: "Track attendance, manage leaves, configure client/lead accounts, and synchronize shifts seamlessly across your entire organization."
  }
};

export function Login({
  mode,
  setMode,
  toggleMode,
  selectedRole,
  setSelectedRole,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPass,
  setShowPass,
  handleLogin,
  handleSignup,
  handleForgotPassword,
  error,
  setError,
  loading,
}) {
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  const [forgotEmail, setForgotEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const msg = await handleForgotPassword(forgotEmail);
      setSuccessMessage(msg);
      setForgotEmail('');
    } catch (err) {
      // error set by parent handler
    } finally {
      setForgotLoading(false);
    }
  };

  const currentContent = roleContents[selectedRole] || roleContents.default;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col-reverse lg:flex-row bg-[#090d16] relative" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Full Page Video Background Element */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Navy color overlay filter */}
        <div className="absolute inset-0 bg-[#0f0c2e]/80 z-10" />

        {/* SVG Dot Grid Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] z-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#5b4cf5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>

        {/* Soft Blurred Circles (depth shadows) */}
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-[#5b4cf5]/20 rounded-full blur-[100px] z-20" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-900/25 rounded-full blur-[100px] z-20" />
      </div>

      {/* LEFT PANEL (44% width on desktop) — Dark branded side, transparent layout overlaying background video */}
      <div className="hidden lg:flex lg:w-[44%] p-8 sm:p-12 lg:p-16 flex-col justify-between relative overflow-hidden flex-shrink-0 h-screen z-10 bg-transparent">

        {/* Top Section: Logo Block & Trust Badges */}
        <div className="relative z-30 space-y-4">
          <div className="flex flex-col items-start gap-2">
            <div className="p-2">
              <img src={logoImg} alt="AppzMaker Logo" className="h-32 sm:h-44 lg:h-56 w-auto object-contain max-w-full drop-shadow-xl" />
            </div>
            <div className="text-[#a59bfb] text-sm uppercase font-extrabold tracking-widest mt-1 pl-1">Workforce Solutions</div>
          </div>

          <div className="flex gap-3 pt-2">
            <span className="px-4 py-2 border border-[#2e2880] rounded-full text-xs font-extrabold text-[#a59bfb] bg-[#1a1550]/60 uppercase tracking-wider">Real-time Sync</span>
          </div>
        </div>

        {/* Middle Section: Hero Text & Stat Cards */}
        <div className="relative z-30 my-4 lg:my-0 space-y-6">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              {currentContent.title}
            </h1>
            <p className="text-[#40d6a2] text-base sm:text-lg leading-relaxed">
              {currentContent.description}
            </p>
          </div>

        </div>

        {/* Bottom Section: Footer Copyright */}
        <div className="relative z-30 text-slate-300/90 text-sm pt-4 border-t border-[#2e2880]/50">
          <div>© 2026 AppZ Makers. All rights reserved.</div>
          <div className="mt-1">
            Developed By{' '}
            <div className="relative inline-block group cursor-pointer text-[#a59bfb] hover:text-white font-semibold transition-colors">
              AppZ  Makers
              {/* Hover Tooltip Box */}
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/10 backdrop-blur-3xl text-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:-translate-y-1 z-50 pointer-events-auto">
                <div className="flex flex-col items-center text-center gap-3">
                  <img src={appzMakersLogo} alt="AppZ Makers" className="h-16 w-auto object-contain drop-shadow-sm mb-1" />
                  <div className="text-[13px] font-extrabold text-white leading-snug">Developed by the<br/>AppZCuberorior Team</div>
                  <a href="https://appzmake.com" target="_blank" rel="noreferrer" className="text-[#40d6a2] font-bold hover:underline text-sm transition-colors hover:text-emerald-400">https://appzmake.com</a>
                  <div className="text-[11px] text-white/70 font-bold mt-1">Click here to visit our official website.</div>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-6 -mt-[6px] w-3 h-3 bg-white/10 backdrop-blur-3xl rotate-45 transform border-b border-r border-white/20"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL (56% width on desktop) — Glassmorphic box form side */}
      <div className="flex-1 overflow-y-auto h-screen z-10 bg-transparent">
        <div className="min-h-full flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
          {/* Blurred Login Box Container */}
          <div className="w-full max-w-lg relative z-30">
            <div className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[32px] p-8 sm:p-10 space-y-6 relative overflow-hidden group">
              {/* Subtle liquid glow inside */}
            <div className="absolute -inset-24 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-1000 -z-10" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Logo on Mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="p-2">
                <img src={logoImg} alt="AppzMaker Logo" className="w-36 sm:w-48 h-auto object-contain drop-shadow-xl" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <span className="text-[#a59bfb] text-[10px] font-extrabold uppercase tracking-widest block">Welcome back</span>
              <h2 className="text-white text-[20px] sm:text-3xl font-extrabold tracking-tight whitespace-nowrap drop-shadow-md">
                {isForgot ? 'Reset Password' : 'Sign in to your AppZ TeamorA'}
              </h2>
              <p className="text-white/70 text-sm">
                {isForgot ? 'Enter your email address to get a password reset link' : 'Select your role and sign in to continue'}
              </p>
            </div>

            {/* Role selector */}
            {!isForgot && (
              <div className="space-y-2.5">
                <label className="block text-white/70 text-[10px] uppercase font-bold tracking-wider">Choose Portal Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 bg-white/5 backdrop-blur-md rounded-[14px] p-1 gap-1 border border-white/10 shadow-inner">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.id);
                          setEmail('');
                          setPassword('');
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[11px] text-[11px] font-extrabold transition-all duration-300 ${isSelected
                          ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20'
                          : 'bg-transparent hover:bg-white/10 text-white/60 hover:text-white border border-transparent'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{role.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className={`p-3.5 rounded-[14px] bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 text-sm shadow-inner ${error.includes('You did not checkout properly') ? 'font-bold' : 'font-medium'}`}>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-[14px] bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-200 text-sm font-medium shadow-inner">
                {successMessage}
              </div>
            )}

            {/* Form */}
            {isForgot ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-white/70 text-[10px] uppercase font-bold tracking-wider">Email Address</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all font-medium shadow-inner"
                      placeholder="you@domain.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-400/90 hover:to-purple-400/90 disabled:opacity-60 text-white py-3.5 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/20 hover:-translate-y-0.5"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  <LogIn className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-indigo-300 hover:text-white text-xs font-bold transition-colors drop-shadow-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                {isSignup && (
                  <div className="space-y-1.5">
                    <label className="block text-white/70 text-[10px] uppercase font-bold tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] px-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all font-medium shadow-inner"
                      placeholder="Your full name"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-white/70 text-[10px] uppercase font-bold tracking-wider">Email Address</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all font-medium shadow-inner"
                      placeholder="you@domain.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-white/70 text-[10px] uppercase font-bold tracking-wider">Password</label>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within/input:text-white/80 transition-colors" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[14px] pl-11 pr-12 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all font-medium shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Utility Row */}
                <div className="flex items-center justify-end text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-indigo-300 hover:text-white font-bold transition-colors drop-shadow-sm"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-400/90 hover:to-purple-400/90 disabled:opacity-60 text-white py-3.5 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-300 font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/20 hover:-translate-y-0.5"
                >
                  {loading ? 'Please wait...' : isSignup ? 'Register Portal' : 'Sign In to Workspace'}
                  <LogIn className="w-4 h-4" />
                </button>
              </form>
            )}

            </div>
          </div>

          {/* Bottom Section: Footer Copyright (Mobile View) */}
          <div className="lg:hidden relative z-30 text-white/70 text-[10px] sm:text-xs text-center mt-8 space-y-1 font-medium">
            <div>© 2026 AppZ Makers. All rights reserved.</div>
            <div>
              Developed By{' '}
              <a href="https://appzmake.com" target="_blank" rel="noreferrer" className="text-indigo-300 font-bold hover:text-white transition-colors">
                AppZ Makers
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
