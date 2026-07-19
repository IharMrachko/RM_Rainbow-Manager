import { Injectable } from '@angular/core';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  getRedirectResult,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { FIREBASE_PATHS } from '@rainbow/shared';
import { getFirebaseAuth, getFirebaseDb, initFirebase } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();
  private ready = false;
  private readyResolve!: () => void;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  constructor() {
    initFirebase();
    void this.finishRedirectIfAny();
    onAuthStateChanged(getFirebaseAuth(), (user) => {
      this.userSubject.next(user);
      if (user) {
        localStorage.setItem('user', JSON.stringify({ email: user.email, uid: user.uid }));
      } else {
        localStorage.removeItem('user');
      }
      if (!this.ready) {
        this.ready = true;
        this.readyResolve();
      }
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  get userId(): string | null {
    return this.userSubject.value?.uid ?? null;
  }

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async signIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    this.userSubject.next(cred.user);
    return cred.user;
  }

  async signUp(email: string, password: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    const parentRef = collection(
      getFirebaseDb(),
      FIREBASE_PATHS.usersRoot,
      FIREBASE_PATHS.usersItems,
      'items',
    );
    await addDoc(parentRef, {
      userId: cred.user.uid,
      email: email.trim(),
      role: 'USER',
      createdAt: serverTimestamp(),
    });
    this.userSubject.next(cred.user);
    return cred.user;
  }

  async signInWithGoogle(): Promise<User> {
    const user = Capacitor.isNativePlatform()
      ? await this.signInWithGoogleNative()
      : await this.signInWithGoogleWeb();
    await this.upsertGoogleUser(user);
    this.userSubject.next(user);
    return user;
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }

  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch {
        // Native session may already be empty when using skipNativeAuth.
      }
    }
    await signOut(getFirebaseAuth());
    this.userSubject.next(null);
  }

  private async signInWithGoogleNative(): Promise<User> {
    const result = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
    });
    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw Object.assign(new Error('Google Sign-In did not return an ID token'), {
        code: 'auth/missing-id-token',
      });
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(getFirebaseAuth(), credential);
    return cred.user;
  }

  private async signInWithGoogleWeb(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(getFirebaseAuth(), provider);
    return cred.user;
  }

  private async finishRedirectIfAny(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const result = await getRedirectResult(getFirebaseAuth());
      if (result?.user) {
        await this.upsertGoogleUser(result.user);
        this.userSubject.next(result.user);
      }
    } catch (err) {
      console.warn('Firebase redirect result', err);
    }
  }

  private async upsertGoogleUser(user: User): Promise<void> {
    const ref = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.usersRoot,
      FIREBASE_PATHS.usersItems,
      'items',
      user.uid,
    );
    await setDoc(
      ref,
      {
        userId: user.uid,
        email: user.email,
        role: 'USER',
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}
