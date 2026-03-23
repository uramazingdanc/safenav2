import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.safenav2',
  appName: 'SafeNav',
  webDir: 'dist',
  server: {
    url: 'https://8f03284e-7d32-4368-b640-d2b60e420f32.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
