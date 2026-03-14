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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      
      // Admin only check
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
                <div className="absolute inset-0 blur-lg bg-indigo-500/30 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-widest">Authenticating</h3>
                <p className="text-xs text-indigo-200/60 font-medium uppercase tracking-[0.2em] mt-1">Verifying Admin Credentials</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-b from-indigo-600/80 to-indigo-900/80 p-8 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center p-1 bg-white rounded-full shadow-2xl mb-6">
              <div className="bg-indigo-600 p-1 rounded-full overflow-hidden">
                <img 
                  src="https://raw.githubusercontent.com/johnlawrencemartinez/sariconnect-assets/main/logo.png" 
                  alt="SariConnect Logo" 
                  className="h-16 w-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "https://api.iconify.design/lucide:store.svg?color=%23ffffff";
                    e.currentTarget.className = "h-10 w-10 m-3";
                  }}
                />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Admin Portal</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-bold text-white/90 uppercase tracking-widest">Authorized Access Only</p>
            </div>
            <p className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em] mt-2">SariConnect Management System</p>
          </div>

          {/* Form Section */}
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-rose-500/20 border border-rose-500/50 text-rose-100 text-sm rounded-2xl font-medium backdrop-blur-md"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Admin Username / Email"
                    className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all font-medium"
                  />
                  {errors.email && (
                    <p className="mt-1 ml-2 text-xs text-rose-400 font-bold uppercase tracking-wider">{errors.email.message}</p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">
                    <Key className="h-5 w-5" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {errors.password && (
                    <p className="mt-1 ml-2 text-xs text-rose-400 font-bold uppercase tracking-wider">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 border-none" 
                isLoading={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secure Connection • 256-bit Encrypted</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
