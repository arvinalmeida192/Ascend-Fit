import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Dumbbell, Weight, Ruler } from 'lucide-react';

function CompleteProfile() {
  const [formData, setFormData] = useState({
    gender: 'Male',
    dob: '',
    weight: '',
    height: '',
    experience: 'Beginner'
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      // If profile already complete → skip this page
      if (userDoc.exists() && userDoc.data().height && userDoc.data().weight) {
        navigate('/app/dashboard');
      }
    };

    checkUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      // 🔥 FIX: use setDoc with merge (safe create + update)
      await setDoc(userRef, {
        gender: formData.gender,
        dob: formData.dob,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        experience: formData.experience,
      }, { merge: true });

      navigate('/app/dashboard');
    } catch (err) {
      alert("Error saving profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <Dumbbell className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
          <p className="text-zinc-400 mt-2">
            Just a few more details to personalize Ascend Fit
          </p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Weight className="absolute left-4 top-4 text-zinc-500" />
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  placeholder="Weight (kg)"
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white"
                />
              </div>

              <div className="relative">
                <Ruler className="absolute left-4 top-4 text-zinc-500" />
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  value={formData.height}
                  placeholder="Height (cm)"
                  onChange={handleChange}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pl-12 text-white"
                />
              </div>
            </div>

            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white"
            >
              <option value="Beginner">Beginner (0-1 year)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-semibold text-lg"
            >
              {loading ? "Saving..." : "Continue to Dashboard"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}

export default CompleteProfile;