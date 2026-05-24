import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

/* ─── tiny hook: intersection observer for scroll reveals ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── animated counter ─── */
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const RANKS = ['Iron','Bronze','Silver','Gold','Platinum','Diamond','Emerald','Ruby','Sapphire','Ascendant'];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroRef, heroVisible] = useReveal();
  const [featRef, featVisible] = useReveal();
  const [rankRef, rankVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={styles.root}>
      <style>{CSS}</style>

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="11" width="6" height="6" rx="1.5" fill="#f97316"/>
              <rect x="11" y="2" width="6" height="24" rx="2" fill="#f97316"/>
              <rect x="20" y="11" width="6" height="6" rx="1.5" fill="#f97316"/>
              <rect x="0" y="12.5" width="4" height="3" rx="1" fill="#ea580c"/>
              <rect x="24" y="12.5" width="4" height="3" rx="1" fill="#ea580c"/>
            </svg>
            <span style={styles.logoText}>ASCEND FIT</span>
          </div>

          {/* desktop links */}
          <div className="desktop-links" style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#ranks" style={styles.navLink}>Ranks</a>
            <Link to="/login" style={styles.navLink}>Login</Link>
            <Link to="/signup" style={styles.cta}>Get Started</Link>
          </div>

          {/* mobile hamburger */}
          <button className="hamburger" style={styles.hamburger} onClick={() => setMenuOpen(p => !p)}>
            <span style={{ ...styles.bar, ...(menuOpen ? styles.barTop : {}) }} />
            <span style={{ ...styles.bar, ...(menuOpen ? styles.barMid : {}) }} />
            <span style={{ ...styles.bar, ...(menuOpen ? styles.barBot : {}) }} />
          </button>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <div style={styles.mobileMenu}>
            <a href="#features" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#ranks" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Ranks</a>
            <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" style={{ ...styles.mobileLink, ...styles.mobileCta }} onClick={() => setMenuOpen(false)}>Get Started →</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={styles.hero}>
        {/* background grid */}
        <div style={styles.gridBg} aria-hidden />
        {/* orange glow orb */}
        <div style={styles.orb} aria-hidden />

        <div
          ref={heroRef}
          style={{ ...styles.heroContent, ...(heroVisible ? styles.fadeIn : styles.fadeOut) }}
        >
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            50-RANK PROGRESSION SYSTEM
          </div>

          <h1 style={styles.heroTitle}>
            TURN YOUR<br />
            <span style={styles.heroAccent}>SWEAT</span> INTO<br />
            <span style={styles.heroAccent}>RANKS</span>
          </h1>

          <p style={styles.heroSub}>
            The fitness tracker built for serious lifters. Log every rep, track every macro,
            watch your rank climb from Iron to Ascendant.
          </p>

          <div style={styles.heroButtons}>
            <Link to="/signup" style={styles.btnPrimary} className="btn-glow">
              Start Your Ascent →
            </Link>
            <Link to="/login" style={styles.btnGhost}>
              Login
            </Link>
          </div>
        </div>

        {/* floating rank pill */}
        <div style={styles.rankPill} className="float-anim">
          <span style={{ color: '#f97316', fontWeight: 700 }}>Iron I</span>
          <span style={styles.rankArrow}>→</span>
          <span style={{ color: '#67e8f9', fontWeight: 700 }}>Ascendant V</span>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="stats-grid" style={styles.statsSection} ref={statsRef}>
        {[
          { val: 50, suffix: '', label: 'Ranks to climb' },
          { val: 150, suffix: '+', label: 'Exercises tracked' },
          { val: 300, suffix: '+', label: 'Foods in database' },
          { val: 16, suffix: '', label: 'Muscle groups mapped' },
        ].map((s, i) => (
          <div key={i} style={styles.statItem}>
            <div style={styles.statNum}>
              {statsVisible ? <Counter to={s.val} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" style={styles.featSection} ref={featRef}>
        <div style={styles.sectionLabel}>WHAT YOU GET</div>
        <h2 style={styles.sectionTitle}>
          Everything a serious<br />lifter needs.
        </h2>

        <div style={styles.featGrid}>
          {[
            {
              icon: '🏋️',
              title: 'Smart Workout Logger',
              desc: 'Log sets, reps, weight and RPE. Auto-calculates calories burned and rank points earned per session.',
              accent: '#f97316',
            },
            {
              icon: '🍗',
              title: 'Full Nutrition Engine',
              desc: 'Track every macro and micro. 300+ Indian & international foods. Build your own dishes and save them.',
              accent: '#34d399',
            },
            {
              icon: '🏆',
              title: '50-Rank System',
              desc: 'Iron to Ascendant across 10 tiers. Points earned from volume, compounds, and consistency.',
              accent: '#fbbf24',
            },
            {
              icon: '💪',
              title: 'Muscle Map',
              desc: 'See exactly which muscles you\'re developing. Color-coded body model updates with every workout.',
              accent: '#60a5fa',
            },
            {
              icon: '📊',
              title: 'Progress Analytics',
              desc: 'Weekly trends on nutrition, volume, and strength. Watch your numbers climb over time.',
              accent: '#f87171',
            },
            {
              icon: '⚡',
              title: 'Instant Dashboard',
              desc: 'Your daily snapshot — calories, macros, rank progress, and recent workouts at a glance.',
              accent: '#a78bfa',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                ...styles.featCard,
                animationDelay: `${i * 80}ms`,
                ...(featVisible ? styles.featCardVisible : {}),
                '--accent': f.accent,
              }}
              className="feat-card"
            >
              <div style={styles.featIcon}>{f.icon}</div>
              <h3 style={{ ...styles.featTitle, color: f.accent }}>{f.title}</h3>
              <p style={styles.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RANKS ──────────────────────────────────────────── */}
      <section id="ranks" style={styles.rankSection} ref={rankRef}>
        <div style={styles.rankBg} aria-hidden />
        <div style={styles.sectionLabel}>THE CLIMB</div>
        <h2 style={{ ...styles.sectionTitle, textAlign: 'center' }}>
          50 ranks.<br />One goal.
        </h2>
        <p style={styles.rankSub}>
          Every workout earns you points. Points push you up the ladder.
          The higher you climb, the harder it gets — just like real strength.
        </p>

        <div style={styles.rankTrack}>
          {RANKS.map((tier, i) => {
            const colors = {
              Iron:'#9ca3af', Bronze:'#cd7f32', Silver:'#c0c0c0',
              Gold:'#fbbf24', Platinum:'#e2e8f0', Diamond:'#67e8f9',
              Emerald:'#34d399', Ruby:'#f87171', Sapphire:'#60a5fa',
              Ascendant:'#f97316'
            };
            const col = colors[tier];
            return (
              <div
                key={tier}
                style={{
                  ...styles.rankChip,
                  borderColor: col,
                  color: col,
                  animationDelay: `${i * 60}ms`,
                  ...(rankVisible ? styles.rankChipVisible : {}),
                }}
                className="rank-chip"
              >
                <span style={{ ...styles.rankDot, background: col }} />
                {tier}
              </div>
            );
          })}
        </div>

        <div style={styles.rankNote}>
          Each tier has 5 divisions (I → V) · 50 ranks total
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section style={styles.ctaSection} ref={ctaRef}>
        <div style={styles.ctaGlow} aria-hidden />
        <div style={{ ...styles.ctaContent, ...(ctaVisible ? styles.fadeIn : styles.fadeOut) }}>
          <h2 style={styles.ctaTitle}>Ready to Ascend?</h2>
          <p style={styles.ctaSub}>Free. No subscriptions. Just lift.</p>
          <Link to="/signup" style={styles.btnPrimary} className="btn-glow">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="11" width="6" height="6" rx="1.5" fill="#f97316"/>
            <rect x="11" y="2" width="6" height="24" rx="2" fill="#f97316"/>
            <rect x="20" y="11" width="6" height="6" rx="1.5" fill="#f97316"/>
          </svg>
          <span style={{ ...styles.logoText, fontSize: '0.85rem', color: '#52525b' }}>ASCEND FIT</span>
        </div>
        <p style={styles.footerText}>Built for lifters. Fuelled by reps.</p>
        <p style={{ ...styles.footerText, color: '#3f3f46' }}>Built by <span style={{ color: '#f97316', fontWeight: 600 }}>Arvin Almeida</span></p>
      </footer>
    </div>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────── */
const styles = {
  root: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#fff',
    fontFamily: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
    overflowX: 'hidden',
  },

  /* NAV */
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'background 0.3s, border-color 0.3s',
    borderBottom: '1px solid transparent',
  },
  navScrolled: {
    background: 'rgba(9,9,11,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottomColor: '#27272a',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto',
    padding: '0 1.5rem',
    height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.12em', color: '#fff',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '2rem' },
  navLink: {
    color: '#a1a1aa', textDecoration: 'none', fontSize: '0.9rem',
    letterSpacing: '0.05em', fontWeight: 500,
    transition: 'color 0.2s',
  },
  cta: {
    background: '#f97316', color: '#fff', textDecoration: 'none',
    padding: '0.5rem 1.25rem', borderRadius: 8, fontWeight: 700,
    fontSize: '0.85rem', letterSpacing: '0.05em',
    transition: 'background 0.2s',
  },
  hamburger: {
    display: 'none', flexDirection: 'column', gap: 5,
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  },
  bar: {
    display: 'block', width: 22, height: 2,
    background: '#fff', borderRadius: 2,
    transition: 'transform 0.25s, opacity 0.25s',
  },
  barTop: { transform: 'translateY(7px) rotate(45deg)' },
  barMid: { opacity: 0 },
  barBot: { transform: 'translateY(-7px) rotate(-45deg)' },
  mobileMenu: {
    background: '#111113', borderTop: '1px solid #27272a',
    display: 'flex', flexDirection: 'column',
    padding: '1rem 1.5rem 1.5rem',
    gap: '0.25rem',
  },
  mobileLink: {
    color: '#d4d4d8', textDecoration: 'none',
    padding: '0.75rem 0', fontSize: '1.1rem',
    fontWeight: 600, letterSpacing: '0.04em',
    borderBottom: '1px solid #27272a',
  },
  mobileCta: {
    color: '#f97316', borderBottom: 'none', marginTop: '0.5rem',
  },

  /* HERO */
  hero: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '7rem 1.5rem 4rem',
    position: 'relative', overflow: 'hidden',
    textAlign: 'center',
  },
  gridBg: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
  },
  orb: {
    position: 'absolute', top: '20%', left: '50%',
    transform: 'translateX(-50%)',
    width: 600, height: 600,
    background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative', zIndex: 1,
    maxWidth: 760,
    transition: 'opacity 0.8s, transform 0.8s',
  },
  fadeOut: { opacity: 0, transform: 'translateY(30px)' },
  fadeIn:  { opacity: 1, transform: 'translateY(0)' },

  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    border: '1px solid rgba(249,115,22,0.4)',
    background: 'rgba(249,115,22,0.08)',
    color: '#f97316', padding: '0.4rem 1rem',
    borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.12em', marginBottom: '1.5rem',
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#f97316', flexShrink: 0,
    boxShadow: '0 0 6px #f97316',
  },
  heroTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 'clamp(3.5rem, 12vw, 8rem)',
    fontWeight: 800, lineHeight: 0.92,
    letterSpacing: '-0.02em',
    color: '#fff',
    margin: '0 0 1.5rem',
  },
  heroAccent: {
    color: 'transparent',
    WebkitTextStroke: '2px #f97316',
  },
  heroSub: {
    color: '#a1a1aa', fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
    maxWidth: 520, margin: '0 auto 2.5rem',
    lineHeight: 1.65, fontFamily: "'Inter', sans-serif", fontWeight: 400,
  },
  heroButtons: {
    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
  },
  btnPrimary: {
    background: '#f97316', color: '#fff', textDecoration: 'none',
    padding: '0.9rem 2rem', borderRadius: 10,
    fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em',
    transition: 'transform 0.15s, background 0.2s',
    display: 'inline-block',
  },
  btnGhost: {
    border: '1px solid #3f3f46', color: '#d4d4d8', textDecoration: 'none',
    padding: '0.9rem 2rem', borderRadius: 10,
    fontWeight: 600, fontSize: '0.95rem',
    transition: 'border-color 0.2s, color 0.2s',
    display: 'inline-block',
  },
  rankPill: {
    position: 'relative', zIndex: 1,
    marginTop: '3rem',
    display: 'inline-flex', alignItems: 'center', gap: 12,
    background: '#18181b', border: '1px solid #27272a',
    padding: '0.6rem 1.25rem', borderRadius: 100,
    fontSize: '0.85rem', letterSpacing: '0.04em',
  },
  rankArrow: { color: '#3f3f46', fontSize: '1.1rem' },

  /* STATS */
  statsSection: {
    borderTop: '1px solid #18181b', borderBottom: '1px solid #18181b',
    background: '#0d0d0f',
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 0,
  },
  statItem: {
    padding: '2.5rem 1.5rem', textAlign: 'center',
    borderRight: '1px solid #18181b',
    borderBottom: '1px solid #18181b',
  },
  statNum: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
    fontWeight: 800, color: '#f97316', lineHeight: 1,
    marginBottom: '0.4rem',
  },
  statLabel: {
    color: '#52525b', fontSize: '0.75rem',
    textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif",
  },

  /* FEATURES */
  featSection: {
    maxWidth: 1200, margin: '0 auto',
    padding: '6rem 1.5rem',
  },
  sectionLabel: {
    color: '#f97316', fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.2em', marginBottom: '0.75rem',
  },
  sectionTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 'clamp(2.2rem, 6vw, 4rem)',
    fontWeight: 800, lineHeight: 1.05,
    marginBottom: '3rem', color: '#fff',
  },
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1px',
    border: '1px solid #18181b',
    borderRadius: 16, overflow: 'hidden',
  },
  featCard: {
    background: '#0d0d0f',
    padding: '2rem',
    opacity: 0, transform: 'translateY(20px)',
    transition: 'opacity 0.5s, transform 0.5s, background 0.2s',
    cursor: 'default',
  },
  featCardVisible: { opacity: 1, transform: 'translateY(0)' },
  featIcon: { fontSize: '1.75rem', marginBottom: '1rem' },
  featTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: '1.3rem', fontWeight: 700,
    letterSpacing: '0.03em', marginBottom: '0.5rem',
  },
  featDesc: {
    color: '#71717a', fontSize: '0.875rem',
    lineHeight: 1.65, fontFamily: "'Inter', sans-serif",
  },

  /* RANKS */
  rankSection: {
    padding: '6rem 1.5rem',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
    background: '#0a0a0c',
  },
  rankBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  rankSub: {
    color: '#71717a', maxWidth: 480, margin: '0 auto 3rem',
    fontSize: '0.95rem', lineHeight: 1.7,
    fontFamily: "'Inter', sans-serif",
  },
  rankTrack: {
    display: 'flex', flexWrap: 'wrap',
    justifyContent: 'center', gap: '0.6rem',
    maxWidth: 720, margin: '0 auto',
    position: 'relative', zIndex: 1,
  },
  rankChip: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    border: '1px solid', borderRadius: 100,
    padding: '0.4rem 1rem', fontSize: '0.82rem',
    fontWeight: 700, letterSpacing: '0.06em',
    opacity: 0, transform: 'scale(0.9)',
    transition: 'opacity 0.4s, transform 0.4s',
  },
  rankChipVisible: { opacity: 1, transform: 'scale(1)' },
  rankDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  rankNote: {
    marginTop: '2rem', color: '#3f3f46',
    fontSize: '0.75rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
    position: 'relative', zIndex: 1,
  },

  /* CTA */
  ctaSection: {
    padding: '7rem 1.5rem',
    textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 50% 60% at 50% 100%, rgba(249,115,22,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ctaContent: {
    position: 'relative', zIndex: 1,
    transition: 'opacity 0.8s, transform 0.8s',
  },
  ctaTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 'clamp(3rem, 9vw, 6rem)',
    fontWeight: 800, color: '#fff', margin: '0 0 0.75rem',
    lineHeight: 1,
  },
  ctaSub: {
    color: '#52525b', fontSize: '1rem',
    marginBottom: '2.5rem', fontFamily: "'Inter', sans-serif",
  },

  /* FOOTER */
  footer: {
    borderTop: '1px solid #18181b',
    padding: '2rem 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '1rem',
    maxWidth: 1200, margin: '0 auto',
  },
  footerText: {
    color: '#3f3f46', fontSize: '0.8rem',
    fontFamily: "'Inter', sans-serif",
  },
};

/* ─── CSS-in-HTML for responsive + animations ──────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');

  /* hide desktop nav on mobile, show hamburger */
  @media (max-width: 700px) {
    nav .desktop-links { display: none !important; }
    nav button.hamburger { display: flex !important; }
  }
  @media (min-width: 701px) {
    nav button.hamburger { display: none !important; }
  }

  /* stats: 4 cols on desktop */
  @media (min-width: 640px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
  }

  /* hover states */
  .btn-glow:hover { background: #ea580c !important; transform: translateY(-2px); }
  .feat-card:hover { background: #111113 !important; }
  .rank-chip:hover { opacity: 0.85 !important; }
  a[style*="border: 1px solid #3f3f46"]:hover { border-color: #71717a !important; color: #fff !important; }

  /* float animation for rank pill */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .float-anim { animation: float 3s ease-in-out infinite; }

  /* scroll bar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #09090b; }
  ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
`;