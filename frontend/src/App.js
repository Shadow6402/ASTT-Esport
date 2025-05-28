import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './assets/styles/main.css';

// Page d'accueil personnalisée
const HomePage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-container">
      <div className="network-bg"></div>
      <div className="particles" id="particles"></div>

      <div className="logo-container">
        <img src="/logo.png" alt="Logo ASTT E-sport VR" className="logo" />
      </div>

      <h1 className="app-title">ASTT E-sport VR</h1>
      <p className="app-subtitle">Plateforme de gestion des membres et distribution des codes d'accès</p>

      <div className="loading-bar">
        <div className="loading-progress" style={{ width: loading ? '70%' : '100%' }}></div>
      </div>

      {!loading && (
        <div className="action-buttons">
          <a href="/login" className="action-button login">Connexion</a>
          <a href="/register" className="action-button register">Inscription</a>
        </div>
      )}
    </div>
  );
};

// Composants fictifs pour les routes
const Login = () => <div className="page-container"><h1>Connexion</h1><p>Page de connexion en cours de développement</p></div>;
const Register = () => <div className="page-container"><h1>Inscription</h1><p>Page d'inscription en cours de développement</p></div>;
const Dashboard = () => <div className="page-container"><h1>Tableau de bord</h1><p>Tableau de bord en cours de développement</p></div>;
const NotFound = () => <div className="page-container"><h1>404</h1><p>Page non trouvée</p></div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  );
}

export default App;
