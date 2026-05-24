import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { Award, TrendingUp, Dumbbell, Zap, ChevronDown, ChevronUp, Lock } from 'lucide-react';

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

const TIER_META = {
  Iron:      { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", glow: "rgba(156,163,175,0.3)",  desc: "Every legend starts here. Build the foundation." },
  Bronze:    { color: "#cd7f32", bg: "rgba(205,127,50,0.1)",  glow: "rgba(205,127,50,0.3)",   desc: "Consistency is forming. The grind is real." },
  Silver:    { color: "#c0c0c0", bg: "rgba(192,192,192,0.1)", glow: "rgba(192,192,192,0.3)",  desc: "Strength habits locked in. Progress is visible." },
  Gold:      { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  glow: "rgba(251,191,36,0.3)",   desc: "Serious lifter territory. Respect is earned." },
  Platinum:  { color: "#e2e8f0", bg: "rgba(226,232,240,0.1)", glow: "rgba(226,232,240,0.3)",  desc: "Elite consistency. Most never reach this tier." },
  Diamond:   { color: "#67e8f9", bg: "rgba(103,232,249,0.1)", glow: "rgba(103,232,249,0.3)",  desc: "Top 5% of lifters. Strength is exceptional." },
  Emerald:   { color: "#34d399", bg: "rgba(52,211,153,0.1)",  glow: "rgba(52,211,153,0.3)",   desc: "Rare dedication. Your body is a testament." },
  Ruby:      { color: "#f87171", bg: "rgba(248,113,113,0.1)", glow: "rgba(248,113,113,0.3)",  desc: "Top 1%. Nearly untouchable strength levels." },
  Sapphire:  { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  glow: "rgba(96,165,250,0.3)",   desc: "Legendary. Your name is spoken with reverence." },
  Ascendant: { color: "#f97316", bg: "rgba(249,115,22,0.1)",  glow: "rgba(249,115,22,0.4)",   desc: "THE PINNACLE. You have truly ascended." },
};

const BASE_POINTS = 500;

function getThresholdForRank(rankIndex) {
  let total = 0;
  for (let i = 0; i <= rankIndex; i++) {
    total += Math.round(BASE_POINTS * Math.pow(1.35, i));
  }
  return total;
}

function getPointsRequiredForRank(rankIndex) {
  return Math.round(BASE_POINTS * Math.pow(1.35, rankIndex));
}

function getRankFromPoints(points) {
  let threshold = 0;
  for (let i = 0; i < RANK_ORDER.length; i++) {
    threshold += Math.round(BASE_POINTS * Math.pow(1.35, i));
    if (points < threshold) return RANK_ORDER[i];
  }
  return RANK_ORDER[RANK_ORDER.length - 1];
}

function getRankProgress(rankPoints, currentRank) {
  const idx = RANK_ORDER.indexOf(currentRank);
  const prevThreshold = idx === 0 ? 0 : getThresholdForRank(idx - 1);
  const nextThreshold = getThresholdForRank(idx);
  const progress = Math.min(((rankPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100, 100);
  return {
    progress: Math.max(0, progress),
    pointsLeft: Math.max(0, nextThreshold - rankPoints),
    nextThreshold,
    prevThreshold,
  };
}

function getTier(rank) {
  return rank?.split(" ")[0];
}

function RankBadge({ rank, size = "md" }) {
  const tier = getTier(rank);
  const meta = TIER_META[tier] || TIER_META.Iron;
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold border-2 flex-shrink-0`}
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.color,
        color: meta.color,
        boxShadow: `0 0 12px ${meta.glow}`,
      }}
    >
      <Award size={size === "lg" ? 24 : size === "md" ? 18 : 14} />
    </div>
  );
}

export default function Rankings() {
  const [userData, setUserData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedTier, setExpandedTier] = useState(null);
  const [activeTab, setActiveTab] = useState('myrank'); // 'myrank' | 'leaderboard' | 'tiers'

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) setUserData(userSnap.data());

      // Workout count for this user
      try {
        const wq = query(collection(db, "workouts"), where("userId", "==", uid));
        const wSnap = await getDocs(wq);
        setWorkoutCount(wSnap.size);
      } catch (_) {}

      // Top 20 leaderboard
      try {
        const lq = query(
          collection(db, "users"),
          orderBy("rankPoints", "desc"),
          limit(20)
        );
        const lSnap = await getDocs(lq);
        setLeaderboard(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (_) {}

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading rankings...</div>
      </div>
    );
  }

  const rank = userData?.currentRank || "Iron I";
  const rankPoints = userData?.rankPoints || 0;
  const tier = getTier(rank);
  const meta = TIER_META[tier] || TIER_META.Iron;
  const rankIdx = RANK_ORDER.indexOf(rank);
  const nextRank = rankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[rankIdx + 1] : null;
  const { progress, pointsLeft, prevThreshold, nextThreshold } = getRankProgress(rankPoints, rank);

  // Group ranks into tiers for the tier browser
  const tiers = Object.keys(TIER_META).map(tierName => ({
    name: tierName,
    meta: TIER_META[tierName],
    ranks: RANK_ORDER.filter(r => r.startsWith(tierName)),
  }));

  const userLeaderboardPosition = leaderboard.findIndex(u => u.id === auth.currentUser?.uid);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Rankings</h1>
          <p className="text-zinc-400 mt-1">50 ranks. One ascent. Where do you stand?</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {[
            { key: 'myrank', label: 'My Rank' },
            { key: 'leaderboard', label: 'Leaderboard' },
            { key: 'tiers', label: 'All 50 Ranks' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition whitespace-nowrap ${
                activeTab === t.key ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* MY RANK TAB */}
        {activeTab === 'myrank' && (
          <div className="space-y-6">

            {/* Main rank card */}
            <div
              className="rounded-3xl p-8 border relative overflow-hidden"
              style={{ backgroundColor: meta.bg, borderColor: meta.color + "40" }}
            >
              {/* Glow backdrop */}
              <div
                className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: meta.color }}
              />

              <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Badge */}
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-3xl flex items-center justify-center border-2 flex-shrink-0"
                  style={{
                    backgroundColor: meta.bg,
                    borderColor: meta.color,
                    boxShadow: `0 0 40px ${meta.glow}`,
                  }}
                >
                  <Award size={52} style={{ color: meta.color }} />
                </div>

                <div className="flex-1">
                  <p className="text-zinc-400 text-sm uppercase tracking-widest mb-1">Current Rank</p>
                  <h2 className="text-3xl md:text-5xl font-bold mb-1" style={{ color: meta.color }}>{rank}</h2>
                  <p className="text-zinc-400 mb-4">{meta.desc}</p>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-xs mb-1">Rank Points</p>
                      <p className="text-2xl font-bold text-white">{rankPoints.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-xs mb-1">Rank #</p>
                      <p className="text-2xl font-bold text-white">
                        {userLeaderboardPosition >= 0 ? `#${userLeaderboardPosition + 1}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-xs mb-1">Workouts</p>
                      <p className="text-2xl font-bold text-white">{workoutCount}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-xs mb-1">Tier</p>
                      <p className="text-2xl font-bold" style={{ color: meta.color }}>{tier}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress to next rank */}
              {nextRank && (
                <div className="mt-8 relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold" style={{ color: meta.color }}>{rank}</span>
                    <span className="text-zinc-400">{nextRank}</span>
                  </div>
                  <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%`, backgroundColor: meta.color, boxShadow: `0 0 12px ${meta.glow}` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-zinc-500">
                    <span>{prevThreshold.toLocaleString()} pts</span>
                    <span className="text-zinc-400 font-medium">{pointsLeft.toLocaleString()} pts to {nextRank}</span>
                    <span>{nextThreshold.toLocaleString()} pts</span>
                  </div>
                </div>
              )}

              {!nextRank && (
                <div className="mt-8 text-center py-4">
                  <p className="text-orange-500 font-bold text-xl">🏆 MAX RANK ACHIEVED — YOU HAVE ASCENDED</p>
                </div>
              )}
            </div>

            {/* Rank path — show surrounding ranks */}
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <TrendingUp className="text-orange-500" size={20} /> Your Rank Path
              </h3>
              <div className="space-y-3">
                {RANK_ORDER.slice(Math.max(0, rankIdx - 2), Math.min(RANK_ORDER.length, rankIdx + 6)).map((r, i) => {
                  const rIdx = RANK_ORDER.indexOf(r);
                  const rTier = getTier(r);
                  const rMeta = TIER_META[rTier];
                  const isCurrent = r === rank;
                  const isUnlocked = rIdx <= rankIdx;
                  const threshold = getThresholdForRank(rIdx);
                  const needed = getPointsRequiredForRank(rIdx);

                  return (
                    <div
                      key={r}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition ${
                        isCurrent ? 'border-2' : 'border border-zinc-800 bg-zinc-800/30'
                      }`}
                      style={isCurrent ? { borderColor: rMeta.color, backgroundColor: rMeta.bg } : {}}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isUnlocked ? rMeta.bg : 'rgba(39,39,42,0.8)',
                          border: `1.5px solid ${isUnlocked ? rMeta.color : '#3f3f46'}`,
                        }}
                      >
                        {isUnlocked
                          ? <Award size={18} style={{ color: rMeta.color }} />
                          : <Lock size={14} className="text-zinc-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-semibold"
                            style={{ color: isUnlocked ? rMeta.color : '#52525b' }}
                          >
                            {r}
                          </p>
                          {isCurrent && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: rMeta.color, color: '#000' }}
                            >
                              YOU ARE HERE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">Requires {threshold.toLocaleString()} total pts · +{needed.toLocaleString()} pts this rank</p>
                      </div>
                      {isCurrent && (
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: rMeta.color }}>{Math.round(progress)}%</p>
                          <p className="text-xs text-zinc-500">complete</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How to earn points */}
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Zap className="text-orange-500" size={20} /> How to Earn Rank Points
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Volume Points", desc: "+5 pts per 500kg of total workout volume", icon: Dumbbell },
                  { label: "Compound Bonus", desc: "+10 pts per compound exercise in a session", icon: TrendingUp },
                  { label: "Exercise Variety", desc: "+3 pts per unique exercise logged", icon: Award },
                ].map(item => (
                  <div key={item.label} className="bg-zinc-800 rounded-2xl p-4">
                    <item.icon className="text-orange-500 mb-3" size={20} />
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-zinc-400 text-xs mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-zinc-600 text-xs mt-4">Points accumulate with every workout. Rank up automatically when thresholds are crossed.</p>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-white text-lg">Top Athletes</h3>
                <p className="text-zinc-500 text-sm">Top 20 by rank points</p>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No athletes yet. Be the first!</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {leaderboard.map((user, i) => {
                    const uRank = user.currentRank || "Iron I";
                    const uTier = getTier(uRank);
                    const uMeta = TIER_META[uTier] || TIER_META.Iron;
                    const isMe = user.id === auth.currentUser?.uid;
                    const medals = ["🥇", "🥈", "🥉"];

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 px-6 py-4 transition ${isMe ? 'bg-orange-500/5' : 'hover:bg-zinc-800/50'}`}
                      >
                        {/* Position */}
                        <div className="w-8 text-center flex-shrink-0">
                          {i < 3
                            ? <span className="text-xl">{medals[i]}</span>
                            : <span className="text-zinc-500 font-bold text-sm">#{i + 1}</span>
                          }
                        </div>

                        <RankBadge rank={uRank} size="sm" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>
                              {user.name || "Anonymous"}
                              {isMe && <span className="text-xs ml-1 text-orange-400">(you)</span>}
                            </p>
                          </div>
                          <p className="text-xs font-medium mt-0.5" style={{ color: uMeta.color }}>{uRank}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-white">{(user.rankPoints || 0).toLocaleString()}</p>
                          <p className="text-xs text-zinc-500">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {userLeaderboardPosition < 0 && (
              <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 text-center">
                <p className="text-zinc-400 text-sm">You're not in the top 20 yet. Keep logging workouts to climb!</p>
              </div>
            )}
          </div>
        )}

        {/* ALL 50 RANKS TAB */}
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm mb-6">
              The full 50-rank progression system. Each tier has 5 divisions. Higher tiers require exponentially more points — early ranks reward fast strength gains, later ranks demand true dedication.
            </p>

            {tiers.map(tierData => {
              const isExpanded = expandedTier === tierData.name;
              const userInThisTier = getTier(rank) === tierData.name;
              const tierUnlocked = RANK_ORDER.indexOf(`${tierData.name} I`) <= rankIdx;

              return (
                <div
                  key={tierData.name}
                  className="rounded-3xl border overflow-hidden transition"
                  style={{
                    borderColor: userInThisTier ? tierData.meta.color + "60" : '#27272a',
                    backgroundColor: userInThisTier ? tierData.meta.bg : 'rgb(24,24,27)',
                  }}
                >
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left"
                    onClick={() => setExpandedTier(isExpanded ? null : tierData.name)}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                      style={{
                        backgroundColor: tierUnlocked ? tierData.meta.bg : 'rgba(39,39,42,0.6)',
                        borderColor: tierUnlocked ? tierData.meta.color : '#3f3f46',
                        boxShadow: tierUnlocked ? `0 0 16px ${tierData.meta.glow}` : 'none',
                      }}
                    >
                      {tierUnlocked
                        ? <Award size={22} style={{ color: tierData.meta.color }} />
                        : <Lock size={16} className="text-zinc-600" />
                      }
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3
                          className="text-lg font-bold"
                          style={{ color: tierUnlocked ? tierData.meta.color : '#52525b' }}
                        >
                          {tierData.name}
                        </h3>
                        {userInThisTier && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: tierData.meta.color, color: '#000' }}
                          >
                            CURRENT TIER
                          </span>
                        )}
                        <span className="text-xs text-zinc-600">
                          {tierData.name} I – {tierData.name} V
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm mt-0.5">{tierData.meta.desc}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronUp size={20} className="text-zinc-400" />
                        : <ChevronDown size={20} className="text-zinc-400" />
                      }
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: '#27272a' }}>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
                        {tierData.ranks.map(r => {
                          const rIdx = RANK_ORDER.indexOf(r);
                          const rUnlocked = rIdx <= rankIdx;
                          const isCurrent = r === rank;
                          const threshold = getThresholdForRank(rIdx);
                          const needed = getPointsRequiredForRank(rIdx);

                          return (
                            <div
                              key={r}
                              className="rounded-2xl p-4 border text-center"
                              style={{
                                borderColor: isCurrent ? tierData.meta.color : rUnlocked ? tierData.meta.color + "30" : '#27272a',
                                backgroundColor: isCurrent ? tierData.meta.bg : rUnlocked ? 'rgba(39,39,42,0.5)' : 'rgba(24,24,27,0.8)',
                                boxShadow: isCurrent ? `0 0 20px ${tierData.meta.glow}` : 'none',
                              }}
                            >
                              <div className="flex justify-center mb-2">
                                {rUnlocked
                                  ? <Award size={20} style={{ color: tierData.meta.color }} />
                                  : <Lock size={16} className="text-zinc-700" />
                                }
                              </div>
                              <p
                                className="font-bold text-sm"
                                style={{ color: rUnlocked ? tierData.meta.color : '#52525b' }}
                              >
                                {r}
                              </p>
                              {isCurrent && <p className="text-xs mt-1" style={{ color: tierData.meta.color }}>← YOU</p>}
                              <p className="text-xs text-zinc-600 mt-2">{threshold.toLocaleString()} pts</p>
                              <p className="text-xs text-zinc-700">+{needed.toLocaleString()} this rank</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}