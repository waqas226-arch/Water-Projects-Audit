# FGRF – Water Projects Audit & Monitoring System
**Faizan Global Relief Foundation** • Data Management & ERP Department  
**Author:** Syed Waqas, Manager MIS

---

## ⚡ How to Run on PC (Fast & Smooth)

### Option 1: One-Click Double Click (Recommended)
Simply double-click the **`START_APP.bat`** file in this folder.
- The server will start automatically.
- Your default web browser will automatically open with the active system!

### Option 2: Command Line
Open PowerShell or Command Prompt in this directory and run:
```bash
npm start
```
or
```bash
npm run dev
```

### Option 3: Create Desktop Shortcut
Double-click **`CREATE_DESKTOP_SHORTCUT.bat`** to place a direct shortcut on your Windows Desktop.

---

## ℹ️ Why Direct `index.html` Double-Clicking Doesn't Work
Modern web applications built with React, Vite, and TypeScript use ECMAScript modules and JSX compilation. Web browsers do not allow loading modules via the raw `file://` protocol due to security/CORS restrictions. Running through `START_APP.bat` serves the files through a high-performance local server, ensuring full functionality, interactive maps, Excel exports, and AI analysis.
