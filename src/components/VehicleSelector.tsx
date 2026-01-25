import { useState, useEffect } from 'react';
import { VEHICLE_MAKES, getModelsForMake, getYearsForModel, VehicleModel } from '../data/vehicles';

interface VehicleSelectorProps {
  onSelect: (vehicle: { make: string; model: string; year: number } | null) => void;
  initialVehicle?: { make: string; model: string; year: number } | null;
}

export default function VehicleSelector({ onSelect, initialVehicle }: VehicleSelectorProps) {
  const [make, setMake] = useState<string>(initialVehicle?.make || '');
  const [model, setModel] = useState<string>(initialVehicle?.model || '');
  const [year, setYear] = useState<number | ''>(initialVehicle?.year || '');
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');

  useEffect(() => {
    if (make) {
      const makeModels = getModelsForMake(make);
      setModels(makeModels);
      if (!makeModels.find(m => m.name === model)) {
        setModel('');
        setYear('');
        setYears([]);
      }
    } else {
      setModels([]);
      setModel('');
      setYear('');
      setYears([]);
    }
  }, [make]);

  useEffect(() => {
    if (make && model) {
      const modelYears = getYearsForModel(make, model);
      setYears(modelYears);
      if (!modelYears.includes(year as number)) {
        setYear('');
      }
    } else {
      setYears([]);
      setYear('');
    }
  }, [model, make]);

  useEffect(() => {
    if (make && model && year) {
      onSelect({ make, model, year: year as number });
    } else {
      onSelect(null);
    }
  }, [make, model, year, onSelect]);

  const filteredMakes = VEHICLE_MAKES.filter(m =>
    m.name.toLowerCase().includes(searchMake.toLowerCase())
  );

  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchModel.toLowerCase())
  );

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Make Selection */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">Make</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search make..."
            value={searchMake}
            onChange={(e) => setSearchMake(e.target.value)}
            className="w-full px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-obd-accent mb-2"
          />
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setSearchMake('');
            }}
            className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-obd-accent appearance-none cursor-pointer"
          >
            <option value="">Select Make</option>
            {filteredMakes.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 bottom-3 md:bottom-3.5 pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">Model</label>
        <div className="relative">
          {make && (
            <input
              type="text"
              placeholder="Search model..."
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              className="w-full px-3 py-2 md:px-4 md:py-2 text-sm md:text-base bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-obd-accent mb-2"
            />
          )}
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSearchModel('');
            }}
            disabled={!make}
            className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-obd-accent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Model</option>
            {filteredModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 bottom-3 md:bottom-3.5 pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Year Selection */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1.5 md:mb-2">Year</label>
        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')}
            disabled={!model}
            className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-obd-accent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Vehicle Summary */}
      {make && model && year && (
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-obd-accent bg-opacity-20 rounded-lg border border-obd-accent">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-obd-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <div className="min-w-0">
              <p className="font-semibold text-base md:text-lg truncate">{year} {make} {model}</p>
              <p className="text-xs md:text-sm text-gray-400">Vehicle selected</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
