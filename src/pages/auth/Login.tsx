import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Lock, User, Key, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        // Create user doc if it doesn't exist (e.g., first time login)
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || 'Staff User',
          email: firebaseUser.email,
          role: 'staff',
          createdAt: serverTimestamp()
        });
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          role: 'staff',
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError(null);
    const adminEmail = 'admin@store.com';
    const adminPass = 'admin123';
    try {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (signInErr: any) {
        // If user doesn't exist, create them
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          const createRes = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
          const firebaseUser = createRes.user;
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: 'Admin User',
            email: adminEmail,
            role: 'admin',
            createdAt: serverTimestamp()
          });
        } else {
          throw signInErr;
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error("Quick Login Error:", err);
      setError('Quick login failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#fdf0d5] p-4 overflow-hidden font-sans">
      {/* Side Corner Design (The Frame Effect from the image) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f39c12]/20 via-transparent to-[#f39c12]/20 pointer-events-none z-0" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(243,156,18,0.1)] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[420px] bg-white rounded-none shadow-2xl overflow-hidden pt-12 pb-16 px-10 flex flex-col items-center z-10 mx-4"
      >
        {/* Logo Section */}
        <div className="mb-10">
          <img 
            src="https://raw.githubusercontent.com/johnlawrencemartinez/sariconnect-assets/main/logo.png" 
            alt="SariConnect Logo" 
            className="h-36 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = "https://api.iconify.design/lucide:store.svg?color=%23f39c12";
            }}
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-black mb-10 tracking-tight">Admin Login</h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] rounded-none font-bold text-center mb-6"
            >
              {error}
            </motion.div>
          )}

          <div className="w-full space-y-4 mb-8">
            {/* Email Input */}
            <div className="relative">
              <input
                {...register('email')}
                type="email"
                placeholder="Admin Email ID"
                className="w-full bg-[#e9ecef] rounded-none px-6 py-4 text-slate-700 font-bold placeholder:text-slate-400 outline-none transition-all border-none focus:ring-2 focus:ring-[#f39c12]/20"
              />
              {errors.email && (
                <p className="mt-1 text-[9px] text-rose-500 font-bold uppercase tracking-wider pl-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full bg-[#e9ecef] rounded-none px-6 py-4 text-slate-700 font-bold placeholder:text-slate-400 outline-none transition-all border-none focus:ring-2 focus:ring-[#f39c12]/20"
              />
              {errors.password && (
                <p className="mt-1 text-[9px] text-rose-500 font-bold uppercase tracking-wider pl-2">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Login Button - Centered and specific width like image */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-[85%] bg-[#fdf0d5] hover:bg-[#fae1b0] text-black font-black text-lg py-3.5 rounded-none transition-all active:scale-[0.98] shadow-sm disabled:opacity-70 flex items-center justify-center mb-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Log In"
            )}
          </button>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-[85%] border-2 border-black text-black font-bold text-sm py-3 rounded-none transition-all active:scale-[0.98] shadow-sm disabled:opacity-70 flex items-center justify-center mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </button>

          {/* Forgot Password */}
          <button
            type="button"
            className="text-[#f39c12] font-bold text-xs hover:underline transition-all mb-10"
          >
            Forgot Password?
          </button>

          {/* Bottom Decorative Line */}
          <div className="w-full h-[1px] bg-black/20" />
        </form>
      </motion.div>
    </div>
  );
};
