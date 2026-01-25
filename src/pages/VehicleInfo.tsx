import { useOBD } from '../context/OBDContext';
import VehicleSelector from '../components/VehicleSelector';

export default function VehicleInfo() {
  const { isConnected, vehicleInfo, refreshVehicleInfo, selectedVehicle, setSelectedVehicle } = useOBD();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Vehicle Information</h2>
        {isConnected && (
          <button
            onClick={refreshVehicleInfo}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm md:text-base font-medium transition-colors"
          >
            Refresh OBD Data
          </button>
        )}
      </div>

      {/* Vehicle Selection */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          Select Your Vehicle
        </h3>
        <VehicleSelector 
          onSelect={setSelectedVehicle} 
          initialVehicle={selectedVehicle}
        />
      </div>

      {/* Current Vehicle Banner */}
      {selectedVehicle && (
        <div className="bg-gradient-to-r from-obd-accent to-blue-700 rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-blue-200">Currently Selected</p>
                <h3 className="text-lg md:text-2xl font-bold truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm md:text-base w-full sm:w-auto"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* OBD Info - Only show when connected */}
      {isConnected && (
        <>
          {/* Vehicle Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            <span className="truncate">VIN</span>
          </h3>
          <p className="font-mono text-sm md:text-xl tracking-wider break-all">
            {vehicleInfo?.vin || 'Not Available'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Battery Voltage
          </h3>
          <p className="text-2xl md:text-3xl font-bold">
            {vehicleInfo?.voltage || '—'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            ELM327 Version
          </h3>
          <p className="font-mono text-base md:text-lg">
            {vehicleInfo?.elmVersion || '—'}
          </p>
        </div>

        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            OBD Protocol
          </h3>
          <p className="text-base md:text-lg">
            {vehicleInfo?.protocol || '—'}
          </p>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">OBD-II Protocol Reference</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">SAE J1850 PWM</span>
              <span className="text-right">Ford (pre-2008)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">SAE J1850 VPW</span>
              <span className="text-right">GM (pre-2008)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">ISO 9141-2</span>
              <span className="text-right">EU/Asian (pre-2004)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">ISO 14230 (KWP)</span>
              <span className="text-right">EU/Asian (2003+)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">ISO 15765 (CAN)</span>
              <span className="text-right">All (2008+)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700 gap-2">
              <span className="text-gray-400 flex-shrink-0">SAE J1939 (CAN)</span>
              <span className="text-right">Heavy duty</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Not Connected Message */}
      {!isConnected && !selectedVehicle && (
        <div className="bg-obd-card rounded-xl p-6 md:p-8 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">Connect for OBD Data</h3>
          <p className="text-gray-400 text-sm md:text-base">Select your vehicle above, then connect your ELM327 adapter to read VIN, voltage, and protocol information.</p>
        </div>
      )}
    </div>
  );
}
