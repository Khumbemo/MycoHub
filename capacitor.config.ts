import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mutha.MycoHub',
  appName: 'MycoHub',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      // Native Google sign-in only fetches the credential; the Firebase JS SDK
      // owns the session so Firestore and Storage see the same user.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
