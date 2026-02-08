import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import { getMe, getNeedsSetup } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => { setUser(data.username); setNeedsSetup(false); })
      .catch(async (e) => {
        setUser(null);
        if (e.status === 401) {
          try {
            const { needsSetup: need } = await getNeedsSetup();
            setNeedsSetup(need);
          } catch {
            setNeedsSetup(false);
          }
        } else setNeedsSetup(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={needsSetup ? <Setup onDone={() => setNeedsSetup(false)} /> : <Navigate to="/" replace />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : needsSetup ? <Navigate to="/setup" replace /> : <Login onLogin={(u) => setUser(u)} />} />
        <Route path="/" element={user ? <Dashboard username={user} onLogout={() => setUser(null)} /> : <Navigate to={needsSetup ? '/setup' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
