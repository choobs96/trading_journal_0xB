import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TradeProvider } from './context/TradeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TradeLog from './pages/TradeLog';
import Analytics from './pages/Analytics';
import Playbook from './pages/Playbook';
import CalendarView from './pages/CalendarView';
import AddTrade from './pages/AddTrade';
import ImportCSV from './pages/ImportCSV';

export default function App() {
  return (
    <TradeProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trades" element={<TradeLog />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/add" element={<AddTrade />} />
              <Route path="/import" element={<ImportCSV />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TradeProvider>
  );
}
