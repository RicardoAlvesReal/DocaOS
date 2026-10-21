const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE_ROOT = 'c:\\Users\\ricar\\Documents\\dev-workspace\\DocaOS';
const SCREENSHOT_DIR = path.resolve(WORKSPACE_ROOT, 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\ricar\\.gemini\\antigravity-ide\\brain\\cb530f90-707c-4c8b-a5da-778fb44f0eb5';
const OUTPUT_PDF_LOCAL = path.resolve(WORKSPACE_ROOT, 'DocaOS_YMS_Apresentacao_Portfolio.pdf');
const OUTPUT_PDF_ARTIFACT = path.resolve(ARTIFACT_DIR, 'DocaOS_YMS_Apresentacao_Portfolio.pdf');

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const ext = path.extname(filePath).replace('.', '');
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

async function buildPdf() {
  console.log('Encoding brand assets and screenshots to base64...');

  // Brand logos
  const logoLight = getBase64Image(path.resolve(WORKSPACE_ROOT, 'frontend/public/docaos-logo.png'));
  const logoDark = getBase64Image(path.resolve(WORKSPACE_ROOT, 'frontend/public/docaos-logo-dark.png'));
  const iconDoca = getBase64Image(path.resolve(WORKSPACE_ROOT, 'frontend/public/docaos-icon.png'));
  const iconRaos = getBase64Image(path.resolve(WORKSPACE_ROOT, 'frontend/public/raos-icon.png'));

  // High-res screenshots
  const imgTorreDark = getBase64Image(path.resolve(ARTIFACT_DIR, '.tempmediaStorage/media_1792577596248.png')) || getBase64Image(path.resolve(SCREENSHOT_DIR, '04_torre_de_controle_kanban.png'));
  const imgTorreLight = getBase64Image(path.resolve(ARTIFACT_DIR, '.tempmediaStorage/media_1792577582479.png'));
  const imgDocas = getBase64Image(path.resolve(ARTIFACT_DIR, 'docks_view_light_1792577318539.png')) || getBase64Image(path.resolve(SCREENSHOT_DIR, '05_gestao_docas.png'));
  const imgGantt = getBase64Image(path.resolve(ARTIFACT_DIR, 'gantt_view_light_1792577346063.png'));
  const imgMapa = getBase64Image(path.resolve(SCREENSHOT_DIR, '06_mapa_patio_geofencing.png'));
  const imgPortaria = getBase64Image(path.resolve(SCREENSHOT_DIR, '07_portaria_cancela.png'));
  const imgMotorista = getBase64Image(path.resolve(SCREENSHOT_DIR, '11_pwa_motorista_chamado.png'));
  const imgTransportador = getBase64Image(path.resolve(SCREENSHOT_DIR, '10_portal_transportador.png'));
  const imgRelatorios = getBase64Image(path.resolve(SCREENSHOT_DIR, '08_relatorios_auditoria_bi.png'));
  const imgIntegracoes = getBase64Image(path.resolve(SCREENSHOT_DIR, '09_integracoes_webhooks.png'));
  const imgSuperAdmin = getBase64Image(path.resolve(SCREENSHOT_DIR, '12_super_admin_raos.png'));
  const imgModalDark = getBase64Image(path.resolve(ARTIFACT_DIR, 'modal_dark_mode_1792601543318.png'));
  const imgModalLight = getBase64Image(path.resolve(ARTIFACT_DIR, 'modal_light_mode_1792601608447.png'));

  // Realistic Logistics Photography
  const photoHub = getBase64Image(path.resolve(ARTIFACT_DIR, 'hero_logistics_hub_1792570973641.jpg'));
  const photoDocks = getBase64Image(path.resolve(ARTIFACT_DIR, 'dock_operations_trucks_1792570993758.jpg'));
  const photoGate = getBase64Image(path.resolve(ARTIFACT_DIR, 'gate_inspection_access_1792571017935.jpg'));
  const photoDriver = getBase64Image(path.resolve(ARTIFACT_DIR, 'driver_mobile_badge_1792571046405.jpg'));

  console.log('Generating executive A4 landscape HTML presentation...');

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DocaOS - Yard & Dock Operating System | Portfólio Corporativo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

    @page {
      size: 297mm 210mm;
      margin: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #00142c;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .slide {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 85% 15%, rgba(0, 168, 150, 0.12) 0%, rgba(0, 20, 44, 1) 70%);
      padding: 13mm 16mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Ambient decor */
    .glow-teal-top {
      position: absolute;
      top: -120px;
      right: -120px;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(0, 168, 150, 0.22) 0%, transparent 70%);
      pointer-events: none;
    }
    .glow-blue-bottom {
      position: absolute;
      bottom: -150px;
      left: -150px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(2, 128, 144, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Header */
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0, 168, 150, 0.25);
      padding-bottom: 9px;
      margin-bottom: 10px;
      position: relative;
      z-index: 10;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-img {
      height: 30px;
      width: auto;
      object-fit: contain;
    }

    .brand-tagline {
      font-size: 11px;
      color: #94a3b8;
      border-left: 1px solid rgba(255, 255, 255, 0.15);
      padding-left: 10px;
      font-weight: 500;
    }

    .slide-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #00E5C8;
    }

    .slide-num {
      background: rgba(0, 168, 150, 0.2);
      border: 1px solid rgba(0, 168, 150, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }

    /* Content Layouts */
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 5;
      justify-content: center;
    }

    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #00E5C8;
      background: rgba(0, 168, 150, 0.15);
      border: 1px solid rgba(0, 168, 150, 0.35);
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 6px;
      width: fit-content;
    }

    .slide-title {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.15;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .slide-title span {
      background: linear-gradient(135deg, #00A896, #00E5C8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .slide-subtitle {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.4;
      max-width: 850px;
      margin-bottom: 14px;
    }

    /* Grid Splits */
    .grid-2col {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 16px;
      align-items: stretch;
      flex: 1;
    }

    .grid-2col-reverse {
      display: grid;
      grid-template-columns: 0.85fr 1.15fr;
      gap: 16px;
      align-items: stretch;
      flex: 1;
    }

    .grid-3col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      flex: 1;
    }

    .grid-4col {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      flex: 1;
    }

    /* Cards */
    .card {
      background: #04244a;
      border: 1px solid rgba(0, 168, 150, 0.25);
      border-radius: 14px;
      padding: 14px 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .card-highlight {
      background: linear-gradient(145deg, #04244a, #001c3d);
      border: 1px solid rgba(0, 229, 200, 0.45);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 14px 30px rgba(0, 168, 150, 0.15);
    }

    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.45;
    }

    /* Screenshot Frames */
    .screenshot-frame {
      border: 1px solid rgba(0, 168, 150, 0.35);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
      background: #00142c;
      display: flex;
      flex-direction: column;
    }

    .browser-topbar {
      background: #001c3d;
      border-bottom: 1px solid rgba(0, 168, 150, 0.2);
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      color: #64748b;
    }

    .dots {
      display: flex;
      gap: 4px;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .url-pill {
      background: rgba(0, 0, 0, 0.4);
      padding: 2px 10px;
      border-radius: 6px;
      color: #00E5C8;
      font-size: 9px;
      margin-left: 8px;
    }

    .screenshot-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
    }

    /* Badges & Metrics */
    .metric-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28px;
      font-weight: 800;
      color: #00E5C8;
      line-height: 1;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 11px;
      color: #cbd5e1;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Footer */
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 8px;
      margin-top: 10px;
      font-size: 10px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }

    .footer-highlight {
      color: #00A896;
      font-weight: 700;
    }

    /* COVER SPECIFICS */
    .cover-slide {
      background: radial-gradient(circle at 80% 25%, rgba(0, 168, 150, 0.25) 0%, rgba(0, 20, 44, 1) 65%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 18mm 20mm;
    }

    .cover-hero-title {
      font-size: 44px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.05;
      letter-spacing: -0.03em;
      margin: 16px 0 12px 0;
    }

    .cover-hero-title span {
      background: linear-gradient(135deg, #00A896 0%, #00E5C8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 15px;
      color: #94a3b8;
      max-width: 780px;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .badge-raos {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(0, 168, 150, 0.35);
      padding: 6px 14px;
      border-radius: 12px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- =================================================================== -->
  <!-- SLIDE 1: CAPA EXECUTIVA (COVER)                                     -->
  <!-- =================================================================== -->
  <div class="slide cover-slide">
    <div class="glow-teal-top"></div>
    <div class="glow-blue-bottom"></div>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;">
      <img src="${logoLight}" alt="DocaOS Logo" style="height: 52px; width: auto;" />
      
      <div class="badge-raos">
        <img src="${iconRaos}" alt="RAOS Tecnologia" style="height: 22px; width: auto;" />
        <div>
          <span style="color: #64748b; font-size: 9px; display: block;">DESENVOLVIDO POR</span>
          <span style="color: #00E5C8; font-weight: 700;">RAOS Tecnologia</span>
        </div>
      </div>
    </div>

    <div style="z-index: 10; margin-top: 10px;">
      <div class="section-tag">YMS & INTELLIGENT DOCK DISPATCHING</div>
      <h1 class="cover-hero-title">
        Doca<span>OS</span> Enterprise<br/>
        O Sistema Operacional de Pátios e Docas
      </h1>
      <p class="cover-subtitle">
        Elimine filas externas, garanta auditoria probatória sob a <strong>Lei Federal 11.442/2007</strong>, proteja a segurança física com <strong>Crachá Digital para terceiros</strong> e impulsione o giro das docas em até 35% com agendamento inteligente.
      </p>

      <div style="display: flex; gap: 14px; margin-top: 10px;">
        <div class="card" style="padding: 10px 16px; background: rgba(0, 28, 61, 0.6);">
          <div style="font-size: 18px; font-weight: 800; color: #00E5C8; font-family: 'JetBrains Mono', monospace;">-85%</div>
          <div style="font-size: 10px; color: #94a3b8;">Multas de Estadia Indevidas</div>
        </div>
        <div class="card" style="padding: 10px 16px; background: rgba(0, 28, 61, 0.6);">
          <div style="font-size: 18px; font-weight: 800; color: #00E5C8; font-family: 'JetBrains Mono', monospace;">&lt; 30s</div>
          <div style="font-size: 10px; color: #94a3b8;">Tempo de Liberação na Guarita</div>
        </div>
        <div class="card" style="padding: 10px 16px; background: rgba(0, 28, 61, 0.6);">
          <div style="font-size: 18px; font-weight: 800; color: #00E5C8; font-family: 'JetBrains Mono', monospace;">100% PWA</div>
          <div style="font-size: 10px; color: #94a3b8;">WhatsApp Sem Instalação de App</div>
        </div>
        <div class="card" style="padding: 10px 16px; background: rgba(0, 28, 61, 0.6);">
          <div style="font-size: 18px; font-weight: 800; color: #00E5C8; font-family: 'JetBrains Mono', monospace;">14 Dias</div>
          <div style="font-size: 10px; color: #94a3b8;">Implantação Ágil em Produção</div>
        </div>
      </div>
    </div>

    <div class="slide-footer" style="z-index: 10;">
      <div>Dossiê Corporativo Oficial • Versão 2.4 Enterprise</div>
      <div>Portal Oficial: <span class="footer-highlight">docaos.log.br</span> | Contato: <span class="footer-highlight">contato@raostecnologia.com.br</span></div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 2: OS 4 GRANDES GARGALOS LOGÍSTICOS                           -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Diagnóstico Operacional</span>
      </div>
      <div class="slide-meta"><span class="slide-num">02</span><span>CENÁRIO ATUAL</span></div>
    </div>

    <div class="slide-body">
      <div class="section-tag">OS GARGALOS INVISÍVEIS DA LOGÍSTICA</div>
      <h2 class="slide-title">Por que Pátios Sem <span>DocaOS</span> Perdem Milhões?</h2>
      <p class="slide-subtitle">Centros de distribuição operam frequentemente no escuro. A falta de controle probatório e de sincronização entre guarita e docas corrói a margem operacional de transportadores e embarcadores.</p>

      <div class="grid-4col">
        <div class="card">
          <div style="font-size: 24px; margin-bottom: 6px;">⚖️</div>
          <div class="card-title" style="color: #ef4444;">1. Multas de Estadia Indevidas</div>
          <div class="card-desc">
            A <strong>Lei 11.442/2007</strong> estipula multa de R$ 2,21+/t/hora após 5 horas. Sem cerca GPS probatória, transportadoras cobram diárias astronômicas com base em alegações verbais.
          </div>
        </div>

        <div class="card">
          <div style="font-size: 24px; margin-bottom: 6px;">🚛</div>
          <div class="card-title" style="color: #f59e0b;">2. Filas Externas & Picos</div>
          <div class="card-desc">
            Caminhões chegam desordenadamente nos mesmos horários matinais. A portaria vira um gargalo, gerando filas em rodovias, riscos de roubo de carga e multas de trânsito.
          </div>
        </div>

        <div class="card">
          <div style="font-size: 24px; margin-bottom: 6px;">📢</div>
          <div class="card-title" style="color: #38bdf8;">3. Rádio, Buzinas & Pedestres</div>
          <div class="card-desc">
            Comunicação manual por walkie-talkie ou buzina. Motoristas e ajudantes circulam a pé pelo pátio entre carretas em manobra, criando graves riscos de segurança do trabalho e acidentes.
          </div>
        </div>

        <div class="card">
          <div style="font-size: 24px; margin-bottom: 6px;">📉</div>
          <div class="card-title" style="color: #a855f7;">4. Docas Ociosas sem Visibilidade</div>
          <div class="card-desc">
            O gestor não sabe em tempo real se uma doca está livre, terminando ou travada aguardando conferente. O armazém opera com 30% a menos da sua capacidade potencial de giro.
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Estudo de Produtividade Logística</div>
      <div>Eliminação do caos na esteira de recebimento e expedição</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 3: A ARQUITETURA DA SOLUÇÃO DOCAOS                           -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Esteira Operacional</span>
      </div>
      <div class="slide-meta"><span class="slide-num">03</span><span>ARQUITETURA DA PLATAFORMA</span></div>
    </div>

    <div class="slide-body">
      <div class="section-tag">FLUXO INTEGRADO DE PONTA A PONTA</div>
      <h2 class="slide-title">Da Convocação à Liberação: <span>Fluxo Contínuo e Automatizado</span></h2>
      <p class="slide-subtitle">O DocaOS orquestra cada estágio da passagem do caminhão e dos terceiros pelo centro de distribuição com automação em nuvem.</p>

      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 5px;">
        <div class="card-highlight" style="padding: 12px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700; margin-bottom: 4px;">ETAPA 01</div>
          <div class="card-title" style="font-size: 12px;">Agendamento de Slots</div>
          <div class="card-desc" style="font-size: 10px;">Transportador agenda janela de horário com validação de tipo de baú e temperatura.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700; margin-bottom: 4px;">ETAPA 02</div>
          <div class="card-title" style="font-size: 12px;">Cerca GPS Auditada</div>
          <div class="card-desc" style="font-size: 10px;">Raio geográfico de 1.500m audita o momento real da chegada sob a Lei 11.442/2007.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700; margin-bottom: 4px;">ETAPA 03</div>
          <div class="card-title" style="font-size: 12px;">Portaria & Crachás</div>
          <div class="card-desc" style="font-size: 10px;">Check-in express com scanner OCR e emissão de Crachá Digital com QR Code para ajudantes.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700; margin-bottom: 4px;">ETAPA 04</div>
          <div class="card-title" style="font-size: 12px;">Chamada WhatsApp</div>
          <div class="card-desc" style="font-size: 10px;">Convocação para a doca exata disparada no WhatsApp do motorista sem exigir aplicativo.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700; margin-bottom: 4px;">ETAPA 05</div>
          <div class="card-title" style="font-size: 12px;">Auditoria & Laudo</div>
          <div class="card-desc" style="font-size: 10px;">Geração de Laudo Pericial em PDF assinado com carimbo probatório para defesa jurídica.</div>
        </div>
      </div>

      <div style="margin-top: 14px; background: rgba(0, 168, 150, 0.08); border: 1px solid rgba(0, 168, 150, 0.3); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 11px; color: #e2e8f0;">
          <strong>Compatibilidade Corporativa:</strong> Conectividade nativa com <strong>SAP, TOTVS Protheus, Oracle, Senior WMS</strong> e qualquer TMS via REST APIs & Webhooks seguros.
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #00E5C8; font-weight: 700;">100% CLOUD & MULTI-TENANT</div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Arquitetura Operacional de Ponta a Ponta</div>
      <div>Sincronização em tempo real entre Pátio, Portaria, Docas e ERP</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 4: TORRE DE CONTROLE & KANBAN DINÂMICO                        -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Torre de Controle</span>
      </div>
      <div class="slide-meta"><span class="slide-num">04</span><span>OPERAÇÃO EM TEMPO REAL</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col">
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">GESTÃO VISUAL POR QUADRO KANBAN</div>
            <h2 class="slide-title">Visibilidade 360° do <span>Pátio em Tempo Real</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Cada carga é monitorada desde o agendamento prévio até a saída da cancela com cronômetro regressivo de SLA e alertas automáticos de custo de estadia.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">⏱️ Cronômetro Ativo & SLA de Permanência</div>
                <div class="card-desc">Contagem em tempo real dos minutos de cada veículo em cada fase. Alerta visual em vermelho antes de gerar custo de sobreestadia.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📲 Disparo Instantâneo para o Motorista</div>
                <div class="card-desc">Botão integrado para chamar o motorista para a doca via WhatsApp com 1 clique direto no cartão.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📁 Importação em Lote via Planilha CSV</div>
                <div class="card-desc">Suba a grade diária completa de dezenas de carretas em segundos com processamento de inconsistências.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app • Torre de Controle</span>
          </div>
          <img src="${imgTorreDark}" alt="Torre de Controle DocaOS" class="screenshot-img" />
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Torre de Controle Operacional</div>
      <div>Quadro Kanban dinâmico com atualização por WebSocket</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 5: GESTÃO DE DOCAS & CRONOGRAMA GANTT                         -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Gestão de Baias</span>
      </div>
      <div class="slide-meta"><span class="slide-num">05</span><span>GESTÃO OPERACIONAL DE DOCAS</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col-reverse">
        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/docks • Grade & Gantt</span>
          </div>
          <img src="${imgDocas}" alt="Gestão de Docas DocaOS" class="screenshot-img" />
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">MAXIMIZE O GIRO DAS SUAS BAIAS</div>
            <h2 class="slide-title">+35% de Throughput <span>Sem Obras no CD</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Visualização em Grade de Baias Físicas e Linha do Tempo (Gantt) para alocação precisa de time slots por tipo de mercadoria e equipamento.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🚪 Status Visual das Baias em Tempo Real</div>
                <div class="card-desc">Identifique imediatamente docas <strong>Livres</strong>, <strong>Ocupadas</strong> com identificação do veículo ou em <strong>Manutenção</strong>.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">❄️ Compatibilidade de Carroceria & Refrigeração</div>
                <div class="card-desc">Filtre docas equipadas para carga seca, sider, baú fechado ou refrigerada (Reefer/Termoking).</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📅 Linha do Tempo (Gantt Interativo)</div>
                <div class="card-desc">Visão horizontal das 24 horas do dia, prevenindo sobreposição de agendamentos e ociosidade de equipes de conferência.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Módulo de Agendamento e Docas</div>
      <div>Giro inteligente de veículos com redução de tempo de descarga</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 6: COMPLIANCE LEI 11.442/2007 & GEOFENCING GPS               -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Auditoria Probatória</span>
      </div>
      <div class="slide-meta"><span class="slide-num">06</span><span>COMPLIANCE JURÍDICO</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col">
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">BLINDAGEM CONTRA COBRANÇAS DE ESTADIA</div>
            <h2 class="slide-title">Auditoria GPS & <span>Lei Federal 11.442/2007</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">A legislação garante ao transportador o pagamento de hora parada após 5 horas de permanência. O DocaOS cria a cerca virtual para auditar milimetricamente quando o caminhão realmente chegou.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📍 Cerca Virtual Geofence de 1.500 Metros</div>
                <div class="card-desc">O check-in só é liberado se a coordenada GPS do motorista estiver dentro do raio homologado do CD, impedindo check-ins remotos fraudulentos.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📑 Laudo Pericial em PDF com Carimbo Probatório</div>
                <div class="card-desc">Documento técnico emitido em 1 clique com data/hora UTC, placas, doca utilizada e distância auditada para defesa jurídica contra impugnações.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">💰 Cálculo Automático de Valor por Tonelada</div>
                <div class="card-desc">Cálculo parametrizado do valor oficial (R$ 2,21+/t/hora ou taxa contratual negociada), apontando exatamente o passivo real.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/yard-map • Cerca Pericial GPS</span>
          </div>
          <img src="${imgMapa}" alt="Mapa do Pátio DocaOS" class="screenshot-img" />
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Segurança Jurídica e Rastreabilidade Pericial</div>
      <div>Proteção probatória auditada contra cobranças indevidas de transportadoras</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 7: CRACHÁ DIGITAL PARA AJUDANTES E CHAPAS (DIFERENCIAL)       -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Segurança Patrimonial</span>
      </div>
      <div class="slide-meta"><span class="slide-num">07</span><span>CRACHÁ DIGITAL DE TERCEIROS</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col-reverse">
        <div class="screenshot-frame" style="background: #020b18; display: flex; align-items: center; justify-content: center; padding: 10px;">
          <img src="${photoDriver}" alt="Crachá Digital no Celular" style="height: 100%; max-height: 155mm; border-radius: 14px; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.8);" />
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">DIFERENCIAL EXCLUSIVO DOCAOS</div>
            <h2 class="slide-title">Crachá Digital para <span>Ajudantes & Chapas</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Controle absoluto da entrada de pedestres e ajudantes de carga no centro de distribuição, eliminando riscos trabalhistas e violações de segurança patrimonial.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🪪 Credenciamento Instantâneo via WhatsApp</div>
                <div class="card-desc">Ao agendar a carga com ajudante, o DocaOS gera automaticamente o Crachá Digital com QR Code dinâmico e envia para o celular do ajudante.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">👷 Verificação Obrigatória de EPIs na Portaria</div>
                <div class="card-desc">O fiscal de portaria escaneia o QR Code do crachá e checa conformidade de calçado de segurança, colete refletivo e capacete antes de liberar a catraca.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📄 Formato Físico de Bolso (Impressão em PVC)</div>
                <div class="card-desc">Opção de impressão imediata do passe na portaria para ajudantes sem smartphone, com chip RFID decorativo e código de barras.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Segurança do Trabalho & Controle de Acesso de Pedestres</div>
      <div>Conformidade de normas de segurança e auditorias de seguradoras de carga</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 8: PORTARIA EXPRESS & SCANNER OCR                             -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Portaria & Cancela</span>
      </div>
      <div class="slide-meta"><span class="slide-num">08</span><span>PORTARIA EXPRESS</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col">
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">TRIAGEM EM MENOS DE 30 SEGUNDOS</div>
            <h2 class="slide-title">Portaria Sem Fila: <span>Scanner OCR & QR Code</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Substitua pranchetas e planilhas manuais na guarita. O conferente valida a carga apenas apontando o leitor de QR Code ou digitando a placa Mercosul.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📷 Leitor de Câmera & Dispositivos USB</div>
                <div class="card-desc">Compatível com webcam comum, leitor laser de código de barras USB ou câmera de celular/tablet dos fiscais de pátio.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">⚡ Check-in com 1 Toque</div>
                <div class="card-desc">O sistema localiza automaticamente o time slot correspondente, valida se está na janela correta e libera a passagem para a área interna.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🚫 Bloqueio de Veículos Não Autorizados</div>
                <div class="card-desc">Alerta sonoro e visual imediato caso um caminhão não possua agendamento prévio ou esteja com restrição de compliance.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/gate • Portaria & Cancela</span>
          </div>
          <img src="${imgPortaria}" alt="Portaria Express DocaOS" class="screenshot-img" />
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Eficiência na Cancela de Entrada</div>
      <div>Redução de 80% no tempo de espera do caminhão na portaria</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 9: PWA DO MOTORISTA & CONVOCAÇÃO WHATSAPP                     -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Comunicação Zero Atrito</span>
      </div>
      <div class="slide-meta"><span class="slide-num">09</span><span>CHAMADA DO MOTORISTA</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col-reverse">
        <div class="screenshot-frame" style="background: #020b18; display: flex; align-items: center; justify-content: center; padding: 10px;">
          <img src="${imgMotorista}" alt="PWA do Motorista DocaOS" style="height: 100%; max-height: 155mm; border-radius: 14px; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.8);" />
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">SEM EXIGÊNCIA DE APLICATIVO</div>
            <h2 class="slide-title">Convoque o Motorista <span>Direto pelo WhatsApp</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Motoristas de carga rejeitam instalar apps pesados que consomem dados do plano móvel. O DocaOS funciona 100% via web e mensageria oficial do WhatsApp.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">💬 Notificações de Status Automatizadas</div>
                <div class="card-desc">O motorista recebe aviso quando seu agendamento é aprovado, quando a doca está liberada e quando pode iniciar a manobra.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🎯 Direcionamento Claro para a Baia Designada</div>
                <div class="card-desc">A notificação indica a doca exata (ex: "Dirija-se à DOCA 04") e instruções de acesso, eliminando perguntas na guarita.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📡 Rastreamento de Leitura e Confirmação</div>
                <div class="card-desc">A Torre de Controle sabe exatamente quando o motorista abriu a mensagem e iniciou o deslocamento.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Engajamento Total dos Motoristas</div>
      <div>100% de adesão operacional sem necessidade de suporte de TI</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 10: PORTAL DO TRANSPORTADOR                                   -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Colaboração Externa</span>
      </div>
      <div class="slide-meta"><span class="slide-num">10</span><span>PORTAL DO TRANSPORTADOR</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col">
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">ELIMINE E-MAILS E LIGAÇÕES</div>
            <h2 class="slide-title">Autoagendamento <span>24/7 pelo Próprio Parceiro</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Disponibilize aos seus transportadores homologados um portal limpo para reserva de janelas de entrega de acordo com a capacidade real de recebimento do seu armazém.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🌐 Link Personalizado por Armazém</div>
                <div class="card-desc">Cada centro de distribuição possui seu link único (ex: <code>docaos.log.br/portal/seu-cd</code>) com identidade visual personalizada.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🧾 Coleta Antecipada de Dados & NF-e</div>
                <div class="card-desc">Transportadora cadastra placa do cavalo, carreta, motorista, CPF, telefone e chave da nota fiscal antes do veículo sair da origem.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🔒 Regras Rígidas de Tolerância</div>
                <div class="card-desc">Configuração de janelas de antecedência e cancelamento automático em caso de no-show para liberar a vaga a outro parceiro.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/portal/docas-santos • Autoagendamento</span>
          </div>
          <img src="${imgTransportador}" alt="Portal do Transportador DocaOS" class="screenshot-img" />
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Colaboração em Cadeia de Suprimentos</div>
      <div>Autonomia e pontualidade na entrega de matérias-primas e mercadorias</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 11: RELATÓRIOS, AUDITORIA & ROI                               -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Business Intelligence</span>
      </div>
      <div class="slide-meta"><span class="slide-num">11</span><span>RELATÓRIOS & ROI</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col-reverse">
        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/reports • Auditoria & Indicadores</span>
          </div>
          <img src="${imgRelatorios}" alt="Relatórios & ROI DocaOS" class="screenshot-img" />
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">DADOS PARA DECISÕES ESTRATÉGICAS</div>
            <h2 class="slide-title">Indicadores de Desempenho <span>e ROI Comprovado</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Painel consolidado de KPIs com exportação em Excel, CSV e Laudo em PDF para negociação comercial com transportadores e auditoria fiscal.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">📊 Tempo Médio de Permanência (Dwell Time)</div>
                <div class="card-desc">Histórico de tempo em cada fase (espera externa, pátio, baia de carga/descarga e cancela de saída).</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">💵 Rastreio de Economia em Estadias</div>
                <div class="card-desc">Calculadora financeira que mede o valor exato economizado mensalmente pelo centro de distribuição com o DocaOS.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🏆 Ranking de Transportadoras Pontuais</div>
                <div class="card-desc">Índice OTIF (On-Time In-Full) e percentual de cumprimento de janelas para bonificação ou ajuste de contratos.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Inteligência de Dados e Compliance Financeiro</div>
      <div>Tomada de decisões logísticas orientadas por indicadores auditados</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 12: MODO CLARO & ESCURO: USABILIDADE PREMIUM                  -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Experiência do Usuário</span>
      </div>
      <div class="slide-meta"><span class="slide-num">12</span><span>DESIGN SYSTEM MODERNO</span></div>
    </div>

    <div class="slide-body">
      <div class="section-tag">ADAPTABILIDADE TOTAL A QUALQUER AMBIENTE</div>
      <h2 class="slide-title">Flexibilidade de Visual: <span>Modo Claro & Modo Escuro</span></h2>
      <p class="slide-subtitle">O DocaOS foi construído com design system refinado na nova paleta Deep Navy e Teal, oferecendo alto contraste para escritórios iluminados e salas de controle noturnas 24/7.</p>

      <div class="grid-2col" style="gap: 16px; margin-top: 4px;">
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 12px; color: #ffffff;">☀️ Modo Claro (Visual Clean Diurno)</span>
            <span style="font-size: 10px; color: #00A896; font-family: 'JetBrains Mono', monospace;">Escritórios & Gestão</span>
          </div>
          <div class="screenshot-frame" style="flex: 1; border: 1px solid #cbd5e1;">
            <div class="browser-topbar" style="background: #f1f5f9; color: #64748b; border-bottom: 1px solid #e2e8f0;">
              <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
              <span class="url-pill" style="background: #ffffff; color: #00A896; border: 1px solid #cbd5e1;">docaos.log.br • Tema Claro</span>
            </div>
            <img src="${imgTorreLight}" alt="Modo Claro DocaOS" class="screenshot-img" />
          </div>
        </div>

        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 12px; color: #ffffff;">🌙 Modo Escuro (Visual Deep Navy)</span>
            <span style="font-size: 10px; color: #00E5C8; font-family: 'JetBrains Mono', monospace;">Torre de Controle 24/7</span>
          </div>
          <div class="screenshot-frame" style="flex: 1;">
            <div class="browser-topbar">
              <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
              <span class="url-pill">docaos.log.br • Tema Escuro</span>
            </div>
            <img src="${imgTorreDark}" alt="Modo Escuro DocaOS" class="screenshot-img" />
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Usabilidade, Conforto Visual e Acessibilidade</div>
      <div>Alternância instantânea de tema com persistência automática de preferências</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 13: INTEGRAÇÕES ERP, WMS, TMS & APIS                          -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Ecossistema Conectado</span>
      </div>
      <div class="slide-meta"><span class="slide-num">13</span><span>INTEGRAÇÕES ENTERPRISE</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col">
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">INTEROPERABILIDADE TOTAL</div>
            <h2 class="slide-title">Conectividade Nativa com seu <span>ERP, WMS & TMS</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">O DocaOS não exige descarte de softwares legados. Ele se conecta através de APIs REST modernas e Webhooks em tempo real.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">⚡ Conectores Pré-Configurados</div>
                <div class="card-desc">Integração homologada para <strong>SAP (B1/S4HANA), TOTVS Protheus, Datasul, Senior WMS, Oracle</strong> e plataformas de e-commerce.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🔔 Webhooks Ativos por Evento</div>
                <div class="card-desc">Disparo imediato de notificações HTTP JSON nos eventos de <code>checkin_realizado</code>, <code>doca_alocada</code> e <code>veiculo_liberado</code>.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🔐 Segurança de Nível Bancário</div>
                <div class="card-desc">Autenticação via Bearer Tokens JWT, chaves de API com rotação automática, criptografia TLS 1.3 e logs de auditoria por IP.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/integrations • APIs & Webhooks</span>
          </div>
          <img src="${imgIntegracoes}" alt="Integrações DocaOS" class="screenshot-img" />
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Conectividade Corporativa Sem Fricção</div>
      <div>Arquitetura orientada a microsserviços com alta disponibilidade</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 14: MULTI-ARMAZÉM & GESTÃO CORPORATIVA                        -->
  <!-- =================================================================== -->
  <div class="slide">
    <div class="slide-header">
      <div class="brand-group">
        <img src="${logoLight}" alt="DocaOS" class="brand-logo-img" />
        <span class="brand-tagline">Multi-Tenant & Governança</span>
      </div>
      <div class="slide-meta"><span class="slide-num">14</span><span>ESCALABILIDADE CORPORATIVA</span></div>
    </div>

    <div class="slide-body">
      <div class="grid-2col-reverse">
        <div class="screenshot-frame">
          <div class="browser-topbar">
            <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
            <span class="url-pill">docaos.log.br/app/super-admin • Gestão de Filiais</span>
          </div>
          <img src="${imgSuperAdmin}" alt="Painel Multi-Tenant DocaOS" class="screenshot-img" />
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-tag">CENTRALIZAÇÃO OPERACIONAL</div>
            <h2 class="slide-title">Multi-Armazém para <span>Redes de Distribuição</span></h2>
            <p class="slide-subtitle" style="margin-bottom: 10px;">Gerencie todas as filiais, galpões e entrepostos da sua empresa através de um único acesso com controle granular de perfis e governança LGPD.</p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🏢 Visão Consolidada de Filiais</div>
                <div class="card-desc">Diretores de logística alternam facilmente entre armazéns de diferentes estados ou cidades sem trocar de login.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">👥 Perfis de Acesso Customizados (RBAC)</div>
                <div class="card-desc">Controle de permissões para Administradores, Gestores de Pátio, Fiscais de Portaria, Líderes de Doca e Auditores Externos.</div>
              </div>
              <div class="card" style="padding: 10px 14px;">
                <div class="card-title">🛡️ Conformidade Total LGPD</div>
                <div class="card-desc">Anonimização de dados de motoristas e ajudantes de acordo com a política de retenção da sua corporação.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <div>DocaOS • Governança, Segurança e Gestão de Múltiplas Unidades</div>
      <div>Plataforma pronta para operações logísticas de grande porte</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- SLIDE 15: IMPLANTAÇÃO RÁPIDA & CONTATO RAOS TECNOLOGIA              -->
  <!-- =================================================================== -->
  <div class="slide cover-slide" style="padding: 14mm 18mm;">
    <div class="glow-teal-top"></div>
    <div class="glow-blue-bottom"></div>

    <div style="display: flex; justify-content: space-between; align-items: center; z-index: 10;">
      <img src="${logoLight}" alt="DocaOS" style="height: 40px; width: auto;" />
      <div class="badge-raos">
        <img src="${iconRaos}" alt="RAOS Tecnologia" style="height: 20px; width: auto;" />
        <span>RAOS Tecnologia • Inovação em Software Logístico</span>
      </div>
    </div>

    <div style="z-index: 10; margin: 10px 0;">
      <div class="section-tag">ENTRE EM OPERAÇÃO EM 14 DIAS</div>
      <h2 style="font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.15; margin-bottom: 8px;">
        Pronto para Otimizar o seu Pátio com o <span>DocaOS</span>?
      </h2>
      <p style="font-size: 13px; color: #94a3b8; max-width: 800px; margin-bottom: 14px;">
        Nossa equipe de engenharia e consultores logísticos realiza o setup completo das suas baias, parâmetros de geofencing e treinamento dos seus fiscais e portaria em tempo recorde.
      </p>

      <div class="grid-3col" style="gap: 12px; margin-bottom: 16px;">
        <div class="card-highlight" style="padding: 12px;">
          <div style="font-size: 18px; margin-bottom: 4px;">📅 Dias 1 a 4</div>
          <div style="font-weight: 700; font-size: 12px; color: #ffffff; margin-bottom: 2px;">Parametrização & Baias</div>
          <div style="font-size: 10px; color: #94a3b8;">Cadastro de docas, tolerâncias de estadia, cerca GPS e integração de cadastros.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-size: 18px; margin-bottom: 4px;">🎓 Dias 5 a 10</div>
          <div style="font-weight: 700; font-size: 12px; color: #ffffff; margin-bottom: 2px;">Treinamento da Equipe</div>
          <div style="font-size: 10px; color: #94a3b8;">Capacitação da guarita, operadores de doca, conferentes e comunicado às transportadoras.</div>
        </div>

        <div class="card-highlight" style="padding: 12px;">
          <div style="font-size: 18px; margin-bottom: 4px;">🚀 Dias 11 a 14</div>
          <div style="font-weight: 700; font-size: 12px; color: #ffffff; margin-bottom: 2px;">Go-Live & Operação Assistida</div>
          <div style="font-size: 10px; color: #94a3b8;">Entrada em produção com acompanhamento presencial ou remoto da nossa engenharia.</div>
        </div>
      </div>

      <!-- Contact Banner -->
      <div style="background: rgba(0, 20, 44, 0.9); border: 1px solid rgba(0, 229, 200, 0.4); border-radius: 14px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 24px;">
          <div>
            <span style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace; display: block;">PORTAL WEB & SANDBOX</span>
            <span style="font-size: 14px; font-weight: 800; color: #00E5C8;">docaos.log.br</span>
          </div>
          <div>
            <span style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace; display: block;">E-MAIL CORPORATIVO</span>
            <span style="font-size: 14px; font-weight: 800; color: #ffffff;">contato@raostecnologia.com.br</span>
          </div>
          <div>
            <span style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace; display: block;">WHATSAPP CONSULTIVO</span>
            <span style="font-size: 14px; font-weight: 800; color: #10b981;">(27) 99617-4965</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; color: #94a3b8; display: block;">EMPRESA DESENVOLVEDORA</span>
          <span style="font-size: 12px; font-weight: 700; color: #ffffff;">RAOS Tecnologia</span>
        </div>
      </div>
    </div>

    <div class="slide-footer" style="z-index: 10;">
      <div>DocaOS Enterprise • Sistema Operacional de Pátios e Docas</div>
      <div>© 2026 RAOS Tecnologia. Todos os direitos reservados.</div>
    </div>
  </div>

</body>
</html>
  `;

  // Write temporary presentation HTML
  const tempHtmlPath = path.resolve(SCREENSHOT_DIR, 'docaos_presentation.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  console.log(`Presentation HTML saved to: ${tempHtmlPath}`);

  console.log('Launching headless Chrome to render PDF...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--font-render-hinting=none'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });

  console.log('Generating A4 Landscape PDF with print background...');
  await page.pdf({
    path: OUTPUT_PDF_LOCAL,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log(`Local PDF successfully created at: ${OUTPUT_PDF_LOCAL}`);

  // Copy to Artifact directory
  try {
    fs.copyFileSync(OUTPUT_PDF_LOCAL, OUTPUT_PDF_ARTIFACT);
    console.log(`Artifact PDF saved at: ${OUTPUT_PDF_ARTIFACT}`);
  } catch (err) {
    console.warn(`Could not copy to artifact directory: ${err.message}`);
  }

  const stats = fs.statSync(OUTPUT_PDF_LOCAL);
  console.log(`PDF Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

buildPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
