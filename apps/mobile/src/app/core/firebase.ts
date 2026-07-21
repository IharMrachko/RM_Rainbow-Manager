import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAI, AI } from 'firebase/ai';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let ai: AI | null = null;

export function initFirebase(): FirebaseApp {
  if (app) {
    return app;
  }
  if (!environment.firebase?.apiKey) {
    throw new Error(
      'Firebase apiKey is empty. Fill apps/mobile/src/environments/environment.ts',
    );
  }

  app = getApps().length ? getApps()[0]! : initializeApp(environment.firebase);

  try {
    auth = Capacitor.isNativePlatform()
      ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
      : initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    // Auth already initialized (HMR / re-entry)
    auth = getAuth(app);
  }

  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');
  try {
    ai = getAI(app);
  } catch {
    ai = null;
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initFirebase();
  }
  return auth!;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    initFirebase();
  }
  return db!;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    initFirebase();
  }
  return storage!;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    initFirebase();
  }
  return functions!;
}

export function getFirebaseAi(): AI | null {
  if (!app) {
    initFirebase();
  }
  return ai;
}
