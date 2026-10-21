const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      background: #00142c;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 80px 100px;
      position: relative;
      overflow: hidden;
    }
    .glow-1 {
      position: absolute;
      top: -200px;
      right: -100px;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(0, 229, 200, 0.18) 0%, transparent 65%);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      bottom: -200px;
      left: -100px;
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 65%);
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
    }
    .logo-box {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .logo-teal { color: #00E5C8; }
    .badge-tag {
      background: rgba(0, 229, 200, 0.1);
      border: 1px solid rgba(0, 229, 200, 0.35);
      color: #00E5C8;
      padding: 8px 18px;
      border-radius: 999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
    }
    .hero {
      z-index: 2;
      max-width: 1300px;
      margin-top: 20px;
    }
    .hero-title {
      font-size: 64px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -2px;
      margin-bottom: 24px;
    }
    .hero-title span {
      color: #00E5C8;
    }
    .hero-sub {
      font-size: 24px;
      line-height: 1.5;
      color: #94a3b8;
      max-width: 1000px;
      margin-bottom: 50px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }
    .metric-card {
      background: rgba(4, 36, 74, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
      backdrop-filter: blur(12px);
    }
    .metric-val {
      font-size: 38px;
      font-weight: 900;
      color: #00E5C8;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 6px;
    }
    .metric-lbl {
      font-size: 15px;
      color: #cbd5e1;
      font-weight: 600;
    }
    .footer-bar {
      z-index: 2;
      background: rgba(2, 20, 44, 0.95);
      border: 1px solid rgba(0, 229, 200, 0.3);
      border-radius: 20px;
      padding: 24px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .contact-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .contact-kicker {
      font-size: 12px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .contact-value {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class='glow-1'></div>
  <div class='glow-2'></div>
  
  <div class='header'>
    <div class='logo-box'>
      <div class='logo-text'>Doca<span class='logo-teal'>OS</span></div>
      <div class='badge-tag'>PATIO & DOCK OPERATING SYSTEM</div>
    </div>
    <div style='display:flex; gap: 12px;'>
      <div class='badge-tag' style='color:#38bdf8; border-color: rgba(56, 189, 248, 0.3);'>LEI 11.442/07</div>
      <div class='badge-tag' style='color:#34d399; border-color: rgba(52, 211, 153, 0.3);'>ISO 9001 / OEA</div>
      <div class='badge-tag' style='color:#f59e0b; border-color: rgba(245, 158, 11, 0.3);'>SAP & TOTVS READY</div>
    </div>
  </div>

  <div class='hero'>
    <h1 class='hero-title'>
      Transforme seu Pátio em uma Operação <span>Ágil, Segura e Lucrativa</span>.
    </h1>
    <p class='hero-sub'>
      Elimine filas na portaria com check-in em segundos, automatize chamadas por WhatsApp e proteja seu centro de distribuição contra cobranças indevidas de sobreestadia.
    </p>

    <div class='metrics'>
      <div class='metric-card'>
        <div class='metric-val'>&lt; 40s</div>
        <div class='metric-lbl'>Check-in Óptico na Portaria</div>
      </div>
      <div class='metric-card'>
        <div class='metric-val'>Zero</div>
        <div class='metric-lbl'>Conflito de Docas (Slots 2h)</div>
      </div>
      <div class='metric-card'>
        <div class='metric-val'>100%</div>
        <div class='metric-lbl'>Blindagem Lei 11.442/07</div>
      </div>
      <div class='metric-card'>
        <div class='metric-val'>+40%</div>
        <div class='metric-lbl'>Aumento de Giro de Frota</div>
      </div>
    </div>
  </div>

  <div class='footer-bar'>
    <div class='contact-item'>
      <span class='contact-kicker'>PORTAL OFICIAL & SANDBOX</span>
      <span class='contact-value' style='color: #00E5C8;'>docaos.log.br</span>
    </div>
    <div class='contact-item'>
      <span class='contact-kicker'>WHATSAPP CONSULTIVO</span>
      <span class='contact-value' style='color: #34d399;'>(27) 99617-4965</span>
    </div>
    <div class='contact-item'>
      <span class='contact-kicker'>E-MAIL CORPORATIVO</span>
      <span class='contact-value'>contato@raostecnologia.com.br</span>
    </div>
    <div class='contact-item' style='text-align: right;'>
      <span class='contact-kicker'>EMPRESA DESENVOLVEDORA</span>
      <span class='contact-value'>RAOS Tecnologia</span>
    </div>
  </div>
</body>
</html>
`;

const tmp = path.resolve('c:/Users/ricar/Documents/dev-workspace/DocaOS/screen_recordings/snapshots/temp_closing.html');
fs.writeFileSync(tmp, html, 'utf8');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file://' + tmp, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve('c:/Users/ricar/Documents/dev-workspace/DocaOS/screen_recordings/snapshots/scene_11_encerramento.png') });
  await browser.close();
  console.log('Closing scene rendered with perfection!');
})();
