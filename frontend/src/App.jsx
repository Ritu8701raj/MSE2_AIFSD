import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Home = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="container mt-4">Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>Campus Lost & Found</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        A unified platform to report and find lost items on campus.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a href="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>Get Started</a>
        <a href="/login" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>Login</a>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
