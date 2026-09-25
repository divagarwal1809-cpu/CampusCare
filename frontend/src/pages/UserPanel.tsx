import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, MapPin, Users, AlertTriangle, CheckCircle2,
  Clock, Send, ChevronRight, Eye, Activity, Sparkles,
  FileText, ArrowRight, Star, Info
} from 'lucide-react';
import { PriorityBadge, PriorityDial } from '../components/PriorityBadge';
import { PriorityLevel, Incident } from '../types';

interface UserPanelProps {
  incidents: Incident[];
  onSubmitIncident: (data: any) => Promise<void>;
}

// Priority level from score
function scoreToLevel(score: number): PriorityLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

// Category icons and colors
const CATEGORY_META: Record<string, { icon: string; color: string; desc: string }> = {
  Medical: { icon: '🏥', color: 'from-rose-50 to-white border-rose-300 text-rose-900', desc: 'Injury, illness, unconscious person' },
  Fire: { icon: '🔥', color: 'from-amber-50 to-white border-amber-300 text-amber-900', desc: 'Fire, smoke, thermal hazard' },
  Security: { icon: '🔒', color: 'from-blue-50 to-white border-blue-300 text-blue-900', desc: 'Theft, threat, unauthorized access' },
  Technical: { icon: '⚡', color: 'from-sky-50 to-white border-sky-300 text-sky-900', desc: 'Power failure, elevator, equipment' },
  Hazmat: { icon: '☢️', color: 'from-purple-50 to-white border-purple-300 text-purple-900', desc: 'Chemical spill, gas leak, biohazard' },
  General: { icon: '📋', color: 'from-slate-50 to-white border-slate-300 text-slate-900', desc: 'Other campus concern' },
};

const CAMPUS_LOCATIONS = [
  { name: 'Science Quad - Chemistry Wing', building: 'Science Complex Block A', lat: 12.9722, lng: 77.5938 },
  { name: 'Block C Engineering Lab', building: 'Block C Engineering', lat: 12.9708, lng: 77.5932 },
  { name: 'North Hostel Gate', building: 'North Gate Portal', lat: 12.9714, lng: 77.5962 },
  { name: 'Main Library 2nd Floor', building: 'Central Library', lat: 12.9730, lng: 77.5952 },
  { name: 'Student Activity Center (Gym)', building: 'Sports Pavilion', lat: 12.9719, lng: 77.5947 },
  { name: 'Hostel Zone B Dormitory', building: 'Hostel Block B', lat: 12.9740, lng: 77.5965 },
  { name: 'Central Dining Hall', building: 'Dining Complex', lat: 12.9695, lng: 77.5945 },
  { name: 'Block E Tech Substation', building: 'Block E Tech Park', lat: 12.9734, lng: 77.5928 },
];

export const UserPanel: React.FC<UserPanelProps> = ({ incidents, onSubmitIncident }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');

  // Form state
  const [category, setCategory] = useState<string>('Medical');
  const [severity, setSeverity] = useState(2);
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [locationName, setLocationName] = useState(CAMPUS_LOCATIONS[0].name);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // Live auto-triage estimate
  const liveTriage = useMemo(() => {
    const sevScore = severity * 20.0;
    let peopleScore = 10.0;
    if (peopleAffected === 1) peopleScore = 30.0;
    else if (peopleAffected <= 5) peopleScore = 55.0;
    else if (peopleAffected <= 15) peopleScore = 80.0;
    else peopleScore = 100.0;

    const catScores: Record<string, number> = { Fire: 100, Hazmat: 95, Medical: 85, Security: 80, Technical: 55, General: 40 };
    const catScore = catScores[category] ?? 50;

    let locScore = 50.0;
    if (locationName.includes('Science') || locationName.includes('Lab')) locScore = 90.0;
    else if (locationName.includes('Hostel')) locScore = 85.0;
    else if (locationName.includes('Library')) locScore = 75.0;

    const timeScore = (category === 'Fire' || category === 'Medical') ? 75.0 : 40.0;
    const escScore = severity >= 4 ? 40.0 : 10.0;

    const total = sevScore * 0.30 + peopleScore * 0.20 + catScore * 0.20 + locScore * 0.10 + timeScore * 0.10 + escScore * 0.10;
    const score = Math.round(Math.min(100, Math.max(0, total)) * 10) / 10;
    const level = scoreToLevel(score);
    const scale10 = Math.max(1, Math.min(10, Math.round(score / 10)));

    let requiredTeam = 'Medical';
    if (category === 'Fire' || category === 'Hazmat') requiredTeam = 'Fire';
    else if (category === 'Security') requiredTeam = 'Security';
    else if (category === 'Technical') requiredTeam = 'Technical';

    const etaMap: Record<string, number> = { CRITICAL: 3, HIGH: 5, MEDIUM: 10, LOW: 15 };
    const eta = etaMap[level];

    return { score, level, scale10, requiredTeam, eta };
  }, [category, severity, peopleAffected, locationName]);

  // Recent incidents by the user
  const recentReports = incidents.slice(0, 5);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const loc = CAMPUS_LOCATIONS.find(l => l.name === locationName) || CAMPUS_LOCATIONS[0];
    try {
      await onSubmitIncident({
        title,
        description,
        category,
        severity,
        people_affected: peopleAffected,
        location_name: locationName,
        building: loc.building,
        floor: '1st Floor',
        latitude: loc.lat,
        longitude: loc.lng,
        reporter_name: reporterName || 'Campus User',
        reporter_contact: reporterContact || 'N/A',
      });
      const code = `INC-${String(Math.floor(1000 + Math.random() * 9000))}`;
      setSubmittedCode(code);
      setSubmitted(true);
      setStep(3);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setCategory('Medical');
    setSeverity(2);
    setPeopleAffected(1);
    setLocationName(CAMPUS_LOCATIONS[0].name);
    setTitle('');
    setDescription('');
    setReporterName('');
    setReporterContact('');
    setSubmitted(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-8 page-enter">
      {/* Welcome Hero Tile */}
      <div className="bento-card p-6 lg:p-8 bg-gradient-to-r from-white via-sky-50/50 to-indigo-50/30 border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 status-dot-live" />
            CampusCare — Student & Staff Portal
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Report a Campus Incident
        </h1>
        <p className="text-slate-600 max-w-xl leading-relaxed text-sm">
          Submit an emergency or hazard report. Our automated decision-support engine instantly calculates priority, assigns the nearest responder unit, and keeps you updated.
        </p>

        {/* Quick stats row */}
        <div className="flex flex-wrap gap-4 mt-6">
          {[
            { label: 'Average Response Time', value: '< 5 min', icon: Clock },
            { label: 'Active Incidents', value: String(incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length), icon: Activity },
            { label: 'Field Units Ready', value: '7', icon: ShieldAlert },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
              <Icon className="w-4 h-4 text-sky-600" />
              <div>
                <div className="text-lg font-black text-slate-900 font-mono">{value}</div>
                <div className="text-[11px] text-slate-500 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Report Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step Indicator */}
          {!submitted && (
            <div className="flex items-center gap-3">
              {[
                { num: 1, label: 'Incident Type' },
                { num: 2, label: 'Details & Location' },
              ].map((s, i) => (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => { if (s.num < step || (s.num === 2 && category && severity)) setStep(s.num as 1 | 2); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                      step === s.num
                        ? 'bg-slate-900 text-white shadow-sm'
                        : step > s.num
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] bg-white/20">
                      {step > s.num ? '✓' : s.num}
                    </span>
                    {s.label}
                  </button>
                  {i < 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Success State */}
          {step === 3 && submitted && (
            <div className="bento-card p-8 text-center space-y-5 bg-gradient-to-b from-emerald-50/50 to-white border-emerald-200 modal-enter">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">Incident Dispatched Successfully</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">Your report has been auto-triaged by CampusCare EOC. Responders are notified and en route.</p>
              </div>
              <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-6 py-3 shadow-xs">
                <span className="text-slate-500 text-xs font-semibold">Incident Code:</span>
                <span className="font-mono font-black text-sky-700 text-lg">{submittedCode}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                  <div className="font-black text-slate-900 text-lg">{liveTriage.scale10}<span className="text-slate-400 text-xs">/10</span></div>
                  <div className="text-slate-500 font-medium">Priority</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                  <div className="font-black text-slate-900 text-lg">{liveTriage.eta}<span className="text-slate-400 text-xs">min</span></div>
                  <div className="text-slate-500 font-medium">Response ETA</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                  <div className="font-black text-sky-700 text-sm">{liveTriage.requiredTeam}</div>
                  <div className="text-slate-500 font-medium">Team Dispatched</div>
                </div>
              </div>
              <button onClick={resetForm} className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm mx-auto flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Report Another Incident
              </button>
            </div>
          )}

          {/* Step 1: Category + Severity */}
          {step === 1 && !submitted && (
            <div className="space-y-5 slide-up">
              <div className="bento-card p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-sky-600" />
                  What category best matches this incident?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 shadow-xs ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-600 flex items-center justify-center text-[9px] font-black text-white">✓</span>
                        )}
                        <div className="text-2xl mb-2">{meta.icon}</div>
                        <div className="text-xs font-bold text-slate-900">{cat}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{meta.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bento-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Estimated Urgency / Severity
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                    severity >= 5 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    severity >= 4 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    severity >= 3 ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {severity === 1 ? '1 — Minor Hazard' : severity === 2 ? '2 — Moderate' : severity === 3 ? '3 — Significant' : severity === 4 ? '4 — Serious Hazard' : '5 — Life-Threatening'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => setSeverity(v)}
                      className={`flex-1 h-12 rounded-xl font-extrabold text-base transition-all duration-200 ${
                        v <= severity
                          ? v >= 5 ? 'bg-rose-600 text-white shadow-sm'
                          : v >= 4 ? 'bg-amber-500 text-white shadow-sm'
                          : v >= 3 ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1 font-medium">
                  <span>Minor Concern</span>
                  <span>Immediate Life Threat</span>
                </div>
              </div>

              <div className="bento-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    How many people are affected?
                  </h3>
                  <span className="font-black text-sky-700 font-mono text-base">{peopleAffected} people</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={peopleAffected}
                  onChange={e => setPeopleAffected(Number(e.target.value))}
                  className="w-full accent-sky-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>0</span><span>10</span><span>25</span><span>50+</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
              >
                <span>Continue to Location & Description</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Details form */}
          {step === 2 && !submitted && (
            <div className="space-y-5 slide-up">
              <div className="bento-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Select Campus Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAMPUS_LOCATIONS.map(loc => {
                    const isSelected = locationName === loc.name;
                    return (
                      <button
                        key={loc.name}
                        onClick={() => setLocationName(loc.name)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-900 ring-1 ring-sky-300 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-slate-900">{loc.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{loc.building}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bento-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Describe the Incident
                </h3>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Brief Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chemical fume alert near Block C Chemistry Lab"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what you see: symptoms, smoke, hazards, injuries, number of people needing assistance..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 resize-none transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="bento-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Your Contact Info (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input type="text" placeholder="e.g. Alex Morgan" value={reporterName}
                      onChange={e => setReporterName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone or Extension</label>
                    <input type="text" placeholder="e.g. +91 98765 43210" value={reporterContact}
                      onChange={e => setReporterContact(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition shadow-xs">
                  ← Back to Type
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !description.trim() || submitting}
                  className="flex-2 py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : <Send className="w-4 h-4 text-sky-400" />}
                  Submit & Trigger Auto-Triage
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview + Active Incidents */}
        <div className="space-y-4">
          {/* Live Triage Preview Box */}
          {!submitted && (
            <div className="bento-card p-5 space-y-4 bg-gradient-to-br from-white to-sky-50/40 border-sky-200 slide-up">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-extrabold text-sky-900 uppercase tracking-wider">Live Auto-Triage Engine</span>
              </div>

              {/* Priority Dial - prominent 1-10 */}
              <div className="flex items-center gap-4">
                <PriorityDial scale10={liveTriage.scale10} level={liveTriage.level} size="xl" />
                <div>
                  <div className="text-2xl font-black text-slate-900 font-mono">{liveTriage.score}<span className="text-slate-400 text-sm">/100</span></div>
                  <PriorityBadge level={liveTriage.level} size="sm" />
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Estimated Urgency</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Required Team</span>
                  <span className="text-sky-800 font-bold">{liveTriage.requiredTeam}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Estimated Response ETA</span>
                  <span className="text-emerald-700 font-bold">{liveTriage.eta} min</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="text-slate-900 font-bold">{CATEGORY_META[category]?.icon} {category}</span>
                </div>
              </div>

              {/* Priority Scale visual bar */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-medium">
                  <span>1 — Low</span><span>10 — Critical</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      liveTriage.level === 'CRITICAL' ? 'bg-gradient-to-r from-amber-500 to-rose-600' :
                      liveTriage.level === 'HIGH' ? 'bg-gradient-to-r from-sky-500 to-amber-500' :
                      liveTriage.level === 'MEDIUM' ? 'bg-gradient-to-r from-emerald-500 to-sky-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${(liveTriage.scale10 / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Incidents Feed Box */}
          <div className="bento-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Campus Feed</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">{recentReports.length} active</span>
            </div>
            {recentReports.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No active incidents</div>
            ) : (
              <div className="space-y-2">
                {recentReports.map(inc => (
                  <div key={inc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-sky-700 font-bold">{inc.code}</span>
                      <PriorityBadge level={inc.priority_level} scale10={inc.priority_scale_10} size="sm" />
                    </div>
                    <div className="text-xs text-slate-900 font-bold truncate">{inc.title}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{inc.location_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contacts Box */}
          <div className="bento-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Campus Emergency Hotlines</span>
            </div>
            {[
              { label: 'Campus Security Desk', value: '100', color: 'text-amber-600' },
              { label: 'Medical Emergency Core', value: '108', color: 'text-rose-600' },
              { label: 'Fire & Safety Officer', value: '101', color: 'text-orange-600' },
              { label: 'EOC Dispatch Hotline', value: 'ext-4400', color: 'text-sky-600' },
            ].map(c => (
              <div key={c.label} className="flex justify-between items-center py-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">{c.label}</span>
                <span className={`font-mono font-black text-sm ${c.color}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
