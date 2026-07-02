import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import VisitorLayout from './visitor/VisitorLayout.jsx';
import VisitorHome from './visitor/VisitorHome.jsx';
import VisitorTournois from './visitor/VisitorTournois.jsx';
import VisitorTournoiDetails from './visitor/VisitorTournoiDetails.jsx';
import VisitorEquipes from './visitor/VisitorEquipes.jsx';
import VisitorEquipeDetails from './visitor/VisitorEquipeDetails.jsx';
import VisitorJoueurs from './visitor/VisitorJoueurs.jsx';
import VisitorJoueurDetails from './visitor/VisitorJoueurDetails.jsx';

import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tournois from './pages/Tournois.jsx';
import TournoiDetails from './pages/TournoiDetails.jsx';
import Equipes from './pages/Equipes.jsx';
import EquipeDetails from './pages/EquipeDetails.jsx';
import Joueurs from './pages/Joueurs.jsx';

import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="empty">Chargement…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="empty">Chargement…</div>;

  return (
    <Routes>
      {/* Public visitor app */}
      <Route element={<VisitorLayout />}>
        <Route path="/" element={<VisitorHome />} />
        <Route path="/tournois" element={<VisitorTournois />} />
        <Route path="/tournois/:id" element={<VisitorTournoiDetails />} />
        <Route path="/equipes" element={<VisitorEquipes />} />
        <Route path="/equipes/:id" element={<VisitorEquipeDetails />} />
        <Route path="/joueurs" element={<VisitorJoueurs />} />
        <Route path="/joueurs/:id" element={<VisitorJoueurDetails />} />
        <Route path="/matches/:id" element={<VisitorHome />} />
      </Route>

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin app */}
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="tournois" element={<Tournois />} />
        <Route path="tournois/:id" element={<TournoiDetails />} />
        <Route path="equipes" element={<Equipes />} />
        <Route path="equipes/:id" element={<EquipeDetails />} />
        <Route path="joueurs" element={<Joueurs />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
