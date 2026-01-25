import { useOBD } from '../context/OBDContext';

export default function VehicleInfo() {
  const { isConnected, vehicleInfo, refreshVehicleInfo } = useOBD();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect for Vehicle Info</h2>
        <p className="text-gray-400">Connect your ELM327 adapter to view vehicle information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vehicle Information</h2>
        <button
          onClick={refreshVehicleInfo}
          className="px-4 py-2 bg-obd-accent hover:bg-blue-600 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Vehicle Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            VIN (Vehicle Identification Number)
          </h3>
          <p className="font-mono text-xl tracking-wider">
            {vehicleInfo?.vin || 'Not Available'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Battery Voltage
          </h3>
          <p className="text-3xl font-bold">
            {vehicleInfo?.voltage || '—'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            ELM327 Version
          </h3>
          <p className="font-mono text-lg">
            {vehicleInfo?.elmVersion || '—'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            OBD Protocol
          </h3>
          <p className="text-lg">
            {vehicleInfo?.protocol || '—'}
          </p>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="bg-obd-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">OBD-II Protocol Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">SAE J1850 PWM</span>
              <span>Ford vehicles (pre-2008)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">SAE J1850 VPW</span>
              <span>GM vehicles (pre-2008)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">ISO 9141-2</span>
              <span>European/Asian (pre-2004)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">ISO 14230-4 (KWP2000)</span>
              <span>European/Asian (2003+)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">ISO 15765-4 (CAN)</span>
              <span>All vehicles (2008+)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">SAE J1939 (CAN)</span>
              <span>Heavy duty vehicles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
