# OBD-II Scanner Web App

A web-based OBD-II diagnostic scanner that connects to your vehicle via an ELM327 Bluetooth adapter.

## Features

- **Bluetooth Connection** - Connect to ELM327 adapters via Web Bluetooth API
- **Live Data Monitoring** - Real-time sensor readings (RPM, speed, temps, etc.)
- **Diagnostic Codes** - Read and clear DTCs (Diagnostic Trouble Codes)
- **Vehicle Info** - View VIN, protocol, and adapter information
- **Dark Theme UI** - Modern dashboard interface

## Requirements

- **Browser**: Chrome or Edge (Web Bluetooth support required)
- **Hardware**: ELM327 Bluetooth OBD-II adapter
- **Vehicle**: Any OBD-II compliant vehicle (1996+ in US, 2001+ in EU)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Open in Browser

Navigate to `https://localhost:3000` (HTTPS required for Web Bluetooth)

### 4. Connect Your Adapter

1. Plug ELM327 adapter into vehicle's OBD-II port
2. Turn ignition ON (engine can be off or running)
3. Click "Connect ELM327" button
4. Select your adapter from the Bluetooth pairing dialog

## Supported PIDs

| PID | Description | Unit |
|-----|-------------|------|
| 04 | Engine Load | % |
| 05 | Coolant Temperature | °C |
| 0C | Engine RPM | RPM |
| 0D | Vehicle Speed | km/h |
| 0F | Intake Air Temperature | °C |
| 10 | MAF Rate | g/s |
| 11 | Throttle Position | % |
| 2F | Fuel Level | % |
| 42 | Control Module Voltage | V |
| 5C | Oil Temperature | °C |

## Diagnostic Codes

The scanner can read:
- **Stored DTCs** (Mode 03) - Current fault codes
- **Pending DTCs** (Mode 07) - Codes that haven't triggered MIL yet
- **Clear DTCs** (Mode 04) - Reset Check Engine Light

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Web Bluetooth API

## Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 56+ | ✅ Supported |
| Edge 79+ | ✅ Supported |
| Opera 43+ | ✅ Supported |
| Firefox | ❌ Not supported |
| Safari | ❌ Not supported |

## Important Notes

1. **HTTPS Required** - Web Bluetooth only works over HTTPS or localhost
2. **User Gesture Required** - Bluetooth pairing requires user interaction
3. **Adapter Compatibility** - Works best with genuine ELM327 v1.5+ adapters

## Troubleshooting

**Can't find device?**
- Make sure adapter is powered (LED should be on)
- Try adapter name prefixes: OBD, ELM, OBDII, V-LINK, Vgate

**Connection drops?**
- Cheap ELM327 clones may have firmware issues
- Try moving closer to the adapter

**No data returned?**
- Ensure ignition is ON
- Some PIDs may not be supported by your vehicle

## License

MIT
