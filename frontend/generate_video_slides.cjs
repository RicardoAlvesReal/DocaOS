const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SNAP_DIR = path.resolve('c:/Users/ricar/Documents/dev-workspace/DocaOS/screen_recordings/snapshots');
const OUT_DIR = path.resolve('c:/Users/ricar/Documents/dev-workspace/DocaOS/screen_recordings/verified_frames');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SCENES_META = [
  {
    id: 'scene_01_landing',
    kicker: 'DOCAOS YMS • VISÃO GERAL DA PLATAFORMA',
    title: 'Sistema Operacional de Pátios & Agendamento Inteligente de Docas',
    tag: 'Redução de Custos • Zero Filas na Portaria',
    badgeColor: '#00E5C8'
  },
  {
    id: 'scene_02_login',
    kicker: 'ACESSO OPERACIONAL CORPORATIVO',
    title: 'Arquitetura em Nuvem Multi-Tenant & Alta Performance',
    tag: 'Segurança JWT • Criptografia Bcrypt • Modo Sandbox Integrado',
    badgeColor: '#38bdf8'
  },
  {
    id: 'scene_03_torre_kanban',
    kicker: 'TORRE DE CONTROLE KANBAN • TEMPO REAL',
    title: 'Visão Macro do Pátio & Blindagem sob a Lei Federal 11.442/07',
    tag: 'Tolerância de 5h Calculada Automaticamente • Alertas de Estadia',
    badgeColor: '#ef4444'
  },
  {
    id: 'scene_04_docas',
    kicker: 'GESTÃO & AGENDAMENTO DE DOCAS',
    title: 'Mapeamento Físico de Baias e Calendário em Slots (Gantt)',
    tag: '+40% de Giro de Carretas • Chamada Automática via WhatsApp',
    badgeColor: '#10b981'
  },
  {
    id: 'scene_05_mapa_gps',
    kicker: 'MAPA DO PÁTIO & CERCA ELETRÔNICA GPS',
    title: 'Geofencing Anti-Fraude com Auditoria de Presença por Satélite',
    tag: 'Comprovação Jurídica • Início de Estadia Apenas no Perímetro do CD',
    badgeColor: '#00E5C8'
  },
  {
    id: 'scene_06_portaria',
    kicker: 'PORTARIA EXPRESS & CANCELA INTELIGENTE',
    title: 'Leitor Óptico de Placas, QR Code e Checklist de Lacres OEA',
    tag: 'Liberação em < 40 Segundos • Vistoria Fotográfica Preventiva',
    badgeColor: '#f59e0b'
  },
  {
    id: 'scene_07_crachas',
    kicker: 'CRACHÁ DIGITAL DE PEDESTRES & AJUDANTES',
    title: 'Credenciamento Instantâneo de Chapas, Terceiros e Fiscais',
    tag: 'Envio Direto no WhatsApp • Padrão Visual PVC para Crachá de Bolso',
    badgeColor: '#a855f7'
  },
  {
    id: 'scene_08_motorista_pwa',
    kicker: 'PORTAL DO MOTORISTA PWA • SEM INSTALAÇÃO',
    title: 'Interface Mobile Ágil com Notificação e Chamada para Doca',
    tag: 'Acesso Direto pelo Navegador • Elimina Aplicativos e Cadastros Complexos',
    badgeColor: '#10b981'
  },
  {
    id: 'scene_09_transportador',
    kicker: 'PORTAL DO TRANSPORTADOR • AUTOAGENDAMENTO',
    title: 'Reserva Autônoma de Janelas Horárias com Anexação de NF-e',
    tag: 'Redução de 90% em E-mails/Ligações • Validação Técnica de Frota',
    badgeColor: '#38bdf8'
  },
  {
    id: 'scene_10_relatorios',
    kicker: 'RELATÓRIOS EXECUTIVOS & AUDITORIA DE SLA',
    title: 'Indicadores de Dwell Time, Ociosidade e Laudos Probatórios',
    tag: 'Conformidade Fiscal e Jurídica • Exportação em Excel e PDF',
    badgeColor: '#00E5C8'
  },
  {
    id: 'scene_11_encerramento',
    kicker: 'RAOS TECNOLOGIA • IMPLANTAÇÃO IMEDIATA',
    title: 'docaos.log.br • Transforme seu Pátio em uma Operação Ágil',
    tag: 'WhatsApp: (27) 99617-4965 • contato@raostecnologia.com.br',
    badgeColor: '#00E5C8'
  }
];

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const ext = path.extname(filePath).replace('.', '');
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

async function renderFrames() {
  console.log('Iniciando renderização de molduras cinematográficas...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  for (const item of SCENES_META) {
    const imgPath = path.join(SNAP_DIR, `${item.id}.png`);
    const bgBase64 = getBase64Image(imgPath);

    // Skip overlay on scene_11 if it is already a full dedicated slide, or add a subtle footer
    const isSlide = item.id === 'scene_11_encerramento';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      background: #000c1c;
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative;
      overflow: hidden;
    }
    .bg-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      background-image: url('${bgBase64}');
      background-size: cover;
      background-position: center;
    }
    .vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      background: radial-gradient(circle at center, transparent 65%, rgba(0, 10, 24, 0.6) 100%),
                  linear-gradient(to top, rgba(0, 10, 24, 0.95) 0%, rgba(0, 10, 24, 0.4) 18%, transparent 40%);
      pointer-events: none;
    }
    .top-badge {
      position: absolute;
      top: 24px;
      right: 32px;
      background: rgba(0, 20, 44, 0.85);
      border: 1px solid rgba(0, 229, 200, 0.35);
      border-radius: 999px;
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00E5C8;
      box-shadow: 0 0 10px #00E5C8;
    }
    .top-badge-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: 0.5px;
    }
    .lower-third {
      position: absolute;
      bottom: 28px;
      left: 40px;
      right: 40px;
      background: rgba(0, 18, 40, 0.9);
      border: 1px solid rgba(0, 229, 200, 0.3);
      border-radius: 18px;
      padding: 18px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(16px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
    }
    .kicker {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: ${item.badgeColor};
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kicker-pill {
      background: rgba(0, 229, 200, 0.15);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .title {
      font-size: 23px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .tag-box {
      background: rgba(4, 36, 74, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      text-align: right;
    }
    .tag-highlight {
      color: #00E5C8;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class='bg-layer'></div>
  <div class='vignette'></div>

  <div class='top-badge'>
    <div class='live-dot'></div>
    <div class='top-badge-text'>DocaOS • YMS Enterprise</div>
  </div>

  ${!isSlide ? `
  <div class='lower-third'>
    <div>
      <div class='kicker'>
        <span class='kicker-pill'>${item.kicker}</span>
      </div>
      <div class='title'>${item.title}</div>
    </div>
    <div class='tag-box'>
      <span>${item.tag}</span>
    </div>
  </div>
  ` : ''}
</body>
</html>
    `;

    const tmpFile = path.join(OUT_DIR, `temp_${item.id}.html`);
    fs.writeFileSync(tmpFile, html, 'utf8');

    await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle0' });
    const outPng = path.join(OUT_DIR, `${item.id}.png`);
    await page.screenshot({ path: outPng });
    console.log(`[Frame Gerado] ${item.id} -> ${outPng}`);
    try { fs.unlinkSync(tmpFile); } catch(e){}
  }

  await browser.close();
  console.log('Todos os 11 frames finais gerados com sucesso!');
}

renderFrames().catch(console.error);
