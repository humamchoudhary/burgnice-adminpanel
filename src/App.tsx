import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('adminToken'));

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Dashboard onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/" replace />
              : <Login onLogin={() => setIsLoggedIn(true)} />
          }
        />

        <Route
          path="/signup"
          element={
            isLoggedIn
              ? <Navigate to="/" replace />
              : <Signup onSignup={() => setIsLoggedIn(true)} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
