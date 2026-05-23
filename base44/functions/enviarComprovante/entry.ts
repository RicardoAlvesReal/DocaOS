import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { matricula, mesKey, fileUrl, fileName } = await req.json();

    if (!matricula || !mesKey || !fileUrl) {
      return Response.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Cria comprovante com service role (ignora RLS)
    await base44.asServiceRole.entities.Comprovante.create({
      matricula,
      mesKey,
      fileUrl,
      fileName: fileName || '',
      status: 'aguardando',
    });

    // Atualiza status do mês no aluno
    const alunos = await base44.asServiceRole.entities.Aluno.filter({ matricula });
    if (alunos.length > 0) {
      const aluno = alunos[0];
      const meses = { ...aluno.meses, [mesKey]: 'aguardando' };
      await base44.asServiceRole.entities.Aluno.update(aluno.id, { meses });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});