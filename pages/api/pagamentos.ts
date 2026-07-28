import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configuração dos Cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- GET: Listar Pagamentos ---
  if (req.method === 'GET') {
    const { usuario_id } = req.query;

    try {
      if (usuario_id) {
        // Busca os pagamentos de um usuário específico
        const [rows] = await db.query(
          `SELECT id, usuario_id, valor, DATE_FORMAT(data_pagamento, '%Y-%m-%d') as data_pagamento, status, mes_referencia 
           FROM pagamentos 
           WHERE usuario_id = ? 
           ORDER BY data_pagamento DESC`,
          [usuario_id]
        );
        res.status(200).json(rows);
        return;
      } else {
        // Busca todos os pagamentos com o nome do aluno (para Admin)
        const [rows] = await db.query(
          `SELECT p.id, p.usuario_id, u.nome as aluno_nome, p.valor, 
                  DATE_FORMAT(p.data_pagamento, '%Y-%m-%d') as data_pagamento, p.status, p.mes_referencia 
           FROM pagamentos p
           JOIN usuarios u ON p.usuario_id = u.id
           ORDER BY p.data_pagamento DESC`
        );
        res.status(200).json(rows);
        return;
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar pagamentos' });
      return;
    }
  }

  // --- POST: Registrar Novo Pagamento ---
  if (req.method === 'POST') {
    const { usuario_id, valor, data_pagamento, status, mes_referencia } = req.body;

    if (!usuario_id || !valor || !data_pagamento || !mes_referencia) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      return;
    }

    try {
      const [result]: any = await db.query(
        `INSERT INTO pagamentos (usuario_id, valor, data_pagamento, status, mes_referencia) 
         VALUES (?, ?, ?, ?, ?)`,
        [usuario_id, valor, data_pagamento, status || 'PAGO', mes_referencia]
      );

      res.status(201).json({ 
        message: 'Pagamento registrado com sucesso!', 
        id: result.insertId 
      });
      return;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      res.status(500).json({ error: 'Erro ao registrar pagamento' });
      return;
    }
  }

  res.status(405).json({ error: 'Método não permitido' });
}