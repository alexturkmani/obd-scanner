import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { OBDProvider } from './context/OBDContext';
import Dashboard from './pages/Dashboard';
import DiagnosticCodes from './pages/DiagnosticCodes';
import LiveData from './pages/LiveData';
import VehicleInfo from './pages/VehicleInfo';
import ConnectionPanel from './components/ConnectionPanel';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <OBDProvider>
      <BrowserRouter>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-obd-card transition-all duration-300 flex flex-col`}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-obd-accent rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-bold text-lg">OBD Scanner</span>}
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-obd-accent text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {sidebarOpen && <span>Dashboard</span>}
              </NavLink>

              <NavLink
                to="/codes"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-obd-accent text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {sidebarOpen && <span>Diagnostic Codes</span>}
              </NavLink>

              <NavLink
                to="/live"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-obd-accent text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {sidebarOpen && <span>Live Data</span>}
              </NavLink>

              <NavLink
                to="/vehicle"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-obd-accent text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {sidebarOpen && <span>Vehicle Info</span>}
              </NavLink>
            </nav>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-4 border-t border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <svg className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            <header className="bg-obd-card p-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">OBD-II Diagnostic Scanner</h1>
              <ConnectionPanel />
            </header>

            <div className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/codes" element={<DiagnosticCodes />} />
                <Route path="/live" element={<LiveData />} />
                <Route path="/vehicle" element={<VehicleInfo />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </OBDProvider>
  );
}

export default App;
