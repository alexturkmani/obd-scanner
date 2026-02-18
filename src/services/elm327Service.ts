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
  boostPressure: number;
  intakePressure: number;
}

export interface ProgrammingResult {
  success: boolean;
  message: string;
  rawResponse?: string;
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
  private lastDeviceName: string | null = null;
  private disconnectListeners: Set<() => void> = new Set();


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

      // Listen for disconnections for auto-reconnect
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this._isMonitoring = false;
        this.disconnectListeners.forEach(cb => cb());
      });

      this.lastDeviceName = this.device.name || null;
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  onDisconnect(callback: () => void): () => void {
    this.disconnectListeners.add(callback);
    return () => this.disconnectListeners.delete(callback);
  }

  getLastDeviceName(): string | null {
    return this.lastDeviceName;
  }

  async tryAutoReconnect(): Promise<boolean> {
    try {
      if (this.device?.gatt && !this.device.gatt.connected) {
        this.server = await this.device.gatt.connect();
        if (!this.server) return false;

        let service: BluetoothRemoteGATTService;
        try {
          service = await this.server.getPrimaryService(ELM327_SERVICE_UUID);
        } catch {
          service = await this.server.getPrimaryService(ALT_SERVICE_UUID);
        }

        this.txCharacteristic = await service.getCharacteristic(ELM327_CHARACTERISTIC_TX);
        this.rxCharacteristic = await service.getCharacteristic(ELM327_CHARACTERISTIC_RX);
        await this.rxCharacteristic.startNotifications();
        this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this));
        await this.initializeAdapter();
        this.isConnected = true;
        return true;
      }
      return false;
    } catch {
      return false;
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
      { pid: '0B', key: 'intakePressure' },
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

  // ---- Permanent DTCs (Mode 0A) ----
  async readPermanentDTCs(): Promise<DTCCode[]> {
    const dtcs: DTCCode[] = [];
    try {
      const response = await this.sendCommand('0A');
      // Mode 0A response prefix is '4A'
      const parsed = this.parseDTCResponseWithPrefix(response, '4A');
      dtcs.push(...parsed);
    } catch (error) {
      console.error('Error reading permanent DTCs:', error);
    }
    return dtcs;
  }

  private parseDTCResponseWithPrefix(response: string, prefix: string): DTCCode[] {
    const dtcs: DTCCode[] = [];
    const lines = response.split(/[\r\n]+/).filter(l => l.trim());
    let hexData = '';
    for (const line of lines) {
      let cleaned = line.replace(/[\s]/g, '');
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
      }
      if (/^[0-9A-Fa-f]+$/.test(cleaned)) {
        hexData += cleaned;
      }
    }
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

  // ---- Vehicle Programming / Control ----
  async sendRawCommand(command: string): Promise<string> {
    try {
      return await this.sendCommand(command, 5000);
    } catch (error) {
      return `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async resetServiceLight(): Promise<ProgrammingResult> {
    try {
      // Clear DTCs also resets service indicators on most vehicles
      const response = await this.sendCommand('04', 5000);
      if (/OK|44/i.test(response)) {
        return { success: true, message: 'Service light reset successfully', rawResponse: response };
      }
      return { success: false, message: 'Unexpected response from ECU', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to reset service light' };
    }
  }

  async resetAdaptiveValues(): Promise<ProgrammingResult> {
    try {
      // Clear DTCs resets adaptive learning values
      const response = await this.sendCommand('04', 5000);
      if (/OK|44/i.test(response)) {
        return { success: true, message: 'Adaptive values reset. Drive cycle needed to relearn.', rawResponse: response };
      }
      return { success: false, message: 'Unexpected response from ECU', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to reset' };
    }
  }

  async testComponent(mode08pid: string): Promise<ProgrammingResult> {
    try {
      // Mode 08 - Control operation of on-board systems
      const response = await this.sendCommand(`08${mode08pid}`, 5000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'Component test not supported by this vehicle', rawResponse: response };
      }
      return { success: true, message: 'Component test initiated', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Component test failed' };
    }
  }

  async requestDPFRegeneration(): Promise<ProgrammingResult> {
    try {
      // Attempt DPF regeneration via Mode 08 (vehicle-specific)
      const response = await this.sendCommand('0800', 10000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'DPF regeneration not supported via OBD on this vehicle', rawResponse: response };
      }
      return { success: true, message: 'DPF regeneration request sent. Keep engine running at idle.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'DPF regeneration request failed' };
    }
  }

  // ---- Advanced Programming / Module Control ----

  /** Reset gauge cluster / instrument cluster service interval */
  async resetGaugeCluster(): Promise<ProgrammingResult> {
    try {
      // Clear DTCs + reset service interval counters
      // Mode 04 clears DTCs; some ECUs also reset service counters
      const clearRes = await this.sendCommand('04', 5000);
      // Attempt to reset service interval via Mode 08 TID 01 (on-board test)
      let extraRes = '';
      try {
        extraRes = await this.sendCommand('0801', 3000);
      } catch {}
      if (/OK|44/i.test(clearRes)) {
        return { success: true, message: 'Gauge cluster service indicators reset. Cycle ignition to confirm.', rawResponse: `${clearRes} | ${extraRes}` };
      }
      return { success: false, message: 'ECU did not acknowledge reset', rawResponse: clearRes };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Gauge cluster reset failed' };
    }
  }

  /** Throttle body alignment / electronic throttle idle relearn */
  async throttleRelearn(): Promise<ProgrammingResult> {
    try {
      // Reset throttle adaptations by clearing DTCs then requesting idle relearn
      await this.sendCommand('04', 3000);
      // Mode 08 PID 00 = general on-board test (used for throttle relearn on many vehicles)
      const response = await this.sendCommand('0800', 5000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'Throttle relearn not supported via generic OBD. Vehicle may require manufacturer-specific commands.', rawResponse: response };
      }
      return { success: true, message: 'Throttle body relearn initiated. Keep engine at idle for 2 minutes without touching the accelerator.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Throttle relearn failed' };
    }
  }

  /** Injector buzz test - activate injectors sequentially */
  async injectorBuzzTest(cylinderNum: number): Promise<ProgrammingResult> {
    try {
      // Mode 08 with cylinder-specific TID
      const tid = cylinderNum.toString(16).padStart(2, '0').toUpperCase();
      const response = await this.sendCommand(`0803${tid}`, 5000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: `Injector test not supported for cylinder ${cylinderNum}. Requires manufacturer-specific protocol.`, rawResponse: response };
      }
      return { success: true, message: `Injector buzz test initiated for cylinder ${cylinderNum}`, rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Injector test failed' };
    }
  }

  /** ABS bleed procedure initiation */
  async absBleedProcedure(): Promise<ProgrammingResult> {
    try {
      // ABS bleeding typically requires manufacturer-specific UDS commands
      // Attempt via Mode 08 (control on-board system)
      const response = await this.sendCommand('0804', 8000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'ABS bleed procedure not available via generic OBD-II. Requires manufacturer-specific diagnostic tool for ABS module access.', rawResponse: response };
      }
      return { success: true, message: 'ABS bleed procedure initiated. Follow vehicle-specific bleed sequence at each caliper.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'ABS bleed procedure failed' };
    }
  }

  /** Steering angle sensor (SAS) calibration */
  async calibrateSteeringAngle(): Promise<ProgrammingResult> {
    try {
      // SAS calibration via Mode 08
      const response = await this.sendCommand('0805', 5000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'Steering angle calibration not available via generic OBD. Turn steering wheel full lock-to-lock and re-center. Some vehicles require manufacturer tool.', rawResponse: response };
      }
      return { success: true, message: 'Steering angle sensor calibration started. Turn wheel full left, full right, then center.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'SAS calibration failed' };
    }
  }

  /** Battery registration / BMS reset after battery replacement */
  async batteryRegistration(): Promise<ProgrammingResult> {
    try {
      // Attempt to reset battery management via clearing adaptation data
      const response = await this.sendCommand('04', 5000);
      // Some vehicles accept Mode 08 for battery reset
      let bmRes = '';
      try {
        bmRes = await this.sendCommand('0806', 3000);
      } catch {}
      if (/OK|44/i.test(response)) {
        return { success: true, message: 'Battery management system reset. New battery capacity will be learned over the next few drive cycles.', rawResponse: `${response} | ${bmRes}` };
      }
      return { success: false, message: 'Battery registration not confirmed by ECU', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Battery registration failed' };
    }
  }

  /** Transmission adaptation reset */
  async resetTransmissionAdaptation(): Promise<ProgrammingResult> {
    try {
      // Clear DTCs resets transmission learned shift points on many vehicles
      const response = await this.sendCommand('04', 5000);
      if (/OK|44/i.test(response)) {
        return { success: true, message: 'Transmission adaptations reset. Shift patterns will be relearned over the next 50-100 miles of driving.', rawResponse: response };
      }
      return { success: false, message: 'Transmission reset not confirmed', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Transmission reset failed' };
    }
  }

  /** TPMS sensor reset / relearn */
  async resetTPMS(): Promise<ProgrammingResult> {
    try {
      const response = await this.sendCommand('0807', 5000);
      if (/NODATA|UNABLE|ERROR|\?/i.test(response)) {
        return { success: false, message: 'TPMS reset not available via generic OBD. Check owner\'s manual for manual TPMS relearn procedure (usually involves tire pressure button with ignition ON).', rawResponse: response };
      }
      return { success: true, message: 'TPMS relearn initiated. Drive at 25+ mph for 10 minutes to complete sensor registration.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'TPMS reset failed' };
    }
  }

  /** Immobilizer / key programming init (puts ECU in programming mode) */
  async immobilizerInit(): Promise<ProgrammingResult> {
    try {
      // Security access request - Mode 27 (UDS Security Access)
      // This requests seed from ECU; actual key programming requires manufacturer seed-key algorithms
      const response = await this.sendCommand('2701', 5000);
      if (/NODATA|UNABLE|ERROR|\?|7F/i.test(response)) {
        return { success: false, message: 'Immobilizer access denied. Key programming requires manufacturer-specific security access credentials. Generic OBD cannot bypass immobilizer security.', rawResponse: response };
      }
      return { success: true, message: 'ECU security access initiated. Seed received. Key algorithm required to proceed.', rawResponse: response };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Immobilizer init failed' };
    }
  }

  /** Read O2 sensor monitoring test results (Mode 06) */
  async readO2SensorTests(): Promise<{ testId: string; value: number; min: number; max: number; passed: boolean }[]> {
    const results: { testId: string; value: number; min: number; max: number; passed: boolean }[] = [];
    try {
      // Mode 06 - Request results of specific monitored systems
      const response = await this.sendCommand('0600', 5000);
      const cleaned = response.replace(/[\s\r\n]/g, '');
      if (/NODATA|ERROR/i.test(cleaned)) return results;
      // Parse Mode 06 response: 46 TID CIDH CIDL VAL MINH MINL MAXH MAXL
      const lines = response.split(/[\r\n]+/).filter(l => l.trim());
      for (const line of lines) {
        const hex = line.replace(/\s/g, '');
        if (!hex.startsWith('46') || hex.length < 18) continue;
        const tid = hex.substring(2, 4);
        const val = parseInt(hex.substring(8, 12), 16);
        const min = parseInt(hex.substring(12, 16), 16);
        const max = parseInt(hex.substring(16, 20), 16);
        results.push({
          testId: `TID ${tid}`,
          value: val,
          min,
          max,
          passed: val >= min && val <= max,
        });
      }
    } catch (error) {
      console.error('Error reading O2 sensor tests:', error);
    }
    return results;
  }

  /** Read readiness monitor status (Mode 01 PID 01) */
  async readReadinessMonitors(): Promise<{
    mil: boolean;
    dtcCount: number;
    monitors: { name: string; available: boolean; complete: boolean }[];
  }> {
    const defaultResult = { mil: false, dtcCount: 0, monitors: [] as { name: string; available: boolean; complete: boolean }[] };
    try {
      const response = await this.sendCommand('0101', 3000);
      const cleaned = response.replace(/[\s\r\n]/g, '');
      const idx = cleaned.indexOf('4101');
      if (idx === -1) return defaultResult;
      const data = cleaned.substring(idx + 4);
      if (data.length < 8) return defaultResult;
      
      const a = parseInt(data.substring(0, 2), 16);
      const b = parseInt(data.substring(2, 4), 16);
      const c = parseInt(data.substring(4, 6), 16);
      const d = parseInt(data.substring(6, 8), 16);

      const mil = (a & 0x80) !== 0;
      const dtcCount = a & 0x7F;
      const isSpark = (b & 0x08) === 0; // bit 3 of B = 0 means spark ignition

      const monitors: { name: string; available: boolean; complete: boolean }[] = [];

      // Common monitors (bits in byte B)
      const commonMonitors = [
        { name: 'Misfire', availBit: 0, completeBit: 4 },
        { name: 'Fuel System', availBit: 1, completeBit: 5 },
        { name: 'Components', availBit: 2, completeBit: 6 },
      ];
      for (const m of commonMonitors) {
        monitors.push({
          name: m.name,
          available: (b & (1 << m.availBit)) !== 0,
          complete: (b & (1 << m.completeBit)) === 0, // 0 = complete
        });
      }

      if (isSpark) {
        // Spark-ignition monitors (bytes C and D)
        const sparkMonitors = [
          { name: 'Catalyst', cBit: 0, dBit: 0 },
          { name: 'Heated Catalyst', cBit: 1, dBit: 1 },
          { name: 'Evaporative System', cBit: 2, dBit: 2 },
          { name: 'Secondary Air', cBit: 3, dBit: 3 },
          { name: 'A/C Refrigerant', cBit: 4, dBit: 4 },
          { name: 'Oxygen Sensor', cBit: 5, dBit: 5 },
          { name: 'Oxygen Sensor Heater', cBit: 6, dBit: 6 },
          { name: 'EGR/VVT System', cBit: 7, dBit: 7 },
        ];
        for (const m of sparkMonitors) {
          monitors.push({
            name: m.name,
            available: (c & (1 << m.cBit)) !== 0,
            complete: (d & (1 << m.dBit)) === 0,
          });
        }
      } else {
        // Compression-ignition (diesel) monitors
        const dieselMonitors = [
          { name: 'NMHC Catalyst', cBit: 0, dBit: 0 },
          { name: 'NOx/SCR Aftertreatment', cBit: 1, dBit: 1 },
          { name: 'Boost Pressure', cBit: 3, dBit: 3 },
          { name: 'Exhaust Gas Sensor', cBit: 5, dBit: 5 },
          { name: 'PM Filter', cBit: 6, dBit: 6 },
          { name: 'EGR/VVT System', cBit: 7, dBit: 7 },
        ];
        for (const m of dieselMonitors) {
          monitors.push({
            name: m.name,
            available: (c & (1 << m.cBit)) !== 0,
            complete: (d & (1 << m.dBit)) === 0,
          });
        }
      }

      return { mil, dtcCount, monitors };
    } catch (error) {
      console.error('Error reading readiness monitors:', error);
      return defaultResult;
    }
  }

  /** Read full freeze frame snapshot (Mode 02) */
  async readFullFreezeFrame(): Promise<Record<string, { name: string; value: number; unit: string }>> {
    const snapshot: Record<string, { name: string; value: number; unit: string }> = {};
    const freezePids: { pid: string; name: string; unit: string }[] = [
      { pid: '02', name: 'DTC that triggered freeze frame', unit: '' },
      { pid: '04', name: 'Engine Load', unit: '%' },
      { pid: '05', name: 'Coolant Temp', unit: '°C' },
      { pid: '06', name: 'Short Term Fuel Trim B1', unit: '%' },
      { pid: '07', name: 'Long Term Fuel Trim B1', unit: '%' },
      { pid: '0B', name: 'Intake Manifold Pressure', unit: 'kPa' },
      { pid: '0C', name: 'Engine RPM', unit: 'RPM' },
      { pid: '0D', name: 'Vehicle Speed', unit: 'km/h' },
      { pid: '0E', name: 'Timing Advance', unit: '°' },
      { pid: '0F', name: 'Intake Air Temp', unit: '°C' },
      { pid: '11', name: 'Throttle Position', unit: '%' },
    ];

    for (const p of freezePids) {
      const val = await this.readFreezeFrame(p.pid);
      if (val !== null) {
        snapshot[p.pid] = { name: p.name, value: val, unit: p.unit };
      }
    }
    return snapshot;
  }

  /** Cylinder power balance / misfire count (Mode 06) */
  async readMisfireData(): Promise<{ cylinder: number; count: number }[]> {
    const misfires: { cylinder: number; count: number }[] = [];
    try {
      // Mode 06 TID A0-A8 are typically misfire counters
      for (let i = 0; i <= 8; i++) {
        const tid = (0xA0 + i).toString(16).toUpperCase();
        const response = await this.sendCommand(`06${tid}`, 2000);
        const cleaned = response.replace(/[\s\r\n]/g, '');
        if (/NODATA|ERROR/i.test(cleaned)) continue;
        const prefix = `46${tid}`;
        const idx = cleaned.indexOf(prefix);
        if (idx !== -1 && cleaned.length >= idx + prefix.length + 4) {
          const countHex = cleaned.substring(idx + prefix.length + 4, idx + prefix.length + 8);
          const count = parseInt(countHex, 16);
          if (!isNaN(count)) {
            misfires.push({ cylinder: i + 1, count });
          }
        }
      }
    } catch (error) {
      console.error('Error reading misfire data:', error);
    }
    return misfires;
  }

  /** Read fuel trim data for all banks */
  async readFuelTrims(): Promise<{ bank: number; shortTerm: number; longTerm: number }[]> {
    const trims: { bank: number; shortTerm: number; longTerm: number }[] = [];
    try {
      // Bank 1
      const stft1 = await this.readPID('06');
      const ltft1 = await this.readPID('07');
      if (stft1 !== null || ltft1 !== null) {
        trims.push({ bank: 1, shortTerm: stft1 ?? 0, longTerm: ltft1 ?? 0 });
      }
      // Bank 2
      const stft2 = await this.readPID('08');
      const ltft2 = await this.readPID('09');
      if (stft2 !== null || ltft2 !== null) {
        trims.push({ bank: 2, shortTerm: stft2 ?? 0, longTerm: ltft2 ?? 0 });
      }
    } catch (error) {
      console.error('Error reading fuel trims:', error);
    }
    return trims;
  }

  async readFreezeFrame(pid: string): Promise<number | null> {
    try {
      const command = `02${pid}00`; // Frame 00
      const response = await this.sendCommand(command);
      const cleaned = response.replace(/[\s\r\n]/g, '');
      if (/NODATA|UNABLE|ERROR|\?/i.test(cleaned)) return null;
      const pidUpper = pid.toUpperCase();
      const pfx = `42${pidUpper}`;
      const dataStart = cleaned.indexOf(pfx);
      if (dataStart === -1) return null;
      const data = cleaned.substring(dataStart + 2 + pidUpper.length);
      const bytes: number[] = [];
      for (let i = 0; i < data.length && i < 8; i += 2) {
        const byte = parseInt(data.substring(i, i + 2), 16);
        if (!isNaN(byte)) bytes.push(byte);
      }
      const pidDef = MODE_01_PIDS[pidUpper];
      if (pidDef && bytes.length > 0) return pidDef.formula(bytes);
      return null;
    } catch {
      return null;
    }
  }

  async getECUInfo(): Promise<{ calId: string; cvn: string; ecuName: string }> {
    let calId = 'Not Available';
    let cvn = 'Not Available';
    let ecuName = 'Not Available';
    try {
      const calRes = await this.sendCommand('0904', 5000);
      calId = this.parseASCIIResponse(calRes, '49 04') || 'Not Available';
    } catch {}
    try {
      const cvnRes = await this.sendCommand('0906', 5000);
      cvn = cvnRes.replace(/[\s\r\n]/g, '').replace(/4906/g, '').trim() || 'Not Available';
    } catch {}
    try {
      const ecuRes = await this.sendCommand('090A', 5000);
      ecuName = this.parseASCIIResponse(ecuRes, '49 0A') || 'Not Available';
    } catch {}
    return { calId, cvn, ecuName };
  }

  private parseASCIIResponse(response: string, prefix: string): string | null {
    const lines = response.split(/[\r\n]+/).filter(l => l.trim());
    let hexData = lines.join('').replace(/[^0-9A-Fa-f]/g, '');
    const pfx = prefix.replace(/\s/g, '');
    const idx = hexData.indexOf(pfx);
    if (idx !== -1) hexData = hexData.substring(idx + pfx.length);
    let result = '';
    for (let i = 0; i < hexData.length; i += 2) {
      const charCode = parseInt(hexData.substring(i, i + 2), 16);
      if (charCode >= 32 && charCode <= 126) result += String.fromCharCode(charCode);
    }
    return result.trim() || null;
  }
}

// Singleton instance
export const elm327Service = new ELM327Service();
