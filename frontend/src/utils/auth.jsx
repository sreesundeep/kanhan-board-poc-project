import { createContext, useContext, useState, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const AuthContext = createContext(null);

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const IS_DEV_MODE = !CLERK_KEY || CLERK_KEY === "pk_test_your_key_here";

// Base64url encode (no padding)
function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeDevToken(userId) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ sub: userId, name: "Dev User" }));
  const sig = b64url("devsignature");
  return `${header}.${payload}.${sig}`;
}

/** Wraps Clerk auth into our unified AuthContext */
export function ClerkAuthBridge({ children }) {
  const { isSignedIn, getToken, userId } = useClerkAuth();
  const signOut = null; // Handled by Clerk's UserButton

  return (
    <AuthContext.Provider value={{ isSignedIn: !!isSignedIn, getToken, userId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Dev-mode auth that simulates Clerk with fake JWTs */
export function DevAuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState("dev_user_001");

  const getToken = useCallback(async () => makeDevToken(userId), [userId]);

  const signIn = useCallback((id) => {
    setUserId(id || "dev_user_001");
    setIsSignedIn(true);
  }, []);

  const signOut = useCallback(() => setIsSignedIn(false), []);

  return (
    <AuthContext.Provider value={{ isSignedIn, getToken, userId, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Unified auth hook — works in both Clerk and dev mode */
export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be inside an auth provider");
  return ctx;
}
