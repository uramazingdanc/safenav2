export type Language = 'en' | 'fil' | 'ceb';

export interface TranslationKeys {
  // Common
  appName: string;
  loading: string;
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  view: string;
  close: string;
  search: string;
  filter: string;
  export: string;
  
  // Navigation
  dashboard: string;
  home: string;
  map: string;
  safetyMap: string;
  profile: string;
  settings: string;
  help: string;
  hotlines: string;
  logout: string;
  
  // Admin Navigation
  manageUsers: string;
  manageHazards: string;
  evacCenters: string;
  reports: string;
  liveMap: string;
  commandCenter: string;
  
  // Dashboard Stats
  totalUsers: string;
  totalHazards: string;
  activeAlerts: string;
  pendingReports: string;
  
  // Actions
  addHazard: string;
  addEvacCenter: string;
  reportHazard: string;
  findRoute: string;
  viewAll: string;
  approve: string;
  reject: string;
  verify: string;
  
  // Notifications
  notifications: string;
  unread: string;
  markAllRead: string;
  noNotifications: string;
  critical: string;
  highPriority: string;
  sosAlert: string;
  newHazardReport: string;
  verificationRequest: string;
  
  // User Verification
  getVerified: string;
  uploadId: string;
  verificationPending: string;
  verificationApproved: string;
  verificationRejected: string;
  verifiedGuardian: string;
  submitForReview: string;
  
  // Hazard Types
  flood: string;
  fire: string;
  landslide: string;
  earthquake: string;
  typhoon: string;
  accident: string;
  
  // Status
  active: string;
  resolved: string;
  pending: string;
  verified: string;
  rejected: string;
  open: string;
  closed: string;
  full: string;
  standby: string;
  
  // Severity
  low: string;
  medium: string;
  high: string;
  
  // Weather
  weather: string;
  temperature: string;
  humidity: string;
  windSpeed: string;
  
  // Emergency
  emergencyHotlines: string;
  callNow: string;
  
  // Forms
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  barangay: string;
  location: string;
  description: string;
  
  // Auth
  signIn: string;
  signUp: string;
  signOut: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  termsAndConditions: string;
  
  // Messages
  welcomeBack: string;
  stayAlert: string;
  yourBarangay: string;
  quickActions: string;
  recentAlerts: string;
  
  // Language
  language: string;
  english: string;
  tagalog: string;
  cebuano: string;
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    // Common
    appName: 'SafeNav',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Navigation
    dashboard: 'Dashboard',
    home: 'Home',
    map: 'Map',
    safetyMap: 'Safety Map',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    hotlines: 'Hotlines',
    logout: 'Logout',
    
    // Admin Navigation
    manageUsers: 'Manage Users',
    manageHazards: 'Manage Hazards',
    evacCenters: 'Evacuation Centers',
    reports: 'Reports',
    liveMap: 'Live Map',
    commandCenter: 'Command Center',
    
    // Dashboard Stats
    totalUsers: 'Total Users',
    totalHazards: 'Total Hazards',
    activeAlerts: 'Active Alerts',
    pendingReports: 'Pending Reports',
    
    // Actions
    addHazard: 'Add Hazard',
    addEvacCenter: 'Add Evac Center',
    reportHazard: 'Report Hazard',
    findRoute: 'Find Route',
    viewAll: 'View All',
    approve: 'Approve',
    reject: 'Reject',
    verify: 'Verify',
    
    // Notifications
    notifications: 'Notifications',
    unread: 'unread',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications yet',
    critical: 'Critical',
    highPriority: 'High Priority',
    sosAlert: 'SOS Alert Received!',
    newHazardReport: 'New Hazard Report',
    verificationRequest: 'Verification Request',
    
    // User Verification
    getVerified: 'Get Verified',
    uploadId: 'Upload Government ID',
    verificationPending: 'Verification in Progress',
    verificationApproved: 'Verification Approved',
    verificationRejected: 'Verification Rejected',
    verifiedGuardian: 'Verified Guardian',
    submitForReview: 'Submit for Review',
    
    // Hazard Types
    flood: 'Flood',
    fire: 'Fire',
    landslide: 'Landslide',
    earthquake: 'Earthquake',
    typhoon: 'Typhoon',
    accident: 'Accident',
    
    // Status
    active: 'Active',
    resolved: 'Resolved',
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    open: 'Open',
    closed: 'Closed',
    full: 'Full',
    standby: 'Standby',
    
    // Severity
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Weather
    weather: 'Weather',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    
    // Emergency
    emergencyHotlines: 'Emergency Hotlines',
    callNow: 'Call Now',
    
    // Forms
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    phoneNumber: 'Phone Number',
    barangay: 'Barangay',
    location: 'Location',
    description: 'Description',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    termsAndConditions: 'Terms and Conditions',
    
    // Messages
    welcomeBack: 'Welcome back',
    stayAlert: 'Stay alert, stay safe',
    yourBarangay: 'Your Barangay',
    quickActions: 'Quick Actions',
    recentAlerts: 'Recent Alerts',
    
    // Language
    language: 'Language',
    english: 'English',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
  
  fil: {
    // Common
    appName: 'SafeNav',
    loading: 'Naglo-load...',
    save: 'I-save',
    cancel: 'Kanselahin',
    confirm: 'Kumpirmahin',
    delete: 'Tanggalin',
    edit: 'I-edit',
    view: 'Tingnan',
    close: 'Isara',
    search: 'Maghanap',
    filter: 'Salain',
    export: 'I-export',
    
    // Navigation
    dashboard: 'Dashboard',
    home: 'Tahanan',
    map: 'Mapa',
    safetyMap: 'Mapa ng Kaligtasan',
    profile: 'Profile',
    settings: 'Mga Setting',
    help: 'Tulong',
    hotlines: 'Mga Hotline',
    logout: 'Mag-logout',
    
    // Admin Navigation
    manageUsers: 'Pamahalaan ang mga User',
    manageHazards: 'Pamahalaan ang mga Panganib',
    evacCenters: 'Mga Evacuation Center',
    reports: 'Mga Ulat',
    liveMap: 'Live na Mapa',
    commandCenter: 'Command Center',
    
    // Dashboard Stats
    totalUsers: 'Kabuuang User',
    totalHazards: 'Kabuuang Panganib',
    activeAlerts: 'Mga Aktibong Alerto',
    pendingReports: 'Mga Nakabinbing Ulat',
    
    // Actions
    addHazard: 'Magdagdag ng Panganib',
    addEvacCenter: 'Magdagdag ng Evac Center',
    reportHazard: 'Mag-ulat ng Panganib',
    findRoute: 'Maghanap ng Ruta',
    viewAll: 'Tingnan Lahat',
    approve: 'Aprubahan',
    reject: 'Tanggihan',
    verify: 'I-verify',
    
    // Notifications
    notifications: 'Mga Abiso',
    unread: 'hindi nabasa',
    markAllRead: 'Markahan lahat bilang nabasa',
    noNotifications: 'Wala pang mga abiso',
    critical: 'Kritikal',
    highPriority: 'Mataas na Priyoridad',
    sosAlert: 'Nakatanggap ng SOS Alert!',
    newHazardReport: 'Bagong Ulat ng Panganib',
    verificationRequest: 'Kahilingan sa Beripikasyon',
    
    // User Verification
    getVerified: 'Magpa-verify',
    uploadId: 'I-upload ang Government ID',
    verificationPending: 'Isinasagawa ang Beripikasyon',
    verificationApproved: 'Naaprubahan ang Beripikasyon',
    verificationRejected: 'Tinanggihan ang Beripikasyon',
    verifiedGuardian: 'Verified na Guardian',
    submitForReview: 'Isumite para sa Pagsusuri',
    
    // Hazard Types
    flood: 'Baha',
    fire: 'Sunog',
    landslide: 'Pagguho ng Lupa',
    earthquake: 'Lindol',
    typhoon: 'Bagyo',
    accident: 'Aksidente',
    
    // Status
    active: 'Aktibo',
    resolved: 'Nalutas',
    pending: 'Nakabinbin',
    verified: 'Na-verify',
    rejected: 'Tinanggihan',
    open: 'Bukas',
    closed: 'Sarado',
    full: 'Puno',
    standby: 'Standby',
    
    // Severity
    low: 'Mababa',
    medium: 'Katamtaman',
    high: 'Mataas',
    
    // Weather
    weather: 'Panahon',
    temperature: 'Temperatura',
    humidity: 'Halumigmig',
    windSpeed: 'Bilis ng Hangin',
    
    // Emergency
    emergencyHotlines: 'Mga Emergency Hotline',
    callNow: 'Tumawag Ngayon',
    
    // Forms
    fullName: 'Buong Pangalan',
    email: 'Email',
    password: 'Password',
    phoneNumber: 'Numero ng Telepono',
    barangay: 'Barangay',
    location: 'Lokasyon',
    description: 'Paglalarawan',
    
    // Auth
    signIn: 'Mag-sign In',
    signUp: 'Mag-sign Up',
    signOut: 'Mag-sign Out',
    createAccount: 'Gumawa ng Account',
    alreadyHaveAccount: 'Mayroon ka nang account?',
    dontHaveAccount: 'Wala ka pang account?',
    termsAndConditions: 'Mga Tuntunin at Kundisyon',
    
    // Messages
    welcomeBack: 'Maligayang pagbabalik',
    stayAlert: 'Maging alerto, manatiling ligtas',
    yourBarangay: 'Ang Iyong Barangay',
    quickActions: 'Mabilis na Aksyon',
    recentAlerts: 'Mga Kamakailang Alerto',
    
    // Language
    language: 'Wika',
    english: 'Ingles',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
  
  ceb: {
    // Common
    appName: 'SafeNav',
    loading: 'Nagkarga...',
    save: 'I-save',
    cancel: 'Kanselahon',
    confirm: 'Kumpirmahon',
    delete: 'Tangtangon',
    edit: 'Usbon',
    view: 'Tan-awon',
    close: 'Isira',
    search: 'Pangita',
    filter: 'Salahon',
    export: 'I-export',
    
    // Navigation
    dashboard: 'Dashboard sa Admin',
    home: 'Panimalay',
    map: 'Mapa',
    safetyMap: 'Mapa sa Kaluwasan',
    profile: 'Profile',
    settings: 'Mga Setting',
    help: 'Tabang',
    hotlines: 'Mga Hotline',
    logout: 'Paggawas',
    
    // Admin Navigation
    manageUsers: 'Pagdumala sa mga Gumagamit',
    manageHazards: 'Pagdumala sa mga Katalagman',
    evacCenters: 'Mga Evacuation Center',
    reports: 'Mga Taho',
    liveMap: 'Live nga Mapa',
    commandCenter: 'Command Center',
    
    // Dashboard Stats
    totalUsers: 'Kinatibuk-ang Gumagamit',
    totalHazards: 'Kinatibuk-ang Katalagman',
    activeAlerts: 'Mga Aktibo nga Alerto',
    pendingReports: 'Mga Naghulat nga Taho',
    
    // Actions
    addHazard: 'Idugang og Katalagman',
    addEvacCenter: 'Idugang og Evac Center',
    reportHazard: 'Itaho ang Katalagman',
    findRoute: 'Pangita og Ruta',
    viewAll: 'Tan-awa Tanan',
    approve: 'Aprubahan',
    reject: 'Balibaran',
    verify: 'I-verify',
    
    // Notifications
    notifications: 'Mga Pahibalo',
    unread: 'wala mabasa',
    markAllRead: 'Markahi tanan nga nabasa',
    noNotifications: 'Walay mga pahibalo pa',
    critical: 'Kritikal',
    highPriority: 'Taas nga Prayoridad',
    sosAlert: 'Nakadawat og SOS Alert!',
    newHazardReport: 'Bag-ong Taho sa Katalagman',
    verificationRequest: 'Hangyo sa Beripikasyon',
    
    // User Verification
    getVerified: 'Pagpa-verify',
    uploadId: 'I-upload ang Government ID',
    verificationPending: 'Nagpadayon ang Beripikasyon',
    verificationApproved: 'Giaprubahan ang Beripikasyon',
    verificationRejected: 'Gisalikway ang Beripikasyon',
    verifiedGuardian: 'Verified nga Guardian',
    submitForReview: 'Isumite para sa Pagsusi',
    
    // Hazard Types
    flood: 'Baha',
    fire: 'Sunog',
    landslide: 'Pagdahili sa Yuta',
    earthquake: 'Linog',
    typhoon: 'Bagyo',
    accident: 'Aksidente',
    
    // Status
    active: 'Aktibo',
    resolved: 'Nasulbad',
    pending: 'Naghulat',
    verified: 'Na-verify',
    rejected: 'Gisalikway',
    open: 'Bukas',
    closed: 'Sirado',
    full: 'Puno',
    standby: 'Standby',
    
    // Severity
    low: 'Ubos',
    medium: 'Kasarangan',
    high: 'Taas',
    
    // Weather
    weather: 'Panahon',
    temperature: 'Temperatura',
    humidity: 'Kahalumigmig',
    windSpeed: 'Kusog sa Hangin',
    
    // Emergency
    emergencyHotlines: 'Mga Emergency Hotline',
    callNow: 'Tawagi Karon',
    
    // Forms
    fullName: 'Tibuok nga Ngalan',
    email: 'Email',
    password: 'Password',
    phoneNumber: 'Numero sa Telepono',
    barangay: 'Barangay',
    location: 'Lokasyon',
    description: 'Paghulagway',
    
    // Auth
    signIn: 'Pag-sign In',
    signUp: 'Pag-sign Up',
    signOut: 'Pag-sign Out',
    createAccount: 'Paghimo og Account',
    alreadyHaveAccount: 'Aduna ka nay account?',
    dontHaveAccount: 'Wala pa kay account?',
    termsAndConditions: 'Mga Termino ug Kondisyon',
    
    // Messages
    welcomeBack: 'Maayong pagbalik',
    stayAlert: 'Magbantay, magpabilin nga luwas',
    yourBarangay: 'Imong Barangay',
    quickActions: 'Dali nga Aksyon',
    recentAlerts: 'Bag-ong mga Alerto',
    
    // Language
    language: 'Pinulongan',
    english: 'Iningles',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
};
