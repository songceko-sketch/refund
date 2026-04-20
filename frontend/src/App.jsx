import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    if (token) setAuth({ token, role, email });
    setAuthLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('email', data.email);
    setAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    setAuth(null);
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen font-sans text-slate-800 flex flex-col">
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 flex items-center gap-8">
                <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent tracking-tight">
                  RefundFlow
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                  <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Home</Link>
                  <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">About Us</Link>
                  <Link to="/privacy" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Privacy</Link>
                  {auth && (
                    <Link to="/dashboard" className="text-sm font-bold text-primary hover:text-indigo-600 transition-colors">
                      {auth.role === 'admin' ? '⚙️ Admin Panel' : '📦 My Dashboard'}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {auth ? (
                  <>
                    <span className="hidden sm:inline-block text-sm text-slate-500 font-medium truncate max-w-[160px]">{auth.email}</span>
                    <button
                      onClick={logout}
                      className="text-sm font-semibold text-red-600 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-full shadow-sm text-sm font-semibold text-white bg-primary hover:bg-blue-600 transition-all transform hover:scale-105"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Auth routes — redirect to dashboard if already logged in */}
            <Route path="/login" element={!auth ? <Login onLogin={login} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!auth ? <Register /> : <Navigate to="/dashboard" replace />} />

            {/* Protected dashboard */}
            <Route path="/dashboard" element={auth ? <Dashboard auth={auth} /> : <Navigate to="/login" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="w-full text-center py-6 border-t border-slate-200 bg-white/50 mt-auto">
          <p className="text-xs text-slate-400">
            &copy; 2026 RefundFlow. All rights reserved.{' '}
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            {' · '}
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
