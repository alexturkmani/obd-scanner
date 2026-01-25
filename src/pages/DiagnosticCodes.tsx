import { useState } from 'react';
import { useOBD } from '../context/OBDContext';

export default function DiagnosticCodes() {
  const { isConnected, dtcCodes, readDTCs, clearDTCs } = useOBD();
  const [isReading, setIsReading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleReadCodes = async () => {
    setIsReading(true);
    await readDTCs();
    setIsReading(false);
  };

  const handleClearCodes = async () => {
    setIsClearing(true);
    await clearDTCs();
    setIsClearing(false);
    setShowConfirmClear(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect to Read Codes</h2>
        <p className="text-gray-400">Connect your ELM327 adapter to read diagnostic trouble codes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Diagnostic Trouble Codes</h2>
        <div className="flex gap-3">
          <button
            onClick={handleReadCodes}
            disabled={isReading}
            className="px-4 py-2 bg-obd-accent hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isReading ? 'Reading...' : 'Read Codes'}
          </button>
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={dtcCodes.length === 0 || isClearing}
            className="px-4 py-2 bg-obd-error hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Clear Codes
          </button>
        </div>
      </div>

      {/* Codes List */}
      {dtcCodes.length === 0 ? (
        <div className="bg-obd-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-obd-success">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No Fault Codes</h3>
          <p className="text-gray-400">Click "Read Codes" to scan for diagnostic trouble codes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dtcCodes.map((dtc, index) => (
            <div key={index} className="bg-obd-card rounded-xl p-4 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                dtc.severity === 'high' ? 'bg-obd-error' :
                dtc.severity === 'medium' ? 'bg-obd-warning' : 'bg-yellow-600'
              } bg-opacity-20`}>
                <svg className={`w-6 h-6 ${
                  dtc.severity === 'high' ? 'text-obd-error' :
                  dtc.severity === 'medium' ? 'text-obd-warning' : 'text-yellow-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg">{dtc.code}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    dtc.severity === 'high' ? 'bg-obd-error' :
                    dtc.severity === 'medium' ? 'bg-obd-warning' : 'bg-yellow-600'
                  }`}>
                    {dtc.severity.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-600 text-xs">{dtc.category}</span>
                </div>
                <p className="text-gray-300">{dtc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-obd-card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Clear Diagnostic Codes?</h3>
            <p className="text-gray-400 mb-6">
              This will reset the Check Engine Light and clear all stored diagnostic trouble codes.
              Make sure you've noted down all codes before clearing.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCodes}
                disabled={isClearing}
                className="px-4 py-2 bg-obd-error hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear Codes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
