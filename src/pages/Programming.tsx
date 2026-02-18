import { useState } from 'react';
import { useOBD } from '../context/OBDContext';
import { ProgrammingResult } from '../services/elm327Service';

interface CommandHistory {
  command: string;
  response: string;
  timestamp: string;
  success?: boolean;
}

const ACTIONS: {
  category: string;
  categoryIcon: string;
  categoryColor: string;
  items: { id: string; label: string; description: string; color: string; danger?: boolean }[];
}[] = [
  {
    category: 'Engine & Emissions',
    categoryIcon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707',
    categoryColor: 'obd-warning',
    items: [
      { id: 'serviceLight', label: 'Reset Service / CEL Light', description: 'Clear check engine light and service indicators', color: 'obd-warning' },
      { id: 'adaptiveValues', label: 'Reset Adaptive Values', description: 'Reset ECU fuel trim, idle, and learned values', color: 'obd-accent' },
      { id: 'throttleRelearn', label: 'Throttle Body Relearn', description: 'Re-calibrate electronic throttle idle position', color: 'obd-accent' },
      { id: 'dpfRegen', label: 'DPF Regeneration', description: 'Force diesel particulate filter regeneration', color: 'obd-error', danger: true },
    ],
  },
  {
    category: 'Instrument & Body',
    categoryIcon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    categoryColor: 'obd-accent',
    items: [
      { id: 'gaugeCluster', label: 'Gauge Cluster Reset', description: 'Reset instrument cluster service interval counters', color: 'obd-accent' },
      { id: 'tpms', label: 'TPMS Reset / Relearn', description: 'Reset tire pressure monitoring sensors', color: 'obd-success' },
      { id: 'steeringAngle', label: 'Steering Angle Calibration', description: 'Calibrate SAS after alignment or suspension work', color: 'obd-accent' },
    ],
  },
  {
    category: 'Drivetrain',
    categoryIcon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    categoryColor: 'obd-success',
    items: [
      { id: 'transmissionReset', label: 'Transmission Adaptation Reset', description: 'Reset learned shift points and adaptation values', color: 'obd-success' },
      { id: 'absBleed', label: 'ABS Bleed Procedure', description: 'Initiate ABS pump for brake fluid bleeding', color: 'obd-error', danger: true },
    ],
  },
  {
    category: 'Electrical & Security',
    categoryIcon: 'M13 10V3L4 14h7v7l9-11h-7z',
    categoryColor: 'obd-error',
    items: [
      { id: 'batteryReg', label: 'Battery Registration / BMS Reset', description: 'Register new battery and reset charging system', color: 'obd-warning' },
      { id: 'immobilizer', label: 'Immobilizer / Key Init', description: 'Initialize security access for key programming', color: 'obd-error', danger: true },
    ],
  },
  {
    category: 'Component Tests',
    categoryIcon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    categoryColor: 'obd-success',
    items: [
      { id: 'evapTest', label: 'EVAP System Leak Test', description: 'Initiate evaporative emission system leak test', color: 'obd-success' },
      { id: 'o2Test', label: 'O2 Sensor Heater Test', description: 'Test oxygen sensor heater circuit operation', color: 'obd-success' },
      { id: 'injector1', label: 'Injector Buzz Test - Cyl 1', description: 'Activate fuel injector on cylinder 1', color: 'obd-warning', danger: true },
      { id: 'injector2', label: 'Injector Buzz Test - Cyl 2', description: 'Activate fuel injector on cylinder 2', color: 'obd-warning', danger: true },
      { id: 'injector3', label: 'Injector Buzz Test - Cyl 3', description: 'Activate fuel injector on cylinder 3', color: 'obd-warning', danger: true },
      { id: 'injector4', label: 'Injector Buzz Test - Cyl 4', description: 'Activate fuel injector on cylinder 4', color: 'obd-warning', danger: true },
    ],
  },
];

export default function Programming() {
  const {
    isConnected, sendRawCommand,
    resetServiceLight, resetAdaptiveValues, testComponent, requestDPFRegeneration,
    resetGaugeCluster, throttleRelearn, injectorBuzzTest,
    absBleedProcedure, calibrateSteeringAngle, batteryRegistration,
    resetTransmissionAdaptation, resetTPMS, immobilizerInit,
  } = useOBD();
  const [rawCommand, setRawCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [result, setResult] = useState<ProgrammingResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const addToHistory = (command: string, response: string, success?: boolean) => {
    setCommandHistory(prev => [{
      command,
      response,
      timestamp: new Date().toLocaleTimeString(),
      success,
    }, ...prev].slice(0, 100));
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
      case 'serviceLight': res = await resetServiceLight(); break;
      case 'adaptiveValues': res = await resetAdaptiveValues(); break;
      case 'throttleRelearn': res = await throttleRelearn(); break;
      case 'dpfRegen': res = await requestDPFRegeneration(); break;
      case 'gaugeCluster': res = await resetGaugeCluster(); break;
      case 'tpms': res = await resetTPMS(); break;
      case 'steeringAngle': res = await calibrateSteeringAngle(); break;
      case 'transmissionReset': res = await resetTransmissionAdaptation(); break;
      case 'absBleed': res = await absBleedProcedure(); break;
      case 'batteryReg': res = await batteryRegistration(); break;
      case 'immobilizer': res = await immobilizerInit(); break;
      case 'evapTest': res = await testComponent('01'); break;
      case 'o2Test': res = await testComponent('02'); break;
      case 'injector1': res = await injectorBuzzTest(1); break;
      case 'injector2': res = await injectorBuzzTest(2); break;
      case 'injector3': res = await injectorBuzzTest(3); break;
      case 'injector4': res = await injectorBuzzTest(4); break;
      default: res = { success: false, message: 'Unknown action' };
    }
    setResult(res);
    addToHistory(`Action: ${action}`, `${res.success ? 'OK' : 'FAIL'}: ${res.message}`, res.success);
    setIsExecuting(false);
  };

  const getConfirmAction = () => {
    if (!showConfirm) return null;
    for (const cat of ACTIONS) {
      const item = cat.items.find(i => i.id === showConfirm);
      if (item) return item;
    }
    return null;
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
        <p className="text-xs md:text-sm text-gray-400 mt-1">Advanced ECU programming, module resets, and component testing</p>
      </div>

      {/* Safety Warning Banner */}
      <div className="bg-obd-warning bg-opacity-10 border border-obd-warning border-opacity-30 rounded-xl p-3 md:p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-obd-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-xs md:text-sm text-obd-warning font-medium">Safety Notice</p>
            <p className="text-xs text-gray-400 mt-1">Programming operations communicate directly with vehicle ECUs. Ensure engine is running, vehicle is stationary, and battery is fully charged. Some functions require manufacturer-specific protocols and may not be supported on all vehicles.</p>
          </div>
        </div>
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

      {/* Programming Actions by Category */}
      {ACTIONS.map((cat) => (
        <div key={cat.category} className="bg-obd-card rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-gray-700 hover:bg-opacity-30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-${cat.categoryColor} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 text-${cat.categoryColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.categoryIcon} />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm md:text-base">{cat.category}</p>
                <p className="text-xs text-gray-400">{cat.items.length} action{cat.items.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === cat.category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedCategory === cat.category && (
            <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-2">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setShowConfirm(item.id)}
                  disabled={isExecuting}
                  className={`w-full flex items-center gap-3 p-3 bg-gray-700 bg-opacity-50 hover:bg-opacity-80 rounded-xl transition-colors text-left disabled:opacity-50 ${item.danger ? 'border border-obd-error border-opacity-20' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full bg-${item.color} flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                  </div>
                  {item.danger && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-obd-error bg-opacity-20 text-obd-error rounded font-medium flex-shrink-0">ADV</span>
                  )}
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Raw Command Terminal */}
      <div className="bg-obd-card rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-1">Command Terminal</h3>
        <p className="text-xs text-gray-400 mb-3">Send raw AT/OBD/UDS commands directly to the ELM327 adapter</p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={rawCommand}
            onChange={(e) => setRawCommand(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleRawCommand()}
            placeholder="Enter command (e.g., ATI, 0100, 03, 0902)"
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
          {[
            { cmd: 'ATI', label: 'ATI' },
            { cmd: 'ATRV', label: 'ATRV' },
            { cmd: 'ATDP', label: 'ATDP' },
            { cmd: '0100', label: '0100' },
            { cmd: '0101', label: 'Readiness' },
            { cmd: '0120', label: '0120' },
            { cmd: '03', label: 'DTCs' },
            { cmd: '07', label: 'Pending' },
            { cmd: '0A', label: 'Permanent' },
            { cmd: '04', label: 'Clear' },
            { cmd: '0600', label: 'Mode 06' },
            { cmd: '0902', label: 'VIN' },
            { cmd: '0904', label: 'Cal ID' },
            { cmd: '090A', label: 'ECU Name' },
            { cmd: '2701', label: 'Sec Access' },
          ].map(({ cmd, label }) => (
            <button
              key={cmd}
              onClick={() => setRawCommand(cmd)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono transition-colors"
              title={cmd}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Command History */}
        <div className="bg-gray-900 rounded-lg p-3 max-h-72 overflow-auto font-mono text-xs">
          {commandHistory.length === 0 ? (
            <p className="text-gray-500">No commands sent yet...</p>
          ) : (
            commandHistory.map((entry, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{entry.timestamp}</span>
                  {entry.success !== undefined && (
                    <span className={entry.success ? 'text-obd-success' : 'text-obd-error'}>
                      {entry.success ? '✓' : '✗'}
                    </span>
                  )}
                  <span className="text-obd-accent">&gt; {entry.command}</span>
                </div>
                <pre className="text-gray-300 whitespace-pre-wrap ml-4">{entry.response}</pre>
              </div>
            ))
          )}
        </div>

        {commandHistory.length > 0 && (
          <button
            onClick={() => setCommandHistory([])}
            className="text-xs text-gray-500 hover:text-gray-300 mt-2"
          >
            Clear history
          </button>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-obd-card rounded-xl p-4 md:p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${getConfirmAction()?.danger ? 'bg-obd-error' : 'bg-obd-warning'} bg-opacity-20 flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${getConfirmAction()?.danger ? 'text-obd-error' : 'text-obd-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Action</h3>
                <p className="text-xs text-gray-400">{getConfirmAction()?.label}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">
              {getConfirmAction()?.description}
            </p>
            {getConfirmAction()?.danger && (
              <div className="bg-obd-error bg-opacity-10 border border-obd-error border-opacity-20 rounded-lg p-2 mb-3">
                <p className="text-xs text-obd-error">
                  ⚠ Advanced operation. This sends commands directly to vehicle control modules. Ensure vehicle is in a safe condition before proceeding.
                </p>
              </div>
            )}
            <p className="text-gray-500 text-xs mb-4">
              Make sure engine is running, vehicle is stationary, and battery is charged. Not all vehicles support every function via generic OBD-II.
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
                className={`px-4 py-2 ${getConfirmAction()?.danger ? 'bg-obd-error hover:bg-red-600' : 'bg-obd-warning hover:bg-yellow-600'} rounded-lg text-sm font-medium`}
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
