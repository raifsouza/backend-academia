import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Autorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- BUSCAR TREINOS DE UM ALUNO ---
  if (req.method === 'GET') {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({ error: 'O id do usuário é obrigatório.' });
    }

    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, titulo, descricao, dia_semana, data_criacao 
         FROM treinos 
         WHERE usuario_id = ? 
         ORDER BY id DESC`,
        [usuario_id]
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      return res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // --- CRIAR NOVO TREINO ---
  if (req.method === 'POST') {
    const { usuario_id, titulo, descricao, dia_semana } = req.body;

    if (!usuario_id || !titulo || !descricao) {
      return res.status(400).json({ error: 'Usuário, Título e Descrição são obrigatórios.' });
    }

    try {
      const [result] = await db.query(
        `INSERT INTO treinos (usuario_id, titulo, descricao, dia_semana) VALUES (?, ?, ?, ?)`,
        [usuario_id, titulo, descricao, dia_semana || 'Geral']
      );

      return res.status(201).json({
        message: 'Treino adicionado com sucesso!',
        id: (result as any).insertId
      });
    } catch (error) {
      console.error('Erro ao cadastrar treino:', error);
      return res.status(500).json({ error: 'Erro ao cadastrar treino.' });
    }
  }

  if (req.method === 'PUT') {
    const { id, titulo, dia_semana, descricao } = req.body;

    if (!id || !titulo) {
      res.status(400).json({ error: 'ID e Título são obrigatórios.' });
      return;
    }

    try {
      await db.query(
        `UPDATE treinos 
         SET titulo = ?, dia_semana = ?, descricao = ? 
         WHERE id = ?`,
        [titulo, dia_semana, descricao, id]
      );

      // Apenas execute o res.status().json() sem o "return res..."
      res.status(200).json({ message: 'Treino atualizado com sucesso!' });
      return;
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar treino.' });
      return;
    }
  }

  if (req.method === 'DELETE') {
  const { id } = req.query;

  try {
    await db.query('DELETE FROM treinos WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Treino excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir treino:', error);
    return res.status(500).json({ error: 'Erro ao excluir o treino' });
  }
}

  res.status(405).json({ error: 'Método não permitido' });
}