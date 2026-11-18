const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const proc = spawn(chromePath, ['--headless', '--disable-gpu', '--remote-debugging-port=9222', 'about:blank']);

setTimeout(async () => {
  try {
    const targets = await new Promise(r => http.get('http://127.0.0.1:9222/json', res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
    }));
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = async () => {
      let id = 1;
      const send = (m, p = {}) => new Promise(res => {
        const myId = id++;
        const h = ev => {
          const msg = JSON.parse(ev.data);
          if (msg.id === myId) { ws.removeEventListener('message', h); res(msg.result); }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: myId, method: m, params: p }));
      });
      
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const results = {};
            try {
              const r = await fetch('https://api.github.com/zen');
              results.github = { status: r.status, text: await r.text() };
            } catch(e) { results.github = { error: e.message }; }
            return results;
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });
      console.log('EDGE BROWSER RESULT:', JSON.stringify(evalRes.result.value));
      proc.kill();
      process.exit(0);
    };
  } catch(e) { console.error(e); proc.kill(); process.exit(1); }
}, 1500);
