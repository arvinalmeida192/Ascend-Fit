import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  User, Target, Scale, Ruler, Flame, Award, Dumbbell,
  Save, Edit2, TrendingUp, Calendar, Activity, LogOut, Check, X
} from 'lucide-react';

const RANK_COLORS = {
  Iron: "#9ca3af", Bronze: "#cd7f32", Silver: "#c0c0c0",
  Gold: "#fbbf24", Platinum: "#e2e8f0", Diamond: "#67e8f9",
  Emerald: "#34d399", Ruby: "#f87171", Sapphire: "#60a5fa",
  Ascendant: "#f97316"
};

function getRankColor(rank) {
  const tier = rank?.split(" ")[0];
  return RANK_COLORS[tier] || "#f97316";
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const hm = height / 100;
  return (weight / (hm * hm)).toFixed(1);
}

function getBMILabel(bmi) {
  if (!bmi) return { label: '—', color: 'text-zinc-500' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (bmi < 25)   return { label: 'Normal', color: 'text-green-400' };
  if (bmi < 30)   return { label: 'Overweight', color: 'text-yellow-400' };
  return { label: 'Obese', color: 'text-red-400' };
}

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [workoutStats, setWorkoutStats] = useState({ count: 0, totalVolume: 0, totalCalories: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'goals' | 'stats'
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', weight: '', height: '', dob: '',
    gender: 'Male', experience: 'Beginner',
    calorieGoal: 2500, proteinGoal: '', carbsGoal: '', fatGoal: '',
    targetWeight: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const d = snap.data();
        setUserData(d);
        setForm({
          name: d.name || '',
          weight: d.weight || '',
          height: d.height || '',
          dob: d.dob || '',
          gender: d.gender || 'Male',
          experience: d.experience || 'Beginner',
          calorieGoal: d.calorieGoal || 2500,
          proteinGoal: d.proteinGoal || Math.round((d.calorieGoal || 2500) * 0.3 / 4),
          carbsGoal: d.carbsGoal || Math.round((d.calorieGoal || 2500) * 0.4 / 4),
          fatGoal: d.fatGoal || Math.round((d.calorieGoal || 2500) * 0.3 / 9),
          targetWeight: d.targetWeight || '',
        });
      }

      // Workout stats
      try {
        const wq = query(collection(db, "workouts"), where("userId", "==", uid));
        const wSnap = await getDocs(wq);
        const workouts = wSnap.docs.map(d => d.data());
        setWorkoutStats({
          count: workouts.length,
          totalVolume: workouts.reduce((t, w) => t + (w.totalVolume || 0), 0),
          totalCalories: workouts.reduce((t, w) => t + (w.caloriesBurned || 0), 0),
        });
      } catch (_) {}

      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      const updates = {
        name: form.name,
        weight: parseFloat(form.weight) || userData?.weight,
        height: parseFloat(form.height) || userData?.height,
        dob: form.dob,
        gender: form.gender,
        experience: form.experience,
        calorieGoal: parseInt(form.calorieGoal) || 2500,
        proteinGoal: parseInt(form.proteinGoal) || null,
        carbsGoal: parseInt(form.carbsGoal) || null,
        fatGoal: parseInt(form.fatGoal) || null,
        targetWeight: parseFloat(form.targetWeight) || null,
      };
      await updateDoc(doc(db, "users", uid), updates);
      setUserData(p => ({ ...p, ...updates }));
      setEditMode(false);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading profile...</div>
      </div>
    );
  }

  const rank = userData?.currentRank || "Iron I";
  const rankColor = getRankColor(rank);
  const age = calcAge(userData?.dob);
  const bmi = calcBMI(userData?.weight, userData?.height);
  const bmiInfo = getBMILabel(parseFloat(bmi));
  const joinDate = userData?.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || '—';

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">Profile</h1>
            <p className="text-zinc-400 mt-1">Your stats, goals, and settings.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl text-sm font-medium transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Profile hero card */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center border-2 flex-shrink-0 text-3xl font-bold"
              style={{ borderColor: rankColor, backgroundColor: rankColor + "15", color: rankColor }}
            >
              {(userData?.name || "?")[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{userData?.name || "Athlete"}</h2>
              <p className="text-zinc-400 text-sm">{userData?.email || auth.currentUser?.email}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full border"
                  style={{ color: rankColor, borderColor: rankColor + "40", backgroundColor: rankColor + "15" }}
                >
                  {rank}
                </span>
                <span className="text-sm text-zinc-500 px-3 py-1 rounded-full bg-zinc-800">
                  {userData?.experience || "Beginner"}
                </span>
                {age && (
                  <span className="text-sm text-zinc-500 px-3 py-1 rounded-full bg-zinc-800">
                    {age} yrs
                  </span>
                )}
                <span className="text-sm text-zinc-500 px-3 py-1 rounded-full bg-zinc-800">
                  Member since {joinDate}
                </span>
              </div>
            </div>

            <button
              onClick={() => { setEditMode(!editMode); setActiveSection('profile'); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium text-sm transition flex-shrink-0 ${
                editMode ? 'bg-zinc-700 text-zinc-300' : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {editMode ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
            </button>
          </div>

          {/* Body metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800">
            {[
              { icon: Scale, label: "Weight", value: `${userData?.weight || '—'} kg` },
              { icon: Ruler, label: "Height", value: `${userData?.height || '—'} cm` },
              { icon: Activity, label: "BMI", value: bmi || '—', sub: bmiInfo.label, subColor: bmiInfo.color },
              { icon: Calendar, label: "Gender", value: userData?.gender || '—' },
            ].map(item => (
              <div key={item.label} className="bg-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon size={14} className="text-orange-500" />
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">{item.label}</p>
                </div>
                <p className="text-xl font-bold text-white">{item.value}</p>
                {item.sub && <p className={`text-xs mt-0.5 ${item.subColor}`}>{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'profile', label: 'Edit Info' },
            { key: 'goals', label: 'My Goals' },
            { key: 'stats', label: 'All-Time Stats' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveSection(t.key); if (t.key !== 'profile') setEditMode(false); if (t.key === 'profile') setEditMode(true); }}
              className={`px-5 py-2.5 rounded-2xl font-medium transition text-sm ${
                activeSection === t.key ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* EDIT PROFILE SECTION */}
        {activeSection === 'profile' && (
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="text-orange-500" size={20} /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Full Name</label>
                <input
                  type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Date of Birth</label>
                <input
                  type="date" name="dob" value={form.dob} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Gender</label>
                <select
                  name="gender" value={form.gender} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Training Experience</label>
                <select
                  name="experience" value={form.experience} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Beginner">Beginner (0–1 year)</option>
                  <option value="Intermediate">Intermediate (1–3 years)</option>
                  <option value="Advanced">Advanced (3+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Weight (kg)</label>
                <input
                  type="number" step="0.1" name="weight" value={form.weight} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Height (cm)</label>
                <input
                  type="number" step="0.1" name="height" value={form.height} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile} disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-8 py-3 rounded-2xl font-semibold flex items-center gap-2 transition"
              >
                {saving ? <><Save size={16} /> Saving...</> : <><Check size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}

        {/* GOALS SECTION */}
        {activeSection === 'goals' && (
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="text-orange-500" size={20} /> My Goals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-zinc-400 text-sm mb-2">
                  <Flame className="inline mr-1 text-orange-500" size={14} />
                  Daily Calorie Goal (kcal)
                </label>
                <input
                  type="number" name="calorieGoal" value={form.calorieGoal} onChange={handleChange}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-zinc-600 mt-1.5">Recommended: 2000–3500 kcal depending on activity level</p>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Daily Protein Goal (g)</label>
                <input
                  type="number" name="proteinGoal" value={form.proteinGoal} onChange={handleChange}
                  placeholder={`Auto: ${Math.round(form.calorieGoal * 0.3 / 4)}g`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Daily Carbs Goal (g)</label>
                <input
                  type="number" name="carbsGoal" value={form.carbsGoal} onChange={handleChange}
                  placeholder={`Auto: ${Math.round(form.calorieGoal * 0.4 / 4)}g`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Daily Fat Goal (g)</label>
                <input
                  type="number" name="fatGoal" value={form.fatGoal} onChange={handleChange}
                  placeholder={`Auto: ${Math.round(form.calorieGoal * 0.3 / 9)}g`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Target Weight (kg)</label>
                <input
                  type="number" step="0.1" name="targetWeight" value={form.targetWeight} onChange={handleChange}
                  placeholder="e.g. 80"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Macro ratio preview */}
            <div className="mt-6 bg-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Macro Ratio Preview</p>
              <div className="flex gap-2 h-4 rounded-full overflow-hidden">
                <div className="bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round((form.proteinGoal * 4 / form.calorieGoal) * 100) || 30}%` }} />
                <div className="bg-green-500 rounded-full transition-all" style={{ width: `${Math.round((form.carbsGoal * 4 / form.calorieGoal) * 100) || 40}%` }} />
                <div className="bg-yellow-500 rounded-full transition-all" style={{ width: `${Math.round((form.fatGoal * 9 / form.calorieGoal) * 100) || 30}%` }} />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-blue-400">● Protein</span>
                <span className="text-green-400">● Carbs</span>
                <span className="text-yellow-400">● Fat</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile} disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-8 py-3 rounded-2xl font-semibold flex items-center gap-2 transition"
              >
                {saving ? <><Save size={16} /> Saving...</> : <><Check size={16} /> Save Goals</>}
              </button>
            </div>
          </div>
        )}

        {/* ALL-TIME STATS SECTION */}
        {activeSection === 'stats' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Dumbbell, label: "Total Workouts", value: workoutStats.count, color: "text-orange-500" },
                { icon: TrendingUp, label: "Total Volume Lifted", value: `${workoutStats.totalVolume.toLocaleString()} kg`, color: "text-blue-400" },
                { icon: Flame, label: "Total Calories Burned", value: `${workoutStats.totalCalories.toLocaleString()} kcal`, color: "text-green-400" },
                { icon: Award, label: "Current Rank", value: rank, color: "text-yellow-400", valueStyle: { color: rankColor } },
                { icon: Activity, label: "Rank Points", value: (userData?.rankPoints || 0).toLocaleString(), color: "text-purple-400" },
                { icon: Scale, label: "Current Weight", value: `${userData?.weight || '—'} kg`, color: "text-pink-400" },
              ].map(stat => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                  <stat.icon size={20} className={`${stat.color} mb-3`} />
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p
                    className="text-2xl font-bold text-white"
                    style={stat.valueStyle || {}}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Averages */}
            {workoutStats.count > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <h3 className="font-semibold text-white mb-4">Workout Averages</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Avg Volume/Session", value: `${Math.round(workoutStats.totalVolume / workoutStats.count).toLocaleString()} kg` },
                    { label: "Avg Calories/Session", value: `${Math.round(workoutStats.totalCalories / workoutStats.count).toLocaleString()} kcal` },
                    { label: "Pts per Workout", value: `${Math.round((userData?.rankPoints || 0) / workoutStats.count)} pts` },
                  ].map(a => (
                    <div key={a.label} className="bg-zinc-800 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{a.label}</p>
                      <p className="text-xl font-bold text-white">{a.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}