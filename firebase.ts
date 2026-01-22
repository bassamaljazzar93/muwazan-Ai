// firebase.ts - Uses global Firebase loaded from CDN

// Declare global types
declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    firebaseTimestamp: () => any;
  }
}

// Get Firebase services from window (loaded via CDN in index.html)
export const auth = (window as any).firebaseAuth;
export const db = (window as any).firebaseDb;

// Auth functions
export const createUserWithEmailAndPassword = (email: string, password: string) => {
  return auth.createUserWithEmailAndPassword(email, password);
};

export const signInWithEmailAndPassword = (email: string, password: string) => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const signInAnonymously = () => {
  return auth.signInAnonymously();
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Firestore functions
export const serverTimestamp = () => {
  return (window as any).firebaseTimestamp();
};

export const doc = (collectionPath: string, docId: string) => {
  return db.collection(collectionPath).doc(docId);
};

export const collection = (path: string) => {
  return db.collection(path);
};

export const setDoc = async (docRef: any, data: any, options?: { merge?: boolean }) => {
  if (options?.merge) {
    return docRef.set(data, { merge: true });
  }
  return docRef.set(data);
};

export const getDoc = async (docRef: any) => {
  return docRef.get();
};

export const getDocs = async (queryRef: any) => {
  return queryRef.get();
};

export const deleteDoc = async (docRef: any) => {
  return docRef.delete();
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  return collectionRef;
};

export const where = (field: string, op: string, value: any) => {
  return { field, op, value };
};

export default { auth, db };