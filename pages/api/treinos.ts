import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import { enviarNotificacaoPush } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurações de CORS completas
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- BUSCAR TREINOS DO ALUNO ---
  if (req.method === 'GET') {
    // Suporta 'usuario_id', 'usuarioId' ou 'usuario id' (previne erros de URL no Flutter)
    const rawUsuarioId =
      req.query.usuario_id || req.query.usuarioId || req.query['usuario id'];

    if (!rawUsuarioId) {
      return res.status(400).json({ error: 'O id do usuário é obrigatório.' });
    }

    const userIdNum = parseInt(rawUsuarioId as string, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'ID do usuário inválido.' });
    }

    try {
      const [treinos]: any = await db.query(
        `SELECT id, usuario_id, titulo, descricao, dia_semana, data_criacao 
         FROM treinos 
         WHERE usuario_id = ? 
         ORDER BY id DESC`,
        [userIdNum]
      );

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

  // --- CRIAR NOVO TREINO COM NOTIFICAÇÃO PUSH ---
  if (req.method === 'POST') {
    const { usuario_id, titulo, descricao, dia_semana, exercicios } = req.body;

    if (!usuario_id || !titulo) {
      return res.status(400).json({ error: 'Usuário e Título são obrigatórios.' });
    }

    try {
      const [resultTreino]: any = await db.query(
        `INSERT INTO treinos (usuario_id, titulo, descricao, dia_semana) VALUES (?, ?, ?, ?)`,
        [usuario_id, titulo, descricao || '', dia_semana || 'Geral']
      );

      const treinoId = resultTreino.insertId;

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
              ex.descanso_segundos || 60,
            ]
          );
        }
      }

      // --- TENTA ENVIAR A NOTIFICAÇÃO (SEM INTERROMPER A RESPOSTA EM CASO DE ERRO) ---
      try {
        const [userRows]: any = await db.query('SELECT fcm_token FROM usuarios WHERE id = ?', [usuario_id]);
        if (userRows.length > 0 && userRows[0].fcm_token) {
          await enviarNotificacaoPush(
            userRows[0].fcm_token,
            '💪 Novo Treino Disponível!',
            `Seu novo treino "${titulo}" já está preparado na sua ficha.`
          );
        }
      } catch (fcmError) {
        console.error('Erro ao enviar notificação de treino:', fcmError);
      }

      return res.status(201).json({
        message: 'Treino e exercícios cadastrados com sucesso!',
        id: treinoId,
      });
    } catch (error) {
      console.error('Erro ao cadastrar treino:', error);
      return res.status(500).json({ error: 'Erro ao cadastrar treino.' });
    }
  }

  // --- ATUALIZAR TREINO ---
  if (req.method === 'PUT') {
    const { id, titulo, dia_semana, descricao, exercicios } = req.body;

    if (!id || !titulo) return res.status(400).json({ error: 'ID e Título são obrigatórios.' });

    try {
      await db.query(
        `UPDATE treinos SET titulo = ?, dia_semana = ?, descricao = ? WHERE id = ?`,
        [titulo, dia_semana, descricao, id]
      );

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
              ex.descanso_segundos || 60,
            ]
          );
        }
      }

      return res.status(200).json({ message: 'Treino atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar treino.' });
    }
  }

  // --- EXCLUIR TREINO ---
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID do treino é obrigatório.' });

    try {
      await db.query('DELETE FROM treinos WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Treino excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      return res.status(500).json({ error: 'Erro ao excluir o treino' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}