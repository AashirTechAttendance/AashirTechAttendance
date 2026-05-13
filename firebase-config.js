// ═══════════════════════════════════════════════════════
// FIREBASE CONFIGURATION
// ⚠️  REPLACE WITH YOUR OWN FIREBASE PROJECT CREDENTIALS
// ═══════════════════════════════════════════════════════
// HOW TO GET YOUR CREDENTIALS:
//   1. Go to https://console.firebase.google.com/
//   2. Create a new project (or use existing)
//   3. Go to Project Settings → Your Apps → Web App
//   4. Copy the firebaseConfig object below
//   5. Enable Google Sign-In in Authentication → Sign-in method
//   6. Create a Firestore Database in Native Mode
//   7. Set Firestore Security Rules (see README.md)

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ── Global Firebase Instances ──────────────────────────
const auth = firebase.auth();
const db   = firebase.firestore();

// ── Google Auth Provider ───────────────────────────────
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ── Admin Email Whitelist ──────────────────────────────
// Add teacher/admin email addresses here
const ADMIN_EMAILS = [
  "admin@aashirtech.com",
  "teacher@aashirtech.com",
  // Add more admin emails as needed
];

// ── Attendance Time Rules ──────────────────────────────
const ATTENDANCE_OPEN_HOUR  = 4;   // 4:00 AM
const ATTENDANCE_CLOSE_HOUR = 11;  // 11:00 AM
