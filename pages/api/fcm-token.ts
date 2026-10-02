import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { usuario_id, fcm_token } = req.body;

    if (!usuario_id || !fcm_token) {
      return res.status(400).json({ error: 'usuario_id e fcm_token são obrigatórios.' });
    }

    try {
      await db.query('UPDATE usuarios SET fcm_token = ? WHERE id = ?', [fcm_token, usuario_id]);
      return res.status(200).json({ message: 'Token FCM atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar fcm_token:', error);
      return res.status(500).json({ error: 'Erro ao salvar token de notificação.' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}