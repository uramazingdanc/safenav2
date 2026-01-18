import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fil' | 'ceb';

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
  
  // Status
  loading: string;
  success: string;
  error: string;
  cancel: string;
  save: string;
  close: string;
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
    
    loading: 'Loading...',
    success: 'Success!',
    error: 'Error occurred',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
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
    
    loading: 'Naglo-load...',
    success: 'Tagumpay!',
    error: 'May naganap na error',
    cancel: 'Kanselahin',
    save: 'I-save',
    close: 'Isara',
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
    
    loading: 'Nagkarga...',
    success: 'Malampuson!',
    error: 'Adunay nahitabo nga sayop',
    cancel: 'Kanselahon',
    save: 'I-save',
    close: 'Isira',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

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
