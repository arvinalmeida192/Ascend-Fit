import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile is complete
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || !userDoc.data().weight || !userDoc.data().height) {
        navigate('/complete-profile');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Dumbbell className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold text-white">Ascend Fit</h1>
          <p className="text-zinc-400 mt-2">Welcome back</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8 shadow-xl">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 pl-11 text-white focus:outline-none focus:border-orange-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-orange-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-zinc-700 flex-1"></div>
            <span className="text-zinc-500 text-sm">OR</span>
            <div className="h-px bg-zinc-700 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-center mt-8 text-zinc-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-orange-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;