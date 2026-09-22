import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- BUSCAR TREINOS DE UM ALUNO (COM OS EXERCÍCIOS) ---
  if (req.method === 'GET') {
    const { usuario_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({ error: 'O id do usuário é obrigatório.' });
    }

    try {
      // 1. Busca os treinos do usuário
      const [treinos]: any = await db.query(
        `SELECT id, usuario_id, titulo, descricao, dia_semana, data_criacao 
         FROM treinos 
         WHERE usuario_id = ? 
         ORDER BY id DESC`,
        [usuario_id]
      );

      // 2. Para cada treino encontrado, busca seus respectivos exercícios
      for (let treino of treinos) {
        const [exercicios]: any = await db.query(
          `SELECT id, treino_id, nome, grupo_muscular, series, repeticoes, carga_kg, descanso_segundos, concluido 
           FROM exercicios 
           WHERE treino_id = ?`,
          [treino.id]
        );
        treino.exercicios = exercicios;
      }

      return res.status(200).json(treinos);
    } catch (error) {
      console.error('Erro ao buscar treinos e exercícios:', error);
      return res.status(500).json({ error: 'Erro ao buscar treinos' });
    }
  }

  // --- CRIAR NOVO TREINO COM EXERCÍCIOS ---
  if (req.method === 'POST') {
    const { usuario_id, titulo, descricao, dia_semana, exercicios } = req.body;

    if (!usuario_id || !titulo) {
      return res.status(400).json({ error: 'Usuário e Título são obrigatórios.' });
    }

    try {
      // 1. Insere o Treino Principal
      const [resultTreino]: any = await db.query(
        `INSERT INTO treinos (usuario_id, titulo, descricao, dia_semana) VALUES (?, ?, ?, ?)`,
        [usuario_id, titulo, descricao || '', dia_semana || 'Geral']
      );

      const treinoId = resultTreino.insertId;

      // 2. Insere os exercícios detalhados (se houver)
      if (exercicios && Array.isArray(exercicios) && exercicios.length > 0) {
        for (const ex of exercicios) {
          await db.query(
            `INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes, carga_kg, descanso_segundos) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              treinoId,
              ex.nome,
              ex.grupo_muscular || 'Geral',
              ex.series || 3,
              ex.repeticoes || '12',
              ex.carga_kg || 0.00,
              ex.descanso_segundos || 60
            ]
          );
        }
      }

      return res.status(201).json({
        message: 'Treino e exercícios cadastrados com sucesso!',
        id: treinoId
      });
    } catch (error) {
      console.error('Erro ao cadastrar treino:', error);
      return res.status(500).json({ error: 'Erro ao cadastrar treino.' });
    }
  }

  // --- ATUALIZAR TREINO E EXERCÍCIOS ---
  if (req.method === 'PUT') {
    const { id, titulo, dia_semana, descricao, exercicios } = req.body;

    if (!id || !titulo) {
      res.status(400).json({ error: 'ID e Título são obrigatórios.' });
      return;
    }

    try {
      // 1. Atualiza os dados principais do treino
      await db.query(
        `UPDATE treinos 
         SET titulo = ?, dia_semana = ?, descricao = ? 
         WHERE id = ?`,
        [titulo, dia_semana, descricao, id]
      );

      // 2. Atualiza os exercícios (Remove os antigos e insere a nova lista atualizada)
      if (exercicios && Array.isArray(exercicios)) {
        await db.query(`DELETE FROM exercicios WHERE treino_id = ?`, [id]);

        for (const ex of exercicios) {
          await db.query(
            `INSERT INTO exercicios (treino_id, nome, grupo_muscular, series, repeticoes, carga_kg, descanso_segundos) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              ex.nome,
              ex.grupo_muscular || 'Geral',
              ex.series || 3,
              ex.repeticoes || '12',
              ex.carga_kg || 0.00,
              ex.descanso_segundos || 60
            ]
          );
        }
      }

      res.status(200).json({ message: 'Treino atualizado com sucesso!' });
      return;
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar treino.' });
      return;
    }
  }

  // --- EXCLUIR TREINO (Exercícios são removidos automaticamente via CASCADE) ---
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID do treino é obrigatório.' });
    }

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