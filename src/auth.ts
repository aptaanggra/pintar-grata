import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Cache the access token in memory
let cachedAccessToken: string | null = null;
let hasDocsScope = false;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      hasDocsScope = false;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (includeDocs: boolean = false): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    if (includeDocs) {
      provider.addScope('https://www.googleapis.com/auth/docs');
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    hasDocsScope = includeDocs && !!cachedAccessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const checkHasDocsScope = (): boolean => {
  return hasDocsScope;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  hasDocsScope = false;
};
