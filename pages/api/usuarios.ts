import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- GET: Listar TODOS os usuários (para o Admin gerenciar roles) ou buscar dados do perfil ---
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      if (id) {
        const [rows]: any = await db.query(
          'SELECT id, nome, email, telefone, foto_url, tipo_usuario, matricula FROM usuarios WHERE id = ?',
          [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        return res.status(200).json(rows[0]);
      }

      // Lista todos os usuários cadastrados no sistema (Admin, Personal, Aluno)
      const [usuarios] = await db.query(
        'SELECT id, nome, email, telefone, foto_url, tipo_usuario, matricula FROM usuarios ORDER BY nome ASC'
      );
      return res.status(200).json(usuarios);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar usuários' });
    }
  }

  // --- PUT: Atualizar Perfil ou Alterar Tipo de Usuário (Role) ---
  if (req.method === 'PUT') {
    const { id, nome, telefone, foto_url, senha, tipo_usuario } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    try {
      // 1. Se for alteração do Tipo de Usuário (realizada pelo Admin)
      if (tipo_usuario !== undefined) {
        await db.query('UPDATE usuarios SET tipo_usuario = ? WHERE id = ?', [tipo_usuario, id]);
        return res.status(200).json({ message: 'Nível de acesso do usuário atualizado com sucesso!' });
      }

      // 2. Se for edição do próprio Perfil pelo usuário logado
      let query = 'UPDATE usuarios SET nome = ?, telefone = ?, foto_url = ?';
      const values: any[] = [nome, telefone, foto_url || null];

      // Atualiza senha se foi informada uma nova
      if (senha && senha.trim().length > 0) {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        query += ', senha = ?';
        values.push(senhaHash);
      }

      query += ' WHERE id = ?';
      values.push(id);

      await db.query(query, values);
      return res.status(200).json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar usuário' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}