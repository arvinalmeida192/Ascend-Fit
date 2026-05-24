import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import MuscleMap from './pages/MuscleMap';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading Ascend Fit...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/app/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/app/dashboard" />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/workouts" element={<Workouts />} />
          <Route path="/app/nutrition" element={<Nutrition />} />
          <Route path="/app/muscle-map" element={<MuscleMap />} />
          <Route path="/app/rankings" element={<Rankings />} />
          <Route path="/app/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;