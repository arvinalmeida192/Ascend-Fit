import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, Plus, Calendar, TrendingUp, Target,
  Flame, Zap, Activity, ChevronRight, Award
} from 'lucide-react';

const RANK_ORDER = [
  "Iron I","Iron II","Iron III","Iron IV","Iron V",
  "Bronze I","Bronze II","Bronze III","Bronze IV","Bronze V",
  "Silver I","Silver II","Silver III","Silver IV","Silver V",
  "Gold I","Gold II","Gold III","Gold IV","Gold V",
  "Platinum I","Platinum II","Platinum III","Platinum IV","Platinum V",
  "Diamond I","Diamond II","Diamond III","Diamond IV","Diamond V",
  "Emerald I","Emerald II","Emerald III","Emerald IV","Emerald V",
  "Ruby I","Ruby II","Ruby III","Ruby IV","Ruby V",
  "Sapphire I","Sapphire II","Sapphire III","Sapphire IV","Sapphire V",
  "Ascendant I","Ascendant II","Ascendant III","Ascendant IV","Ascendant V",
];

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

function getNextRank(currentRank) {
  const idx = RANK_ORDER.indexOf(currentRank);
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : "MAX RANK";
}

function getRankProgress(rankPoints, currentRank) {
  const idx = RANK_ORDER.indexOf(currentRank);
  // Points needed scales up: early ranks cheap, later ranks expensive
  const basePoints = 500;
  const pointsForNext = Math.round(basePoints * Math.pow(1.35, idx));
  const prevThreshold = idx === 0 ? 0 : Math.round(basePoints * Math.pow(1.35, idx - 1));
  const progress = Math.min(((rankPoints - prevThreshold) / (pointsForNext - prevThreshold)) * 100, 100);
  return { progress: Math.max(0, progress), pointsForNext, pointsLeft: Math.max(0, pointsForNext - rankPoints) };
}

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [totalWorkoutCount, setTotalWorkoutCount] = useState(0);
  const [todayNutrition, setTodayNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      // User data
      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.exists() ? userSnap.data() : {};
      setUserData(user);

      // Recent workouts (last 5)
      try {
        const wq = query(
          collection(db, "workouts"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const wSnap = await getDocs(wq);
        setRecentWorkouts(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Total count
        const countSnap = await getCountFromServer(
          query(collection(db, "workouts"), where("userId", "==", uid))
        );
        setTotalWorkoutCount(countSnap.data().count);
      } catch (_) {}

      // Today's nutrition
      const today = new Date().toISOString().split('T')[0];
      try {
        const nq = query(
          collection(db, "nutrition"),
          where("userId", "==", uid),
          where("date", "==", today)
        );
        const nSnap = await getDocs(nq);
        if (!nSnap.empty) {
          setTodayNutrition(nSnap.docs[0].data());
        }
      } catch (_) {}

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const rank = userData?.currentRank || "Iron I";
  const rankPoints = userData?.rankPoints || 0;
  const rankColor = getRankColor(rank);
  const nextRank = getNextRank(rank);
  const { progress, pointsLeft } = getRankProgress(rankPoints, rank);

  const calorieGoal = userData?.calorieGoal || 2500;
  const caloriesConsumed = todayNutrition?.totalCalories || 0;
  const proteinConsumed = todayNutrition?.totalProtein || 0;
  const carbsConsumed = todayNutrition?.totalCarbs || 0;
  const fatConsumed = todayNutrition?.totalFat || 0;
  const proteinGoal = userData?.proteinGoal || Math.round(calorieGoal * 0.3 / 4);
  const carbsGoal = userData?.carbsGoal || Math.round(calorieGoal * 0.4 / 4);
  const fatGoal = userData?.fatGoal || Math.round(calorieGoal * 0.3 / 9);

  const caloriePct = Math.min((caloriesConsumed / calorieGoal) * 100, 100);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-zinc-950 min-h-screen">

      {/* Header */}
      <div className="flex flex-col justify-between items-start mb-6 md:mb-10 gap-3">
        <div>
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            Welcome back, {userData?.name?.split(" ")[0] || "Athlete"} 👋
          </h1>
          <p className="text-zinc-400 mt-1">Here's your fitness snapshot for today.</p>
        </div>

        {/* Rank Badge */}
        <div className="flex items-center gap-3 bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-800 self-start">
          <Award style={{ color: rankColor }} className="w-8 h-8 md:w-10 md:h-10" />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Current Rank</p>
            <p className="text-xl md:text-2xl font-bold" style={{ color: rankColor }}>{rank}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">

          {/* Calorie Ring + Macros */}
          <div className="bg-zinc-900 rounded-3xl p-4 md:p-8 border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="text-orange-500" size={20} /> Today's Nutrition
              </h3>
              <button
                onClick={() => navigate('/app/nutrition')}
                className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1"
              >
                Log Meal <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Calorie Circle */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="65" fill="none" stroke="#27272a" strokeWidth="14" />
                  <circle
                    cx="80" cy="80" r="65" fill="none"
                    stroke="#f97316" strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 65}`}
                    strokeDashoffset={`${2 * Math.PI * 65 * (1 - caloriePct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-white">{caloriesConsumed}</p>
                  <p className="text-xs text-zinc-500">/ {calorieGoal} kcal</p>
                </div>
              </div>

              {/* Macros */}
              <div className="flex-1 space-y-4 w-full">
                {[
                  { label: "Protein", consumed: proteinConsumed, goal: proteinGoal, color: "bg-blue-500" },
                  { label: "Carbs", consumed: carbsConsumed, goal: carbsGoal, color: "bg-green-500" },
                  { label: "Fat", consumed: fatConsumed, goal: fatGoal, color: "bg-yellow-500" },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{m.label}</span>
                      <span className="text-white">{m.consumed}g <span className="text-zinc-500">/ {m.goal}g</span></span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-2 ${m.color} rounded-full transition-all`}
                        style={{ width: `${Math.min((m.consumed / m.goal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Workouts */}
          <div className="bg-zinc-900 rounded-3xl p-4 md:p-8 border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Dumbbell className="text-orange-500" size={20} /> Recent Workouts
              </h3>
              <button
                onClick={() => navigate('/app/workouts')}
                className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1"
              >
                Log Workout <ChevronRight size={16} />
              </button>
            </div>

            {recentWorkouts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-700 rounded-2xl">
                No workouts logged yet. Start lifting!
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkouts.map(w => (
                  <div key={w.id} className="flex items-center justify-between bg-zinc-800 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <Dumbbell className="text-orange-500" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{w.split} Day</p>
                        <p className="text-sm text-zinc-400">{w.date} · {w.exercises?.length || 0} exercises</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-500 font-semibold">{w.totalVolume?.toLocaleString()} kg</p>
                      <p className="text-xs text-zinc-500">total volume</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">

          {/* Rank Progress */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} /> Rank Progress
            </h3>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: rankColor }} className="font-semibold">{rank}</span>
              <span className="text-zinc-400">{nextRank}</span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: rankColor }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-zinc-500">
              <span>{rankPoints} pts</span>
              <span>{pointsLeft} pts to {nextRank}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-5">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Activity size={18} className="text-orange-500" />
                  <span className="text-sm">Total Workouts</span>
                </div>
                <span className="font-bold text-white">{totalWorkoutCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Zap size={18} className="text-orange-500" />
                  <span className="text-sm">Bodyweight</span>
                </div>
                <span className="font-bold text-white">{userData?.weight || "--"} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Target size={18} className="text-orange-500" />
                  <span className="text-sm">Calorie Goal</span>
                </div>
                <span className="font-bold text-white">{calorieGoal} kcal</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-5">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/app/workouts')}
                className="w-full bg-orange-500 hover:bg-orange-600 transition py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Log Workout
              </button>
              <button
                onClick={() => navigate('/app/nutrition')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 transition py-3 rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Log Meal
              </button>
              <button
                onClick={() => navigate('/app/rankings')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 transition py-3 rounded-2xl font-medium flex items-center justify-center gap-2"
              >
                <Award size={18} /> View Rankings
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}