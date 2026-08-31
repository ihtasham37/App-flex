import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, LogIn, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../../context/SettingsContext';

export default function Login() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user: loggedInUser } = await signInWithEmailAndPassword(auth, email, password);
      const isAdminUser = loggedInUser.email?.toLowerCase().includes('admin') || 
                          loggedInUser.email?.toLowerCase() === 'aliihtasham10@gmail.com';
      if (isAdminUser && from === "/") {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-12 text-center"
      >
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <Zap size={40} className="text-blue-600 fill-blue-600" />
              <h1 className="text-5xl font-black text-slate-900 tracking-tight italic uppercase">
                {settings.appName || 'AppFlix'}
              </h1>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Account Access</h2>
        </div>

        <div className="space-y-6">
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F8FAFF] px-4 text-slate-400 font-bold tracking-widest">OR</span>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-white rounded-full flex items-center justify-center gap-3 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all font-bold text-slate-700"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Sign with Google
            </button>

            <button 
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              className="w-full h-14 bg-white rounded-full flex items-center justify-center gap-3 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all font-bold text-slate-700"
            >
              <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <ArrowRight size={12} className="text-white" />
              </div>
              Login with Email
            </button>
          </div>

          {showEmailLogin && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleLogin} 
              className="space-y-4 pt-4 text-left"
            >
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-2xl"
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-2xl"
              />
              {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
              <Button type="submit" variant="gradient" className="w-full h-12 rounded-2xl font-bold" loading={loading}>
                Continue
              </Button>
            </motion.form>
          )}
        </div>

        <div className="pt-8 text-center space-y-4">
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Signon authentication
          </p>
          <div className="flex justify-center gap-6">
             <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create Account</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
