# AashirTech Attendance System

A professional, secure student attendance management web application built with HTML, CSS, JavaScript, and Firebase.

---

## 🚀 Setup Instructions

### Step 1: Create a Firebase Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Add project"** → Enter project name (e.g. `aashirtech-attendance`)
3. Disable Google Analytics (optional) → Click **"Create project"**

### Step 2: Enable Google Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → Toggle **Enable** → Save
3. Add your domain to **Authorized domains** if deploying

### Step 3: Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **"Start in production mode"** → Select a region → Enable

### Step 4: Set Firestore Security Rules

Go to **Firestore → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own profile
    match /users/{uid} {
      allow read: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
      );
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
      );
    }
    
    // Attendance records
    match /attendance/{docId} {
      // Students can read their own, teachers can read all
      allow read: if request.auth != null && (
        resource.data.uid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'
      );
      // Students can only create attendance for themselves
      allow create: if request.auth != null && 
        request.resource.data.uid == request.auth.uid;
      // Only teachers can update/delete
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}
```

### Step 5: Create Firestore Indexes

Go to **Firestore → Indexes → Composite** and create:

| Collection | Field 1 | Field 2 | Order |
|------------|---------|---------|-------|
| attendance | uid (Asc) | date (Desc) | — |
| attendance | date (Asc) | — | — |

### Step 6: Get Firebase Config

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → click Web icon `</>`
3. Register app → Copy the `firebaseConfig` object

### Step 7: Configure the App

Open `js/firebase-config.js` and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",            // ← Replace
  authDomain: "YOUR_AUTH_DOMAIN",    // ← Replace
  projectId: "YOUR_PROJECT_ID",      // ← Replace
  storageBucket: "YOUR_STORAGE_BUCKET",    // ← Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← Replace
  appId: "YOUR_APP_ID"               // ← Replace
};

// Add teacher/admin emails
const ADMIN_EMAILS = [
  "yourteacher@email.com",  // ← Replace with actual teacher email
];
```

### Step 8: Set Up Admin/Teacher

The first time the teacher signs in:
- Their email must be in the `ADMIN_EMAILS` array
- They will be prompted to complete profile setup
- Their role will be set to `teacher` automatically

---

## 📁 File Structure

```
aashirtech/
├── index.html              # Main HTML file
├── css/
│   ├── main.css            # Base styles, variables, layout
│   ├── auth.css            # Auth screen styles
│   ├── dashboard.css       # Student dashboard
│   └── admin.css           # Admin dashboard
├── js/
│   ├── firebase-config.js  # ⚠️ Firebase credentials (edit this!)
│   ├── auth.js             # Authentication logic
│   ├── attendance.js       # Attendance marking & display
│   ├── admin.js            # Admin panel logic
│   ├── reports.js          # PDF & Excel export
│   └── app.js              # Main orchestration
└── assets/
    └── favicon.svg         # App favicon
```

---

## 🕐 Attendance Time Rules

- **Opens:** 4:00 AM daily
- **Closes:** 11:00 AM daily
- Students can only mark attendance during this window
- After 11 AM, the button locks automatically
- To change times, edit in `js/firebase-config.js`:
  ```javascript
  const ATTENDANCE_OPEN_HOUR  = 4;   // 4:00 AM
  const ATTENDANCE_CLOSE_HOUR = 11;  // 11:00 AM
  ```

---

## 🚀 Deployment

### Option 1: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Any Static Host
Upload all files to Vercel, Netlify, GitHub Pages, or any web server.

### Option 3: Local Testing
Open `index.html` directly in a browser (some features may require a server due to CORS).
Use VS Code Live Server extension or:
```bash
npx serve .
```

---

## 🔐 Security Notes

- Never commit `firebase-config.js` with real credentials to public repos
- Use Firebase environment variables for production
- Firestore rules enforce data access — students cannot see other students' data
- Admin access is controlled by email whitelist

---

## 📊 Features

### Student Features
- Google Sign-In
- Mark daily attendance (4 AM–11 AM window)
- View personal attendance history
- Attendance percentage donut chart
- Streak tracking
- Grade badge (Excellent/Good/Average/Low)

### Admin/Teacher Features
- Full student list with search & filter
- Daily attendance overview
- Monthly trend charts
- Individual student detail modal
- Monthly report generation
- Export to PDF & Excel
- Dark mode

---

*AashirTech Attendance System — Built with ❤️ using Firebase*
