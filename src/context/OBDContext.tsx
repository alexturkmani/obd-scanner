import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { elm327Service, OBDData, DTCCode, VehicleInfo } from '../services/elm327Service';

interface OBDContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  liveData: Partial<OBDData>;
  dtcCodes: DTCCode[];
  vehicleInfo: VehicleInfo | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  readDTCs: () => Promise<void>;
  clearDTCs: () => Promise<boolean>;
  refreshVehicleInfo: () => Promise<void>;
  startLiveMonitoring: () => void;
  stopLiveMonitoring: () => void;
  isMonitoring: boolean;
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

export function OBDProvider({ children }: OBDProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<Partial<OBDData>>({});
  const [dtcCodes, setDtcCodes] = useState<DTCCode[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

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
      
      // Get initial vehicle info
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
    setVehicleInfo(null);
  };

  const readDTCs = async () => {
    const stored = await elm327Service.readDTCs();
    const pending = await elm327Service.readPendingDTCs();
    setDtcCodes([...stored, ...pending]);
  };

  const clearDTCs = async () => {
    const success = await elm327Service.clearDTCs();
    if (success) {
      setDtcCodes([]);
    }
    return success;
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

  return (
    <OBDContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectionError,
        liveData,
        dtcCodes,
        vehicleInfo,
        connect,
        disconnect,
        readDTCs,
        clearDTCs,
        refreshVehicleInfo,
        startLiveMonitoring,
        stopLiveMonitoring,
        isMonitoring,
      }}
    >
      {children}
    </OBDContext.Provider>
  );
}
