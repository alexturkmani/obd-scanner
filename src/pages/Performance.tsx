import { useOBD } from '../context/OBDContext';
import Gauge from '../components/Gauge';

export default function Performance() {
  const {
    isConnected, liveData, isMonitoring, startLiveMonitoring,
    performanceData, startPerformanceTimer, stopPerformanceTimer, resetPerformanceTimer,
    isPerformanceTiming,
  } = useOBD();

  // Boost pressure: intake pressure (kPa) minus atmospheric (~101.325 kPa)
  const boostPressure = (liveData.intakePressure || 0) - 101.325;
  const boostPsi = boostPressure * 0.14504;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Connect for Performance</h2>
        <p className="text-gray-400 text-sm md:text-base">Connect your ELM327 adapter to access performance features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Performance</h2>
        <div className="flex gap-2">
          {!isMonitoring && (
            <button
              onClick={startLiveMonitoring}
              className="px-3 py-1.5 bg-obd-success hover:bg-green-600 rounded-lg text-sm font-medium"
            >
              Start Monitoring
            </button>
          )}
        </div>
      </div>

      {/* Boost Gauge */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Turbo/Boost Gauge</h3>
        <div className="flex flex-col items-center">
          <Gauge
            value={Math.max(boostPsi, -14.7)}
            max={30}
            label="Boost Pressure"
            unit="PSI"
            color={boostPsi > 0 ? '#ef4444' : '#3b82f6'}
          />
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-400">Intake: {(liveData.intakePressure || 0).toFixed(0)} kPa</span>
            <span className="text-sm text-gray-400 mx-2">|</span>
            <span className={`text-sm font-medium ${boostPsi > 0 ? 'text-obd-error' : 'text-obd-accent'}`}>
              {boostPsi > 0 ? '+' : ''}{boostPsi.toFixed(1)} PSI
            </span>
          </div>
        </div>
      </div>

      {/* Performance Timer */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold">Performance Timer</h3>
          <div className="flex gap-2">
            {!isPerformanceTiming ? (
              <button
                onClick={startPerformanceTimer}
                disabled={!isMonitoring}
                className="px-3 py-1.5 bg-obd-success hover:bg-green-600 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Arm Timer
              </button>
            ) : (
              <button
                onClick={stopPerformanceTimer}
                className="px-3 py-1.5 bg-obd-warning hover:bg-yellow-600 rounded-lg text-sm font-medium"
              >
                Stop
              </button>
            )}
            <button
              onClick={resetPerformanceTimer}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {isPerformanceTiming && !performanceData.zeroToSixty && (
          <div className="mb-4 p-3 bg-obd-accent bg-opacity-20 rounded-lg text-center">
            <p className="text-sm text-obd-accent font-medium animate-pulse">
              Timer armed — start from standstill to begin timing
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">0-60 mph</p>
            <p className="text-xl md:text-2xl font-bold">
              {performanceData.zeroToSixty !== null ? `${performanceData.zeroToSixty.toFixed(2)}s` : '—'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">0-100 km/h</p>
            <p className="text-xl md:text-2xl font-bold">
              {performanceData.zeroToHundred !== null ? `${performanceData.zeroToHundred.toFixed(2)}s` : '—'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">1/4 Mile</p>
            <p className="text-xl md:text-2xl font-bold">
              {performanceData.quarterMile !== null ? `${performanceData.quarterMile.toFixed(2)}s` : '—'}
            </p>
            {performanceData.quarterMileSpeed !== null && (
              <p className="text-xs text-gray-400">{performanceData.quarterMileSpeed.toFixed(0)} km/h</p>
            )}
          </div>
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Max Speed</p>
            <p className="text-xl md:text-2xl font-bold">{performanceData.maxSpeed.toFixed(0)}</p>
            <p className="text-xs text-gray-400">km/h</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Max RPM</p>
            <p className="text-xl md:text-2xl font-bold">{performanceData.maxRpm.toFixed(0)}</p>
            <p className="text-xs text-gray-400">RPM</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Current Speed</p>
            <p className="text-xl md:text-2xl font-bold">{(liveData.speed || 0).toFixed(0)}</p>
            <p className="text-xs text-gray-400">km/h</p>
          </div>
        </div>
      </div>

      {/* Live Gauges */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Live Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Gauge value={liveData.rpm || 0} max={8000} label="RPM" unit="RPM" color="#ef4444" />
          <Gauge value={liveData.speed || 0} max={280} label="Speed" unit="km/h" color="#22c55e" />
          <Gauge value={liveData.throttlePosition || 0} max={100} label="Throttle" unit="%" color="#8b5cf6" />
          <Gauge value={liveData.engineLoad || 0} max={100} label="Load" unit="%" color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
