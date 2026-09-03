import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evenements from './pages/Evenements';
import Competitions from './pages/Competitions';
import Articles from './pages/Articles';
import Musique from './pages/Musique';
import Boutique from './pages/Boutique';
import Vendeurs from './pages/Vendeurs';
import Utilisateurs from './pages/Utilisateurs';
import Chaines from './pages/Chaines';
import Podcasts from './pages/Podcasts';
import Paiements from './pages/Paiements';

function MiseEnPage({ children }) {
  return (
    <div className="mise-en-page">
      <Sidebar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><MiseEnPage><Dashboard /></MiseEnPage></ProtectedRoute>} />
          <Route path="/evenements" element={<ProtectedRoute><MiseEnPage><Evenements /></MiseEnPage></ProtectedRoute>} />
          <Route path="/competitions" element={<ProtectedRoute><MiseEnPage><Competitions /></MiseEnPage></ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><MiseEnPage><Articles /></MiseEnPage></ProtectedRoute>} />
          <Route path="/musique" element={<ProtectedRoute><MiseEnPage><Musique /></MiseEnPage></ProtectedRoute>} />
          <Route path="/boutique" element={<ProtectedRoute><MiseEnPage><Boutique /></MiseEnPage></ProtectedRoute>} />
          <Route path="/vendeurs" element={<ProtectedRoute><MiseEnPage><Vendeurs /></MiseEnPage></ProtectedRoute>} />
          <Route path="/utilisateurs" element={<ProtectedRoute><MiseEnPage><Utilisateurs /></MiseEnPage></ProtectedRoute>} />
          <Route path="/chaines" element={<ProtectedRoute><MiseEnPage><Chaines /></MiseEnPage></ProtectedRoute>} />
          <Route path="/podcasts" element={<ProtectedRoute><MiseEnPage><Podcasts /></MiseEnPage></ProtectedRoute>} />
          <Route path="/paiements" element={<ProtectedRoute><MiseEnPage><Paiements /></MiseEnPage></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
