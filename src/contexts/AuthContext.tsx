import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  adminError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(null);
      setAdminError(null);
      if (u) {
        // Check if user is in admins collection
        try {
          const adminRef = doc(db, "admins", u.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            setUser(u);
          } else {
            setAdminError("You are not authorized as an admin.");
            await signOut(auth);
          }
        } catch (e) {
          setAdminError("Admin check failed. Try again later.");
          await signOut(auth);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Add your VITE_FIREBASE_* env vars.");
    setAdminError(null);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Check if user is in admins collection
    const adminRef = doc(db, "admins", cred.user.uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      setAdminError("You are not authorized as an admin.");
      await signOut(auth);
      throw new Error("You are not authorized as an admin.");
    }
  };
  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  };
  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, login, logout, resetPassword, adminError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
