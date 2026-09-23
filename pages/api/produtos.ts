import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- BUSCAR LISTA DE PRODUTOS ---
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
          id, 
          nome, 
          preco, 
          estoque 
        FROM produtos 
        ORDER BY nome ASC
      `;

      const [rows] = await db.query(query);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({ error: 'Erro ao buscar produtos da lanchonete' });
    }
  }

  // --- CADASTRAR NOVO PRODUTO (ADMIN) ---
  if (req.method === 'POST') {
    const { nome, preco, estoque } = req.body;

    if (!nome || preco == null || estoque == null) {
      return res.status(400).json({ error: 'Nome, preço e quantidade em estoque são obrigatórios.' });
    }

    try {
      const query = `
        INSERT INTO produtos (nome, preco, estoque) 
        VALUES (?, ?, ?)
      `;

      const values = [
        nome, 
        parseFloat(preco), 
        parseInt(estoque, 10)
      ];

      const [result] = await db.query(query, values);

      return res.status(201).json({
        message: 'Produto cadastrado com sucesso!',
        id: (result as any).insertId,
        nome,
        preco,
        estoque
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar produto' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}