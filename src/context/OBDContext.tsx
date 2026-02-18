import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { elm327Service, OBDData, DTCCode, VehicleInfo, ProgrammingResult } from '../services/elm327Service';

export interface SelectedVehicle {
  make: string;
  model: string;
  year: number;
}

export interface VehicleProfile {
  id: string;
  vehicle: SelectedVehicle;
  dtcHistory: { date: string; codes: DTCCode[] }[];
  maintenanceItems: MaintenanceItem[];
  createdAt: string;
}

export interface MaintenanceItem {
  id: string;
  type: string;
  lastDate: string;
  lastMileage: number;
  intervalMiles: number;
  intervalMonths: number;
  notes: string;
}

interface OBDContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  liveData: Partial<OBDData>;
  dtcCodes: DTCCode[];
  permanentDtcCodes: DTCCode[];
  vehicleInfo: VehicleInfo | null;
  selectedVehicle: SelectedVehicle | null;
  setSelectedVehicle: (vehicle: SelectedVehicle | null) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  readDTCs: () => Promise<void>;
  clearDTCs: () => Promise<boolean>;
  readPermanentDTCs: () => Promise<void>;
  refreshVehicleInfo: () => Promise<void>;
  startLiveMonitoring: () => void;
  stopLiveMonitoring: () => void;
  isMonitoring: boolean;
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // Vehicle profiles
  vehicleProfiles: VehicleProfile[];
  activeProfileId: string | null;
  setActiveProfile: (id: string) => void;
  addVehicleProfile: (vehicle: SelectedVehicle) => string;
  deleteVehicleProfile: (id: string) => void;
  updateMaintenance: (profileId: string, item: MaintenanceItem) => void;
  addMaintenanceItem: (profileId: string, item: MaintenanceItem) => void;
  deleteMaintenanceItem: (profileId: string, itemId: string) => void;
  // Programming
  sendRawCommand: (cmd: string) => Promise<string>;
  resetServiceLight: () => Promise<ProgrammingResult>;
  resetAdaptiveValues: () => Promise<ProgrammingResult>;
  testComponent: (pid: string) => Promise<ProgrammingResult>;
  requestDPFRegeneration: () => Promise<ProgrammingResult>;
  // Advanced Programming
  resetGaugeCluster: () => Promise<ProgrammingResult>;
  throttleRelearn: () => Promise<ProgrammingResult>;
  injectorBuzzTest: (cylinder: number) => Promise<ProgrammingResult>;
  absBleedProcedure: () => Promise<ProgrammingResult>;
  calibrateSteeringAngle: () => Promise<ProgrammingResult>;
  batteryRegistration: () => Promise<ProgrammingResult>;
  resetTransmissionAdaptation: () => Promise<ProgrammingResult>;
  resetTPMS: () => Promise<ProgrammingResult>;
  immobilizerInit: () => Promise<ProgrammingResult>;
  // Advanced Diagnostics
  readReadinessMonitors: () => Promise<{ mil: boolean; dtcCount: number; monitors: { name: string; available: boolean; complete: boolean }[] }>;
  readO2SensorTests: () => Promise<{ testId: string; value: number; min: number; max: number; passed: boolean }[]>;
  readFullFreezeFrame: () => Promise<Record<string, { name: string; value: number; unit: string }>>;
  readMisfireData: () => Promise<{ cylinder: number; count: number }[]>;
  readFuelTrims: () => Promise<{ bank: number; shortTerm: number; longTerm: number }[]>;
  // Performance
  performanceData: PerformanceData;
  startPerformanceTimer: () => void;
  stopPerformanceTimer: () => void;
  resetPerformanceTimer: () => void;
  isPerformanceTiming: boolean;
  // Auto-reconnect
  autoReconnect: boolean;
  setAutoReconnect: (v: boolean) => void;
}

export interface PerformanceData {
  zeroToSixty: number | null; // seconds
  zeroToHundred: number | null; // seconds
  quarterMile: number | null; // seconds
  quarterMileSpeed: number | null; // km/h
  maxSpeed: number;
  maxRpm: number;
}

const OBDContext = createContext<OBDContextType | null>(null);

export function useOBD() {
  const context = useContext(OBDContext);
  if (!context) {
    throw new Error('useOBD must be used within an OBDProvider');
  }
  return context;
}

interface OBDProviderProps {
  children: ReactNode;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function OBDProvider({ children }: OBDProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<Partial<OBDData>>({});
  const [dtcCodes, setDtcCodes] = useState<DTCCode[]>([]);
  const [permanentDtcCodes, setPermanentDtcCodes] = useState<DTCCode[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('obdTheme') as 'dark' | 'light') || 'dark';
  });

  // Auto-reconnect
  const [autoReconnect, setAutoReconnectState] = useState(() => {
    return localStorage.getItem('obdAutoReconnect') === 'true';
  });

  // Vehicle profiles
  const [vehicleProfiles, setVehicleProfiles] = useState<VehicleProfile[]>(() => {
    const saved = localStorage.getItem('vehicleProfiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    return localStorage.getItem('activeProfileId');
  });

  const [selectedVehicle, setSelectedVehicleState] = useState<SelectedVehicle | null>(() => {
    const saved = localStorage.getItem('selectedVehicle');
    return saved ? JSON.parse(saved) : null;
  });

  // Performance timer
  const [isPerformanceTiming, setIsPerformanceTiming] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    zeroToSixty: null,
    zeroToHundred: null,
    quarterMile: null,
    quarterMileSpeed: null,
    maxSpeed: 0,
    maxRpm: 0,
  });
  const perfStartTime = useRef<number | null>(null);
  const perfStarted = useRef(false);
  const quarterMileDistance = useRef(0);
  const lastSpeedTime = useRef<number>(0);

  // Save profiles to localStorage
  useEffect(() => {
    localStorage.setItem('vehicleProfiles', JSON.stringify(vehicleProfiles));
  }, [vehicleProfiles]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem('activeProfileId', activeProfileId);
    }
  }, [activeProfileId]);

  // Theme effect
  useEffect(() => {
    localStorage.setItem('obdTheme', theme);
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setAutoReconnect = useCallback((v: boolean) => {
    setAutoReconnectState(v);
    localStorage.setItem('obdAutoReconnect', String(v));
  }, []);

  const setSelectedVehicle = useCallback((vehicle: SelectedVehicle | null) => {
    setSelectedVehicleState(vehicle);
    if (vehicle) {
      localStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
    } else {
      localStorage.removeItem('selectedVehicle');
    }
  }, []);

  const addVehicleProfile = useCallback((vehicle: SelectedVehicle): string => {
    const id = generateId();
    const profile: VehicleProfile = {
      id,
      vehicle,
      dtcHistory: [],
      maintenanceItems: [],
      createdAt: new Date().toISOString(),
    };
    setVehicleProfiles(prev => [...prev, profile]);
    return id;
  }, []);

  const deleteVehicleProfile = useCallback((id: string) => {
    setVehicleProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) setActiveProfileId(null);
  }, [activeProfileId]);

  const setActiveProfile = useCallback((id: string) => {
    setActiveProfileId(id);
    const profile = vehicleProfiles.find(p => p.id === id);
    if (profile) setSelectedVehicle(profile.vehicle);
  }, [vehicleProfiles, setSelectedVehicle]);

  const updateMaintenance = useCallback((profileId: string, item: MaintenanceItem) => {
    setVehicleProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      return {
        ...p,
        maintenanceItems: p.maintenanceItems.map(m => m.id === item.id ? item : m),
      };
    }));
  }, []);

  const addMaintenanceItem = useCallback((profileId: string, item: MaintenanceItem) => {
    setVehicleProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      return { ...p, maintenanceItems: [...p.maintenanceItems, item] };
    }));
  }, []);

  const deleteMaintenanceItem = useCallback((profileId: string, itemId: string) => {
    setVehicleProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      return { ...p, maintenanceItems: p.maintenanceItems.filter(m => m.id !== itemId) };
    }));
  }, []);

  // Performance tracking from live data
  useEffect(() => {
    if (!isPerformanceTiming) return;
    const speed = liveData.speed || 0;
    const rpm = liveData.rpm || 0;
    const now = Date.now();

    setPerformanceData(prev => {
      const updated = { ...prev };
      if (speed > prev.maxSpeed) updated.maxSpeed = speed;
      if (rpm > prev.maxRpm) updated.maxRpm = rpm;

      // Start timing when speed goes above 1 km/h (car starts moving)
      if (!perfStarted.current && speed > 1) {
        perfStartTime.current = now;
        perfStarted.current = true;
        lastSpeedTime.current = now;
        quarterMileDistance.current = 0;
      }

      if (perfStarted.current && perfStartTime.current) {
        const elapsed = (now - perfStartTime.current) / 1000;
        
        // Track quarter mile distance (speed in km/h -> m/s * time delta)
        const dt = (now - lastSpeedTime.current) / 1000;
        quarterMileDistance.current += (speed / 3.6) * dt;
        lastSpeedTime.current = now;

        // 0-60 mph = 0-96.56 km/h
        if (prev.zeroToSixty === null && speed >= 96.56) {
          updated.zeroToSixty = elapsed;
        }
        // 0-100 km/h
        if (prev.zeroToHundred === null && speed >= 100) {
          updated.zeroToHundred = elapsed;
        }
        // Quarter mile = 402.336 meters
        if (prev.quarterMile === null && quarterMileDistance.current >= 402.336) {
          updated.quarterMile = elapsed;
          updated.quarterMileSpeed = speed;
        }
      }
      return updated;
    });
  }, [liveData.speed, liveData.rpm, isPerformanceTiming]);

  const startPerformanceTimer = useCallback(() => {
    perfStartTime.current = null;
    perfStarted.current = false;
    quarterMileDistance.current = 0;
    lastSpeedTime.current = Date.now();
    setPerformanceData({
      zeroToSixty: null, zeroToHundred: null,
      quarterMile: null, quarterMileSpeed: null,
      maxSpeed: 0, maxRpm: 0,
    });
    setIsPerformanceTiming(true);
  }, []);

  const stopPerformanceTimer = useCallback(() => {
    setIsPerformanceTiming(false);
  }, []);

  const resetPerformanceTimer = useCallback(() => {
    setIsPerformanceTiming(false);
    perfStartTime.current = null;
    perfStarted.current = false;
    quarterMileDistance.current = 0;
    setPerformanceData({
      zeroToSixty: null, zeroToHundred: null,
      quarterMile: null, quarterMileSpeed: null,
      maxSpeed: 0, maxRpm: 0,
    });
  }, []);

  // Auto-reconnect on disconnect
  useEffect(() => {
    const unsub = elm327Service.onDisconnect(() => {
      setIsConnected(false);
      setIsMonitoring(false);
      setLiveData({});
      if (autoReconnect) {
        const tryReconnect = async () => {
          for (let i = 0; i < 3; i++) {
            await new Promise(res => setTimeout(res, 2000));
            const success = await elm327Service.tryAutoReconnect();
            if (success) {
              setIsConnected(true);
              setConnectionError(null);
              const info = await elm327Service.getVehicleInfo();
              setVehicleInfo(info);
              return;
            }
          }
          setConnectionError('Auto-reconnect failed. Please reconnect manually.');
        };
        tryReconnect();
      }
    });
    return unsub;
  }, [autoReconnect]);

  useEffect(() => {
    const unsubscribe = elm327Service.subscribe((data) => {
      setLiveData(prev => ({ ...prev, ...data }));
    });

    return () => {
      unsubscribe();
      elm327Service.disconnect();
    };
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await elm327Service.connect();
      setIsConnected(true);
      
      const info = await elm327Service.getVehicleInfo();
      setVehicleInfo(info);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    elm327Service.stopLiveMonitoring();
    setIsMonitoring(false);
    await elm327Service.disconnect();
    setIsConnected(false);
    setLiveData({});
    setDtcCodes([]);
    setPermanentDtcCodes([]);
    setVehicleInfo(null);
  };

  const readDTCs = async () => {
    const stored = await elm327Service.readDTCs();
    const pending = await elm327Service.readPendingDTCs();
    const allCodes = [...stored, ...pending];
    setDtcCodes(allCodes);
    // Save to profile history
    if (activeProfileId && allCodes.length > 0) {
      setVehicleProfiles(prev => prev.map(p => {
        if (p.id !== activeProfileId) return p;
        return {
          ...p,
          dtcHistory: [...p.dtcHistory, { date: new Date().toISOString(), codes: allCodes }],
        };
      }));
    }
  };

  const clearDTCs = async () => {
    const success = await elm327Service.clearDTCs();
    if (success) {
      setDtcCodes([]);
    }
    return success;
  };

  const readPermanentDTCs = async () => {
    const permanent = await elm327Service.readPermanentDTCs();
    setPermanentDtcCodes(permanent);
  };

  const refreshVehicleInfo = async () => {
    const info = await elm327Service.getVehicleInfo();
    setVehicleInfo(info);
  };

  const startLiveMonitoring = () => {
    setIsMonitoring(true);
    elm327Service.startLiveMonitoring(500);
  };

  const stopLiveMonitoring = () => {
    setIsMonitoring(false);
    elm327Service.stopLiveMonitoring();
  };

  const sendRawCommand = async (cmd: string) => elm327Service.sendRawCommand(cmd);
  const resetServiceLight = async () => elm327Service.resetServiceLight();
  const resetAdaptiveValues = async () => elm327Service.resetAdaptiveValues();
  const testComponent = async (pid: string) => elm327Service.testComponent(pid);
  const requestDPFRegeneration = async () => elm327Service.requestDPFRegeneration();
  const resetGaugeCluster = async () => elm327Service.resetGaugeCluster();
  const throttleRelearn = async () => elm327Service.throttleRelearn();
  const injectorBuzzTest = async (cylinder: number) => elm327Service.injectorBuzzTest(cylinder);
  const absBleedProcedure = async () => elm327Service.absBleedProcedure();
  const calibrateSteeringAngle = async () => elm327Service.calibrateSteeringAngle();
  const batteryRegistration = async () => elm327Service.batteryRegistration();
  const resetTransmissionAdaptation = async () => elm327Service.resetTransmissionAdaptation();
  const resetTPMS = async () => elm327Service.resetTPMS();
  const immobilizerInit = async () => elm327Service.immobilizerInit();
  const readReadinessMonitors = async () => elm327Service.readReadinessMonitors();
  const readO2SensorTests = async () => elm327Service.readO2SensorTests();
  const readFullFreezeFrame = async () => elm327Service.readFullFreezeFrame();
  const readMisfireData = async () => elm327Service.readMisfireData();
  const readFuelTrims = async () => elm327Service.readFuelTrims();

  return (
    <OBDContext.Provider
      value={{
        isConnected, isConnecting, connectionError,
        liveData, dtcCodes, permanentDtcCodes, vehicleInfo,
        selectedVehicle, setSelectedVehicle,
        connect, disconnect,
        readDTCs, clearDTCs, readPermanentDTCs,
        refreshVehicleInfo,
        startLiveMonitoring, stopLiveMonitoring, isMonitoring,
        theme, toggleTheme,
        vehicleProfiles, activeProfileId,
        setActiveProfile, addVehicleProfile, deleteVehicleProfile,
        updateMaintenance, addMaintenanceItem, deleteMaintenanceItem,
        sendRawCommand, resetServiceLight, resetAdaptiveValues,
        testComponent, requestDPFRegeneration,
        resetGaugeCluster, throttleRelearn, injectorBuzzTest,
        absBleedProcedure, calibrateSteeringAngle, batteryRegistration,
        resetTransmissionAdaptation, resetTPMS, immobilizerInit,
        readReadinessMonitors, readO2SensorTests, readFullFreezeFrame,
        readMisfireData, readFuelTrims,
        performanceData, startPerformanceTimer, stopPerformanceTimer, resetPerformanceTimer,
        isPerformanceTiming,
        autoReconnect, setAutoReconnect,
      }}
    >
      {children}
    </OBDContext.Provider>
  );
}
