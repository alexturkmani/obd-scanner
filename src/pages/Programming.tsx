import { useState } from 'react';
import { useOBD } from '../context/OBDContext';
import { ProgrammingResult } from '../services/elm327Service';

interface CommandHistory {
  command: string;
  response: string;
  timestamp: string;
}

export default function Programming() {
  const {
    isConnected, resetServiceLight, resetAdaptiveValues,
    testComponent, requestDPFRegeneration, sendRawCommand,
  } = useOBD();
  const [rawCommand, setRawCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [result, setResult] = useState<ProgrammingResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const addToHistory = (command: string, response: string) => {
    setCommandHistory(prev => [{
      command,
      response,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 50));
  };

  const handleRawCommand = async () => {
    if (!rawCommand.trim()) return;
    setIsExecuting(true);
    const response = await sendRawCommand(rawCommand.trim());
    addToHistory(rawCommand.trim(), response);
    setRawCommand('');
    setIsExecuting(false);
  };

  const executeAction = async (action: string) => {
    setIsExecuting(true);
    setShowConfirm(null);
    let res: ProgrammingResult;
    switch (action) {
      case 'serviceLight':
        res = await resetServiceLight();
        break;
      case 'adaptiveValues':
        res = await resetAdaptiveValues();
        break;
      case 'dpfRegen':
        res = await requestDPFRegeneration();
        break;
      case 'evapTest':
        res = await testComponent('01');
        break;
      case 'o2Test':
        res = await testComponent('02');
        break;
      default:
        res = { success: false, message: 'Unknown action' };
    }
    setResult(res);
    addToHistory(`Action: ${action}`, `${res.success ? 'OK' : 'FAIL'}: ${res.message}`);
    setIsExecuting(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Connect to Program</h2>
        <p className="text-gray-400 text-sm md:text-base">Connect your ELM327 adapter to access vehicle programming features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Vehicle Programming</h2>
        <p className="text-xs md:text-sm text-gray-400 mt-1">Control and program vehicle systems via OBD-II</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`rounded-xl p-3 md:p-4 ${result.success ? 'bg-obd-success bg-opacity-20 border border-obd-success' : 'bg-obd-error bg-opacity-20 border border-obd-error'}`}>
          <div className="flex items-center gap-2 mb-1">
            {result.success ? (
              <svg className="w-5 h-5 text-obd-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-obd-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className={`font-medium text-sm ${result.success ? 'text-obd-success' : 'text-obd-error'}`}>
              {result.message}
            </span>
          </div>
          {result.rawResponse && (
            <p className="text-xs text-gray-400 font-mono mt-1">Raw: {result.rawResponse}</p>
          )}
          <button onClick={() => setResult(null)} className="text-xs text-gray-500 mt-1 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowConfirm('serviceLight')}
            disabled={isExecuting}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-obd-warning bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-obd-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">Reset Service Light</p>
              <p className="text-xs text-gray-400">Clear check engine light and service indicator</p>
            </div>
          </button>

          <button
            onClick={() => setShowConfirm('adaptiveValues')}
            disabled={isExecuting}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-obd-accent bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-obd-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">Reset Adaptive Values</p>
              <p className="text-xs text-gray-400">Reset ECU learned values (fuel trim, idle, etc.)</p>
            </div>
          </button>

          <button
            onClick={() => setShowConfirm('dpfRegen')}
            disabled={isExecuting}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-obd-error bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-obd-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">DPF Regeneration</p>
              <p className="text-xs text-gray-400">Request diesel particulate filter regeneration</p>
            </div>
          </button>

          <button
            onClick={() => setShowConfirm('evapTest')}
            disabled={isExecuting}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-obd-success bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-obd-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">EVAP System Test</p>
              <p className="text-xs text-gray-400">Initiate on-board EVAP system leak test</p>
            </div>
          </button>
        </div>
      </div>

      {/* Raw Command Terminal */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">Command Terminal</h3>
        <p className="text-xs text-gray-400 mb-3">Send raw AT/OBD commands directly to the ELM327 adapter</p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={rawCommand}
            onChange={(e) => setRawCommand(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleRawCommand()}
            placeholder="Enter command (e.g., ATI, 0100, 03)"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm font-mono focus:outline-none focus:border-obd-accent"
          />
          <button
            onClick={handleRawCommand}
            disabled={isExecuting || !rawCommand.trim()}
            className="px-4 py-2 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>

        {/* Quick command buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['ATI', 'ATRV', 'ATDP', '0100', '0120', '03', '07', '0A', '0902'].map(cmd => (
            <button
              key={cmd}
              onClick={() => { setRawCommand(cmd); }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Command History */}
        <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-auto font-mono text-xs">
          {commandHistory.length === 0 ? (
            <p className="text-gray-500">No commands sent yet...</p>
          ) : (
            commandHistory.map((entry, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{entry.timestamp}</span>
                  <span className="text-obd-accent">&gt; {entry.command}</span>
                </div>
                <pre className="text-gray-300 whitespace-pre-wrap ml-4">{entry.response}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-obd-card rounded-xl p-4 md:p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-obd-warning bg-opacity-20 flex items-center justify-center">
                <svg className="w-6 h-6 text-obd-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Confirm Action</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              This will send a command to your vehicle's ECU. Make sure the engine is running and the vehicle is stationary.
              Are you sure you want to proceed?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(showConfirm)}
                className="px-4 py-2 bg-obd-warning hover:bg-yellow-600 rounded-lg text-sm font-medium"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
