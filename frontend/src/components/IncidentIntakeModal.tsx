import React, { useState, useMemo } from 'react';
import { X, Send, ShieldAlert, AlertCircle, Sparkles, MapPin, Users, Activity } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { PriorityLevel } from '../types';

interface IncidentIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const IncidentIntakeModal: React.FC<IncidentIntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmitIncident,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Medical' | 'Fire' | 'Security' | 'Technical' | 'Hazmat'>('Medical');
  const [severity, setSeverity] = useState(3);
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [locationName, setLocationName] = useState('Science Quad - Chemistry Wing');
  const [building, setBuilding] = useState('Block C Science');
  const [floor, setFloor] = useState('1st Floor');
  const [reporterName, setReporterName] = useState('Campus Security Dispatcher');
  const [reporterContact, setReporterContact] = useState('ext-4401');

  const campusLocations = [
    { name: 'Science Quad - Chemistry Wing', building: 'Science Complex Block A', lat: 12.9722, lng: 77.5938 },
    { name: 'Block C Engineering Lab', building: 'Block C Engineering', lat: 12.9708, lng: 77.5932 },
    { name: 'North Hostel Gate', building: 'North Gate Portal', lat: 12.9714, lng: 77.5962 },
    { name: 'Main Library 2nd Floor', building: 'Central Library', lat: 12.9730, lng: 77.5952 },
    { name: 'Student Activity Center (Gym)', building: 'Sports Pavilion', lat: 12.9719, lng: 77.5947 },
    { name: 'Hostel Zone B Dormitory', building: 'Hostel Block B', lat: 12.9740, lng: 77.5965 },
    { name: 'Central Dining Hall', building: 'Dining Complex', lat: 12.9695, lng: 77.5945 },
    { name: 'Block E Tech Substation', building: 'Block E Tech Park', lat: 12.9734, lng: 77.5928 }
  ];

  // Live Automatic Triage Calculation Preview
  const liveTriage = useMemo(() => {
    // 1. Severity 30%
    const sevScore = severity * 20.0;
    // 2. People affected 20%
    let peopleScore = 10.0;
    if (peopleAffected === 1) peopleScore = 30.0;
    else if (peopleAffected <= 5) peopleScore = 55.0;
    else if (peopleAffected <= 15) peopleScore = 80.0;
    else if (peopleAffected > 15) peopleScore = 100.0;

    // 3. Category 20%
    const catScores: Record<string, number> = {
      Fire: 100, Hazmat: 95, Medical: 85, Security: 80, Technical: 55
    };
    const catScore = catScores[category] || 50;

    // 4. Location risk 10%
    let locScore = 50.0;
    if (locationName.includes('Science') || locationName.includes('Lab')) locScore = 90.0;
    else if (locationName.includes('Hostel')) locScore = 85.0;
    else if (locationName.includes('Library')) locScore = 75.0;

    // 5. Time sensitivity 10%
    const timeScore = (category === 'Fire' || category === 'Medical') ? 75.0 : 40.0;

    // 6. Escalation indicators 10%
    const escScore = severity >= 4 ? 40.0 : 10.0;

    const total = (
      sevScore * 0.30 +
      peopleScore * 0.20 +
      catScore * 0.20 +
      locScore * 0.10 +
      timeScore * 0.10 +
      escScore * 0.10
    );
    const score = Math.round(Math.min(100, Math.max(0, total)) * 10) / 10;

    let level: PriorityLevel = 'MEDIUM';
    if (score >= 75) level = 'CRITICAL';
    else if (score >= 50) level = 'HIGH';
    else if (score < 25) level = 'LOW';

    let requiredTeam = 'Medical';
    if (category === 'Fire' || category === 'Hazmat') requiredTeam = 'Fire';
    else if (category === 'Security') requiredTeam = 'Security';
    else if (category === 'Technical') requiredTeam = 'Technical';

    return { score, level, requiredTeam };
  }, [category, severity, peopleAffected, locationName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    const loc = campusLocations.find(l => l.name === locationName) || campusLocations[0];

    const payload = {
      title,
      description,
      category,
      severity,
      people_affected: peopleAffected,
      location_name: locationName,
      building,
      floor,
      latitude: loc.lat,
      longitude: loc.lng,
      reporter_name: reporterName,
      reporter_contact: reporterContact,
    };

    await onSubmitIncident(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-white to-indigo-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Incident Intake & Automated Triage</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Standard EOC Intake
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Data input triggers deterministic priority scoring and responder allocation profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Triage Preview Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-slate-600 font-semibold">Live Auto-Triage:</span>
            <PriorityBadge level={liveTriage.level} score={liveTriage.score} size="sm" />
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
            <span>Required Unit:</span>
            <span className="font-bold text-sky-700">{liveTriage.requiredTeam}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Incident Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Incident Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              >
                <option value="Medical">Medical Emergency</option>
                <option value="Fire">Fire / Smoke / Thermal</option>
                <option value="Security">Security / Perimeter Threat</option>
                <option value="Technical">Technical / Power / Elevator</option>
                <option value="Hazmat">Hazmat / Chemical Leak</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Severity Scale (1 to 5)</span>
                <span className="text-amber-700 font-mono font-bold">Tier {severity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600 mt-2"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Incident Headline / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unresponsive individual near chemistry lab entrance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          {/* Location & People Affected */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campus Location
              </label>
              <select
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value);
                  const loc = campusLocations.find(l => l.name === e.target.value);
                  if (loc) setBuilding(loc.building);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              >
                {campusLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Estimated People Affected</span>
                <span className="text-sky-700 font-mono font-bold">{peopleAffected} people</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              On-Scene Narrative / Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe physical situation, visible symptoms or hazards, trapped persons..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          {/* Reporter details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reporter Identity
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Reporter Contact Ext / Radio
              </label>
              <input
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono shadow-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Submit Incident & Execute Triage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
