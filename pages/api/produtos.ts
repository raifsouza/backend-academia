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
          estoque,
          categoria
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
    const { nome, preco, estoque, categoria } = req.body;

    if (!nome || preco == null || estoque == null || !categoria) {
      return res.status(400).json({ error: 'Nome, preço, quantidade em estoque e categoria são obrigatórios.' });
    }

    const categoriaFormatada = categoria.toUpperCase();
    if (!['FREEZER', 'SUPLEMENTO'].includes(categoriaFormatada)) {
      return res.status(400).json({ error: 'Categoria inválida. Use FREEZER ou SUPLEMENTO.' });
    }

    try {
      const query = `
        INSERT INTO produtos (nome, preco, estoque, categoria) 
        VALUES (?, ?, ?, ?)
      `;

      const values = [
        nome, 
        parseFloat(preco), 
        parseInt(estoque, 10),
        categoriaFormatada
      ];

      const [result] = await db.query(query, values);

      return res.status(201).json({
        message: 'Produto cadastrado com sucesso!',
        id: (result as any).insertId,
        nome,
        preco,
        estoque,
        categoria: categoriaFormatada
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      return res.status(500).json({ error: 'Erro interno ao cadastrar produto' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}