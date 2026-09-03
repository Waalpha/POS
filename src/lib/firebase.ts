/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseConfigData.authDomain || '',
  projectId: firebaseConfigData.projectId || '',
  storageBucket: firebaseConfigData.storageBucket || '',
  messagingSenderId: firebaseConfigData.messagingSenderId || '',
  appId: firebaseConfigData.appId || '',
  measurementId: firebaseConfigData.measurementId || '',
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
