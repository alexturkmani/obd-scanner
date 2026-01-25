import { useOBD } from '../context/OBDContext';
import Gauge from '../components/Gauge';
import DataCard from '../components/DataCard';

export default function Dashboard() {
  const { isConnected, liveData, isMonitoring, startLiveMonitoring, stopLiveMonitoring, dtcCodes } = useOBD();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">No Device Connected</h2>
        <p className="text-gray-400 max-w-md">
          Connect your ELM327 Bluetooth adapter to start scanning your vehicle.
          Make sure your ignition is on and the adapter is plugged into the OBD-II port.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={isMonitoring ? stopLiveMonitoring : startLiveMonitoring}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isMonitoring
              ? 'bg-obd-warning hover:bg-yellow-600'
              : 'bg-obd-success hover:bg-green-600'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Live Monitoring'}
        </button>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Diagnostic Status</h3>
          <div className="flex items-center gap-3">
            {dtcCodes.length === 0 ? (
              <>
                <div className="w-4 h-4 rounded-full bg-obd-success" />
                <span>No fault codes detected</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-obd-error animate-pulse" />
                <span className="text-obd-error">{dtcCodes.length} fault code(s) detected</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Engine Run Time</h3>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl font-bold">
              {Math.floor((liveData.runTime || 0) / 60)}:{String((liveData.runTime || 0) % 60).padStart(2, '0')}
            </span>
            <span className="text-gray-400">min:sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
