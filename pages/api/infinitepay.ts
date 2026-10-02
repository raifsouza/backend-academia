import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Suporte a CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const data = req.body;
  const orderNsu = data.order_nsu || data.nsu;

  if (orderNsu) {
    try {
      // Atualiza a fatura no banco de dados como PAGO
      await db.query(
        'UPDATE faturas SET status = "PAGO", data_pagamento = NOW() WHERE id = ?',
        [orderNsu]
      );

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Erro ao atualizar fatura via Webhook:', error);
      return res.status(500).json({ error: 'Erro interno ao processar o webhook' });
    }
  }

  return res.status(400).json({ error: 'order_nsu não informado' });
}