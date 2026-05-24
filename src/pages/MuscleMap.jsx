import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Maps exercise muscle field → canonical muscle group IDs
const MUSCLE_EXERCISE_MAP = {
  Chest:      ["chest"],
  Back:       ["lats", "traps", "rhomboids"],
  Shoulders:  ["front_delt", "side_delt", "rear_delt"],
  Traps:      ["traps"],
  Triceps:    ["triceps"],
  Biceps:     ["biceps"],
  Forearms:   ["forearms"],
  Quads:      ["quads"],
  Hamstrings: ["hamstrings"],
  Glutes:     ["glutes"],
  Calves:     ["calves"],
  Core:       ["abs", "obliques"],
  "Full Body":["quads","hamstrings","glutes","chest","lats","abs"],
};

// All trackable muscle groups
const ALL_MUSCLES = [
  "chest","lats","traps","rhomboids",
  "front_delt","side_delt","rear_delt",
  "triceps","biceps","forearms",
  "abs","obliques",
  "quads","hamstrings","glutes","calves",
];

const MUSCLE_DISPLAY_NAMES = {
  chest:"Chest", lats:"Lats", traps:"Traps", rhomboids:"Rhomboids",
  front_delt:"Front Delt", side_delt:"Side Delt", rear_delt:"Rear Delt",
  triceps:"Triceps", biceps:"Biceps", forearms:"Forearms",
  abs:"Abs", obliques:"Obliques",
  quads:"Quads", hamstrings:"Hamstrings", glutes:"Glutes", calves:"Calves",
};

function getColor(score) {
  if (score === 0) return "#27272a"; // untrained - zinc-800
  if (score < 20)  return "#7f1d1d"; // very low - dark red
  if (score < 40)  return "#dc2626"; // low - red
  if (score < 60)  return "#f97316"; // medium - orange
  if (score < 80)  return "#eab308"; // good - yellow
  return "#22c55e";                  // excellent - green
}

function getLevelLabel(score) {
  if (score === 0) return { label: "Untrained", color: "#52525b" };
  if (score < 20)  return { label: "Beginner", color: "#dc2626" };
  if (score < 40)  return { label: "Developing", color: "#f97316" };
  if (score < 60)  return { label: "Intermediate", color: "#f97316" };
  if (score < 80)  return { label: "Advanced", color: "#eab308" };
  return { label: "Elite", color: "#22c55e" };
}

export default function MuscleMap() {
  const [muscleScores, setMuscleScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [view, setView] = useState("front"); // "front" | "back"
  const [timeRange, setTimeRange] = useState(90); // days

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      try {
        const wq = query(collection(db, "workouts"), where("userId", "==", uid));
        const snap = await getDocs(wq);
        const workouts = snap.docs.map(d => d.data());

        // Filter by time range
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeRange);

        const volumes = {};
        ALL_MUSCLES.forEach(m => { volumes[m] = 0; });

        workouts.forEach(w => {
          const wDate = w.date ? new Date(w.date) : null;
          if (wDate && wDate < cutoff) return;

          (w.exercises || []).forEach(ex => {
            const muscleGroups = MUSCLE_EXERCISE_MAP[ex.muscle] || [];
            const exVol = (ex.sets || []).reduce(
              (t, s) => t + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0
            );
            muscleGroups.forEach(mg => {
              volumes[mg] = (volumes[mg] || 0) + exVol;
            });
          });
        });

        // Normalize to 0-100 score. Cap at 50,000 kg of volume = 100 score
        const scores = {};
        ALL_MUSCLES.forEach(m => {
          scores[m] = Math.min(Math.round((volumes[m] / 50000) * 100), 100);
        });

        setMuscleScores(scores);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [timeRange]);

  const c = (muscle) => getColor(muscleScores[muscle] || 0);
  const sel = (muscle) => setSelectedMuscle(muscle === selectedMuscle ? null : muscle);

  const selectedInfo = selectedMuscle ? {
    name: MUSCLE_DISPLAY_NAMES[selectedMuscle],
    score: muscleScores[selectedMuscle] || 0,
    level: getLevelLabel(muscleScores[selectedMuscle] || 0),
  } : null;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Muscle Map</h1>
          <p className="text-zinc-400 mt-1">Visual breakdown of your muscle development from workout history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

          {/* LEFT — Controls + Selected Muscle Info */}
          <div className="lg:col-span-4 space-y-4">

            {/* Controls */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Time Range</p>
              <div className="flex gap-2">
                {[30, 90, 365].map(d => (
                  <button
                    key={d}
                    onClick={() => setTimeRange(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      timeRange === d ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {d === 365 ? '1yr' : `${d}d`}
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 mt-5">View</p>
              <div className="flex gap-2">
                {["front", "back"].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${
                      view === v ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Development Scale</p>
              <div className="space-y-2">
                {[
                  { color: "#27272a", label: "Untrained", range: "0 pts" },
                  { color: "#7f1d1d", label: "Beginner", range: "1–19" },
                  { color: "#dc2626", label: "Developing", range: "20–39" },
                  { color: "#f97316", label: "Intermediate", range: "40–59" },
                  { color: "#eab308", label: "Advanced", range: "60–79" },
                  { color: "#22c55e", label: "Elite", range: "80–100" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <span className="text-xs text-zinc-600 ml-auto">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Muscle Info */}
            {selectedInfo ? (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Selected Muscle</p>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ backgroundColor: getColor(selectedInfo.score) + "30", border: `2px solid ${getColor(selectedInfo.score)}` }}
                  >
                    <span style={{ color: getColor(selectedInfo.score) }}>{selectedInfo.score}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{selectedInfo.name}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: selectedInfo.level.color }}>
                      {selectedInfo.level.label}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Development Score</span>
                    <span>{selectedInfo.score}/100</span>
                  </div>
                  <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${selectedInfo.score}%`, backgroundColor: getColor(selectedInfo.score) }}
                    />
                  </div>
                </div>
                {selectedInfo.score === 0 && (
                  <p className="text-xs text-zinc-600 mt-3">No logged exercises targeting this muscle in the selected time range.</p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 text-center text-zinc-600 text-sm">
                Click a muscle on the body to see details
              </div>
            )}

            {/* All muscle scores list */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">All Muscles</p>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {ALL_MUSCLES.map(m => {
                  const score = muscleScores[m] || 0;
                  return (
                    <button
                      key={m}
                      onClick={() => sel(m)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${
                        selectedMuscle === m ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: getColor(score) }} />
                      <span className="text-sm text-zinc-300 flex-1">{MUSCLE_DISPLAY_NAMES[m]}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: getColor(score) }} />
                        </div>
                        <span className="text-xs text-zinc-500 w-6 text-right">{score}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — SVG Body */}
          <div className="lg:col-span-8 order-first lg:order-last">
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 flex items-center justify-center min-h-[320px] md:min-h-[600px]">
              {loading ? (
                <p className="text-zinc-500">Loading muscle data...</p>
              ) : (
                <svg
                  viewBox="0 0 200 480"
                  className="w-full max-w-xs md:max-w-sm"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.05))' }}
                >
                  {view === "front" ? (
                    <FrontBody c={c} sel={sel} selected={selectedMuscle} />
                  ) : (
                    <BackBody c={c} sel={sel} selected={selectedMuscle} />
                  )}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FRONT BODY SVG ───────────────────────────────────────────────────────────
function FrontBody({ c, sel, selected }) {
  const hl = (m) => selected === m ? "brightness(1.4)" : "brightness(1)";

  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="28" rx="18" ry="22" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      {/* Neck */}
      <rect x="92" y="48" width="16" height="14" rx="4" fill="#3f3f46"/>

      {/* Torso outline */}
      <path d="M65 62 L135 62 L140 130 L130 170 L70 170 L60 130 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Chest — left & right */}
      <ellipse cx="85" cy="90" rx="17" ry="18" fill={c("chest")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("chest") }} onClick={() => sel("chest")} />
      <ellipse cx="115" cy="90" rx="17" ry="18" fill={c("chest")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("chest") }} onClick={() => sel("chest")} />

      {/* Abs — 3 rows */}
      {[0,1,2].map(row => (
        <g key={row}>
          <rect x="84" y={118 + row * 16} width="12" height="13" rx="3"
            fill={c("abs")} stroke="#1a1a1a" strokeWidth="0.5"
            style={{ cursor: 'pointer', filter: hl("abs") }} onClick={() => sel("abs")} />
          <rect x="104" y={118 + row * 16} width="12" height="13" rx="3"
            fill={c("abs")} stroke="#1a1a1a" strokeWidth="0.5"
            style={{ cursor: 'pointer', filter: hl("abs") }} onClick={() => sel("abs")} />
        </g>
      ))}

      {/* Obliques */}
      <path d="M70 120 Q75 140 72 165" fill="none" stroke={c("obliques")} strokeWidth="10" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("obliques") }} onClick={() => sel("obliques")} />
      <path d="M130 120 Q125 140 128 165" fill="none" stroke={c("obliques")} strokeWidth="10" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("obliques") }} onClick={() => sel("obliques")} />

      {/* Front Delts */}
      <ellipse cx="63" cy="80" rx="11" ry="13" fill={c("front_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("front_delt") }} onClick={() => sel("front_delt")} />
      <ellipse cx="137" cy="80" rx="11" ry="13" fill={c("front_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("front_delt") }} onClick={() => sel("front_delt")} />

      {/* Side Delts */}
      <ellipse cx="53" cy="93" rx="9" ry="12" fill={c("side_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("side_delt") }} onClick={() => sel("side_delt")} />
      <ellipse cx="147" cy="93" rx="9" ry="12" fill={c("side_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("side_delt") }} onClick={() => sel("side_delt")} />

      {/* Biceps */}
      <path d="M46 108 Q42 125 44 145" fill="none" stroke={c("biceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("biceps") }} onClick={() => sel("biceps")} />
      <path d="M154 108 Q158 125 156 145" fill="none" stroke={c("biceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("biceps") }} onClick={() => sel("biceps")} />

      {/* Forearms */}
      <path d="M43 148 Q40 168 42 188" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("forearms") }} onClick={() => sel("forearms")} />
      <path d="M157 148 Q160 168 158 188" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("forearms") }} onClick={() => sel("forearms")} />

      {/* Hands */}
      <ellipse cx="41" cy="198" rx="9" ry="12" fill="#3f3f46" />
      <ellipse cx="159" cy="198" rx="9" ry="12" fill="#3f3f46" />

      {/* Hips / pelvis */}
      <path d="M68 172 L132 172 L136 190 L64 190 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Quads — left & right */}
      <path d="M68 192 Q60 230 62 270 L84 270 Q88 230 84 192 Z" fill={c("quads")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("quads") }} onClick={() => sel("quads")} />
      <path d="M132 192 Q140 230 138 270 L116 270 Q112 230 116 192 Z" fill={c("quads")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("quads") }} onClick={() => sel("quads")} />

      {/* Knees */}
      <ellipse cx="73" cy="278" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>
      <ellipse cx="127" cy="278" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Calves */}
      <path d="M63 290 Q58 320 60 360 L82 360 Q86 320 84 290 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("calves") }} onClick={() => sel("calves")} />
      <path d="M137 290 Q142 320 140 360 L118 360 Q114 320 116 290 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("calves") }} onClick={() => sel("calves")} />

      {/* Feet */}
      <ellipse cx="71" cy="368" rx="12" ry="8" fill="#3f3f46"/>
      <ellipse cx="129" cy="368" rx="12" ry="8" fill="#3f3f46"/>

      {/* Labels */}
      <text x="100" y="96" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>CHEST</text>
      <text x="100" y="132" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>ABS</text>
      <text x="73" y="235" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>QUAD</text>
      <text x="127" y="235" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>QUAD</text>
      <text x="71" y="325" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>CALF</text>
      <text x="129" y="325" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>CALF</text>
    </g>
  );
}

// ─── BACK BODY SVG ────────────────────────────────────────────────────────────
function BackBody({ c, sel, selected }) {
  const hl = (m) => selected === m ? "brightness(1.4)" : "brightness(1)";

  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="28" rx="18" ry="22" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      {/* Neck */}
      <rect x="92" y="48" width="16" height="14" rx="4" fill="#3f3f46"/>

      {/* Torso outline */}
      <path d="M65 62 L135 62 L140 130 L130 170 L70 170 L60 130 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Traps */}
      <path d="M83 62 Q100 55 117 62 L115 80 Q100 72 85 80 Z" fill={c("traps")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("traps") }} onClick={() => sel("traps")} />

      {/* Rear Delts */}
      <ellipse cx="63" cy="80" rx="11" ry="13" fill={c("rear_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("rear_delt") }} onClick={() => sel("rear_delt")} />
      <ellipse cx="137" cy="80" rx="11" ry="13" fill={c("rear_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("rear_delt") }} onClick={() => sel("rear_delt")} />

      {/* Rhomboids / Mid Back */}
      <path d="M83 82 Q100 78 117 82 L115 108 Q100 112 85 108 Z" fill={c("rhomboids")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("rhomboids") }} onClick={() => sel("rhomboids")} />

      {/* Lats */}
      <path d="M67 85 Q60 110 62 145 L80 145 Q82 118 84 90 Z" fill={c("lats")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("lats") }} onClick={() => sel("lats")} />
      <path d="M133 85 Q140 110 138 145 L120 145 Q118 118 116 90 Z" fill={c("lats")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("lats") }} onClick={() => sel("lats")} />

      {/* Triceps */}
      <path d="M50 105 Q46 122 48 142" fill="none" stroke={c("triceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("triceps") }} onClick={() => sel("triceps")} />
      <path d="M150 105 Q154 122 152 142" fill="none" stroke={c("triceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("triceps") }} onClick={() => sel("triceps")} />

      {/* Forearms back */}
      <path d="M47 145 Q44 165 46 185" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("forearms") }} onClick={() => sel("forearms")} />
      <path d="M153 145 Q156 165 154 185" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor: 'pointer', filter: hl("forearms") }} onClick={() => sel("forearms")} />

      {/* Hands */}
      <ellipse cx="45" cy="195" rx="9" ry="12" fill="#3f3f46" />
      <ellipse cx="155" cy="195" rx="9" ry="12" fill="#3f3f46" />

      {/* Lower back */}
      <path d="M80 148 L120 148 L122 168 L78 168 Z" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Hips */}
      <path d="M68 172 L132 172 L136 190 L64 190 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Glutes */}
      <ellipse cx="83" cy="200" rx="18" ry="16" fill={c("glutes")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("glutes") }} onClick={() => sel("glutes")} />
      <ellipse cx="117" cy="200" rx="18" ry="16" fill={c("glutes")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("glutes") }} onClick={() => sel("glutes")} />

      {/* Hamstrings */}
      <path d="M67 218 Q60 255 62 270 L84 270 Q88 250 84 218 Z" fill={c("hamstrings")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("hamstrings") }} onClick={() => sel("hamstrings")} />
      <path d="M133 218 Q140 255 138 270 L116 270 Q112 250 116 218 Z" fill={c("hamstrings")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("hamstrings") }} onClick={() => sel("hamstrings")} />

      {/* Knees back */}
      <ellipse cx="73" cy="278" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>
      <ellipse cx="127" cy="278" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Calves back */}
      <path d="M63 290 Q58 320 60 360 L82 360 Q86 320 84 290 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("calves") }} onClick={() => sel("calves")} />
      <path d="M137 290 Q142 320 140 360 L118 360 Q114 320 116 290 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor: 'pointer', filter: hl("calves") }} onClick={() => sel("calves")} />

      {/* Feet */}
      <ellipse cx="71" cy="368" rx="12" ry="8" fill="#3f3f46"/>
      <ellipse cx="129" cy="368" rx="12" ry="8" fill="#3f3f46"/>

      {/* Labels */}
      <text x="100" y="72" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>TRAPS</text>
      <text x="72" y="118" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents: 'none' }}>LATS</text>
      <text x="128" y="118" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents: 'none' }}>LATS</text>
      <text x="83" y="202" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>GLUTE</text>
      <text x="117" y="202" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents: 'none' }}>GLUTE</text>
      <text x="73" y="245" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents: 'none' }}>HAMS</text>
      <text x="127" y="245" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents: 'none' }}>HAMS</text>
    </g>
  );
}