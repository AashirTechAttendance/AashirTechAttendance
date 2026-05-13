// ═══════════════════════════════════════════════════════
// FIREBASE CONFIGURATION
// ═══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase Config ────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyD5xjiFppyn-S9WaV4p5gbq5_rcOaBmvg8",
  authDomain: "aashirtech-attendance.firebaseapp.com",
  projectId: "aashirtech-attendance",
  storageBucket: "aashirtech-attendance.firebasestorage.app",
  messagingSenderId: "773804501059",
  appId: "1:773804501059:web:9f4492661eb33c67b9ccf6",
  measurementId: "G-L3MDC5FRT7"
};

// ── Initialize Firebase ────────────────────────────────

const app = initializeApp(firebaseConfig);

// ── Firebase Services ──────────────────────────────────

const auth = getAuth(app);
const db = getFirestore(app);

// ── Google Auth Provider ───────────────────────────────

const googleProvider = new GoogleAuthProvider();

// ── Admin Email Whitelist ──────────────────────────────

const ADMIN_EMAILS = [
  "admin@aashirtech.com",
  "teacher@aashirtech.com"
];

// ── Attendance Time Rules ──────────────────────────────

const ATTENDANCE_OPEN_HOUR = 4;
const ATTENDANCE_CLOSE_HOUR = 11;

// ── Export Everything ──────────────────────────────────

export {
  app,
  auth,
  db,
  googleProvider,
  ADMIN_EMAILS,
  ATTENDANCE_OPEN_HOUR,
  ATTENDANCE_CLOSE_HOUR
};

console.log("Firebase Connected Successfully");