import { useState } from 'react';
import { useOBD } from '../context/OBDContext';
import VehicleSelector from '../components/VehicleSelector';

export default function VehicleProfiles() {
  const {
    vehicleProfiles, activeProfileId, setActiveProfile,
    addVehicleProfile, deleteVehicleProfile,
  } = useOBD();
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const handleAddProfile = (vehicle: { make: string; model: string; year: number } | null) => {
    if (vehicle) {
      const id = addVehicleProfile(vehicle);
      setActiveProfile(id);
      setShowAdd(false);
    }
  };

  const historyProfile = vehicleProfiles.find(p => p.id === showHistory);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Vehicle Profiles</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-obd-accent hover:bg-blue-600 rounded-lg text-sm md:text-base font-medium transition-colors"
        >
          + Add Vehicle
        </button>
      </div>

      {vehicleProfiles.length === 0 ? (
        <div className="bg-obd-card rounded-xl p-6 md:p-8 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Vehicle Profiles</h3>
          <p className="text-gray-400 text-sm">Add your first vehicle to track maintenance and DTC history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {vehicleProfiles.map((profile) => (
            <div
              key={profile.id}
              className={`bg-obd-card rounded-xl p-4 border-2 transition-colors cursor-pointer ${
                activeProfileId === profile.id ? 'border-obd-accent' : 'border-transparent hover:border-gray-600'
              }`}
              onClick={() => setActiveProfile(profile.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    {profile.vehicle.year} {profile.vehicle.make} {profile.vehicle.model}
                  </h3>
                  {activeProfileId === profile.id && (
                    <span className="text-xs text-obd-accent font-medium">Active</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHistory(profile.id); }}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="View DTC history"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteVehicleProfile(profile.id); }}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-obd-error transition-colors"
                    title="Delete profile"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-xs md:text-sm text-gray-400 space-y-1">
                <p>{profile.maintenanceItems.length} maintenance records</p>
                <p>{profile.dtcHistory.length} scan(s) in history</p>
                <p>Added {new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-obd-card rounded-xl p-4 md:p-6 max-w-md w-full">
            <h3 className="text-lg md:text-xl font-bold mb-4">Add Vehicle Profile</h3>
            <VehicleSelector onSelect={handleAddProfile} />
            <button
              onClick={() => setShowAdd(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DTC History Modal */}
      {showHistory && historyProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-obd-card rounded-xl p-4 md:p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">
              DTC History — {historyProfile.vehicle.year} {historyProfile.vehicle.make} {historyProfile.vehicle.model}
            </h3>
            {historyProfile.dtcHistory.length === 0 ? (
              <p className="text-gray-400 text-sm">No scan history yet.</p>
            ) : (
              <div className="space-y-3">
                {historyProfile.dtcHistory.map((entry, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{new Date(entry.date).toLocaleString()}</p>
                    <div className="space-y-1">
                      {entry.codes.map((code, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-obd-accent">{code.code}</span>
                          <span className="text-gray-300 truncate">{code.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowHistory(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
