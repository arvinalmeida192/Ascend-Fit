import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  Dumbbell, Home, Dumbbell as WorkoutIcon, Utensils,
  User, Trophy, LogOut, Menu, X, Activity
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: "/app/dashboard",   icon: Home,         label: "Dashboard" },
  { to: "/app/workouts",    icon: WorkoutIcon,   label: "Workouts" },
  { to: "/app/nutrition",   icon: Utensils,      label: "Nutrition" },
  { to: "/app/muscle-map",  icon: Activity,      label: "Muscle Map" },
  { to: "/app/rankings",    icon: Trophy,        label: "Rankings" },
  { to: "/app/profile",     icon: User,          label: "Profile" },
];

// Bottom nav shows only 5 items on mobile (drop Muscle Map — least urgent)
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // collapsed by default on mobile
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">

      {/* ── MOBILE OVERLAY ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      {/* On mobile: fixed drawer that slides in from left     */}
      {/* On desktop: static sidebar, collapsible              */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-zinc-900 border-r border-zinc-800
          flex flex-col transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${desktopCollapsed ? 'md:w-20' : 'md:w-72'}
          w-72
        `}
      >
        {/* Logo row */}
        <div className="p-5 flex items-center justify-between border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-orange-500 flex-shrink-0" />
            {!desktopCollapsed && (
              <span className="text-xl font-bold tracking-tight hidden md:block">Ascend Fit</span>
            )}
            <span className="text-xl font-bold tracking-tight md:hidden">Ascend Fit</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={closeSidebar}
            className="md:hidden p-1 rounded-xl hover:bg-zinc-800 text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setDesktopCollapsed(p => !p)}
          className="hidden md:flex p-3 mx-3 mt-3 hover:bg-zinc-800 rounded-2xl self-start items-center gap-2 text-zinc-400 hover:text-white"
        >
          <Menu size={20} />
        </button>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-base
                 ${isActive
                   ? 'bg-orange-500/10 text-orange-500 font-medium'
                   : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                 }`
              }
            >
              <Icon size={22} className="flex-shrink-0" />
              {/* Show label: always on mobile drawer, conditional on desktop */}
              <span className={desktopCollapsed ? 'md:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-400 hover:text-red-500 px-4 py-3 rounded-2xl w-full hover:bg-zinc-800 transition"
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span className={desktopCollapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-orange-500" />
            <span className="font-bold text-white">Ascend Fit</span>
          </div>
          <div className="w-9" /> {/* spacer to centre the logo */}
        </header>

        {/* Page content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* ── MOBILE BOTTOM NAV ──────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-30 flex">
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors text-xs
                 ${isActive ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] leading-none">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Layout;