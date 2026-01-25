import { useOBD } from '../context/OBDContext';

export default function ConnectionPanel() {
  const { isConnected, isConnecting, connectionError, connect, disconnect, vehicleInfo } = useOBD();

  return (
    <div className="flex items-center gap-2 md:gap-4">
      {vehicleInfo && isConnected && (
        <div className="text-xs md:text-sm text-gray-400 hidden sm:block">
          <span className="text-obd-accent">{vehicleInfo.voltage}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1 md:gap-2">
        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${isConnected ? 'bg-obd-success animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs md:text-sm hidden sm:inline">
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {connectionError && (
        <span className="text-xs text-obd-error hidden md:inline max-w-[150px] truncate">{connectionError}</span>
      )}

      <button
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
          isConnected
            ? 'bg-obd-error hover:bg-red-600'
            : 'bg-obd-accent hover:bg-blue-600'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="hidden sm:inline">{isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect ELM327'}</span>
        <span className="sm:hidden">{isConnected ? 'Stop' : isConnecting ? '...' : 'Connect'}</span>
      </button>
    </div>
  );
}
