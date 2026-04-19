import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const comp = payload.data;
    const matricula = comp?.matricula || '?';
    const mesKey = comp?.mesKey || '?';
    const fileName = comp?.fileName || 'arquivo';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'werleyronconi@gmail.com',
      subject: `📎 Novo comprovante enviado — ${matricula}`,
      body: `
        <h2 style="color:#3b82f6">Novo Comprovante Recebido!</h2>
        <p>Um aluno acabou de enviar um comprovante de pagamento.</p>
        <ul>
          <li><strong>Matrícula:</strong> ${matricula}</li>
          <li><strong>Mês:</strong> ${mesKey}</li>
          <li><strong>Arquivo:</strong> ${fileName}</li>
        </ul>
        <p>Acesse o painel administrativo para confirmar ou rejeitar o pagamento.</p>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});