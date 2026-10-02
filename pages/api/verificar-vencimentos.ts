// pages/api/cron/verificar-vencimentos.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import { enviarNotificacaoPush } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Busca pagamentos pendentes com data de vencimento que já passou
    const query = `
      SELECT p.id, p.valor, u.fcm_token 
      FROM pagamentos p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.status = 'PENDENTE' 
        AND p.data_vencimento < CURDATE()
        AND u.fcm_token IS NOT NULL
    `;

    const [faturasVencidas]: any = await db.query(query);

    for (const fatura of faturasVencidas) {
      await enviarNotificacaoPush(
        fatura.fcm_token,
        '⚠️ Mensalidade Vencida',
        'Sua mensalidade está vencida. Evite o bloqueio do seu acesso regularizando o pagamento no app.'
      );
    }

    return res.status(200).json({ menssagem: 'Notificações de vencimento enviadas!' });
  } catch (error) {
    console.error('Erro na rotina de vencimentos:', error);
    return res.status(500).json({ error: 'Erro ao rodar cron de notificações' });
  }
}