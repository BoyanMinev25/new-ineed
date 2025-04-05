// Jest setup file
// Add any global test setup here

// Mock environment variables
process.env.STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_mock_key';

// Mock Firebase (if needed)
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(),
    apps: []
  };
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn()
  };
});

jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteObject: jest.fn()
  };
});

// Mock window.matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 