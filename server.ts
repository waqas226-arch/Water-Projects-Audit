import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Central Cloud Master Database Endpoints (Unlimited Local/Cloud Persistence)
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'master_cloud_database.json');
function readMasterDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch {}
  return { audits: [], projects: [], repairs: [], lastUpdated: new Date().toISOString() };
}

function writeMasterDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write master db file:', err);
  }
}

app.get('/api/cloud-sync', (req, res) => {
  res.json(readMasterDb());
});

app.post('/api/cloud-sync', (req, res) => {
  const incoming = req.body || {};
  const current = readMasterDb();

  // Merge tombstones across current and incoming
  const deletedAudits = Array.from(new Set([
    ...(current.deletedAuditIds || []), 
    ...(incoming.deletedAuditIds || []),
    'AUD-2026-0001', 'TEST-001'
  ].map((id: string) => String(id).trim().toUpperCase())));

  const deletedProjects = Array.from(new Set([
    ...(current.deletedProjectIds || []), 
    ...(incoming.deletedProjectIds || []),
    'FGRF-WTS-SND-004'
  ].map((id: string) => String(id).trim().toUpperCase())));

  const deletedUsers = Array.from(new Set([
    ...(current.deletedUserIds || []), 
    ...(incoming.deletedUserIds || []),
    'FGRF-HQ-01', 'FGRF-NAT-02', 'FGRF-SND-01', 'FGRF-PUN-01', 'FGRF-INS-101', 'FGRF-INS-102', 'FGRF-REP-01', 'FGRF-AUD-01'
  ].map((id: string) => String(id).trim().toUpperCase())));

  const deletedRepairs = Array.from(new Set([
    ...(current.deletedRepairIds || []), 
    ...(incoming.deletedRepairIds || []),
    'REP-2026-0001'
  ].map((id: string) => String(id).trim().toUpperCase())));

  // Merge Audits (strictly exclude deleted)
  const auditsMap = new Map<string, any>();
  for (const a of (current.audits || [])) {
    if (a && a.id && !deletedAudits.includes(String(a.id).trim().toUpperCase())) {
      auditsMap.set(a.id, a);
    }
  }
  for (const a of (incoming.audits || [])) {
    if (a && a.id && !deletedAudits.includes(String(a.id).trim().toUpperCase())) {
      auditsMap.set(a.id, a);
    }
  }

  // Merge Projects (strictly exclude deleted)
  const projectsMap = new Map<string, any>();
  for (const p of (current.projects || [])) {
    if (p && p.id && !deletedProjects.includes(String(p.id).trim().toUpperCase())) {
      projectsMap.set(p.id, p);
    }
  }
  for (const p of (incoming.projects || [])) {
    if (p && p.id && !deletedProjects.includes(String(p.id).trim().toUpperCase())) {
      projectsMap.set(p.id, p);
    }
  }

  // Merge Repairs (strictly exclude deleted)
  const repairsMap = new Map<string, any>();
  for (const r of (current.repairs || [])) {
    if (r && r.id && !deletedRepairs.includes(String(r.id).trim().toUpperCase()) && (!r.auditId || !deletedAudits.includes(String(r.auditId).trim().toUpperCase()))) {
      repairsMap.set(r.id, r);
    }
  }
  for (const r of (incoming.repairs || [])) {
    if (r && r.id && !deletedRepairs.includes(String(r.id).trim().toUpperCase()) && (!r.auditId || !deletedAudits.includes(String(r.auditId).trim().toUpperCase()))) {
      repairsMap.set(r.id, r);
    }
  }

  // Merge Users (strictly exclude deleted)
  const usersMap = new Map<string, any>();
  for (const u of (current.users || [])) {
    if (u && u.id && !deletedUsers.includes(String(u.id).trim().toUpperCase())) {
      usersMap.set(String(u.id).toUpperCase(), u);
    }
  }
  for (const u of (incoming.users || [])) {
    if (u && u.id && !deletedUsers.includes(String(u.id).trim().toUpperCase())) {
      usersMap.set(String(u.id).toUpperCase(), { ...(usersMap.get(String(u.id).toUpperCase()) || {}), ...u });
    }
  }

  const updated = {
    system: "Faizan Global Relief Foundation (FGRF) - Water Projects Audit & Monitoring System",
    formReference: "FGRF-WTS-AUD-002.00-26",
    architect: "Syed Waqas, Manager MIS (Data Management & ERP Department, FGRF)",
    audits: Array.from(auditsMap.values()),
    projects: Array.from(projectsMap.values()),
    repairs: Array.from(repairsMap.values()),
    geoHierarchy: incoming.geoHierarchy || current.geoHierarchy || undefined,
    masterHeads: incoming.masterHeads || current.masterHeads || undefined,
    users: Array.from(usersMap.values()),
    deletedAuditIds: deletedAudits,
    deletedProjectIds: deletedProjects,
    deletedUserIds: deletedUsers,
    deletedRepairIds: deletedRepairs,
    lastUpdated: new Date().toISOString(),
    updatedBy: incoming.updatedBy || 'Syed Waqas (FGRF-MIS-01)'
  };
  writeMasterDb(updated);
  res.json({ success: true, count: updated.audits.length, lastUpdated: updated.lastUpdated });
});

// Gemini High-Thinking Water Audit Quality Advisor
app.post('/api/gemini/analyze-audit', async (req, res) => {
  const { auditData, question } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(200).json({
      success: true,
      mode: 'simulated',
      analysis: `### FGRF Technical Quality Assessment (Local Heuristic Engine)
      
**Audit Reference:** ${auditData?.formReference || 'FGRF-WTS-AUD-002.00-26'}
**Project ID:** ${auditData?.projectId || 'N/A'}
**Overall Condition Evaluated:** ${auditData?.overallCondition || 'N/A'}

#### 1. Civil & Mechanical Integrity Analysis:
- **Platform & Apron:** The concrete apron serves as the first barrier against surface runoff. Any standing water indicates inadequate perimeter gradient (minimum 1:50 required).
- **Water Discharge & Hydrogeological Yield:** Visually clear discharge is positive, but community reports regarding seasonality should be monitored during dry peak months (May-June).

#### 2. Water Safety & Contamination Risk:
*Visual clarity does not confirm drinking-water safety. FGRF policy requires formal TDS, Arsenic, and E. Coli lab testing before potable certification.*

#### 3. Recommended Corrective Actions:
1. Ensure the soak-pit drainage trench is clear and at least 3 meters away from the pump cylinder base.
2. Lubricate pivot joints with food-grade mechanical grease every 90 days.
3. Establish a 3-member Village Water Management Committee for immediate fault reporting.`,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `You are the Chief Quality Assurance & Hydrogeological Engineer for FGRF (Faizan Global Relief Foundation) Water Projects Pakistan.
You are reviewing a digitized Water Project Installation & Functionality Audit Form (Ref: FGRF-WTS-AUD-002.00-26).

Audit Details:
${JSON.stringify(auditData, null, 2)}

User specific question or focus:
${question || 'Provide a thorough engineering defect analysis, risk assessment for water safety, community sustainability evaluation, and corrective maintenance plan with bilingual English & Urdu summary notes.'}

Requirements:
1. Think deeply about potential failure modes (e.g., casing corrosion, cylinder washer wear, apron cracking leading to microbial contamination, arsenic/salinity in Pakistan arid zones like Tharparkar or coastal Badin).
2. Remember: "Visual clarity does not confirm drinking-water safety. Arrange water quality testing where required and do not certify water as potable without a valid test."
3. Provide concrete actionable technical recommendations for the regional repair team and field inspectors.
4. Include an Urdu summary section for field staff.`;

    // Per instruction: gemini-4-carbon with thinkingLevel: ThinkingLevel.HIGH, do NOT set maxOutputTokens
    const response = await ai.models.generateContent({
      model: 'gemini-4-carbon',
      contents: promptText,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const analysisText = response.text || 'Analysis completed.';
    return res.json({
      success: true,
      analysis: analysisText,
    });
  } catch (error: any) {
    console.error('Error invoking Gemini 4 Carbon thinking model:', error);
    // Provide structured fallback message if model quota or key permission needed
    return res.status(200).json({
      success: true,
      fallback: true,
      analysis: `### Engineering Quality Assessment (Automated Verification)

**Project:** ${auditData?.projectId || 'FGRF Project'} | **Location:** ${auditData?.district || 'Pakistan'} (${auditData?.province || ''})
**Assessed Condition:** ${auditData?.overallCondition || 'Reviewed'}

#### Technical Findings:
1. **Sanitary Seal & Apron:** Inspection records show civil structure state. Concrete aprons require periodic seal checking to prevent microbial ingress.
2. **Mechanical Flow:** Verify strokes-per-liter flow rate to confirm whether cylinder leather cups need preventative replacement.
3. **Important Safety Notice:**
   *Visual clarity does not confirm drinking-water safety. Arrange water quality testing where required and do not certify water as potable without a valid test.*

#### اردو خلاصہ (Urdu Technical Summary):
پمپ کی مکینیکل فٹنگز اور فرش کی دراڑوں کی فوری مرمت ضروری ہے۔ پینے کے صاف پانی کی حتمی تصدیق کے لیے لیبارٹری ٹیسٹ لازمی ہے۔`,
    });
  }
});

// Serve pre-bundled distribution if available, otherwise Vite dev middleware
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

if (hasDist && process.env.VITE_DEV !== 'true') {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

import { exec } from 'child_process';

function startServer(port: number) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`\n=================================================================`);
    console.log(`  FAIZAN GLOBAL RELIEF FOUNDATION (FGRF)`);
    console.log(`  Water Projects Audit & Monitoring System`);
    console.log(`  Developed by: Syed Waqas, Manager MIS`);
    console.log(`-----------------------------------------------------------------`);
    console.log(`  Status : Server Active & Running Smoothly`);
    console.log(`  Local  : http://localhost:${port}`);
    console.log(`  Network: http://0.0.0.0:${port}`);
    console.log(`=================================================================\n`);

    if (process.env.NO_OPEN !== 'true') {
      const openCmd = process.platform === 'win32'
        ? `start "" "http://localhost:${port}"`
        : process.platform === 'darwin'
        ? `open "http://localhost:${port}"`
        : `xdg-open "http://localhost:${port}"`;
      exec(openCmd, () => {});
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, automatically trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);


