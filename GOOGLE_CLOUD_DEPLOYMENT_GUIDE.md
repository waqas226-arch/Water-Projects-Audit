# FGRF Water Projects Audit & Monitoring System
## Google Cloud Online Publishing & Deployment Guide

> **Author:** Syed Waqas, Manager MIS  
> **Department:** Data Management & ERP Department – Faizan Global Relief Foundation (FGRF)  
> **Platform Version:** v3.0 Production Build  

---

### Executive Summary

To make the **FGRF Water Projects Audit & Monitoring System** accessible online across Pakistan (from mobile phones in Tharparkar/Badin to desktop computers at Karachi HQ), Google Cloud offers multiple proven hosting options. 

This repository has been fully configured and containerized with:
1. `Dockerfile` — Ready for **Google Cloud Run**
2. `firebase.json` — Ready for **Firebase Hosting (Google Cloud Edge CDN)**
3. `app.yaml` — Ready for **Google App Engine**
4. `deploy-to-google-cloud.bat` — Automated 1-click deployment assistant for Windows

---

### Comparison of Google Cloud Hosting Methods

| Feature | Method 1: Firebase Hosting (Google Cloud CDN) ⭐ | Method 2: Google Cloud Run ⭐⭐ | Method 3: Google App Engine |
| :--- | :--- | :--- | :--- |
| **Best For** | Fastest setup, zero cost, mobile-first | Full backend, Gemini AI Advisor, enterprise scale | Traditional Node.js PaaS |
| **Setup Time** | **~3 minutes** | **~5-7 minutes** | ~10 minutes |
| **Cost / Free Tier** | **100% Free** (Spark Plan: 10 GB storage, 360 MB/day) | **100% Free Tier** (2 Million requests/month free) | Standard free tier |
| **SSL Certificate** | Automatic & Free (HTTPS) | Automatic & Free (HTTPS) | Automatic & Free (HTTPS) |
| **Custom Domain** | Yes (`audit.fgrf.org` or similar) | Yes (`audit.fgrf.org` or similar) | Yes |
| **URL Example** | `https://fgrf-water-audit.web.app` | `https://fgrf-water-audit-xxxx-uc.a.run.app` | `https://fgrf-water-audit.appspot.com` |

---

### Method 1: Firebase Hosting (Recommended – Fastest & Simplest)

Firebase is Google's dedicated web hosting platform, built directly on Google Cloud infrastructure. It requires **no server maintenance** and is completely free.

#### Step 1: Create a Google Cloud / Firebase Project
1. Open your web browser and go to [https://console.firebase.google.com](https://console.firebase.google.com).
2. Sign in with your Google account (e.g., FGRF official email).
3. Click **"Add project"** (پراجیکٹ شامل کریں).
4. Enter a project name, e.g.: `fgrf-water-audit`.
5. Click **Create Project**.

#### Step 2: Deploy using the Automated Windows Assistant
1. In the project folder on your PC, simply double-click:
   `deploy-to-google-cloud.bat`
2. Select Option `[1] Firebase Hosting`.
3. The tool will:
   - Build the latest production bundle (`npm run build`).
   - Open a browser window for you to log into Google.
   - Upload and deploy your system to Google Cloud CDN.

#### Step 3: Or Deploy manually via Terminal
Open PowerShell or Command Prompt in the project folder and run:
```bash
# 1. Build the production application
npm run build

# 2. Login to your Google account
npx -y firebase-tools login

# 3. Connect your project
npx -y firebase-tools use --add

# 4. Deploy to Google Cloud
npx -y firebase-tools deploy --only hosting
```

Your system will immediately receive live public URLs:
* `https://<your-project-id>.web.app`
* `https://<your-project-id>.firebaseapp.com`

---

### Method 2: Google Cloud Run (Containerized Service with Gemini AI Backend)

Google Cloud Run runs the Node.js/Express application containerized with high-thinking AI advisor support.

#### Prerequisites
* Install the **Google Cloud SDK (`gcloud` CLI)** from: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
* Or deploy directly using the **Google Cloud Console Web UI** (see below).

#### Steps to Deploy via CLI:
```bash
# 1. Initialize Google Cloud SDK and login
gcloud auth login

# 2. Set your Google Cloud Project
gcloud config set project YOUR_PROJECT_ID

# 3. Enable Cloud Run and Cloud Build APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 4. Deploy directly from source (Container builds automatically in Cloud Build)
gcloud run deploy fgrf-water-audit \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```
> **Region Tip:** `asia-south1` (Mumbai) or `me-central1` (Middle East) provides the lowest network latency (< 40ms) for field users across Pakistan.

---

### Method 3: Google Cloud Web Console (100% in Browser – No CLI Required)

If you do not want to install any CLI software on your computer:
1. Push this folder to a private **GitHub** repository (e.g., `github.com/fgrf/water-projects-audit`).
2. Go to [https://console.cloud.google.com/run](https://console.cloud.google.com/run).
3. Click **"Create Service"** (سروس بنائیں).
4. Select **"Continuously deploy from a repository"**.
5. Connect your GitHub account and choose the repository.
6. Under **Build configuration**, select **Dockerfile**.
7. Under **Authentication**, select **"Allow unauthenticated invocations"** (public web access).
8. Click **Create**.
Google Cloud will automatically build the Docker container and provide you with an HTTPS web address within 3 minutes!

---

### Custom Domain Mapping (Optional: e.g. `audit.fgrf.org`)

Both Firebase Hosting and Cloud Run allow you to attach FGRF's official domain:
1. Go to **Firebase Console** -> **Hosting** -> **Add custom domain**.
2. Enter your desired subdomain: `audit.fgrf.org` or `water.fgrf.org`.
3. Add the two `CNAME` / `A` records provided by Google to your DNS manager (Cloudflare, cPanel, or domain registrar).
4. Google will automatically issue a free SSL certificate within 15–30 minutes.

---

### Important Architectural Note: Multi-User Central Database Synchronization

* **Current Architecture:**  
  The system currently stores records locally in the browser (`localStorage`). This is ideal for offline field inspections when an inspector is in remote desert areas with poor cellular connectivity.
* **Central Online Sync:**  
  If you want audits entered by Field Supervisors in the field to **automatically appear on HQ's central screen in real-time** (without needing to export/import files), we can connect **Google Cloud Firestore** (Google's live cloud database). 
  * If you would like us to enable live Google Cloud Firestore synchronization now, simply let us know and we will wire it up immediately!
