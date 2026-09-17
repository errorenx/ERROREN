import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import type { Conversation, ChatMessage } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
export const app = (() => {
  try {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    console.warn('Firebase initializeApp notice:', error);
    return null as any;
  }
})();

// Initialize Firebase Auth safely
export const auth = (() => {
  try {
    return app ? getAuth(app) : (null as any);
  } catch (error) {
    console.warn('Firebase getAuth notice:', error);
    return null as any;
  }
})();

// Initialize Firestore safely with custom database ID from config
export const db = (() => {
  try {
    return app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)') : (null as any);
  } catch (error) {
    console.warn('Firebase getFirestore notice:', error);
    return null as any;
  }
})();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in using real Google Account popup
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized in this environment.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Persist/Update user profile in Firestore
    await saveUserProfile(user);

    return user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Google Sign-In popup closed by user.');
    } else {
      console.error('Firebase Google Sign-In Error:', error);
    }
    throw error;
  }
}

/**
 * Register new user with Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not available.');
  }
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  await saveUserProfile(cred.user);
  return cred.user;
}

/**
 * Sign in user with Email and Password
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not available.');
  }
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  await saveUserProfile(cred.user);
  return cred.user;
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
}

/**
 * Save / Update User Profile in Firestore
 */
export async function saveUserProfile(user: User): Promise<void> {
  if (!db || !user?.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'ERROREN User',
        photoURL: user.photoURL || '',
        lastLogin: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Failed to sync user profile to Firestore:', error);
  }
}

/**
 * Clean message object before writing to Firestore (removes undefined fields)
 */
function sanitizeMessage(msg: ChatMessage): any {
  const clean: any = {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  };
  if (msg.attachment) {
    clean.attachment = {
      name: msg.attachment.name,
      mimeType: msg.attachment.mimeType,
      data: msg.attachment.data,
      previewUrl: msg.attachment.previewUrl,
    };
  }
  if (msg.feedback) {
    clean.feedback = msg.feedback;
  }
  if (msg.error !== undefined) {
    clean.error = msg.error;
  }
  return clean;
}

/**
 * Save or update a single conversation in Firestore
 */
export async function saveConversationToCloud(
  userId: string,
  conversation: Conversation
): Promise<void> {
  if (!db || !userId || !conversation.id) return;

  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversation.id);
    const sanitizedMessages = conversation.messages.map(sanitizeMessage);

    await setDoc(
      convRef,
      {
        id: conversation.id,
        userId,
        title: conversation.title || 'Untitled Session',
        createdAt: conversation.createdAt || Date.now(),
        updatedAt: conversation.updatedAt || Date.now(),
        pinned: Boolean(conversation.pinned),
        messages: sanitizedMessages,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to save conversation to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a conversation from Firestore
 */
export async function deleteConversationFromCloud(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!db || !userId || !conversationId) return;

  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await deleteDoc(convRef);
  } catch (error) {
    console.error('Failed to delete conversation from Firestore:', error);
    throw error;
  }
}

/**
 * Load all conversations for a user from Firestore
 */
export async function loadCloudConversations(userId: string): Promise<Conversation[]> {
  if (!db || !userId) return [];

  try {
    const convsColl = collection(db, 'users', userId, 'conversations');
    const q = query(convsColl, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const conversations: Conversation[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      conversations.push({
        id: data.id || docSnap.id,
        title: data.title || 'Untitled Session',
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        pinned: data.pinned || false,
        messages: Array.isArray(data.messages) ? data.messages : [],
      });
    });

    return conversations;
  } catch (error) {
    console.error('Failed to load conversations from Firestore:', error);
    return [];
  }
}

/**
 * Subscribe in real-time to conversations for a user
 */
export function subscribeToCloudConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): () => void {
  if (!db || !userId) return () => {};

  const convsColl = collection(db, 'users', userId, 'conversations');
  const q = query(convsColl, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const conversations: Conversation[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        conversations.push({
          id: data.id || docSnap.id,
          title: data.title || 'Untitled Session',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          pinned: data.pinned || false,
          messages: Array.isArray(data.messages) ? data.messages : [],
        });
      });
      onUpdate(conversations);
    },
    error => {
      console.warn('Real-time conversation sync warning:', error);
    }
  );
}
