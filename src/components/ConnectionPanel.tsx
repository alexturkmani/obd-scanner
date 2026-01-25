import { useOBD } from '../context/OBDContext';

export default function ConnectionPanel() {
  const { isConnected, isConnecting, connectionError, connect, disconnect, vehicleInfo } = useOBD();

  return (
    <div className="flex items-center gap-4">
      {vehicleInfo && isConnected && (
        <div className="text-sm text-gray-400">
          <span className="text-obd-accent">{vehicleInfo.voltage}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-obd-success animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-sm">
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      {connectionError && (
        <span className="text-sm text-obd-error">{connectionError}</span>
      )}

      <button
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isConnected
            ? 'bg-obd-error hover:bg-red-600'
            : 'bg-obd-accent hover:bg-blue-600'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect ELM327'}
      </button>
    </div>
  );
}
