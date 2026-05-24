import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Eye, EyeOff, Weight, Ruler } from 'lucide-react';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dob: '',
    weight: '',
    height: '',
    experience: 'Beginner'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        gender: formData.gender,
        dob: formData.dob,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        experience: formData.experience,
        createdAt: new Date(),
        currentRank: "Iron I",
        rankPoints: 0,
        calorieGoal: 2500,
      });

      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || !userDoc.data().weight || !userDoc.data().height) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email,
          createdAt: new Date(),
          currentRank: "Iron I",
          rankPoints: 0,
          calorieGoal: 2500,
        }, { merge: true });

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
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Dumbbell className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white">Create Account</h1>
          <p className="text-zinc-400">Start your ascent today</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white"
            />

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-zinc-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                onChange={handleChange}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select name="gender" onChange={handleChange} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input type="date" name="dob" onChange={handleChange} required className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Weight className="absolute left-4 top-4 text-zinc-500" />
                <input type="number" step="0.1" name="weight" placeholder="Weight (kg)" onChange={handleChange} required className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white" />
              </div>
              <div className="relative">
                <Ruler className="absolute left-4 top-4 text-zinc-500" />
                <input type="number" step="0.1" name="height" placeholder="Height (cm)" onChange={handleChange} required className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white" />
              </div>
            </div>

            <select name="experience" onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white">
              <option value="Beginner">Beginner (0-1 year)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-zinc-700 flex-1"></div>
            <span className="text-zinc-500 text-sm">OR</span>
            <div className="h-px bg-zinc-700 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>
        </div>

        <p className="text-center mt-6 text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;