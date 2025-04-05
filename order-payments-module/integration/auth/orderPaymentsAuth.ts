/**
 * Order Payments Auth Integration
 * 
 * This module provides authentication integration between the Order Payments Module
 * and the main application's authentication system.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Main app auth type
export type MainAppUser = {
  uid: string;
  email: string;
  displayName?: string;
  role: 'client' | 'provider' | 'admin';
  stripeAccountId?: string;
};

// Auth context interface that will be injected by the main app
export interface OrderPaymentsAuthContext {
  currentUser: MainAppUser | null;
  isAuthenticated: boolean;
  roles: {
    isClient: () => boolean;
    isProvider: () => boolean;
    isAdmin: () => boolean;
  };
  getAuthToken: () => Promise<string>;
  refreshAuthToken: () => Promise<void>;
}

// Real authentication object that uses Firebase Auth directly
// This solves the problem of auth not being initialized properly
let authContext: OrderPaymentsAuthContext = {
  get currentUser() {
    const firebaseUser = firebase.auth().currentUser;
    if (!firebaseUser) return null;
    
    // Convert Firebase user to MainAppUser format
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      role: 'client' as const, // Explicitly typed as 'client'
      stripeAccountId: undefined
    };
  },
  get isAuthenticated() {
    return firebase.auth().currentUser !== null;
  },
  roles: {
    // Implement these based on how you determine user roles
    isClient: () => true, // Adjust based on how you store roles
    isProvider: () => false, // Adjust based on how you store roles
    isAdmin: () => false, // Adjust based on how you store roles
  },
  getAuthToken: async () => {
    const user = firebase.auth().currentUser;
    if (!user) return '';
    return user.getIdToken();
  },
  refreshAuthToken: async () => {
    const user = firebase.auth().currentUser;
    if (user) await user.getIdToken(true);
  },
};

/**
 * Initializes the Order Payments auth with the main application's auth context
 * 
 * @param appAuthContext The authentication context from the main application
 */
export const initializeAuth = (appAuthContext: OrderPaymentsAuthContext) => {
  authContext = appAuthContext;
};

/**
 * Determines if the user has permission to view or modify an order
 * 
 * @param orderId The ID of the order
 * @param clientId The client ID associated with the order
 * @param providerId The provider ID associated with the order
 * @returns 
 */
export const canAccessOrder = (
  orderId: string,
  clientId: string,
  providerId: string
): boolean => {
  if (!authContext.isAuthenticated || !authContext.currentUser) {
    return false;
  }
  
  const uid = authContext.currentUser.uid;
  
  // Admins can access any order
  if (authContext.roles.isAdmin()) {
    return true;
  }
  
  // Clients can only access their own orders
  if (authContext.roles.isClient()) {
    return uid === clientId;
  }
  
  // Providers can only access orders assigned to them
  if (authContext.roles.isProvider()) {
    return uid === providerId;
  }
  
  return false;
};

/**
 * Gets the current user's role-specific ID (either client or provider ID)
 */
export const getCurrentUserRoleId = (): string | null => {
  // Fall back to firebase.auth().currentUser if authContext is not authenticated
  if (!authContext.isAuthenticated || !authContext.currentUser) {
    const firebaseUser = firebase.auth().currentUser;
    if (firebaseUser) {
      console.log('Using direct Firebase auth because context not initialized:', firebaseUser.uid);
      return firebaseUser.uid;
    }
    return null;
  }
  
  // Log the user ID for debugging
  console.log('Using auth context user ID:', authContext.currentUser.uid);
  return authContext.currentUser.uid;
};

/**
 * Gets the Stripe account ID for the current user (for providers who need to receive payments)
 */
export const getStripeAccountId = (): string | null => {
  if (!authContext.isAuthenticated || !authContext.currentUser) {
    return null;
  }
  
  return authContext.currentUser.stripeAccountId || null;
};

// Export the auth object with helper methods
const orderPaymentsAuth = {
  ...authContext,
  initializeAuth,
  canAccessOrder,
  getCurrentUserRoleId,
  getStripeAccountId,
};

export default orderPaymentsAuth; 