import { useState } from 'react';
import { useOBD, MaintenanceItem } from '../context/OBDContext';

const MAINTENANCE_TYPES = [
  'Oil Change',
  'Oil Filter',
  'Air Filter',
  'Cabin Filter',
  'Spark Plugs',
  'Brake Pads (Front)',
  'Brake Pads (Rear)',
  'Brake Fluid',
  'Coolant Flush',
  'Transmission Fluid',
  'Tire Rotation',
  'Timing Belt',
  'Serpentine Belt',
  'Battery',
  'Wiper Blades',
  'Power Steering Fluid',
  'Differential Fluid',
  'Fuel Filter',
];

const DEFAULT_INTERVALS: Record<string, { miles: number; months: number }> = {
  'Oil Change': { miles: 5000, months: 6 },
  'Oil Filter': { miles: 5000, months: 6 },
  'Air Filter': { miles: 15000, months: 12 },
  'Cabin Filter': { miles: 15000, months: 12 },
  'Spark Plugs': { miles: 30000, months: 36 },
  'Brake Pads (Front)': { miles: 30000, months: 36 },
  'Brake Pads (Rear)': { miles: 40000, months: 48 },
  'Brake Fluid': { miles: 30000, months: 24 },
  'Coolant Flush': { miles: 30000, months: 24 },
  'Transmission Fluid': { miles: 50000, months: 48 },
  'Tire Rotation': { miles: 7500, months: 6 },
  'Timing Belt': { miles: 60000, months: 60 },
  'Serpentine Belt': { miles: 50000, months: 48 },
  'Battery': { miles: 50000, months: 48 },
  'Wiper Blades': { miles: 15000, months: 12 },
  'Power Steering Fluid': { miles: 50000, months: 48 },
  'Differential Fluid': { miles: 50000, months: 48 },
  'Fuel Filter': { miles: 30000, months: 36 },
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default function Maintenance() {
  const { activeProfileId, vehicleProfiles, addMaintenanceItem, updateMaintenance, deleteMaintenanceItem, selectedVehicle } = useOBD();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState(MAINTENANCE_TYPES[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMileage, setFormMileage] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const activeProfile = vehicleProfiles.find(p => p.id === activeProfileId);
  const items = activeProfile?.maintenanceItems || [];

  const getStatus = (item: MaintenanceItem): 'good' | 'soon' | 'overdue' => {
    const lastDate = new Date(item.lastDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
    
    if (monthsDiff >= item.intervalMonths) return 'overdue';
    if (monthsDiff >= item.intervalMonths * 0.8) return 'soon';
    return 'good';
  };

  const handleAdd = () => {
    if (!activeProfileId) return;
    const defaults = DEFAULT_INTERVALS[formType] || { miles: 10000, months: 12 };
    const item: MaintenanceItem = {
      id: generateId(),
      type: formType,
      lastDate: formDate,
      lastMileage: parseInt(formMileage) || 0,
      intervalMiles: defaults.miles,
      intervalMonths: defaults.months,
      notes: formNotes,
    };
    addMaintenanceItem(activeProfileId, item);
    setShowAdd(false);
    resetForm();
  };

  const handleUpdate = (item: MaintenanceItem) => {
    if (!activeProfileId) return;
    updateMaintenance(activeProfileId, {
      ...item,
      lastDate: formDate,
      lastMileage: parseInt(formMileage) || item.lastMileage,
      notes: formNotes,
    });
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormType(MAINTENANCE_TYPES[0]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMileage('');
    setFormNotes('');
  };

  if (!activeProfileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 text-gray-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">No Vehicle Profile Selected</h2>
        <p className="text-gray-400 text-sm md:text-base">Go to Vehicle Profiles to create and select a profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Maintenance Tracker</h2>
          {selectedVehicle && (
            <p className="text-sm text-gray-400">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm md:text-base font-medium transition-colors"
        >
          + Add Service
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-obd-card rounded-xl p-6 md:p-8 text-center">
          <h3 className="text-lg md:text-xl font-semibold mb-2">No Maintenance Records</h3>
          <p className="text-gray-400 text-sm md:text-base">Add your first service record to start tracking maintenance.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const status = getStatus(item);
            const statusColors = { good: 'text-obd-success', soon: 'text-obd-warning', overdue: 'text-obd-error' };
            const statusBg = { good: 'bg-obd-success', soon: 'bg-obd-warning', overdue: 'bg-obd-error' };
            const statusLabels = { good: 'OK', soon: 'Due Soon', overdue: 'Overdue' };

            return (
              <div key={item.id} className="bg-obd-card rounded-xl p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm md:text-base">{item.type}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium ${statusBg[status]} bg-opacity-20 ${statusColors[status]}`}>
                        {statusLabels[status]}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 space-y-0.5">
                      <p>Last: {new Date(item.lastDate).toLocaleDateString()} at {item.lastMileage.toLocaleString()} km</p>
                      <p>Interval: Every {item.intervalMiles.toLocaleString()} km / {item.intervalMonths} months</p>
                      {item.notes && <p className="text-gray-500">Note: {item.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setFormDate(new Date().toISOString().split('T')[0]);
                        setFormMileage('');
                        setFormNotes(item.notes);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                      title="Update service"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => activeProfileId && deleteMaintenanceItem(activeProfileId, item.id)}
                      className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-obd-error transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {editingId === item.id && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                    <input type="number" placeholder="Current mileage (km)" value={formMileage} onChange={e => setFormMileage(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                    <input type="text" placeholder="Notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(item)} className="px-3 py-1.5 bg-obd-success hover:bg-green-600 rounded-lg text-sm font-medium">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Service Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-obd-card rounded-xl p-4 md:p-6 max-w-md w-full space-y-3">
            <h3 className="text-lg md:text-xl font-bold">Add Service Record</h3>
            <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm">
              {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
            <input type="number" placeholder="Mileage at service (km)" value={formMileage} onChange={e => setFormMileage(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
            <input type="text" placeholder="Notes (optional)" value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAdd} className="px-3 py-1.5 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
