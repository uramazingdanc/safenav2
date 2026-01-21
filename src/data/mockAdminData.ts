// Mock data provider for Admin dashboard
// Provides realistic fallback data when database is empty or loading

export interface MockUser {
  id: string;
  full_name: string;
  email: string;
  barangay: string;
  phone_number: string;
  status: 'verified' | 'unverified';
  created_at: string;
  role: 'user' | 'admin' | 'moderator';
}

export interface MockReport {
  id: string;
  hazard_type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'rejected';
  photo_url: string | null;
  reporter_name: string;
  reporter_barangay: string;
  ai_confidence: number;
  created_at: string;
  latitude: number;
  longitude: number;
}

export interface MockHazard {
  id: string;
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MockEvacCenter {
  id: string;
  name: string;
  location: string;
  capacity: number;
  current_occupancy: number;
  status: 'active' | 'standby' | 'full';
  latitude: number;
  longitude: number;
  amenities: string[];
  contact_number: string;
}

const BARANGAYS = [
  'Agpangi', 'Anislagan', 'Atipolo', 'Calumpang', 'Capiñahan',
  'Caraycaray', 'Catmon', 'Haguikhikan', 'Padre Inocentes García (Pob.)',
  'Libertad', 'Lico', 'Lucsoon', 'Mabini', 'San Pablo', 'Santo Niño',
  'Santissimo Rosario Pob.', 'Talustusan', 'Villa Caneja', 'Villa Consuelo',
  'Borac', 'Cabungaan', 'Imelda', 'Larrazabal', 'Libtong', 'Padre Sergio Eamiguel', 'Sabang'
];

const FIRST_NAMES = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Rosa', 'Miguel', 'Elena', 'Carlos', 'Sofia', 'Fernando', 'Carmen', 'Ricardo', 'Lucia', 'Antonio'];
const LAST_NAMES = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres', 'Ramos', 'Bautista', 'Villanueva', 'Cruz', 'Flores', 'Gonzales', 'Lopez', 'Martinez', 'Rodriguez'];

const HAZARD_TYPES = ['Flood', 'Landslide', 'Fire', 'Road Accident', 'Fallen Tree', 'Power Line Down', 'Building Collapse', 'Storm Surge'];

// Generate realistic mock users
export const MOCK_USERS: MockUser[] = Array.from({ length: 15 }, (_, i) => {
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[i % LAST_NAMES.length];
  const barangay = BARANGAYS[i % BARANGAYS.length];
  
  return {
    id: `mock-user-${i + 1}`,
    full_name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@email.com`,
    barangay,
    phone_number: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
    status: Math.random() > 0.3 ? 'verified' : 'unverified',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    role: 'user',
  };
});

// Generate realistic mock reports
export const MOCK_REPORTS: MockReport[] = Array.from({ length: 10 }, (_, i) => {
  const hazardType = HAZARD_TYPES[i % HAZARD_TYPES.length];
  const barangay = BARANGAYS[i % BARANGAYS.length];
  const reporter = MOCK_USERS[i % MOCK_USERS.length];
  const severities: MockReport['severity'][] = ['low', 'medium', 'high', 'critical'];
  
  return {
    id: `mock-report-${i + 1}`,
    hazard_type: hazardType,
    location: `Near ${barangay} Barangay Hall, Naval, Biliran`,
    description: `${hazardType} observed in the area. Immediate attention needed. Residents have been notified.`,
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: i < 6 ? 'pending' : (i < 8 ? 'verified' : 'rejected'),
    photo_url: null, // placeholder
    reporter_name: reporter.full_name,
    reporter_barangay: reporter.barangay,
    ai_confidence: Math.floor(70 + Math.random() * 30),
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    latitude: 11.5601 + (Math.random() - 0.5) * 0.05,
    longitude: 124.3949 + (Math.random() - 0.5) * 0.05,
  };
});

// Generate mock hazards for map
export const MOCK_HAZARDS: MockHazard[] = [
  {
    id: 'mock-hazard-1',
    type: 'Flood',
    location: 'Brgy. Caraycaray, Naval',
    description: 'Flash flood affecting low-lying areas',
    severity: 'high',
    status: 'active',
    latitude: 11.5650,
    longitude: 124.3920,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-hazard-2',
    type: 'Landslide',
    location: 'Brgy. Atipolo, Naval',
    description: 'Road blocked due to landslide',
    severity: 'critical',
    status: 'active',
    latitude: 11.5580,
    longitude: 124.4010,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-hazard-3',
    type: 'Fallen Tree',
    location: 'Brgy. Libertad, Naval',
    description: 'Large tree blocking main road',
    severity: 'medium',
    status: 'active',
    latitude: 11.5520,
    longitude: 124.3880,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

// Generate mock evacuation centers
export const MOCK_EVAC_CENTERS: MockEvacCenter[] = [
  {
    id: 'mock-evac-1',
    name: 'Naval National High School',
    location: 'Brgy. Padre Inocentes García, Naval',
    capacity: 500,
    current_occupancy: 120,
    status: 'active',
    latitude: 11.5601,
    longitude: 124.3949,
    amenities: ['Water', 'Electricity', 'Medical Kit', 'Kitchen'],
    contact_number: '0531-234-5678',
  },
  {
    id: 'mock-evac-2',
    name: 'Naval Municipal Gym',
    location: 'Brgy. Santissimo Rosario, Naval',
    capacity: 300,
    current_occupancy: 0,
    status: 'standby',
    latitude: 11.5620,
    longitude: 124.3960,
    amenities: ['Water', 'Electricity', 'Restrooms'],
    contact_number: '0531-234-5679',
  },
  {
    id: 'mock-evac-3',
    name: 'Caraycaray Elementary School',
    location: 'Brgy. Caraycaray, Naval',
    capacity: 200,
    current_occupancy: 180,
    status: 'active',
    latitude: 11.5670,
    longitude: 124.3910,
    amenities: ['Water', 'Kitchen', 'First Aid'],
    contact_number: '0531-234-5680',
  },
];

// Helper to get severity color classes
export const getSeverityColors = (severity: string) => {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500', dot: 'bg-rose-500 animate-pulse' };
    case 'high':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500', dot: 'bg-orange-500' };
    case 'medium':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500', dot: 'bg-yellow-500' };
    default:
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500', dot: 'bg-emerald-500' };
  }
};

// Helper to get status color classes
export const getStatusColors = (status: string) => {
  switch (status) {
    case 'verified':
    case 'active':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
    case 'pending':
    case 'standby':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
    case 'rejected':
    case 'resolved':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' };
    case 'full':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' };
  }
};
