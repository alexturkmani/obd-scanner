import { ELM327_COMMANDS, MODE_01_PIDS, DTC_DEFINITIONS } from '../data/obdCommands';

// ELM327 Service UUID (common for most ELM327 clones)
const ELM327_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const ELM327_CHARACTERISTIC_TX = '0000fff2-0000-1000-8000-00805f9b34fb';
const ELM327_CHARACTERISTIC_RX = '0000fff1-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs for different ELM327 adapters
const ALT_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

export interface OBDData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  throttlePosition: number;
  fuelLevel: number;
  intakeTemp: number;
  voltage: number;
  oilTemp: number;
  mafRate: number;
  runTime: number;
}

export interface DTCCode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
}

export interface VehicleInfo {
  vin: string;
  protocol: string;
  voltage: string;
  elmVersion: string;
}

class ELM327Service {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private responseBuffer: string = '';
  private responseResolver: ((value: string) => void) | null = null;
  private isConnected: boolean = false;
  private listeners: Set<(data: Partial<OBDData>) => void> = new Set();
  private _isMonitoring: boolean = false;

  async connect(): Promise<boolean> {
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
      }

      // Request device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBD' },
          { namePrefix: 'ELM' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'V-LINK' },
          { namePrefix: 'Vgate' },
        ],
        optionalServices: [ELM327_SERVICE_UUID, ALT_SERVICE_UUID],
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      // Connect to GATT Server
      this.server = await this.device.gatt?.connect() ?? null;
      if (!this.server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get primary service
      let service: BluetoothRemoteGATTService;
      try {
        service = await this.server.getPrimaryService(ELM327_SERVICE_UUID);
      } catch {
        service = await this.server.getPrimaryService(ALT_SERVICE_UUID);
      }

      // Get characteristics
      this.txCharacteristic = await service.getCharacteristic(ELM327_CHARACTERISTIC_TX);
      this.rxCharacteristic = await service.getCharacteristic(ELM327_CHARACTERISTIC_RX);

      // Start notifications
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));

      // Initialize ELM327
      await this.initializeAdapter();

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const decoder = new TextDecoder();
    const chunk = decoder.decode(value);
    this.responseBuffer += chunk;

    // Check if response is complete (ends with > prompt)
    if (this.responseBuffer.includes('>')) {
      const response = this.responseBuffer.trim().replace('>', '');
      this.responseBuffer = '';
      if (this.responseResolver) {
        this.responseResolver(response);
        this.responseResolver = null;
      }
    }
  }

  private async sendCommand(command: string, timeout: number = 3000): Promise<string> {
    if (!this.txCharacteristic) {
      throw new Error('Not connected');
    }

    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseResolver = null;
        reject(new Error('Command timeout'));
      }, timeout);

      this.responseResolver = (response) => {
        clearTimeout(timer);
        resolve(response);
      };

      const encoder = new TextEncoder();
      const data = encoder.encode(command + '\r');
      await this.txCharacteristic!.writeValue(data);
    });
  }

  private async initializeAdapter(): Promise<void> {
    // Reset adapter
    await this.sendCommand(ELM327_COMMANDS.RESET, 5000);
    await this.delay(1000);

    // Configure adapter
    await this.sendCommand(ELM327_COMMANDS.ECHO_OFF);
    await this.sendCommand(ELM327_COMMANDS.LINEFEED_OFF);
    await this.sendCommand(ELM327_COMMANDS.SPACES_OFF);
    await this.sendCommand(ELM327_COMMANDS.AUTO_PROTOCOL);

    console.log('ELM327 initialized');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async getVehicleInfo(): Promise<VehicleInfo> {
    const elmVersion = await this.sendCommand(ELM327_COMMANDS.VERSION);
    const voltage = await this.sendCommand(ELM327_COMMANDS.READ_VOLTAGE);
    const protocol = await this.sendCommand(ELM327_COMMANDS.DESCRIBE_PROTOCOL);

    // Try to get VIN (Mode 09, PID 02)
    let vin = 'Not Available';
    try {
      const vinResponse = await this.sendCommand('0902');
      vin = this.parseVIN(vinResponse);
    } catch {
      console.log('VIN not available');
    }

    return {
      vin,
      protocol: protocol.replace('AUTO,', '').trim(),
      voltage: voltage.trim(),
      elmVersion: elmVersion.trim(),
    };
  }

  private parseVIN(response: string): string {
    // VIN response parsing - removes headers and decodes
    const lines = response.split('\n').filter(l => l.trim());
    let hexData = lines.join('').replace(/[^0-9A-Fa-f]/g, '');
    
    // Skip first 4 chars (mode + pid)
    hexData = hexData.substring(4);
    
    let vin = '';
    for (let i = 0; i < hexData.length; i += 2) {
      const charCode = parseInt(hexData.substring(i, i + 2), 16);
      if (charCode >= 32 && charCode <= 126) {
        vin += String.fromCharCode(charCode);
      }
    }
    
    return vin.trim() || 'Not Available';
  }

  async readDTCs(): Promise<DTCCode[]> {
    const dtcs: DTCCode[] = [];
    
    try {
      // Read stored DTCs (Mode 03)
      const response = await this.sendCommand('03');
      const parsed = this.parseDTCResponse(response);
      dtcs.push(...parsed);
    } catch (error) {
      console.error('Error reading DTCs:', error);
    }

    return dtcs;
  }

  async readPendingDTCs(): Promise<DTCCode[]> {
    const dtcs: DTCCode[] = [];
    
    try {
      // Read pending DTCs (Mode 07)
      const response = await this.sendCommand('07');
      const parsed = this.parseDTCResponse(response);
      dtcs.push(...parsed);
    } catch (error) {
      console.error('Error reading pending DTCs:', error);
    }

    return dtcs;
  }

  private parseDTCResponse(response: string): DTCCode[] {
    const dtcs: DTCCode[] = [];
    
    // Split response into lines and process each one
    const lines = response.split(/[\r\n]+/).filter(l => l.trim());
    let hexData = '';
    
    for (const line of lines) {
      let cleaned = line.replace(/[\s]/g, '');
      // Remove mode response prefix only from the START of each line
      // Mode 03 response starts with '43', Mode 07 starts with '47'
      if (cleaned.startsWith('43') || cleaned.startsWith('47')) {
        cleaned = cleaned.substring(2);
      }
      // Skip non-hex data (e.g. 'SEARCHING...', 'NO DATA', adapter responses)
      if (/^[0-9A-Fa-f]+$/.test(cleaned)) {
        hexData += cleaned;
      }
    }
    
    // Each DTC is 4 hex chars (2 bytes)
    for (let i = 0; i < hexData.length; i += 4) {
      const bytes = hexData.substring(i, i + 4);
      if (bytes.length < 4 || bytes === '0000') continue;
      
      const dtc = this.decodeDTC(bytes);
      if (dtc) {
        const description = DTC_DEFINITIONS[dtc] || this.generateDTCDescription(dtc);
        const severity = this.getDTCSeverity(dtc);
        const category = this.getDTCCategory(dtc);
        
        dtcs.push({ code: dtc, description, severity, category });
      }
    }
    
    return dtcs;
  }

  private generateDTCDescription(code: string): string {
    // Generate a meaningful description based on DTC code structure
    const prefix = code.substring(0, 2);
    
    const systemDescriptions: Record<string, Record<string, string>> = {
      'P0': {
        '0': 'Fuel and Air Metering',
        '1': 'Fuel and Air Metering',
        '2': 'Fuel and Air Metering (Injector Circuit)',
        '3': 'Ignition System or Misfire',
        '4': 'Auxiliary Emission Controls',
        '5': 'Vehicle Speed, Idle Control & Auxiliary Inputs',
        '6': 'Computer & Output Circuit',
        '7': 'Transmission',
        '8': 'Transmission',
        '9': 'Transmission',
      },
      'P2': {
        '0': 'Fuel and Air Metering & Auxiliary Emission',
        '1': 'Fuel and Air Metering & Auxiliary Emission',
        '2': 'Fuel and Air Metering (Injector Circuit)',
        '3': 'Ignition System or Misfire',
        '4': 'Auxiliary Emission Controls',
        '5': 'Vehicle Speed, Idle Control & Auxiliary Inputs',
        '6': 'Computer & Output Circuit',
        '7': 'Transmission',
        '8': 'Transmission',
        '9': 'Transmission',
      },
    };
    
    const systems = systemDescriptions[prefix];
    if (systems) {
      const subSystem = systems[code[2]] || 'General';
      return `${subSystem} - Code ${code}`;
    }
    
    // Generic descriptions by category
    const categoryNames: Record<string, string> = {
      'P': 'Powertrain',
      'C': 'Chassis',
      'B': 'Body',
      'U': 'Network Communication',
    };
    const cat = categoryNames[code[0]] || 'Unknown';
    const specific = code[1] === '0' || code[1] === '2' ? 'Generic' : 'Manufacturer Specific';
    return `${cat} ${specific} Fault - Code ${code}`;
  }

  private decodeDTC(bytes: string): string | null {
    const firstChar = parseInt(bytes[0], 16);
    const typeIndex = (firstChar >> 2) & 0x03;
    const types = ['P', 'C', 'B', 'U'];
    const type = types[typeIndex];
    
    const digit1 = firstChar & 0x03;
    const rest = bytes.substring(1);
    
    return `${type}${digit1}${rest}`;
  }

  private getDTCSeverity(code: string): 'low' | 'medium' | 'high' {
    // P0xxx codes are generally most critical
    if (code.startsWith('P0') && parseInt(code.substring(2), 10) < 500) {
      return 'high';
    }
    if (code.startsWith('P')) {
      return 'medium';
    }
    return 'low';
  }

  private getDTCCategory(code: string): string {
    const prefix = code.substring(0, 2);
    const categories: Record<string, string> = {
      'P0': 'Powertrain',
      'P1': 'Powertrain (Manufacturer)',
      'P2': 'Powertrain',
      'P3': 'Powertrain',
      'C0': 'Chassis',
      'C1': 'Chassis (Manufacturer)',
      'B0': 'Body',
      'B1': 'Body (Manufacturer)',
      'U0': 'Network',
      'U1': 'Network (Manufacturer)',
    };
    return categories[prefix] || 'Unknown';
  }

  async clearDTCs(): Promise<boolean> {
    try {
      await this.sendCommand('04');
      return true;
    } catch (error) {
      console.error('Error clearing DTCs:', error);
      return false;
    }
  }

  async readPID(pid: string): Promise<number | null> {
    try {
      const command = `01${pid}`;
      const response = await this.sendCommand(command);
      
      // Parse response - handle multi-line responses
      const cleaned = response.replace(/[\s\r\n]/g, '');
      
      // Skip 'NO DATA', 'UNABLE TO CONNECT', '?' etc.
      if (/NODATA|UNABLE|ERROR|\?/i.test(cleaned)) return null;
      
      // Find the response prefix: 41 + PID
      const pidUpper = pid.toUpperCase();
      const prefix = `41${pidUpper}`;
      const dataStart = cleaned.indexOf(prefix);
      if (dataStart === -1) return null;
      
      // Data bytes start after the mode response (41) + PID length
      const data = cleaned.substring(dataStart + 2 + pidUpper.length);
      const bytes = [];
      for (let i = 0; i < data.length && i < 8; i += 2) {
        const byte = parseInt(data.substring(i, i + 2), 16);
        if (!isNaN(byte)) {
          bytes.push(byte);
        }
      }
      
      const pidDef = MODE_01_PIDS[pidUpper];
      if (pidDef && bytes.length > 0) {
        return pidDef.formula(bytes);
      }
      
      return null;
    } catch (error) {
      console.error(`Error reading PID ${pid}:`, error);
      return null;
    }
  }

  async readAllSensorData(): Promise<Partial<OBDData>> {
    const data: Partial<OBDData> = {};
    
    // ELM327 is a serial device - must send commands sequentially, NOT in parallel.
    // Sending in parallel causes response mixing and timeouts since there's only one response channel.
    const pidMappings: { pid: string; key: keyof OBDData }[] = [
      { pid: '0C', key: 'rpm' },
      { pid: '0D', key: 'speed' },
      { pid: '05', key: 'coolantTemp' },
      { pid: '04', key: 'engineLoad' },
      { pid: '11', key: 'throttlePosition' },
      { pid: '2F', key: 'fuelLevel' },
      { pid: '0F', key: 'intakeTemp' },
      { pid: '42', key: 'voltage' },
      { pid: '5C', key: 'oilTemp' },
      { pid: '10', key: 'mafRate' },
      { pid: '1F', key: 'runTime' },
    ];
    
    for (const { pid, key } of pidMappings) {
      if (!this._isMonitoring) break; // Stop early if monitoring was cancelled
      try {
        const value = await this.readPID(pid);
        if (value !== null) {
          (data as Record<string, number>)[key] = value;
        }
      } catch {
        // Skip failed PIDs (vehicle may not support all)
      }
    }
    
    return data;
  }

  subscribe(callback: (data: Partial<OBDData>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(data: Partial<OBDData>): void {
    this.listeners.forEach(callback => callback(data));
  }

  async startLiveMonitoring(interval: number = 500): Promise<void> {
    this._isMonitoring = true;
    
    const poll = async () => {
      if (!this.isConnected || !this._isMonitoring) return;
      
      try {
        const data = await this.readAllSensorData();
        if (this._isMonitoring) {
          this.notifyListeners(data);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
      
      if (this.isConnected && this._isMonitoring) {
        setTimeout(poll, interval);
      }
    };
    
    poll();
  }

  stopLiveMonitoring(): void {
    this._isMonitoring = false;
  }
}

// Singleton instance
export const elm327Service = new ELM327Service();
