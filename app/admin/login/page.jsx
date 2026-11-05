'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  useEffect(() => {
    // Check if redirect is due to session expiration
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('expired') === 'true') {
        setError('Sesi Anda telah berakhir. Silakan masuk kembali.');
        // Clean URL to avoid showing the message repeatedly if refreshed
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // If already logged in, redirect directly to dashboard
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (isLoggedIn) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    if (!captchaToken) {
      setError('Silakan selesaikan verifikasi reCAPTCHA terlebih dahulu.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          captcha_token: captchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save to localStorage
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('rememberAdmin', 'true');
        }

        // Save to Cookie for better reliability (e.g. CSRF/SSR/Session)
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60; // 30 days or 2 hours
        document.cookie = `adminToken=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `isAdminLoggedIn=true; path=/; max-age=${maxAge}; SameSite=Lax`;

        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Username atau Password yang Anda masukkan salah.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat menghubungkan ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">

      {/* Soft Elegant Background Gradients */}
      <div className="absolute top-[-10rem] left-[-10rem] w-[35rem] h-[35rem] bg-[#561C24]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-10rem] right-[-10rem] w-[35rem] h-[35rem] bg-[#80424a]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Card Container */}
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl relative z-10 transition-all duration-300">

        {/* Back Link to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-coffee-dark transition-colors absolute top-6 left-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Portal Warga
        </Link>

        {/* Brand Header */}
        <div className="text-center mt-4 mb-8 space-y-3.5">
          <div className="mx-auto w-16 h-16 rounded-full bg-white p-1 flex items-center justify-center shadow-md border-2 border-[#561C24]/20 animate-pulse">
            <img
              src="/logo-satpolpp.png"
              alt="Logo Satpol PP"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black tracking-wider text-coffee-dark uppercase leading-none">
              SIPPOL-PP BULELENG
            </h1>
            <p className="text-[9px] text-coffee-medium font-black uppercase tracking-widest">
              Portal Administrasi Internal
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-250 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800 shadow-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-bold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Masukkan username admin"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-coffee-medium focus:ring-2 focus:ring-coffee-cream/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-coffee-medium focus:ring-2 focus:ring-coffee-cream/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Google reCAPTCHA v2 */}
          <div className="flex justify-center py-1">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfNrjYtAAAAACTzDq41xhx2sj-19GKt_fgxp57x"}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          {/* Remember Me & Help Text */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 select-none py-1">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-coffee-medium focus:ring-coffee-cream/30 cursor-pointer"
              />
              Ingat Saya
            </label>
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => alert("Silakan hubungi Kepala Bidang SDA untuk mereset kredensial.")}>
              Lupa Password?
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-coffee-dark to-coffee-medium hover:from-coffee-medium hover:to-coffee-dark text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] select-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Otorisasi Masuk...
              </>
            ) : (
              <>
                Masuk Sistem <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-8 bg-slate-50 border border-slate-200/85 rounded-xl p-4 text-left space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-coffee-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-coffee-medium" /> Data Uji Coba (Demo Mode)
          </h4>
          <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
            Gunakan username <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800 font-mono">admin</code> dan password <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-800 font-mono">admin</code> untuk menguji akses penuh ke dasbor admin.
          </p>
        </div>

      </div>
    </div>
  );
}
