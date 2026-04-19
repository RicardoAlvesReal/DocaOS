import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Busca todos os alunos e comprovantes
    const [alunos, comprovantes] = await Promise.all([
      base44.asServiceRole.entities.Aluno.list(),
      base44.asServiceRole.entities.Comprovante.list(),
    ]);

    const now = new Date();
    const mesAtual = now.toLocaleString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
    const anoAtual = now.getFullYear();

    const MONTH_KEYS = [
      'janeiro','fevereiro','marco','abril','maio','junho',
      'julho','agosto','setembro','outubro','novembro','dezembro'
    ];
    const mesKey = MONTH_KEYS[now.getMonth()];

    // Estatísticas do mês atual
    let pagos = 0, pendentes = 0, aguardando = 0, rejeitados = 0;
    let totalRecebido = 0, totalPendente = 0;

    alunos.forEach(a => {
      const status = (a.meses || {})[mesKey] || 'pendente';
      if (status === 'pago') { pagos++; totalRecebido += a.mensalidade || 0; }
      else if (status === 'aguardando') aguardando++;
      else if (status === 'rejeitado') { rejeitados++; totalPendente += a.mensalidade || 0; }
      else { pendentes++; totalPendente += a.mensalidade || 0; }
    });

    // Comprovantes confirmados no mês (criados este mês)
    const comprovantesDoMes = comprovantes.filter(c => {
      const d = new Date(c.created_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === anoAtual;
    });

    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Tabela de alunos com status do mês
    const linhasAlunos = alunos.map(a => {
      const status = (a.meses || {})[mesKey] || 'pendente';
      const emoji = status === 'pago' ? '✅' : status === 'aguardando' ? '⏳' : status === 'rejeitado' ? '❌' : '🔴';
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 12px">${a.nome}</td>
        <td style="padding:6px 12px;font-family:monospace">${a.matricula}</td>
        <td style="padding:6px 12px">${fmt(a.mensalidade || 0)}</td>
        <td style="padding:6px 12px">${emoji} ${status.charAt(0).toUpperCase() + status.slice(1)}</td>
      </tr>`;
    }).join('');

    const body = `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
        <div style="background:#3b82f6;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">📊 Resumo Mensal de Pagamentos</h1>
          <p style="color:#bfdbfe;margin:4px 0 0">${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)} de ${anoAtual}</p>
        </div>

        <div style="background:#f8fafc;padding:24px;display:flex;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px;background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:900;color:#10b981">${pagos}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px">✅ Pagos</p>
          </div>
          <div style="flex:1;min-width:140px;background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:900;color:#f59e0b">${aguardando}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px">⏳ Aguardando</p>
          </div>
          <div style="flex:1;min-width:140px;background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:28px;font-weight:900;color:#ef4444">${pendentes + rejeitados}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px">🔴 Inadimplentes</p>
          </div>
          <div style="flex:1;min-width:140px;background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:20px;font-weight:900;color:#3b82f6">${fmt(totalRecebido)}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px">💰 Recebido</p>
          </div>
          <div style="flex:1;min-width:140px;background:#fff;border-radius:10px;padding:16px;border:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:20px;font-weight:900;color:#ef4444">${fmt(totalPendente)}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px">❌ Em aberto</p>
          </div>
        </div>

        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0">
          <h2 style="font-size:16px;color:#1e293b;margin:0 0 16px">Detalhamento por Aluno</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:8px 12px;text-align:left;color:#475569">Nome</th>
                <th style="padding:8px 12px;text-align:left;color:#475569">Matrícula</th>
                <th style="padding:8px 12px;text-align:left;color:#475569">Mensalidade</th>
                <th style="padding:8px 12px;text-align:left;color:#475569">Status</th>
              </tr>
            </thead>
            <tbody>${linhasAlunos}</tbody>
          </table>
        </div>

        <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;text-align:center">
          <p style="color:#94a3b8;font-size:12px;margin:0">VanEscolar+ · Resumo automático gerado em ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'werleyronconi@gmail.com',
      subject: `📊 Resumo Mensal — ${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}/${anoAtual}`,
      body,
    });

    return Response.json({ ok: true, pagos, pendentes, aguardando, rejeitados, totalRecebido, totalPendente });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});