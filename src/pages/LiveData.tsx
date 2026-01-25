import { useOBD } from '../context/OBDContext';
import { MODE_01_PIDS } from '../data/obdCommands';

export default function LiveData() {
  const { isConnected, liveData, isMonitoring, startLiveMonitoring, stopLiveMonitoring } = useOBD();

  const sensorData = [
    { key: 'rpm', label: 'Engine RPM', unit: 'RPM', max: 8000 },
    { key: 'speed', label: 'Vehicle Speed', unit: 'km/h', max: 255 },
    { key: 'coolantTemp', label: 'Coolant Temperature', unit: '°C', max: 215 },
    { key: 'intakeTemp', label: 'Intake Air Temperature', unit: '°C', max: 215 },
    { key: 'engineLoad', label: 'Engine Load', unit: '%', max: 100 },
    { key: 'throttlePosition', label: 'Throttle Position', unit: '%', max: 100 },
    { key: 'fuelLevel', label: 'Fuel Level', unit: '%', max: 100 },
    { key: 'voltage', label: 'Battery Voltage', unit: 'V', max: 16 },
    { key: 'mafRate', label: 'MAF Rate', unit: 'g/s', max: 655 },
    { key: 'oilTemp', label: 'Oil Temperature', unit: '°C', max: 210 },
  ];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Connect for Live Data</h2>
        <p className="text-gray-400 text-sm md:text-base">Connect your ELM327 adapter to view real-time sensor data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Live Sensor Data</h2>
        <div className="flex items-center gap-2 md:gap-4">
          {isMonitoring && (
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 rounded-full bg-obd-success animate-pulse" />
              <span className="text-xs md:text-sm text-gray-400">Updating...</span>
            </div>
          )}
          <button
            onClick={isMonitoring ? stopLiveMonitoring : startLiveMonitoring}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-medium transition-colors flex-1 sm:flex-none ${
              isMonitoring
                ? 'bg-obd-warning hover:bg-yellow-600'
                : 'bg-obd-success hover:bg-green-600'
            }`}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </button>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {sensorData.map(({ key, label, unit, max }) => {
          const value = (liveData as Record<string, number>)[key] || 0;
          const percentage = Math.min((value / max) * 100, 100);
          
          return (
            <div key={key} className="bg-obd-card rounded-xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs md:text-sm">{label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-xl font-bold">
                    {typeof value === 'number' ? value.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs md:text-sm text-gray-400">{unit}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-obd-accent transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] md:text-xs text-gray-500">
                <span>0</span>
                <span>{max} {unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supported PIDs */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Available PIDs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {Object.entries(MODE_01_PIDS).map(([pid, info]) => (
            <div key={pid} className="px-2 py-1.5 md:px-3 md:py-2 bg-gray-700 rounded-lg text-xs md:text-sm">
              <span className="font-mono text-obd-accent">{pid}</span>
              <span className="text-gray-400 ml-1 md:ml-2">{info.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
