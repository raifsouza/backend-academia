import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import { enviarNotificacaoPush } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { usuario_id } = req.query;

    try {
      if (usuario_id) {
        const [users]: any = await db.query(
          'SELECT id, nome, data_vencimento, fcm_token FROM usuarios WHERE id = ?',
          [usuario_id]
        );

        if (users.length > 0) {
          const user = users[0];
          const diaVencimento = user.dia_vencimento || 29;

          const hoje = new Date();
          const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

          const anoAtual = hojeInicio.getFullYear();
          const mesAtual = hojeInicio.getMonth();

          const dataVencimentoMes = new Date(anoAtual, mesAtual, diaVencimento);
          const diffEmMs = dataVencimentoMes.getTime() - hojeInicio.getTime();
          const diasAteVencimento = Math.ceil(diffEmMs / (1000 * 60 * 60 * 24));

          if (diasAteVencimento <= 10) {
            const mesesNomes = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            const mesReferenciaAtual = `${mesesNomes[mesAtual]} ${anoAtual}`;
            const yyyy = dataVencimentoMes.getFullYear();
            const mm = String(dataVencimentoMes.getMonth() + 1).padStart(2, '0');
            const dd = String(dataVencimentoMes.getDate()).padStart(2, '0');
            const dataVencStr = `${yyyy}-${mm}-${dd}`;

            const [pagExistente]: any = await db.query(
              `SELECT id FROM pagamentos 
               WHERE usuario_id = ? 
                 AND MONTH(data_pagamento) = ? 
                 AND YEAR(data_pagamento) = ?`,
              [usuario_id, mesAtual + 1, anoAtual]
            );

            if (pagExistente.length === 0) {
              await db.query(
                `INSERT INTO pagamentos (usuario_id, valor, data_pagamento, status, mes_referencia) 
                 VALUES (?, ?, ?, ?, ?)`,
                [usuario_id, 80.00, dataVencStr, 'PENDENTE', mesReferenciaAtual]
              );

              // --- NOTIFICAÇÃO DE COBRANÇA GERADA ---
              if (user.fcm_token) {
                await enviarNotificacaoPush(
                  user.fcm_token,
                  '💳 Mensalidade Disponível',
                  `Sua mensalidade de ${mesReferenciaAtual} foi gerada. Vencimento: ${dd}/${mm}/${yyyy}.`
                );
              }
            }
          }
        }

        const [rows] = await db.query(
          `SELECT id, usuario_id, valor, 
                  DATE_FORMAT(data_pagamento, '%Y-%m-%d') as data_pagamento, 
                  status, mes_referencia 
           FROM pagamentos 
           WHERE usuario_id = ? 
           ORDER BY data_pagamento DESC, id DESC`,
          [usuario_id]
        );
        return res.status(200).json(rows);
      } 
      
      const [rows] = await db.query(
        `SELECT p.id, p.usuario_id, u.nome as aluno_nome, p.valor, 
                DATE_FORMAT(p.data_pagamento, '%Y-%m-%d') as data_pagamento, 
                p.status, p.mes_referencia 
         FROM pagamentos p
         JOIN usuarios u ON p.usuario_id = u.id
         ORDER BY p.data_pagamento DESC, p.id DESC`
      );
      return res.status(200).json(rows);

    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
  }

  if (req.method === 'POST') {
    const { id, usuario_id, valor, data_pagamento, status, mes_referencia } = req.body;

    try {
      if (id) {
        await db.query(
          `UPDATE pagamentos SET status = ?, data_pagamento = ? WHERE id = ?`,
          [status || 'PAGO', data_pagamento || new Date().toISOString().split('T')[0], id]
        );
        return res.status(200).json({ message: 'Pagamento atualizado com sucesso!' });
      }

      const [result]: any = await db.query(
        `INSERT INTO pagamentos (usuario_id, valor, data_pagamento, status, mes_referencia) 
         VALUES (?, ?, ?, ?, ?)`,
        [usuario_id, valor, data_pagamento, status || 'PAGO', mes_referencia]
      );

      // Envia notificação para o aluno quando o admin gera cobrança manual
      const [userRows]: any = await db.query('SELECT fcm_token FROM usuarios WHERE id = ?', [usuario_id]);
      if (userRows.length > 0 && userRows[0].fcm_token) {
        await enviarNotificacaoPush(
          userRows[0].fcm_token,
          '💳 Fatura Registrada',
          `Uma nova cobrança no valor de R$ ${valor} foi registrada.`
        );
      }

      return res.status(201).json({ message: 'Pagamento registrado com sucesso!', id: result.insertId });
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      return res.status(500).json({ error: 'Erro ao salvar pagamento' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}