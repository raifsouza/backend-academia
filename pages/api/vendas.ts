import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- HISTÓRICO DE VENDAS (ADMIN) ---
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
          v.id,
          p.nome AS produto_nome,
          v.quantidade,
          v.valor_total,
          v.metodo_pagamento,
          u.nome AS vendedor_nome,
          v.data_venda
        FROM vendas v
        JOIN produtos p ON p.id = v.produto_id
        JOIN usuarios u ON u.id = v.vendedor_id
        ORDER BY v.data_venda DESC
      `;

      const [rows] = await db.query(query);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de vendas' });
    }
  }

  // --- REGISTRAR VENDA & BAIXA DE ESTOQUE ---
  if (req.method === 'POST') {
    const { produto_id, quantidade, vendedor_id, metodo_pagamento } = req.body;

    if (!produto_id || !quantidade || !vendedor_id || !metodo_pagamento) {
      return res.status(400).json({ error: 'Produto, quantidade, vendedor e método de pagamento são obrigatórios.' });
    }

    try {
      const [produtoRows]: any = await db.query(
        'SELECT id, preco, estoque FROM produtos WHERE id = ?',
        [produto_id]
      );

      if (!produtoRows || produtoRows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const produto = produtoRows[0];
      const qtdVenda = parseInt(quantidade, 10);

      if (produto.estoque < qtdVenda) {
        return res.status(400).json({ error: 'Estoque insuficiente para realizar esta venda.' });
      }

      const valorTotal = produto.preco * qtdVenda;

      // 1. Abate do Estoque
      await db.query(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
        [qtdVenda, produto_id]
      );

      // 2. Registra no Histórico de Vendas com o Método de Pagamento
      const insertQuery = `
        INSERT INTO vendas (produto_id, quantidade, valor_total, vendedor_id, metodo_pagamento, data_venda)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      const [result]: any = await db.query(insertQuery, [
        produto_id,
        qtdVenda,
        valorTotal,
        vendedor_id,
        metodo_pagamento.toUpperCase()
      ]);

      return res.status(201).json({
        message: 'Venda realizada com sucesso!',
        venda_id: result.insertId,
        valor_total: valorTotal
      });

    } catch (error: any) {
      console.error('Erro ao registrar venda:', error);
      return res.status(500).json({ error: 'Erro interno ao registrar venda' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}