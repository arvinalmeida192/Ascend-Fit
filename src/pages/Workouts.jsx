import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, doc, getDoc, updateDoc, increment, getCountFromServer
} from 'firebase/firestore';

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

function getRankFromPoints(points) {
  const basePoints = 500;
  let threshold = 0;
  for (let i = 0; i < RANK_ORDER.length; i++) {
    threshold += Math.round(basePoints * Math.pow(1.35, i));
    if (points < threshold) return RANK_ORDER[i];
  }
  return RANK_ORDER[RANK_ORDER.length - 1];
}
import { Dumbbell, Plus, Save, Trash2, Search, ChevronDown, ChevronUp, X } from 'lucide-react';

const EXERCISES_DB = [
  { name: "Bench Press", muscle: "Chest", type: "compound" },
  { name: "Incline Bench Press", muscle: "Chest", type: "compound" },
  { name: "Decline Bench Press", muscle: "Chest", type: "compound" },
  { name: "Flat Dumbbell Press", muscle: "Chest", type: "compound" },
  { name: "Incline Dumbbell Press", muscle: "Chest", type: "compound" },
  { name: "Cable Crossover", muscle: "Chest", type: "isolation" },
  { name: "Chest Fly", muscle: "Chest", type: "isolation" },
  { name: "Pec Deck", muscle: "Chest", type: "isolation" },
  { name: "Dips", muscle: "Chest", type: "compound" },
  { name: "Push Up", muscle: "Chest", type: "compound" },
  { name: "Squat", muscle: "Quads", type: "compound" },
  { name: "Front Squat", muscle: "Quads", type: "compound" },
  { name: "Hack Squat", muscle: "Quads", type: "compound" },
  { name: "Leg Press", muscle: "Quads", type: "compound" },
  { name: "Leg Extension", muscle: "Quads", type: "isolation" },
  { name: "Bulgarian Split Squat", muscle: "Quads", type: "compound" },
  { name: "Lunges", muscle: "Quads", type: "compound" },
  { name: "Deadlift", muscle: "Back", type: "compound" },
  { name: "Romanian Deadlift", muscle: "Hamstrings", type: "compound" },
  { name: "Sumo Deadlift", muscle: "Back", type: "compound" },
  { name: "Trap Bar Deadlift", muscle: "Back", type: "compound" },
  { name: "Rack Pull", muscle: "Back", type: "compound" },
  { name: "Barbell Row", muscle: "Back", type: "compound" },
  { name: "Dumbbell Row", muscle: "Back", type: "compound" },
  { name: "Seated Cable Row", muscle: "Back", type: "compound" },
  { name: "T-Bar Row", muscle: "Back", type: "compound" },
  { name: "Lat Pulldown", muscle: "Back", type: "compound" },
  { name: "Pull Up", muscle: "Back", type: "compound" },
  { name: "Chin Up", muscle: "Back", type: "compound" },
  { name: "Meadows Row", muscle: "Back", type: "compound" },
  { name: "Pendlay Row", muscle: "Back", type: "compound" },
  { name: "Overhead Press", muscle: "Shoulders", type: "compound" },
  { name: "Seated Dumbbell Press", muscle: "Shoulders", type: "compound" },
  { name: "Arnold Press", muscle: "Shoulders", type: "compound" },
  { name: "Lateral Raise", muscle: "Shoulders", type: "isolation" },
  { name: "Front Raise", muscle: "Shoulders", type: "isolation" },
  { name: "Face Pull", muscle: "Shoulders", type: "isolation" },
  { name: "Rear Delt Fly", muscle: "Shoulders", type: "isolation" },
  { name: "Shrugs", muscle: "Traps", type: "isolation" },
  { name: "Tricep Pushdown", muscle: "Triceps", type: "isolation" },
  { name: "Overhead Tricep Extension", muscle: "Triceps", type: "isolation" },
  { name: "Close Grip Bench Press", muscle: "Triceps", type: "compound" },
  { name: "Skull Crushers", muscle: "Triceps", type: "isolation" },
  { name: "Bicep Curl", muscle: "Biceps", type: "isolation" },
  { name: "Hammer Curl", muscle: "Biceps", type: "isolation" },
  { name: "Preacher Curl", muscle: "Biceps", type: "isolation" },
  { name: "Concentration Curl", muscle: "Biceps", type: "isolation" },
  { name: "EZ Bar Curl", muscle: "Biceps", type: "isolation" },
  { name: "Leg Curl", muscle: "Hamstrings", type: "isolation" },
  { name: "Nordic Hamstring Curl", muscle: "Hamstrings", type: "isolation" },
  { name: "Good Morning", muscle: "Hamstrings", type: "compound" },
  { name: "Calf Raise", muscle: "Calves", type: "isolation" },
  { name: "Seated Calf Raise", muscle: "Calves", type: "isolation" },
  { name: "Hip Thrust", muscle: "Glutes", type: "compound" },
  { name: "Glute Bridge", muscle: "Glutes", type: "isolation" },
  { name: "Plank", muscle: "Core", type: "isolation" },
  { name: "Ab Wheel", muscle: "Core", type: "isolation" },
  { name: "Hanging Leg Raise", muscle: "Core", type: "isolation" },
  { name: "Cable Crunch", muscle: "Core", type: "isolation" },
  { name: "Russian Twist", muscle: "Core", type: "isolation" },
  { name: "Farmer's Walk", muscle: "Full Body", type: "compound" },
  { name: "Power Clean", muscle: "Full Body", type: "compound" },
  { name: "Kettlebell Swing", muscle: "Full Body", type: "compound" },
  { name: "Clean and Jerk", muscle: "Full Body", type: "compound" },
  { name: "Snatch", muscle: "Full Body", type: "compound" },
  { name: "Decline Dumbbell Press", muscle: "Chest", type: "compound" },
  { name: "Machine Chest Press", muscle: "Chest", type: "compound" },
  { name: "Smith Machine Bench Press", muscle: "Chest", type: "compound" },
  { name: "Floor Press", muscle: "Chest", type: "compound" },
  { name: "Svend Press", muscle: "Chest", type: "isolation" },
  { name: "Incline Cable Fly", muscle: "Chest", type: "isolation" },
  { name: "Decline Cable Fly", muscle: "Chest", type: "isolation" },
  { name: "Dumbbell Pullover", muscle: "Chest", type: "compound" },
  { name: "Single Arm Dumbbell Row", muscle: "Back", type: "compound" },
  { name: "Inverted Row", muscle: "Back", type: "compound" },
  { name: "Straight Arm Pulldown", muscle: "Back", type: "isolation" },
  { name: "Wide Grip Pulldown", muscle: "Back", type: "compound" },
  { name: "Close Grip Pulldown", muscle: "Back", type: "compound" },
  { name: "Machine Row", muscle: "Back", type: "compound" },
  { name: "Chest Supported Row", muscle: "Back", type: "compound" },
  { name: "Yates Row", muscle: "Back", type: "compound" },
  { name: "Superman", muscle: "Back", type: "isolation" },
  { name: "Back Extension", muscle: "Back", type: "isolation" },
  { name: "Push Press", muscle: "Shoulders", type: "compound" },
  { name: "Military Press", muscle: "Shoulders", type: "compound" },
  { name: "Seated Barbell Press", muscle: "Shoulders", type: "compound" },
  { name: "Dumbbell Upright Row", muscle: "Shoulders", type: "compound" },
  { name: "Cable Lateral Raise", muscle: "Shoulders", type: "isolation" },
  { name: "Egyptian Lateral Raise", muscle: "Shoulders", type: "isolation" },
  { name: "Cable Front Raise", muscle: "Shoulders", type: "isolation" },
  { name: "Reverse Pec Deck", muscle: "Shoulders", type: "isolation" },
  { name: "Barbell Shrug", muscle: "Traps", type: "isolation" },
  { name: "Dumbbell Shrug", muscle: "Traps", type: "isolation" },
  { name: "JM Press", muscle: "Triceps", type: "compound" },
  { name: "Tricep Kickback", muscle: "Triceps", type: "isolation" },
  { name: "Diamond Push Up", muscle: "Triceps", type: "compound" },
  { name: "Cable Overhead Tricep Extension", muscle: "Triceps", type: "isolation" },
  { name: "Incline Dumbbell Curl", muscle: "Biceps", type: "isolation" },
  { name: "Zottman Curl", muscle: "Biceps", type: "isolation" },
  { name: "Cable Bicep Curl", muscle: "Biceps", type: "isolation" },
  { name: "Reverse Grip Curl", muscle: "Biceps", type: "isolation" },
  { name: "Wrist Curl", muscle: "Forearms", type: "isolation" },
  { name: "Reverse Wrist Curl", muscle: "Forearms", type: "isolation" },
  { name: "Goblet Squat", muscle: "Quads", type: "compound" },
  { name: "Zercher Squat", muscle: "Quads", type: "compound" },
  { name: "Safety Bar Squat", muscle: "Quads", type: "compound" },
  { name: "Overhead Squat", muscle: "Quads", type: "compound" },
  { name: "Step Up", muscle: "Quads", type: "compound" },
  { name: "Walking Lunge", muscle: "Quads", type: "compound" },
  { name: "Reverse Lunge", muscle: "Quads", type: "compound" },
  { name: "Jefferson Squat", muscle: "Quads", type: "compound" },
  { name: "Leg Press (Narrow Stance)", muscle: "Quads", type: "compound" },
  { name: "Seated Leg Curl", muscle: "Hamstrings", type: "isolation" },
  { name: "Lying Leg Curl", muscle: "Hamstrings", type: "isolation" },
  { name: "Single Leg Romanian Deadlift", muscle: "Hamstrings", type: "compound" },
  { name: "Glute Ham Raise", muscle: "Hamstrings", type: "compound" },
  { name: "Standing Calf Raise", muscle: "Calves", type: "isolation" },
  { name: "Donkey Calf Raise", muscle: "Calves", type: "isolation" },
  { name: "Single Leg Calf Raise", muscle: "Calves", type: "isolation" },
  { name: "Cable Pull Through", muscle: "Glutes", type: "compound" },
  { name: "Kas Glute Bridge", muscle: "Glutes", type: "isolation" },
  { name: "Single Leg Hip Thrust", muscle: "Glutes", type: "compound" },
  { name: "Frog Pump", muscle: "Glutes", type: "isolation" },
  { name: "Cable Woodchopper", muscle: "Core", type: "isolation" },
  { name: "Hanging Knee Raise", muscle: "Core", type: "isolation" },
  { name: "Dragon Flag", muscle: "Core", type: "isolation" },
  { name: "Vacuum", muscle: "Core", type: "isolation" },
  { name: "Dead Bug", muscle: "Core", type: "isolation" },
  { name: "Bird Dog", muscle: "Core", type: "isolation" },
  { name: "Pallof Press", muscle: "Core", type: "isolation" },
  { name: "Thruster", muscle: "Full Body", type: "compound" },
  { name: "Burpee", muscle: "Full Body", type: "compound" },
  { name: "Turkish Get Up", muscle: "Full Body", type: "compound" },
  { name: "Bear Crawl", muscle: "Full Body", type: "compound" },
  { name: "Dumbbell Snatch", muscle: "Full Body", type: "compound" },
  { name: "Landmine Press", muscle: "Shoulders", type: "compound" },
  { name: "Landmine Row", muscle: "Back", type: "compound" },
  { name: "Landmine Squat", muscle: "Quads", type: "compound" },
  { name: "Battle Ropes", muscle: "Full Body", type: "compound" },
  { name: "Sled Push", muscle: "Full Body", type: "compound" },
  { name: "Sled Pull", muscle: "Full Body", type: "compound" },
  { name: "Smith Machine Squat", muscle: "Quads", type: "compound" },
  { name: "Smith Machine Bench Press", muscle: "Chest", type: "compound" },
  { name: "Machine Shoulder Press", muscle: "Shoulders", type: "compound" },
  { name: "Machine Lat Pulldown", muscle: "Back", type: "compound" },
  { name: "Machine Chest Fly", muscle: "Chest", type: "isolation" },
  { name: "Cable Tricep Kickback", muscle: "Triceps", type: "isolation" },
  { name: "Incline Hammer Curl", muscle: "Biceps", type: "isolation" },
  { name: "Decline Skull Crushers", muscle: "Triceps", type: "isolation" },
  { name: "Seated Calf Raise Machine", muscle: "Calves", type: "isolation" },
  { name: "Standing Calf Raise Machine", muscle: "Calves", type: "isolation" },
];

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes", "Calves", "Biceps", "Triceps", "Traps", "Core", "Full Body"];
const SPLITS = ["Push", "Pull", "Legs", "Full Body", "Upper", "Lower", "Custom"];

// Calorie burn algorithm
function calcCaloriesBurned(exercises, bodyweight = 75) {
  let totalVolume = 0;
  let compoundSets = 0;
  let totalSets = 0;

  exercises.forEach(ex => {
    ex.sets.forEach(set => {
      const w = parseFloat(set.weight) || 0;
      const r = parseFloat(set.reps) || 0;
      const rpe = parseFloat(set.rpe) || 7;
      const rpeMultiplier = 0.8 + (rpe / 10) * 0.4;
      totalVolume += w * r * rpeMultiplier;
      totalSets++;
      if (ex.type === "compound") compoundSets++;
    });
  });

  const compoundRatio = totalSets > 0 ? compoundSets / totalSets : 0.5;
  const typeMultiplier = 0.8 + compoundRatio * 0.4;
  const weightFactor = 0.85 + (bodyweight / 100) * 0.3;
  const calories = Math.round((totalVolume * 0.033 + totalSets * 3.5) * typeMultiplier * weightFactor);
  return Math.max(calories, 0);
}

// Rank points from a workout
function calcRankPoints(exercises, totalVolume) {
  let points = 0;
  points += Math.floor(totalVolume / 500) * 5;
  let compoundCount = 0;
  exercises.forEach(ex => { if (ex.type === "compound") compoundCount++; });
  points += compoundCount * 10;
  points += exercises.length * 3;
  return Math.max(points, 1);
}

export default function Workouts() {
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);

  const [currentWorkout, setCurrentWorkout] = useState({
    date: new Date().toISOString().split('T')[0],
    split: 'Push',
    notes: '',
    exercises: []
  });

  const [newExercise, setNewExercise] = useState({ name: '', muscle: '', type: 'compound', sets: [] });

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) setUserData(userSnap.data());

      try {
        const q = query(
          collection(db, "workouts"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setPastWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const filteredExercises = EXERCISES_DB.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (muscleFilter === 'All' || ex.muscle === muscleFilter)
  );

  const addSet = () => {
    setNewExercise(prev => ({
      ...prev,
      sets: [...prev.sets, { weight: '', reps: '', rpe: '' }]
    }));
  };

  const updateSet = (i, field, val) => {
    const updated = [...newExercise.sets];
    updated[i][field] = val;
    setNewExercise(prev => ({ ...prev, sets: updated }));
  };

  const addExercise = () => {
    if (!newExercise.name || newExercise.sets.length === 0) return;
    const ex = EXERCISES_DB.find(e => e.name === newExercise.name);
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...newExercise, type: ex?.type || 'compound', id: Date.now().toString() }]
    }));
    setNewExercise({ name: '', muscle: '', type: 'compound', sets: [] });
    setSearchTerm('');
  };

  const totalVolume = currentWorkout.exercises.reduce((t, ex) =>
    t + ex.sets.reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0), 0
  );

  const estCalories = calcCaloriesBurned(currentWorkout.exercises, userData?.weight || 75);
  const estPoints = calcRankPoints(currentWorkout.exercises, totalVolume);

  const saveWorkout = async () => {
    if (currentWorkout.exercises.length === 0) return alert("Add at least one exercise.");
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      await addDoc(collection(db, "workouts"), {
        userId: uid,
        date: currentWorkout.date,
        split: currentWorkout.split,
        notes: currentWorkout.notes,
        exercises: currentWorkout.exercises,
        totalVolume,
        caloriesBurned: estCalories,
        rankPointsEarned: estPoints,
        createdAt: serverTimestamp()
      });

      // Update rank points and check for rank promotion
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const currentPoints = (userSnap.data()?.rankPoints || 0) + estPoints;
      const newRank = getRankFromPoints(currentPoints);

      await updateDoc(userRef, {
        rankPoints: increment(estPoints),
        currentRank: newRank,
      });

      setShowModal(false);
      setCurrentWorkout({ date: new Date().toISOString().split('T')[0], split: 'Push', notes: '', exercises: [] });
      window.location.reload();
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalVolumeAll = pastWorkouts.reduce((t, w) => t + (w.totalVolume || 0), 0);
  const totalCaloriesAll = pastWorkouts.reduce((t, w) => t + (w.caloriesBurned || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">Workouts</h1>
            <p className="text-zinc-400 mt-1">Build your strength. Log your legacy.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-3xl font-semibold flex items-center gap-3 shadow-lg shadow-orange-500/20"
          >
            <Plus size={22} /> Log New Workout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Sessions", value: pastWorkouts.length },
            { label: "Total Volume", value: `${totalVolumeAll.toLocaleString()} kg` },
            { label: "Calories Burned", value: `${totalCaloriesAll.toLocaleString()} kcal` },
            { label: "Avg Volume/Session", value: pastWorkouts.length ? `${Math.round(totalVolumeAll / pastWorkouts.length).toLocaleString()} kg` : "—" },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 rounded-3xl p-4 md:p-6 border border-zinc-800">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-lg md:text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Past Workouts */}
        {loading ? (
          <p className="text-zinc-500 text-center py-20">Loading workouts...</p>
        ) : pastWorkouts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-700 rounded-3xl text-zinc-500">
            No workouts yet. Log your first session!
          </div>
        ) : (
          <div className="space-y-4">
            {pastWorkouts.map(w => (
              <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-800/50 transition"
                  onClick={() => setExpandedWorkout(expandedWorkout === w.id ? null : w.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                      <Dumbbell className="text-orange-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">{w.split} Day</p>
                      <p className="text-zinc-400 text-sm">{w.date} · {w.exercises?.length || 0} exercises</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-8">
                    <div className="text-right">
                      <p className="text-orange-500 font-bold text-sm md:text-base">{(w.totalVolume || 0).toLocaleString()} kg</p>
                      <p className="text-zinc-500 text-xs hidden md:block">volume</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-green-400 font-bold text-sm md:text-base">{w.caloriesBurned || 0} kcal</p>
                      <p className="text-zinc-500 text-xs hidden md:block">burned</p>
                    </div>
                    {expandedWorkout === w.id ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
                  </div>
                </div>

                {expandedWorkout === w.id && (
                  <div className="px-6 pb-6 border-t border-zinc-800 pt-4">
                    {w.notes && <p className="text-zinc-400 text-sm mb-4 italic">"{w.notes}"</p>}
                    <div className="space-y-3">
                      {(w.exercises || []).map((ex, i) => (
                        <div key={i} className="bg-zinc-800 rounded-2xl p-4">
                          <p className="font-medium text-white mb-2">{ex.name} <span className="text-zinc-500 text-sm">({ex.muscle})</span></p>
                          <div className="flex flex-wrap gap-2">
                            {ex.sets.map((set, j) => (
                              <span key={j} className="bg-zinc-700 text-sm px-3 py-1 rounded-xl text-zinc-300">
                                Set {j+1}: {set.weight}kg × {set.reps}{set.rpe ? ` @RPE${set.rpe}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-zinc-900 w-full md:max-w-5xl rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-hidden flex flex-col">

            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Log New Workout</h3>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-zinc-400 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">

                {/* Session Info */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">Date</label>
                    <input type="date" value={currentWorkout.date}
                      onChange={e => setCurrentWorkout(p => ({ ...p, date: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">Split</label>
                    <select value={currentWorkout.split}
                      onChange={e => setCurrentWorkout(p => ({ ...p, split: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white">
                      {SPLITS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">Notes</label>
                    <textarea value={currentWorkout.notes}
                      onChange={e => setCurrentWorkout(p => ({ ...p, notes: e.target.value }))}
                      placeholder="How did it feel?"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 h-24 resize-none text-white" />
                  </div>

                  {/* Live Estimates */}
                  {currentWorkout.exercises.length > 0 && (
                    <div className="bg-zinc-800 rounded-2xl p-4 space-y-2">
                      <p className="text-xs text-zinc-500 uppercase mb-2">Session Estimates</p>
                      <div className="flex justify-between"><span className="text-zinc-400 text-sm">Volume</span><span className="font-bold text-white">{totalVolume.toLocaleString()} kg</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400 text-sm">Calories Burned</span><span className="font-bold text-green-400">{estCalories} kcal</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400 text-sm">Rank Points</span><span className="font-bold text-blue-400">+{estPoints} pts</span></div>
                    </div>
                  )}
                </div>

                {/* Exercise Logger */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Search + Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                      <input type="text" placeholder="Search exercises..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-9 p-3 text-white" />
                    </div>
                    <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white text-sm">
                      {MUSCLE_GROUPS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Exercise Selector */}
                  <div>
                    <label className="text-xs text-zinc-500 uppercase mb-1 block">Exercise</label>
                    <select value={newExercise.name}
                      onChange={e => {
                        const ex = EXERCISES_DB.find(x => x.name === e.target.value);
                        setNewExercise(p => ({ ...p, name: e.target.value, muscle: ex?.muscle || '', type: ex?.type || 'compound' }));
                      }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-white">
                      <option value="">Select exercise</option>
                      {filteredExercises.map(ex => <option key={ex.name} value={ex.name}>{ex.name} ({ex.muscle})</option>)}
                    </select>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    {newExercise.sets.map((set, i) => (
                      <div key={i} className="bg-zinc-800 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-zinc-400 text-sm font-medium">Set {i+1}</span>
                          <button onClick={() => setNewExercise(p => ({ ...p, sets: p.sets.filter((_, j) => j !== i) }))}
                            className="text-red-400 hover:text-red-300">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase block mb-1 text-center">kg</label>
                            <input type="number" placeholder="0" value={set.weight}
                              onChange={e => updateSet(i, 'weight', e.target.value)}
                              className="w-full bg-zinc-700 rounded-xl p-2 text-center text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase block mb-1 text-center">reps</label>
                            <input type="number" placeholder="0" value={set.reps}
                              onChange={e => updateSet(i, 'reps', e.target.value)}
                              className="w-full bg-zinc-700 rounded-xl p-2 text-center text-white text-sm" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 uppercase block mb-1 text-center">RPE</label>
                            <input type="number" placeholder="—" value={set.rpe}
                              onChange={e => updateSet(i, 'rpe', e.target.value)}
                              className="w-full bg-zinc-700 rounded-xl p-2 text-center text-white text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={addSet}
                      className="flex-1 py-3 border border-zinc-600 hover:bg-zinc-800 rounded-2xl text-sm font-medium">
                      + Add Set
                    </button>
                    <button onClick={addExercise}
                      disabled={!newExercise.name || newExercise.sets.length === 0}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 py-3 rounded-2xl text-sm font-semibold">
                      Add to Session
                    </button>
                  </div>

                  {/* Current session exercises */}
                  {currentWorkout.exercises.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-zinc-500 uppercase tracking-wider">In Session ({currentWorkout.exercises.length})</p>
                      {currentWorkout.exercises.map(ex => (
                        <div key={ex.id} className="bg-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{ex.name}</p>
                            <p className="text-zinc-500 text-sm">{ex.sets.length} sets · {ex.sets.reduce((t, s) => t + (parseFloat(s.weight)||0)*(parseFloat(s.reps)||0), 0)} kg vol</p>
                          </div>
                          <button onClick={() => setCurrentWorkout(p => ({ ...p, exercises: p.exercises.filter(e => e.id !== ex.id) }))}
                            className="text-red-400 hover:text-red-300">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-zinc-800 flex justify-between items-center gap-3">
              <div className="text-xs md:text-sm text-zinc-500 hidden sm:block">{currentWorkout.exercises.length} exercises · {totalVolume.toLocaleString()} kg · {estCalories} kcal</div>
              <div className="flex gap-2 md:gap-3 ml-auto">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm">Cancel</button>
                <button onClick={saveWorkout} disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-5 md:px-8 py-2.5 md:py-3 rounded-2xl font-semibold flex items-center gap-2 text-sm md:text-base">
                  <Save size={16} /> {saving ? "Saving..." : "Save Workout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}