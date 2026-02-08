import { Routes, Route } from 'react-router-dom';
import HomePage from './components/landing/HomePage';
import LobbyPage from './components/lobby/LobbyPage';
import GamePage from './components/game/GamePage';
import Layout from './components/layout/Layout';
import GameStartedRedirect from './components/GameStartedRedirect';

function App() {
  return (
    <Layout>
      <GameStartedRedirect />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
