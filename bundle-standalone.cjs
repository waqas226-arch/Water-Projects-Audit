const fs = require('fs');
const path = require('path');

// Read built files from dist
const distDir = path.resolve(__dirname, 'dist');
const assetsDir = path.resolve(distDir, 'assets');

const files = fs.readdirSync(assetsDir);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('Could not find CSS or JS bundle in dist/assets!');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

// Read the template from index.html or dist/index.html
const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FGRF – Water Projects Audit & Monitoring System</title>
    <meta name="description" content="Online installation, functionality audit and corrective action management system for FGRF water projects across Pakistan." />
    <meta name="author" content="Syed Waqas, Manager MIS – FGRF Data Management & ERP Department" />
    <meta name="copyright" content="This software making rights & reserved and copyright by FGRF - Data Management & ERP Department. Syed Waqas, Manager MIS. All rights reserved." />
    <meta property="og:title" content="FGRF – Water Projects Audit & Monitoring System" />
    <meta property="og:description" content="Online installation, functionality audit and corrective action management system for FGRF water projects across Pakistan." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <style>
${cssContent}
    </style>
  </head>
  <body class="bg-slate-50 text-slate-800 antialiased font-sans selection:bg-emerald-500 selection:text-white">
    <div id="root"></div>
    <script type="module">
${jsContent}
    </script>
  </body>
</html>
`;

// Write to root index.html and dist/index.html
fs.writeFileSync(path.resolve(__dirname, 'index.html'), htmlTemplate, 'utf8');
fs.writeFileSync(path.resolve(distDir, 'index.html'), htmlTemplate, 'utf8');
console.log('Successfully generated standalone self-contained index.html!');
