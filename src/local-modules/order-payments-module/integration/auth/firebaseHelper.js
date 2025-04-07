/**
 * Firebase Helper
 * 
 * Provides utilities for Firebase authentication and initialization.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAo_LQ9I4b-JVGujG1hqHBB8-8BnOqSzWw',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'ineed-e9719.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'ineed-e9719',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'ineed-e9719.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '81698665941',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:81698665941:web:bdd79ac80b0463890a795c'
};

// Get global Firebase instance if it exists
const getExistingFirebase = () => {
  // Check for global firebase instance
  if (typeof window !== 'undefined' && window.firebase) {
    console.log('Found global Firebase instance on window');
    return window.firebase;
  }
  
  // Check for existing firebase apps
  if (firebase.apps.length > 0) {
    console.log('Using existing Firebase app');
    return firebase;
  }
  
  return null;
};

// Initialize Firebase if it's not already initialized
const initializeFirebase = () => {
  // Try to get existing Firebase instance first
  const existingFirebase = getExistingFirebase();
  if (existingFirebase) {
    console.log('Using existing Firebase instance');
    return existingFirebase;
  }

  // Initialize a new instance if needed
  try {
    console.log('Firebase not initialized yet, initializing with config:', 
      { ...firebaseConfig, apiKey: firebaseConfig.apiKey.substring(0, 10) + '...' });
    
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Make it available globally for debugging
    if (typeof window !== 'undefined') {
      window._firebase = firebase;
    }
    
    return firebase;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return firebase; // Return firebase anyway to avoid breaking the app
  }
};

// Initialize Firebase
const app = initializeFirebase();

/**
 * Gets the current user's Firebase ID token
 * @param {boolean} forceRefresh - Whether to force refresh the token
 * @returns {Promise<string|null>} The user's ID token or null if not authenticated
 */
const getAuthToken = async (forceRefresh = true) => {
  try {
    console.log('🔑 getAuthToken: Checking for current user...');
    
    // Try to get user from explicit firebase instance
    let user = app.auth().currentUser;
    
    // Try global firebase as fallback
    if (!user && typeof window !== 'undefined' && window.firebase) {
      console.log('🔑 getAuthToken: Trying global firebase instance...');
      user = window.firebase.auth().currentUser;
    }
    
    if (!user) {
      console.warn('🔑 getAuthToken: No authenticated user found');
      return null;
    }
    
    console.log(`🔑 getAuthToken: Found user: ${user.uid}. Getting ID token...`);
    
    // Force token refresh to ensure we have the latest token
    const token = await user.getIdToken(forceRefresh);
    
    if (!token) {
      console.warn('🔑 getAuthToken: User exists but getIdToken returned empty token');
      return null;
    }

    console.log(`🔑 getAuthToken: Successfully retrieved token (length: ${token.length})`);
    
    // Log first 10 chars of the token for debugging
    const tokenPrefix = token.substring(0, 10);
    console.log(`🔑 getAuthToken: Token starts with: ${tokenPrefix}...`);
    
    return token;
  } catch (error) {
    console.error('🔑 getAuthToken: Error getting auth token:', error);
    return null;
  }
};

/**
 * Gets the current user's ID
 * @returns {string|null} The user ID or null if not authenticated
 */
const getCurrentUserId = () => {
  try {
    // Try from our app instance first
    let user = app.auth().currentUser;
    
    // Try global firebase as fallback
    if (!user && typeof window !== 'undefined' && window.firebase) {
      user = window.firebase.auth().currentUser;
    }
    
    if (!user) {
      console.warn('getCurrentUserId: No authenticated user found');
      return null;
    }
    
    console.log(`getCurrentUserId: Found user ID: ${user.uid}`);
    return user.uid;
  } catch (error) {
    console.error('getCurrentUserId: Error getting user ID:', error);
    return null;
  }
};

/**
 * Sets up a listener for authentication state changes
 * @param {Function} callback - Called when auth state changes
 * @returns {Function} Unsubscribe function
 */
const onAuthStateChanged = (callback) => {
  console.log('Setting up auth state change listener');
  return app.auth().onAuthStateChanged((user) => {
    console.log(`Auth state changed: User ${user ? 'logged in' : 'logged out'}`);
    if (user) {
      console.log(`Logged in user: ${user.uid}`);
    }
    callback(user);
  });
};

/**
 * Logs in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>} - Firebase user credential
 */
const signInWithEmailAndPassword = async (email, password) => {
  return app.auth().signInWithEmailAndPassword(email, password);
};

/**
 * Signs out the current user
 * @returns {Promise<void>}
 */
const signOut = async () => {
  return app.auth().signOut();
};

/**
 * Logs the current authentication state for debugging
 * @returns {Object} The auth state information
 */
const logAuthState = () => {
  try {
    // Try multiple sources to find the current user
    let user = app.auth().currentUser;
    
    // Try global firebase as fallback
    if (!user && typeof window !== 'undefined' && window.firebase) {
      user = window.firebase.auth().currentUser;
    }
    
    if (user) {
      const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        providerId: user.providerId,
      };
      console.log('🔑 Current user:', userInfo);
      
      // Additional Firebase auth debugging
      console.log('Available auth methods:', Object.keys(app.auth()));
      console.log('Firebase app instances:', firebase.apps.length);
      
      return { isLoggedIn: true, user: userInfo };
    } else {
      console.warn('🔑 No user is currently signed in');
      
      // Check if Firebase is initialized properly
      console.log('Firebase app instances:', firebase.apps.length);
      console.log('Firebase auth available:', !!app.auth);
      
      return { isLoggedIn: false, user: null };
    }
  } catch (error) {
    console.error('Error checking auth state:', error);
    return { isLoggedIn: false, error: error.message };
  }
};

// Export the utilities
export {
  app as firebase,
  getAuthToken,
  getCurrentUserId,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  logAuthState
};

export default {
  firebase: app,
  getAuthToken,
  getCurrentUserId,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  logAuthState
}; 