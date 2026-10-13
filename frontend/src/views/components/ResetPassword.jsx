import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import logoImg from '../../assets/APPZ New Logo.png';
import bgVideo from '../../assets/Employee_Enters_Office_Lobby_GIF.mp4';

import { BACKEND_URL } from '../../config';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError('No reset token found in URL.');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/verify-token?token=${token}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Token is invalid or has expired.');
        }
        setIsValidToken(true);
        setEmail(data.email || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col-reverse lg:flex-row bg-[#090d16] overflow-hidden relative" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Background Video and Overlays */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-[#0f0c2e]/80 z-10" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] z-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#5b4cf5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-[#5b4cf5]/20 rounded-full blur-[100px] z-20" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-900/25 rounded-full blur-[100px] z-20" />
      </div>

      {/* LEFT PANEL - Branded */}
      <div className="hidden lg:flex lg:w-[44%] p-8 sm:p-12 lg:p-16 flex-col justify-between relative overflow-hidden flex-shrink-0 h-screen z-10 bg-transparent">
        <div className="relative z-30 space-y-8">
          <div className="flex flex-col items-start gap-4">
            <div className="bg-white/95 p-4 rounded-3xl shadow-[0_8px_30px_rgba(255,255,255,0.15)] backdrop-blur-md border border-white/20">
              <img src={logoImg} alt="AppzMaker Logo" className="w-48 h-32 object-contain" />
            </div>
            <div className="text-[#a59bfb] text-sm uppercase font-extrabold tracking-widest mt-1 pl-1">Workforce Solutions</div>
          </div>
          <div className="flex gap-3 pt-2">
            <span className="px-4 py-2 border border-[#2e2880] rounded-full text-xs font-extrabold text-[#a59bfb] bg-[#1a1550]/60 uppercase tracking-wider">Real-time Sync</span>
          </div>
        </div>

        <div className="relative z-30 my-8 lg:my-0 space-y-10">
          <div className="space-y-5 max-w-xl">
            <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Secure password<br /> recovery protocol.
            </h1>
            <p className="text-[#40d6a2] text-base sm:text-lg leading-relaxed">
              Create a new secure passphrase to restore workspace credentials and access your dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-30 text-slate-300/90 text-sm pt-4 border-t border-[#2e2880]/50">
          © 2026 Appzmaker. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Glassmorphic Box */}
      <div className="flex-1 p-6 sm:p-12 lg:p-16 flex items-center justify-center h-screen z-10 bg-transparent overflow-y-auto">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-[24px] p-8 sm:p-10 space-y-8 my-auto">

          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-24 h-24 bg-[#0f0c2e] rounded-[16px] flex items-center justify-center shadow-md border border-[#2e2880]">
              <img src={logoImg} alt="AppzMaker Logo" className="w-20 h-20 object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-slate-900 text-[20px] sm:text-3xl font-extrabold tracking-tight whitespace-nowrap">Create New Password</h2>
            <p className="text-slate-500 text-sm">
              {verifying ? 'Verifying security token...' : success ? 'Credential setup complete' : `Reset password for ${email}`}
            </p>
          </div>

          {verifying ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-10 h-10 border-4 border-[#5b4cf5] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Validating session token...</p>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Password updated successfully.</p>
                  <p className="text-xs text-emerald-600/90 mt-0.5">Your credentials have been securely configured. You can now log in.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#5b4cf5] hover:bg-[#4a3de0] text-white py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-sm"
              >
                Go to Login
              </button>
            </div>
          ) : !isValidToken ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm font-medium">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Invalid or Expired Link</p>
                  <p className="text-xs text-rose-600/90 mt-0.5">{error || 'The password reset token is invalid or has expired.'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#5b4cf5] hover:bg-[#4a3de0] text-white py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-[#fafafa]/90 border border-[#e8e8f0] rounded-[11px] pl-11 pr-12 py-3.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#5b4cf5] focus:ring-2 focus:ring-[#5b4cf5]/15 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-[#fafafa]/90 border border-[#e8e8f0] rounded-[11px] pl-11 pr-12 py-3.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#5b4cf5] focus:ring-2 focus:ring-[#5b4cf5]/15 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5b4cf5] hover:bg-[#4a3de0] disabled:opacity-60 text-white py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-sm"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
                <KeyRound className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
