import { useOBD } from '../context/OBDContext';
import Gauge from '../components/Gauge';
import DataCard from '../components/DataCard';

export default function Dashboard() {
  const { isConnected, liveData, isMonitoring, startLiveMonitoring, stopLiveMonitoring, dtcCodes, selectedVehicle } = useOBD();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">No Device Connected</h2>
        <p className="text-gray-400 max-w-md text-sm md:text-base">
          Connect your ELM327 Bluetooth adapter to start scanning your vehicle.
          Make sure your ignition is on and the adapter is plugged into the OBD-II port.
        </p>
        {selectedVehicle && (
          <div className="mt-4 md:mt-6 px-4 py-3 bg-obd-card rounded-lg">
            <p className="text-xs md:text-sm text-gray-400">Selected Vehicle</p>
            <p className="font-semibold text-sm md:text-base">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Vehicle Banner */}
      {selectedVehicle && (
        <div className="bg-gradient-to-r from-obd-accent to-blue-700 rounded-xl p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-blue-200">Scanning</p>
              <p className="font-bold text-sm md:text-lg truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Dashboard</h2>
        <button
          onClick={isMonitoring ? stopLiveMonitoring : startLiveMonitoring}
          className={`px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors w-full sm:w-auto ${
            isMonitoring
              ? 'bg-obd-warning hover:bg-yellow-600'
              : 'bg-obd-success hover:bg-green-600'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Live Monitoring'}
        </button>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Gauge
          value={liveData.rpm || 0}
          max={8000}
          label="Engine RPM"
          unit="RPM"
          color="#3b82f6"
        />
        <Gauge
          value={liveData.speed || 0}
          max={240}
          label="Vehicle Speed"
          unit="km/h"
          color="#22c55e"
        />
        <Gauge
          value={liveData.coolantTemp || 0}
          max={120}
          label="Coolant Temp"
          unit="°C"
          color="#f59e0b"
        />
        <Gauge
          value={liveData.throttlePosition || 0}
          max={100}
          label="Throttle"
          unit="%"
          color="#8b5cf6"
        />
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <DataCard
          title="Engine Load"
          value={(liveData.engineLoad || 0).toFixed(1)}
          unit="%"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <DataCard
          title="Fuel Level"
          value={(liveData.fuelLevel || 0).toFixed(0)}
          unit="%"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          color="text-obd-warning"
        />
        <DataCard
          title="Intake Air Temp"
          value={(liveData.intakeTemp || 0).toFixed(0)}
          unit="°C"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
          color="text-obd-error"
        />
        <DataCard
          title="Battery Voltage"
          value={(liveData.voltage || 0).toFixed(1)}
          unit="V"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="text-obd-success"
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Diagnostic Status</h3>
          <div className="flex items-center gap-2 md:gap-3">
            {dtcCodes.length === 0 ? (
              <>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-obd-success flex-shrink-0" />
                <span className="text-sm md:text-base">No fault codes detected</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-obd-error animate-pulse flex-shrink-0" />
                <span className="text-obd-error text-sm md:text-base">{dtcCodes.length} fault code(s) detected</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Engine Run Time</h3>
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl md:text-2xl font-bold">
              {Math.floor((liveData.runTime || 0) / 60)}:{String((liveData.runTime || 0) % 60).padStart(2, '0')}
            </span>
            <span className="text-gray-400 text-sm md:text-base">min:sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
