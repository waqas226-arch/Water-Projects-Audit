# Google Firebase Setup & Multi-Device Live Synchronization Guide
**Project:** Faizan Global Relief Foundation (FGRF) – Water Projects Audit System  
**Form Reference:** `FGRF-WTS-AUD-002.00-26`  
**Author:** Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)  
**Target Platform:** Google Firebase (Authentication, Cloud Firestore, Real-Time WebSockets, Offline Persistence, Security Rules)  

---

## 1. Overview

This manual provides the step-by-step instructions to connect your **FGRF Water Projects Audit Management Software** to a central Google Firebase cloud backend. Once configured, any Head, division, location, water project, inspection audit, or staff record created or updated on one computer will **instantly appear in real time on all other authorized computers worldwide**.

---

## 2. Step 1: Create Your Google Firebase Project

1. Open your browser and navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Sign in with your official FGRF Google account.
3. Click **"Add project"** (or **"Create a project"**).
4. Project Name: Enter `fgrf-water-projects-audit` (or your preferred name).
5. Google Analytics: You may enable or disable Google Analytics based on organizational policy.
6. Click **"Create project"** and wait 15–20 seconds for Firebase to provision your cloud environment.
7. Click **"Continue"** to enter the project overview dashboard.

---

## 3. Step 2: Enable Firebase Authentication

The FGRF system bridges employee Staff IDs (e.g., `FGRF-MIS-01`), CNICs (e.g., `42101-1234567-1`), and official emails to Firebase Authentication:

1. In the left sidebar of the Firebase Console, navigate to **Build > Authentication**.
2. Click **"Get started"**.
3. Under the **"Sign-in method"** tab:
   - Select **"Email/Password"**.
   - Toggle **"Enable"** to `ON`.
   - Leave "Email link (passwordless sign-in)" set to `OFF`.
   - Click **"Save"**.
4. In the **"Authorized domains"** tab (under Settings):
   - By default, `localhost` is authorized.
   - Click **"Add domain"** and add your GitHub Pages domain:
     `waqas226-arch.github.io`
   - If you use a custom organizational domain (e.g., `wateraudit.fgrf.org`), add it here as well.

---

## 4. Step 3: Create Cloud Firestore Database

1. In the left sidebar, navigate to **Build > Firestore Database**.
2. Click **"Create database"**.
3. **Database ID:** Leave as `(default)`.
4. **Location:** Select the region closest to Pakistan / South Asia for optimal latency (e.g., `asia-south1` Mumbai, or `asia-southeast1` Singapore).
5. **Security Rules:**
   - Choose **"Start in production mode"**. (Do NOT select open test mode).
6. Click **"Create"** and wait for Firestore to initialize.

---

## 5. Step 4: Register Web App & Obtain Frontend Configuration

1. In the Firebase Console, click the **Gear icon (⚙️)** next to "Project Overview" > **Project settings**.
2. Scroll down to the **"Your apps"** section and click the **Web icon (`</>`)**.
3. App nickname: Enter `FGRF Water Audit Web Portal`.
4. (Optional) Check "Also set up Firebase Hosting for this app".
5. Click **"Register app"**.
6. Firebase will display your `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "fgrf-water-projects-audit.firebaseapp.com",
  projectId: "fgrf-water-projects-audit",
  storageBucket: "fgrf-water-projects-audit.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-ABCDEF1234"
};
```

---

## 6. Step 5: Configure Credentials in the Application

You have two convenient ways to apply these credentials:

### Option A: Direct Web UI (Zero Code / Zero Rebuild)
1. Open the application in your browser.
2. Log on with your Super Administrator account:
   - **User ID:** `FGRF-MIS-01`
   - **Password:** `admin123`
3. In the top sticky header, click the **"Master DB: Live Connected"** button.
4. In the modal that opens, switch to the **"Cloud Credentials"** tab.
5. Paste your `apiKey`, `projectId`, `authDomain`, `storageBucket`, and `appId`.
6. Click **"Save & Connect Firebase"**. The application will automatically reload and connect to Cloud Firestore.

### Option B: Environment Variable File (`.env`)
1. In the project root directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in your values:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSyYourActualApiKeyHere"
   VITE_FIREBASE_AUTH_DOMAIN="fgrf-water-projects-audit.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="fgrf-water-projects-audit"
   VITE_FIREBASE_STORAGE_BUCKET="fgrf-water-projects-audit.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"
   ```
3. Run `npm run build` to compile the standalone distribution.

---

## 7. Step 6: Deploy Production Firestore Security Rules

Production-grade rules have already been generated in the project's `firestore.rules` file:

### Method A: Deploy via Firebase CLI (Recommended)
From your project directory in terminal:
```bash
# 1. Login to Firebase
npx firebase login

# 2. Deploy security rules and indexes
npx firebase deploy --only firestore:rules,firestore:indexes
```

### Method B: Paste via Firebase Console
1. Open [Firebase Console > Firestore Database > Rules](https://console.firebase.google.com/).
2. Open the file `firestore.rules` in your project folder.
3. Copy all code from `firestore.rules`.
4. Paste it into the Firebase Console Rules editor, replacing the default template.
5. Click **"Publish"**.

---

## 8. Step 7: Initialize Super Administrator & First Data Migration

Existing browser data from your local computer can be safely migrated to Cloud Firestore without data loss:

1. Log into the application as Super Administrator (`FGRF-MIS-01`).
2. Click the **"Firebase Live / Master DB"** button in the header.
3. Click **"1. Download JSON Backup"** to save an immutable offline backup of your existing local database.
4. Click **"2. Run Dry-Run"**:
   - The system validates all local project records, audits, repairs, users, and open heads.
   - It filters out any legacy demo test IDs (`TEST-001`, `AUD-2026-0001`, `FGRF-WTS-SND-004`).
   - A summary report will display the exact counts of valid records.
5. Click **"3. Start Live Migration"**:
   - Confirms the transfer and uploads records into Cloud Firestore.
   - All records maintain their original IDs (`FGRF-WTS-SND-001`, etc.).
   - Your local browser data is preserved.

---

## 9. Step 8: Multi-PC Testing & Verification Checklist

To verify that multi-location live synchronization is working:

### TEST 1: Admin Creates a New Head / Location (PC 1 - Head Office)
1. On PC 1, log in as `FGRF-MIS-01`.
2. Go to **"Open Heads"** > **"Geographical Hierarchy"**.
3. Select **Sindh > Mirpur Khas** and click **"+ Add New District"**.
4. Enter:
   - District Name: `Sanghar`
   - Urdu Name: `سانگھڑ`
5. Click **"Save New District"**.
6. Notice that the record is immediately saved to Firestore.

### TEST 2: Second User Views the Newly Created Record (PC 2 - Other Computer)
1. On PC 2 (or a different browser profile / incognito window), open the application URL.
2. Log in as an inspector or coordinator (e.g. `FGRF-MIS-01` or another staff account).
3. Without logging out or pressing F5, open **"Open Heads"** or **"New Inspection Form"**.
4. Check the District dropdown under Mirpur Khas: `Sanghar` (`سانگھڑ`) **is immediately visible**!

### TEST 3: Supervisor Submits an Inspection (PC 3)
1. On PC 3, submit a new inspection form for a water project.
2. In less than 1 second, PC 1 (Head Office) and PC 2 will display the notification badge:
   `🔄 Real-time Cloud Sync: Received 1 new inspection record(s) from field staff!`
3. The dashboard KPIs update immediately across all three computers.

### TEST 4: Offline Field Testing
1. Disconnect PC 2 from Wi-Fi/Internet (Airplane mode).
2. The header indicator will change to **"Offline Mode"**.
3. Submit a field inspection or update a repair. The write is stored in Firestore's persistent local cache.
4. Reconnect to Wi-Fi/Internet.
5. The pending inspection automatically synchronizes to the cloud database and appears on PC 1 and PC 3!

---

## 10. Database Backup & Disaster Recovery

1. **Client-Side Export:**
   Super Admin can click **"Download JSON Backup"** in the Migration Center at any time to obtain a snapshot of all records.
2. **Google Cloud Scheduled Backups (Enterprise):**
   In the Google Cloud Console, enable automated daily Firestore exports to a Cloud Storage bucket:
   ```bash
   gcloud firestore export gs://[PROJECT_ID]-backups
   ```
