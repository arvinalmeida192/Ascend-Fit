import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

const ALL_MUSCLES = [
  "chest","lats","traps","rhomboids",
  "front_delt","side_delt","rear_delt",
  "biceps","triceps","forearms",
  "abs","obliques",
  "quads","hamstrings","glutes","calves",
];

const MUSCLE_DISPLAY_NAMES = {
  chest:"Chest", lats:"Lats", traps:"Traps", rhomboids:"Rhomboids",
  front_delt:"Front Delt", side_delt:"Side Delt", rear_delt:"Rear Delt",
  biceps:"Biceps", triceps:"Triceps", forearms:"Forearms",
  abs:"Abs", obliques:"Obliques",
  quads:"Quads", hamstrings:"Hamstrings", glutes:"Glutes", calves:"Calves",
};

function getColor(score) {
  if (score === 0) return "#27272a";
  if (score < 20)  return "#7f1d1d";
  if (score < 40)  return "#dc2626";
  if (score < 60)  return "#f97316";
  if (score < 80)  return "#eab308";
  return "#22c55e";
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
  const [view, setView] = useState("front");
  const [timeRange, setTimeRange] = useState(90);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      try {
        const wq = query(collection(db, "workouts"), where("userId", "==", uid));
        const snap = await getDocs(wq);
        const workouts = snap.docs.map(d => d.data());
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
            muscleGroups.forEach(mg => { volumes[mg] = (volumes[mg] || 0) + exVol; });
          });
        });

        const scores = {};
        ALL_MUSCLES.forEach(m => {
          scores[m] = Math.min(Math.round((volumes[m] / 50000) * 100), 100);
        });
        setMuscleScores(scores);
      } catch (err) { console.error(err); }
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Muscle Map</h1>
          <p className="text-zinc-400 mt-1">Visual breakdown of your muscle development from workout history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

          {/* LEFT — Controls + Info */}
          <div className="lg:col-span-4 space-y-4">

            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Time Range</p>
              <div className="flex gap-2">
                {[30, 90, 365].map(d => (
                  <button key={d} onClick={() => setTimeRange(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${timeRange === d ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {d === 365 ? '1yr' : `${d}d`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 mt-5">View</p>
              <div className="flex gap-2">
                {["front", "back"].map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${view === v ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

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

            {selectedInfo ? (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Selected Muscle</p>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{ backgroundColor: getColor(selectedInfo.score) + "30", border: `2px solid ${getColor(selectedInfo.score)}` }}>
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
                    <div className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${selectedInfo.score}%`, backgroundColor: getColor(selectedInfo.score) }} />
                  </div>
                </div>
                {selectedInfo.score === 0 && (
                  <p className="text-xs text-zinc-600 mt-3">No logged exercises for this muscle in the selected time range.</p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 text-center text-zinc-600 text-sm">
                Click a muscle on the body to see details
              </div>
            )}

            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">All Muscles</p>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {ALL_MUSCLES.map(m => {
                  const score = muscleScores[m] || 0;
                  return (
                    <button key={m} onClick={() => sel(m)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${selectedMuscle === m ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}>
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
                <svg viewBox="0 0 200 490" className="w-full max-w-xs md:max-w-sm"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.05))' }}>
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

// ─── FRONT BODY ───────────────────────────────────────────────────────────────
function FrontBody({ c, sel, selected }) {
  const hl = (m) => selected === m ? "brightness(1.5)" : "brightness(1)";

  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="28" rx="18" ry="22" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      {/* Neck */}
      <rect x="92" y="48" width="16" height="14" rx="4" fill="#3f3f46"/>

      {/* Torso outline */}
      <path d="M65 62 L135 62 L140 130 L130 170 L70 170 L60 130 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Chest */}
      <ellipse cx="85" cy="90" rx="17" ry="18" fill={c("chest")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("chest") }} onClick={() => sel("chest")} />
      <ellipse cx="115" cy="90" rx="17" ry="18" fill={c("chest")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("chest") }} onClick={() => sel("chest")} />

      {/* Abs — 3 rows */}
      {[0,1,2].map(row => (
        <g key={row}>
          <rect x="84" y={118 + row*16} width="12" height="13" rx="3"
            fill={c("abs")} stroke="#1a1a1a" strokeWidth="0.5"
            style={{ cursor:'pointer', filter:hl("abs") }} onClick={() => sel("abs")} />
          <rect x="104" y={118 + row*16} width="12" height="13" rx="3"
            fill={c("abs")} stroke="#1a1a1a" strokeWidth="0.5"
            style={{ cursor:'pointer', filter:hl("abs") }} onClick={() => sel("abs")} />
        </g>
      ))}

      {/* Obliques */}
      <path d="M70 120 Q75 140 72 165" fill="none" stroke={c("obliques")} strokeWidth="10" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("obliques") }} onClick={() => sel("obliques")} />
      <path d="M130 120 Q125 140 128 165" fill="none" stroke={c("obliques")} strokeWidth="10" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("obliques") }} onClick={() => sel("obliques")} />

      {/* Front Delts */}
      <ellipse cx="63" cy="80" rx="11" ry="13" fill={c("front_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("front_delt") }} onClick={() => sel("front_delt")} />
      <ellipse cx="137" cy="80" rx="11" ry="13" fill={c("front_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("front_delt") }} onClick={() => sel("front_delt")} />

      {/* Side Delts */}
      <ellipse cx="52" cy="94" rx="9" ry="12" fill={c("side_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("side_delt") }} onClick={() => sel("side_delt")} />
      <ellipse cx="148" cy="94" rx="9" ry="12" fill={c("side_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("side_delt") }} onClick={() => sel("side_delt")} />

      {/* Biceps */}
      <path d="M44 108 Q39 126 41 148" fill="none" stroke={c("biceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("biceps") }} onClick={() => sel("biceps")} />
      <path d="M156 108 Q161 126 159 148" fill="none" stroke={c("biceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("biceps") }} onClick={() => sel("biceps")} />

      {/* Forearms (front) */}
      <path d="M40 152 Q36 172 38 194" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("forearms") }} onClick={() => sel("forearms")} />
      <path d="M160 152 Q164 172 162 194" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("forearms") }} onClick={() => sel("forearms")} />

      {/* Hands */}
      <ellipse cx="38" cy="203" rx="9" ry="11" fill="#3f3f46" />
      <ellipse cx="162" cy="203" rx="9" ry="11" fill="#3f3f46" />

      {/* Hips */}
      <path d="M68 172 L132 172 L136 192 L64 192 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Quads */}
      <path d="M68 194 Q60 232 62 272 L84 272 Q88 232 84 194 Z" fill={c("quads")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("quads") }} onClick={() => sel("quads")} />
      <path d="M132 194 Q140 232 138 272 L116 272 Q112 232 116 194 Z" fill={c("quads")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("quads") }} onClick={() => sel("quads")} />

      {/* Knees */}
      <ellipse cx="73" cy="280" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>
      <ellipse cx="127" cy="280" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Calves */}
      <path d="M62 292 Q57 322 59 364 L81 364 Q85 322 84 292 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("calves") }} onClick={() => sel("calves")} />
      <path d="M138 292 Q143 322 141 364 L119 364 Q115 322 116 292 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("calves") }} onClick={() => sel("calves")} />

      {/* Feet */}
      <ellipse cx="70" cy="372" rx="12" ry="8" fill="#3f3f46"/>
      <ellipse cx="130" cy="372" rx="12" ry="8" fill="#3f3f46"/>

      {/* ── Labels ── */}
      <text x="100" y="96" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>CHEST</text>
      <text x="100" y="134" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>ABS</text>

      {/* Delt labels */}
      <text x="63" y="77" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.DELT</text>
      <text x="137" y="77" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.DELT</text>
      <text x="52" y="91" textAnchor="middle" fontSize="4" fill="#ffffff70" style={{ pointerEvents:'none' }}>S.DELT</text>
      <text x="148" y="91" textAnchor="middle" fontSize="4" fill="#ffffff70" style={{ pointerEvents:'none' }}>S.DELT</text>

      {/* Biceps labels */}
      <text x="38" y="128" textAnchor="middle" fontSize="5" fill="#ffffff70" style={{ pointerEvents:'none' }}>BIC</text>
      <text x="162" y="128" textAnchor="middle" fontSize="5" fill="#ffffff70" style={{ pointerEvents:'none' }}>BIC</text>

      {/* Forearms labels */}
      <text x="35" y="173" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.ARM</text>
      <text x="165" y="173" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.ARM</text>

      {/* Quads / Calves labels */}
      <text x="73" y="235" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>QUAD</text>
      <text x="127" y="235" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>QUAD</text>
      <text x="70" y="328" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>CALF</text>
      <text x="130" y="328" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>CALF</text>
    </g>
  );
}

// ─── BACK BODY ────────────────────────────────────────────────────────────────
function BackBody({ c, sel, selected }) {
  const hl = (m) => selected === m ? "brightness(1.5)" : "brightness(1)";

  return (
    <g>
      {/* Head */}
      <ellipse cx="100" cy="28" rx="18" ry="22" fill="#3f3f46" stroke="#52525b" strokeWidth="1"/>
      <rect x="92" y="48" width="16" height="14" rx="4" fill="#3f3f46"/>

      {/* Torso */}
      <path d="M65 62 L135 62 L140 130 L130 170 L70 170 L60 130 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Traps */}
      <path d="M83 62 Q100 55 117 62 L115 80 Q100 72 85 80 Z" fill={c("traps")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("traps") }} onClick={() => sel("traps")} />

      {/* Rear Delts */}
      <ellipse cx="63" cy="80" rx="11" ry="13" fill={c("rear_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("rear_delt") }} onClick={() => sel("rear_delt")} />
      <ellipse cx="137" cy="80" rx="11" ry="13" fill={c("rear_delt")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("rear_delt") }} onClick={() => sel("rear_delt")} />

      {/* Rhomboids */}
      <path d="M83 82 Q100 78 117 82 L115 108 Q100 112 85 108 Z" fill={c("rhomboids")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("rhomboids") }} onClick={() => sel("rhomboids")} />

      {/* Lats */}
      <path d="M67 85 Q60 110 62 148 L80 148 Q82 118 84 90 Z" fill={c("lats")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("lats") }} onClick={() => sel("lats")} />
      <path d="M133 85 Q140 110 138 148 L120 148 Q118 118 116 90 Z" fill={c("lats")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("lats") }} onClick={() => sel("lats")} />

      {/* Triceps */}
      <path d="M50 105 Q45 124 47 146" fill="none" stroke={c("triceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("triceps") }} onClick={() => sel("triceps")} />
      <path d="M150 105 Q155 124 153 146" fill="none" stroke={c("triceps")} strokeWidth="14" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("triceps") }} onClick={() => sel("triceps")} />

      {/* Forearms (back) */}
      <path d="M46 150 Q42 170 44 192" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("forearms") }} onClick={() => sel("forearms")} />
      <path d="M154 150 Q158 170 156 192" fill="none" stroke={c("forearms")} strokeWidth="11" strokeLinecap="round"
        style={{ cursor:'pointer', filter:hl("forearms") }} onClick={() => sel("forearms")} />

      {/* Hands */}
      <ellipse cx="43" cy="201" rx="9" ry="11" fill="#3f3f46" />
      <ellipse cx="157" cy="201" rx="9" ry="11" fill="#3f3f46" />

      {/* Lower back */}
      <path d="M80 150 L120 150 L122 170 L78 170 Z" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Hips */}
      <path d="M68 172 L132 172 L136 192 L64 192 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1"/>

      {/* Glutes */}
      <ellipse cx="83" cy="202" rx="18" ry="16" fill={c("glutes")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("glutes") }} onClick={() => sel("glutes")} />
      <ellipse cx="117" cy="202" rx="18" ry="16" fill={c("glutes")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("glutes") }} onClick={() => sel("glutes")} />

      {/* Hamstrings */}
      <path d="M66 220 Q59 256 61 272 L83 272 Q87 252 84 220 Z" fill={c("hamstrings")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("hamstrings") }} onClick={() => sel("hamstrings")} />
      <path d="M134 220 Q141 256 139 272 L117 272 Q113 252 116 220 Z" fill={c("hamstrings")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("hamstrings") }} onClick={() => sel("hamstrings")} />

      {/* Knees back */}
      <ellipse cx="72" cy="280" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>
      <ellipse cx="128" cy="280" rx="12" ry="10" fill="#3f3f46" stroke="#52525b" strokeWidth="0.5"/>

      {/* Calves back */}
      <path d="M62 292 Q57 322 59 364 L81 364 Q85 322 84 292 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("calves") }} onClick={() => sel("calves")} />
      <path d="M138 292 Q143 322 141 364 L119 364 Q115 322 116 292 Z" fill={c("calves")} stroke="#1a1a1a" strokeWidth="0.5"
        style={{ cursor:'pointer', filter:hl("calves") }} onClick={() => sel("calves")} />

      {/* Feet */}
      <ellipse cx="70" cy="372" rx="12" ry="8" fill="#3f3f46"/>
      <ellipse cx="130" cy="372" rx="12" ry="8" fill="#3f3f46"/>

      {/* ── Labels ── */}
      <text x="100" y="72" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>TRAPS</text>
      <text x="100" y="97" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>RHOMB</text>
      <text x="63" y="77" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>R.DELT</text>
      <text x="137" y="77" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>R.DELT</text>
      <text x="71" y="118" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>LATS</text>
      <text x="129" y="118" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>LATS</text>
      <text x="44" y="126" textAnchor="middle" fontSize="5" fill="#ffffff70" style={{ pointerEvents:'none' }}>TRI</text>
      <text x="156" y="126" textAnchor="middle" fontSize="5" fill="#ffffff70" style={{ pointerEvents:'none' }}>TRI</text>
      <text x="41" y="171" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.ARM</text>
      <text x="159" y="171" textAnchor="middle" fontSize="4.5" fill="#ffffff70" style={{ pointerEvents:'none' }}>F.ARM</text>
      <text x="83" y="204" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>GLUTE</text>
      <text x="117" y="204" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>GLUTE</text>
      <text x="72" y="248" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>HAMS</text>
      <text x="128" y="248" textAnchor="middle" fontSize="5.5" fill="#ffffff80" style={{ pointerEvents:'none' }}>HAMS</text>
      <text x="70" y="328" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>CALF</text>
      <text x="130" y="328" textAnchor="middle" fontSize="6" fill="#ffffff80" style={{ pointerEvents:'none' }}>CALF</text>
    </g>
  );
}