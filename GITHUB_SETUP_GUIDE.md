# FGRF Water Projects Audit & Monitoring System
## Complete GitHub Publishing & Online Operating Guide

> **Organization:** Faizan Global Relief Foundation (FGRF)  
> **Department:** Data Management & ERP Department  
> **Author:** Syed Waqas, Manager MIS  
> **Version:** v3.0 Production Edition  

---

### Overview

Moving this system completely into **GitHub** provides two massive benefits:
1. **Centralized Source Code & Version Control:** All project code, inspection matrices, open heads definitions, GIS maps, and documentation are securely backed up in your organization's GitHub repository.
2. **100% Free Online Operation via GitHub Pages:** GitHub will automatically compile and host the software on a global, high-speed CDN with free SSL encryption (`https://`). Field inspectors, provincial coordinators, and HQ management can operate the software live from any smartphone, tablet, or desktop anywhere in Pakistan without paying any web hosting fees.

---

### Step 1: Create a New GitHub Repository (Takes 30 Seconds)

1. Open your web browser and log in to [GitHub](https://github.com/).
2. Click the **`+`** icon in the top right corner and select **New repository**, or visit [https://github.com/new](https://github.com/new).
3. Fill in the details:
   - **Repository name:** `fgrf-water-projects-audit` (or your preferred name)
   - **Description:** `Faizan Global Relief Foundation (FGRF) - Water Projects Audit & Monitoring System`
   - **Visibility:** Choose **Public** (required for free GitHub Pages) or **Private** (if your organization has GitHub Pro/Enterprise).
   - **Initialize repository:** Leave all checkboxes **unchecked** (do NOT check "Add a README file", do NOT check ".gitignore").
4. Click the green button **"Create repository"** (پراجیکٹ بنائیں).
5. Copy your repository HTTPS URL. It will look like:  
   `https://github.com/YOUR_USERNAME/fgrf-water-projects-audit.git`

---

### Step 2: Push the Software to GitHub

#### Option A: 1-Click Automated Batch Tool (Recommended)
1. In your project folder on your computer, double-click:
   `push-to-github.bat`
2. When prompted:
   `Enter your GitHub Repository URL:`
3. Paste your repository link and press **Enter**.
4. The tool will:
   - Verify the production build.
   - Stage all code and resources.
   - Commit under the MIS Department attribution.
   - Push the complete codebase to your GitHub `main` branch.

#### Option B: Manual Terminal Commands
If you prefer running commands directly in PowerShell or Command Prompt:
```bash
# 1. Initialize git
git init

# 2. Configure author details
git config user.name "Syed Waqas"
git config user.email "waqas.mis@fgrf.org"

# 3. Create main branch
git branch -M main

# 4. Add all files
git add .

# 5. Commit
git commit -m "FGRF Water Projects Audit & Monitoring System v3.0 - Ready for Online Operation"

# 6. Link to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/fgrf-water-projects-audit.git

# 7. Push to GitHub
git push -u origin main --force
```

---

### Step 3: Activate GitHub Pages for Online Web Operating

The deployment workflow can enable **GitHub Pages** automatically. Before running it for the first time, create a fine-grained personal access token limited to this repository with **Pages: Read and write** permission, then save it as the `PAGES_DEPLOY_TOKEN` Actions secret:

1. Create a fine-grained token for this repository and grant it **Pages: Read and write** permission.
2. Open the repository's **Settings** → **Secrets and variables** → **Actions**.
3. Add a repository secret named `PAGES_DEPLOY_TOKEN` and paste the token as its value. Do not commit the token or share it in chat.
4. Run the `Deploy FGRF Water Projects System to GitHub Pages` workflow. Its setup step will enable Pages and configure the site for GitHub Actions.
5. Within 60 seconds of a successful run, your system will be **LIVE ONLINE** at:
   ```
   https://YOUR_USERNAME.github.io/fgrf-water-projects-audit/
   ```

If organization policy prevents the workflow from enabling Pages, enable it manually in **Settings** → **Pages** → **Build and deployment** → **Source** → **GitHub Actions**.

---

### Step 4: Operating the System Online

Now that the software is live on GitHub Pages:
1. **For Field Inspectors & Supervisors (Mobile / Smartphone):**
   - Open the URL in Google Chrome or Safari on mobile.
   - Tap Chrome menu -> **"Add to Home screen"** (ہوم اسکرین پر شامل کریں).
   - The app installs as a native mobile icon on their phone for fast field access.
   - Field staff log in with their assigned credentials (e.g. ID `FGRF-INS-101`, Password `1234`).
   - The system opens directly to the **New Inspection** form.
2. **For Super Admin & HQ Management (Desktop):**
   - Open the URL on desktop.
   - Log in with Super Admin credentials (`42101-1234567-1`, `admin123`).
   - Access all 10 modules: Central Audit Dashboard, GIS Pakistan Map, Open Heads Configuration, Activity Logs, User Management, Reports & Master Database.

---

### Optional: Connecting GitHub to Google Cloud

If you also wish to connect your GitHub repository to Google Cloud:
1. Go to **Google Cloud Console** -> **Cloud Run** -> **Create Service**.
2. Select **"Continuously deploy from a repository"**.
3. Select this GitHub repository.
4. Any future commit you push to GitHub will automatically build and deploy to Google Cloud as well!
