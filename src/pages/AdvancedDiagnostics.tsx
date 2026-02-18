import { useState } from 'react';
import { useOBD } from '../context/OBDContext';

interface ReadinessData {
  mil: boolean;
  dtcCount: number;
  monitors: { name: string; available: boolean; complete: boolean }[];
}

interface O2TestResult {
  testId: string;
  value: number;
  min: number;
  max: number;
  passed: boolean;
}

interface FreezeFrameEntry {
  name: string;
  value: number;
  unit: string;
}

interface MisfireEntry {
  cylinder: number;
  count: number;
}

interface FuelTrimEntry {
  bank: number;
  shortTerm: number;
  longTerm: number;
}

export default function AdvancedDiagnostics() {
  const {
    isConnected,
    readReadinessMonitors,
    readO2SensorTests,
    readFullFreezeFrame,
    readMisfireData,
    readFuelTrims,
  } = useOBD();

  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [o2Tests, setO2Tests] = useState<O2TestResult[]>([]);
  const [freezeFrame, setFreezeFrame] = useState<Record<string, FreezeFrameEntry>>({});
  const [misfires, setMisfires] = useState<MisfireEntry[]>([]);
  const [fuelTrims, setFuelTrims] = useState<FuelTrimEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'readiness' | 'o2' | 'freeze' | 'misfire' | 'fuel'>('readiness');

  const loadReadiness = async () => {
    setLoading('readiness');
    const data = await readReadinessMonitors();
    setReadiness(data);
    setLoading(null);
  };

  const loadO2Tests = async () => {
    setLoading('o2');
    const data = await readO2SensorTests();
    setO2Tests(data);
    setLoading(null);
  };

  const loadFreezeFrame = async () => {
    setLoading('freeze');
    const data = await readFullFreezeFrame();
    setFreezeFrame(data);
    setLoading(null);
  };

  const loadMisfires = async () => {
    setLoading('misfire');
    const data = await readMisfireData();
    setMisfires(data);
    setLoading(null);
  };

  const loadFuelTrims = async () => {
    setLoading('fuel');
    const data = await readFuelTrims();
    setFuelTrims(data);
    setLoading(null);
  };

  const loadAll = async () => {
    setLoading('all');
    const [r, o, f, m, ft] = await Promise.all([
      readReadinessMonitors(),
      readO2SensorTests(),
      readFullFreezeFrame(),
      readMisfireData(),
      readFuelTrims(),
    ]);
    setReadiness(r);
    setO2Tests(o);
    setFreezeFrame(f);
    setMisfires(m);
    setFuelTrims(ft);
    setLoading(null);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">Connect for Diagnostics</h2>
        <p className="text-gray-400 text-sm md:text-base">Connect your ELM327 adapter to run advanced diagnostic tests.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'readiness' as const, label: 'Readiness', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'o2' as const, label: 'O2 Tests', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { id: 'freeze' as const, label: 'Freeze Frame', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'misfire' as const, label: 'Misfire', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'fuel' as const, label: 'Fuel Trims', icon: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Advanced Diagnostics</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Deep vehicle system analysis and test results</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading !== null}
          className="px-3 py-2 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading === 'all' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Run All
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-obd-accent text-white' : 'bg-obd-card hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Readiness Monitors */}
      {activeTab === 'readiness' && (
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold">Emission Readiness Monitors</h3>
            <button
              onClick={loadReadiness}
              disabled={loading !== null}
              className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {loading === 'readiness' ? 'Reading...' : 'Read'}
            </button>
          </div>
          {readiness ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${readiness.mil ? 'bg-obd-error bg-opacity-20' : 'bg-obd-success bg-opacity-20'}`}>
                  <div className={`w-3 h-3 rounded-full ${readiness.mil ? 'bg-obd-error animate-pulse' : 'bg-obd-success'}`}></div>
                  <span className={`text-sm font-medium ${readiness.mil ? 'text-obd-error' : 'text-obd-success'}`}>
                    MIL {readiness.mil ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{readiness.dtcCount} DTC{readiness.dtcCount !== 1 ? 's' : ''} stored</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {readiness.monitors.filter(m => m.available).map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-700 bg-opacity-50 rounded-lg">
                    <span className="text-sm">{m.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      m.complete ? 'bg-obd-success bg-opacity-20 text-obd-success' : 'bg-obd-warning bg-opacity-20 text-obd-warning'
                    }`}>
                      {m.complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                ))}
                {readiness.monitors.filter(m => !m.available).length > 0 && (
                  <div className="col-span-full mt-2">
                    <p className="text-xs text-gray-500">
                      Not available: {readiness.monitors.filter(m => !m.available).map(m => m.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              {/* Smog readiness summary */}
              <div className="mt-4 p-3 bg-gray-700 bg-opacity-30 rounded-lg">
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-300">Smog Check Status: </span>
                  {readiness.monitors.filter(m => m.available).every(m => m.complete) && !readiness.mil
                    ? <span className="text-obd-success">Ready — All monitors complete, MIL off</span>
                    : <span className="text-obd-warning">Not Ready — {readiness.monitors.filter(m => m.available && !m.complete).length} monitor(s) incomplete{readiness.mil ? ', MIL is ON' : ''}</span>
                  }
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Click "Read" to fetch readiness monitor status</p>
          )}
        </div>
      )}

      {/* O2 Sensor Tests */}
      {activeTab === 'o2' && (
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold">O2 Sensor Test Results (Mode 06)</h3>
            <button
              onClick={loadO2Tests}
              disabled={loading !== null}
              className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {loading === 'o2' ? 'Reading...' : 'Read'}
            </button>
          </div>
          {o2Tests.length > 0 ? (
            <div className="space-y-2">
              {o2Tests.map((test, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{test.testId}</p>
                    <p className="text-xs text-gray-400">Range: {test.min} - {test.max}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono">{test.value}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      test.passed ? 'bg-obd-success bg-opacity-20 text-obd-success' : 'bg-obd-error bg-opacity-20 text-obd-error'
                    }`}>
                      {test.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Read" to fetch O2 sensor test results. Requires completed drive cycle.</p>
          )}
        </div>
      )}

      {/* Freeze Frame */}
      {activeTab === 'freeze' && (
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Freeze Frame Data</h3>
              <p className="text-xs text-gray-400">Snapshot of engine conditions when a DTC was stored</p>
            </div>
            <button
              onClick={loadFreezeFrame}
              disabled={loading !== null}
              className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {loading === 'freeze' ? 'Reading...' : 'Read'}
            </button>
          </div>
          {Object.keys(freezeFrame).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(freezeFrame).map(([pid, entry]) => (
                <div key={pid} className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-gray-400 font-mono">PID {pid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">
                      {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                    </p>
                    <p className="text-xs text-gray-400">{entry.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Read" to fetch freeze frame snapshot. Only available when a DTC has been stored.</p>
          )}
        </div>
      )}

      {/* Misfire Data */}
      {activeTab === 'misfire' && (
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Cylinder Misfire Counts</h3>
              <p className="text-xs text-gray-400">Mode 06 misfire counter per cylinder</p>
            </div>
            <button
              onClick={loadMisfires}
              disabled={loading !== null}
              className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {loading === 'misfire' ? 'Reading...' : 'Read'}
            </button>
          </div>
          {misfires.length > 0 ? (
            <div className="space-y-3">
              {misfires.map((m) => {
                const maxCount = Math.max(...misfires.map(x => x.count), 1);
                const pct = (m.count / maxCount) * 100;
                const isHigh = m.count > 10;
                return (
                  <div key={m.cylinder}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Cylinder {m.cylinder}</span>
                      <span className={`text-sm font-mono ${isHigh ? 'text-obd-error' : 'text-gray-300'}`}>{m.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isHigh ? 'bg-obd-error' : m.count > 0 ? 'bg-obd-warning' : 'bg-obd-success'}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Read" to fetch misfire counters. Data may not be available on all vehicles.</p>
          )}
        </div>
      )}

      {/* Fuel Trims */}
      {activeTab === 'fuel' && (
        <div className="bg-obd-card rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Fuel Trim Analysis</h3>
              <p className="text-xs text-gray-400">Short-term and long-term fuel trim per bank</p>
            </div>
            <button
              onClick={loadFuelTrims}
              disabled={loading !== null}
              className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {loading === 'fuel' ? 'Reading...' : 'Read'}
            </button>
          </div>
          {fuelTrims.length > 0 ? (
            <div className="space-y-4">
              {fuelTrims.map((ft) => {
                const getTrimColor = (val: number) => {
                  const abs = Math.abs(val);
                  if (abs > 25) return 'text-obd-error';
                  if (abs > 10) return 'text-obd-warning';
                  return 'text-obd-success';
                };
                const getTrimBar = (val: number) => {
                  const pct = Math.min(Math.abs(val), 50);
                  return { width: `${pct}%`, direction: val >= 0 ? 'right' : 'left' };
                };
                return (
                  <div key={ft.bank} className="p-4 bg-gray-700 bg-opacity-50 rounded-xl">
                    <h4 className="text-sm font-semibold mb-3">Bank {ft.bank}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Short Term Fuel Trim</span>
                          <span className={`text-sm font-mono font-medium ${getTrimColor(ft.shortTerm)}`}>
                            {ft.shortTerm > 0 ? '+' : ''}{ft.shortTerm.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-600 rounded-full">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"></div>
                          <div
                            className={`absolute top-0 h-full rounded-full ${ft.shortTerm >= 0 ? 'bg-obd-accent' : 'bg-obd-warning'}`}
                            style={{
                              left: ft.shortTerm >= 0 ? '50%' : `${50 - parseFloat(getTrimBar(ft.shortTerm).width)}%`,
                              width: getTrimBar(ft.shortTerm).width,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Long Term Fuel Trim</span>
                          <span className={`text-sm font-mono font-medium ${getTrimColor(ft.longTerm)}`}>
                            {ft.longTerm > 0 ? '+' : ''}{ft.longTerm.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-gray-600 rounded-full">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400"></div>
                          <div
                            className={`absolute top-0 h-full rounded-full ${ft.longTerm >= 0 ? 'bg-obd-accent' : 'bg-obd-warning'}`}
                            style={{
                              left: ft.longTerm >= 0 ? '50%' : `${50 - parseFloat(getTrimBar(ft.longTerm).width)}%`,
                              width: getTrimBar(ft.longTerm).width,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Diagnostic hint */}
                    <div className="mt-3 p-2 bg-gray-600 bg-opacity-30 rounded-lg">
                      <p className="text-[10px] text-gray-400">
                        {Math.abs(ft.longTerm) > 25
                          ? '⚠ Long-term trim is excessively high. Check for vacuum leaks, fuel pressure issues, or faulty sensors.'
                          : Math.abs(ft.longTerm) > 10
                          ? '⚡ Long-term trim is elevated. Monitor for developing issues.'
                          : '✓ Fuel trims are within normal range (±10%).'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Click "Read" to fetch fuel trim data from the ECU.</p>
          )}
        </div>
      )}
    </div>
  );
}
