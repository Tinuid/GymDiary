import { useEffect } from 'react';
import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Gallery from './components/Gallery';
import MachineDetail from './components/MachineDetail';
import MachineForm from './components/MachineForm';
import ProgressChart from './components/ProgressChart';
import Settings from './components/Settings';

export default function App() {
  const refresh = useAppStore((s) => s.refreshMachines);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/geraet/neu" element={<MachineForm mode="create" />} />
          <Route path="/geraet/:id" element={<MachineDetail />} />
          <Route path="/geraet/:id/bearbeiten" element={<MachineForm mode="edit" />} />
          <Route path="/geraet/:id/progress" element={<ProgressChart />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const onRoot = location.pathname === '/';
  const title = getTitle(location.pathname);

  return (
    <header className="app-header">
      {onRoot ? (
        <Link to="/settings" className="btn btn-ghost" aria-label="Einstellungen">
          ⚙
        </Link>
      ) : (
        <button className="btn btn-ghost" onClick={() => navigate(-1)} aria-label="Zurück">
          ←
        </button>
      )}
      <h1>{title}</h1>
      {onRoot ? (
        <Link to="/geraet/neu" className="btn btn-ghost" aria-label="Neues Gerät">
          ＋
        </Link>
      ) : (
        <span style={{ width: 40 }} />
      )}
    </header>
  );
}

function getTitle(path: string): string {
  if (path === '/') return 'GymDiary';
  if (path === '/settings') return 'Einstellungen';
  if (path === '/geraet/neu') return 'Neues Gerät';
  if (path.endsWith('/bearbeiten')) return 'Gerät bearbeiten';
  if (path.endsWith('/progress')) return 'Progress';
  return 'Gerät';
}
