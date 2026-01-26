import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fil' | 'ceb';

interface Translations {
  // Common
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  welcomeBack: string;
  createAccount: string;
  orContinueWith: string;
  termsAgree: string;
  termsAndConditions: string;
  helpGuide: string;
  adminAccess: string;
  
  // Navigation
  home: string;
  map: string;
  report: string;
  hotlines: string;
  profile: string;
  
  // Map & Location
  findRoute: string;
  startingPoint: string;
  destination: string;
  useMyLocation: string;
  generateSafeRoute: string;
  hazardWarning: string;
  safeRoute: string;
  
  // Reporting
  reportHazard: string;
  hazardType: string;
  description: string;
  submit: string;
  
  // Hotlines
  emergencyHotlines: string;
  police: string;
  fire: string;
  medical: string;
  disaster: string;
  
  // Admin
  dashboard: string;
  totalUsers: string;
  totalHazards: string;
  addHazard: string;
  addEvacCenter: string;
  systemGuide: string;
  manageUsers: string;
  viewReports: string;
  commandCenter: string;
  liveMap: string;
  evacCenters: string;
  reports: string;
  
  // Status
  loading: string;
  success: string;
  error: string;
  cancel: string;
  save: string;
  close: string;
  
  // Actions
  approve: string;
  reject: string;
  verify: string;
  viewAll: string;
  edit: string;
  delete: string;
  search: string;
  filter: string;
  export: string;
  
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
  landslide: string;
  earthquake: string;
  typhoon: string;
  accident: string;
  
  // Hazard Status
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
  
  // Forms
  fullName: string;
  phoneNumber: string;
  barangay: string;
  location: string;
  
  // Messages
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

const translations: Record<Language, Translations> = {
  en: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    orContinueWith: 'Or continue with',
    termsAgree: 'I agree to the',
    termsAndConditions: 'Terms and Conditions',
    helpGuide: 'Help / User Guide',
    adminAccess: 'Admin Access',
    
    home: 'Home',
    map: 'Map',
    report: 'Report',
    hotlines: 'Hotlines',
    profile: 'Profile',
    
    findRoute: 'Find Safe Route',
    startingPoint: 'Starting Point',
    destination: 'Destination',
    useMyLocation: 'Use My Location',
    generateSafeRoute: 'Generate Safe Route',
    hazardWarning: 'Warning: Route passes through hazard zone!',
    safeRoute: 'Safe Route Generated',
    
    reportHazard: 'Report Hazard',
    hazardType: 'Hazard Type',
    description: 'Description',
    submit: 'Submit',
    
    emergencyHotlines: 'Emergency Hotlines',
    police: 'Police',
    fire: 'Fire Department',
    medical: 'Medical Emergency',
    disaster: 'Disaster Response',
    
    dashboard: 'Dashboard',
    totalUsers: 'Total Users',
    totalHazards: 'Total Hazards',
    addHazard: 'Add Hazard',
    addEvacCenter: 'Add Evacuation Center',
    systemGuide: 'System Guide',
    manageUsers: 'Manage Users',
    viewReports: 'View Reports',
    commandCenter: 'Command Center',
    liveMap: 'Live Map',
    evacCenters: 'Evacuation Centers',
    reports: 'Reports',
    
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error occurred',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    
    approve: 'Approve',
    reject: 'Reject',
    verify: 'Verify',
    viewAll: 'View All',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    notifications: 'Notifications',
    unread: 'unread',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications yet',
    critical: 'Critical',
    highPriority: 'High Priority',
    sosAlert: 'SOS Alert Received!',
    newHazardReport: 'New Hazard Report',
    verificationRequest: 'Verification Request',
    
    getVerified: 'Get Verified',
    uploadId: 'Upload Government ID',
    verificationPending: 'Verification in Progress',
    verificationApproved: 'Verification Approved',
    verificationRejected: 'Verification Rejected',
    verifiedGuardian: 'Verified Guardian',
    submitForReview: 'Submit for Review',
    
    flood: 'Flood',
    landslide: 'Landslide',
    earthquake: 'Earthquake',
    typhoon: 'Typhoon',
    accident: 'Accident',
    
    active: 'Active',
    resolved: 'Resolved',
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    open: 'Open',
    closed: 'Closed',
    full: 'Full',
    standby: 'Standby',
    
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    weather: 'Weather',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    barangay: 'Barangay',
    location: 'Location',
    
    stayAlert: 'Stay alert, stay safe',
    yourBarangay: 'Your Barangay',
    quickActions: 'Quick Actions',
    recentAlerts: 'Recent Alerts',
    
    language: 'Language',
    english: 'English',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
  fil: {
    signIn: 'Mag-login',
    signUp: 'Mag-sign Up',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Kumpirmahin ang Password',
    forgotPassword: 'Nakalimutan ang Password?',
    welcomeBack: 'Maligayang Pagbabalik',
    createAccount: 'Gumawa ng Account',
    orContinueWith: 'O magpatuloy sa',
    termsAgree: 'Sumasang-ayon ako sa',
    termsAndConditions: 'Mga Tuntunin at Kundisyon',
    helpGuide: 'Tulong / Gabay ng User',
    adminAccess: 'Admin Access',
    
    home: 'Home',
    map: 'Mapa',
    report: 'Mag-ulat',
    hotlines: 'Mga Hotline',
    profile: 'Profile',
    
    findRoute: 'Maghanap ng Ligtas na Ruta',
    startingPoint: 'Panimulang Punto',
    destination: 'Destinasyon',
    useMyLocation: 'Gamitin ang Aking Lokasyon',
    generateSafeRoute: 'Gumawa ng Ligtas na Ruta',
    hazardWarning: 'Babala: Ang ruta ay dumadaan sa hazard zone!',
    safeRoute: 'Ligtas na Ruta ang Nagawa',
    
    reportHazard: 'Mag-ulat ng Panganib',
    hazardType: 'Uri ng Panganib',
    description: 'Paglalarawan',
    submit: 'Isumite',
    
    emergencyHotlines: 'Mga Hotline ng Emergency',
    police: 'Pulis',
    fire: 'Bumbero',
    medical: 'Medikal na Emergency',
    disaster: 'Pagtugon sa Sakuna',
    
    dashboard: 'Dashboard',
    totalUsers: 'Kabuuang mga User',
    totalHazards: 'Kabuuang mga Panganib',
    addHazard: 'Magdagdag ng Panganib',
    addEvacCenter: 'Magdagdag ng Evacuation Center',
    systemGuide: 'Gabay sa Sistema',
    manageUsers: 'Pamahalaan ang mga User',
    viewReports: 'Tingnan ang mga Ulat',
    commandCenter: 'Command Center',
    liveMap: 'Live na Mapa',
    evacCenters: 'Mga Evacuation Center',
    reports: 'Mga Ulat',
    
    loading: 'Naglo-load...',
    success: 'Tagumpay!',
    error: 'May naganap na error',
    cancel: 'Kanselahin',
    save: 'I-save',
    close: 'Isara',
    
    approve: 'Aprubahan',
    reject: 'Tanggihan',
    verify: 'I-verify',
    viewAll: 'Tingnan Lahat',
    edit: 'I-edit',
    delete: 'Tanggalin',
    search: 'Maghanap',
    filter: 'Salain',
    export: 'I-export',
    
    notifications: 'Mga Abiso',
    unread: 'hindi nabasa',
    markAllRead: 'Markahan lahat bilang nabasa',
    noNotifications: 'Wala pang mga abiso',
    critical: 'Kritikal',
    highPriority: 'Mataas na Priyoridad',
    sosAlert: 'Nakatanggap ng SOS Alert!',
    newHazardReport: 'Bagong Ulat ng Panganib',
    verificationRequest: 'Kahilingan sa Beripikasyon',
    
    getVerified: 'Magpa-verify',
    uploadId: 'I-upload ang Government ID',
    verificationPending: 'Isinasagawa ang Beripikasyon',
    verificationApproved: 'Naaprubahan ang Beripikasyon',
    verificationRejected: 'Tinanggihan ang Beripikasyon',
    verifiedGuardian: 'Verified na Guardian',
    submitForReview: 'Isumite para sa Pagsusuri',
    
    flood: 'Baha',
    landslide: 'Pagguho ng Lupa',
    earthquake: 'Lindol',
    typhoon: 'Bagyo',
    accident: 'Aksidente',
    
    active: 'Aktibo',
    resolved: 'Nalutas',
    pending: 'Nakabinbin',
    verified: 'Na-verify',
    rejected: 'Tinanggihan',
    open: 'Bukas',
    closed: 'Sarado',
    full: 'Puno',
    standby: 'Standby',
    
    low: 'Mababa',
    medium: 'Katamtaman',
    high: 'Mataas',
    
    weather: 'Panahon',
    temperature: 'Temperatura',
    humidity: 'Halumigmig',
    windSpeed: 'Bilis ng Hangin',
    
    fullName: 'Buong Pangalan',
    phoneNumber: 'Numero ng Telepono',
    barangay: 'Barangay',
    location: 'Lokasyon',
    
    stayAlert: 'Maging alerto, manatiling ligtas',
    yourBarangay: 'Ang Iyong Barangay',
    quickActions: 'Mabilis na Aksyon',
    recentAlerts: 'Mga Kamakailang Alerto',
    
    language: 'Wika',
    english: 'Ingles',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
  ceb: {
    signIn: 'Mo-sulod',
    signUp: 'Mag-sign Up',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Kumpirmahi ang Password',
    forgotPassword: 'Nakalimtan ang Password?',
    welcomeBack: 'Welcome Balik',
    createAccount: 'Paghimo ug Account',
    orContinueWith: 'O padayon sa',
    termsAgree: 'Mouyon ko sa',
    termsAndConditions: 'Mga Termino ug Kondisyon',
    helpGuide: 'Tabang / Giya sa User',
    adminAccess: 'Admin Access',
    
    home: 'Home',
    map: 'Mapa',
    report: 'I-report',
    hotlines: 'Mga Hotline',
    profile: 'Profile',
    
    findRoute: 'Pangita ug Luwas nga Ruta',
    startingPoint: 'Sinugdanan nga Punto',
    destination: 'Destinasyon',
    useMyLocation: 'Gamita Akong Lokasyon',
    generateSafeRoute: 'Paghimo ug Luwas nga Ruta',
    hazardWarning: 'Pasidaan: Ang ruta moagi sa hazard zone!',
    safeRoute: 'Nahimo na ang Luwas nga Ruta',
    
    reportHazard: 'I-report ang Kakuyaw',
    hazardType: 'Klase sa Kakuyaw',
    description: 'Deskripsyon',
    submit: 'I-submit',
    
    emergencyHotlines: 'Mga Emergency Hotline',
    police: 'Pulis',
    fire: 'Bombero',
    medical: 'Medikal nga Emergency',
    disaster: 'Pagtubag sa Katalagman',
    
    dashboard: 'Dashboard',
    totalUsers: 'Total nga mga User',
    totalHazards: 'Total nga mga Kakuyaw',
    addHazard: 'Idugang ang Kakuyaw',
    addEvacCenter: 'Idugang ang Evacuation Center',
    systemGuide: 'Giya sa Sistema',
    manageUsers: 'Pagdumala sa mga User',
    viewReports: 'Tan-awa ang mga Report',
    commandCenter: 'Command Center',
    liveMap: 'Live nga Mapa',
    evacCenters: 'Mga Evacuation Center',
    reports: 'Mga Taho',
    
    loading: 'Nagkarga...',
    success: 'Malampuson!',
    error: 'Adunay nahitabo nga sayop',
    cancel: 'Kanselahon',
    save: 'I-save',
    close: 'Isira',
    
    approve: 'Aprubahan',
    reject: 'Balibaran',
    verify: 'I-verify',
    viewAll: 'Tan-awa Tanan',
    edit: 'Usbon',
    delete: 'Tangtangon',
    search: 'Pangita',
    filter: 'Salahon',
    export: 'I-export',
    
    notifications: 'Mga Pahibalo',
    unread: 'wala mabasa',
    markAllRead: 'Markahi tanan nga nabasa',
    noNotifications: 'Walay mga pahibalo pa',
    critical: 'Kritikal',
    highPriority: 'Taas nga Prayoridad',
    sosAlert: 'Nakadawat og SOS Alert!',
    newHazardReport: 'Bag-ong Taho sa Katalagman',
    verificationRequest: 'Hangyo sa Beripikasyon',
    
    getVerified: 'Pagpa-verify',
    uploadId: 'I-upload ang Government ID',
    verificationPending: 'Nagpadayon ang Beripikasyon',
    verificationApproved: 'Giaprubahan ang Beripikasyon',
    verificationRejected: 'Gisalikway ang Beripikasyon',
    verifiedGuardian: 'Verified nga Guardian',
    submitForReview: 'Isumite para sa Pagsusi',
    
    flood: 'Baha',
    landslide: 'Pagdahili sa Yuta',
    earthquake: 'Linog',
    typhoon: 'Bagyo',
    accident: 'Aksidente',
    
    active: 'Aktibo',
    resolved: 'Nasulbad',
    pending: 'Naghulat',
    verified: 'Na-verify',
    rejected: 'Gisalikway',
    open: 'Bukas',
    closed: 'Sirado',
    full: 'Puno',
    standby: 'Standby',
    
    low: 'Ubos',
    medium: 'Kasarangan',
    high: 'Taas',
    
    weather: 'Panahon',
    temperature: 'Temperatura',
    humidity: 'Kahalumigmig',
    windSpeed: 'Kusog sa Hangin',
    
    fullName: 'Tibuok nga Ngalan',
    phoneNumber: 'Numero sa Telepono',
    barangay: 'Barangay',
    location: 'Lokasyon',
    
    stayAlert: 'Magbantay, magpabilin nga luwas',
    yourBarangay: 'Imong Barangay',
    quickActions: 'Dali nga Aksyon',
    recentAlerts: 'Bag-ong mga Alerto',
    
    language: 'Pinulongan',
    english: 'Iningles',
    tagalog: 'Tagalog',
    cebuano: 'Cebuano',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'safenav-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load from localStorage on initial mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'fil' || stored === 'ceb')) {
      return stored as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    // Sync with localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'fil' || stored === 'ceb')) {
      setLanguageState(stored as Language);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
