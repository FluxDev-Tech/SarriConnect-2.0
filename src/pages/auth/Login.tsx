import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Lock, User, Key, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import api from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);

  const loadingMessages = [
    "Authenticating...",
    "Verifying Credentials...",
    "Connecting to Secure Server...",
    "Preparing Your Dashboard...",
    "Finalizing Setup..."
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Only administrators can access the portal.');
        setIsLoading(false);
        return;
      }

      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl"
          >
            <div className="relative flex flex-col items-center max-w-xs w-full px-6">
              {/* Animated Logo Container */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(238,77,45,0.15)] mb-10 border border-slate-50 relative z-10"
              >
                <img 
                  src="https://raw.githubusercontent.com/johnlawrencemartinez/sariconnect-assets/main/logo.png" 
                  alt="SariConnect Logo" 
                  className="h-14 w-14 object-contain"
                />
                
                {/* Orbital Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-8px] border-2 border-dashed border-brand-500/30 rounded-[2.5rem]"
                />
              </motion.div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6 relative">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="absolute top-0 left-0 h-full bg-brand-500 shadow-[0_0_10px_rgba(238,77,45,0.5)]"
                />
              </div>

              {/* Sequential Messages */}
              <div className="text-center h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                      {loadingMessages[loadingMessageIndex]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Secure Encryption Active
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side - Welcome (Hidden on mobile, shown on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#fdfdfd] relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        <div className="relative z-10 text-center max-w-md">
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(238,77,45,0.15)] mb-6 border border-slate-50"
            >
              <img 
                src="https://raw.githubusercontent.com/johnlawrencemartinez/sariconnect-assets/main/logo.png" 
                alt="SariConnect Logo" 
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://api.iconify.design/lucide:rocket.svg?color=%23ee4d2d";
                }}
              />
            </motion.div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">SariConnect</h1>
            <div className="h-1 w-12 bg-brand-500 rounded-full mt-4" />
          </div>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            The professional standard for modern store management.
          </p>
          
          <div className="mt-16 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Real-time Sales', icon: ShieldCheck },
              { label: 'Inventory Control', icon: Store },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-brand-600" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-500 mt-2 font-medium">Access your professional dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-6">
              <div className="relative group">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 group-focus-within:text-brand-600 transition-colors">
                  Email Address
                </label>
                <div className="relative flex items-center bg-slate-50 rounded-2xl border-2 border-transparent group-focus-within:border-brand-500/20 group-focus-within:bg-white transition-all px-4 py-3.5">
                  <User className="h-5 w-5 text-slate-400 mr-3 group-focus-within:text-brand-600 transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@store.com"
                    className="w-full bg-transparent outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 group-focus-within:text-brand-600 transition-colors">
                  Password
                </label>
                <div className="relative flex items-center bg-slate-50 rounded-2xl border-2 border-transparent group-focus-within:border-brand-500/20 group-focus-within:bg-white transition-all px-4 py-3.5">
                  <Key className="h-5 w-5 text-slate-400 mr-3 group-focus-within:text-brand-600 transition-colors" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-300 hover:text-brand-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(238,77,45,0.2)] border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
                isLoading={isLoading}
              >
                Sign In to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <button 
                type="button"
                className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-600 transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">Secure Administrator Access</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
