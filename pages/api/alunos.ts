import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configuração Global do CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Trata requisições Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- BUSCAR USUÁRIOS / ALUNOS (GET) ---
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
          u.id,
          u.nome,
          u.email,
          u.telefone,
          u.foto_url,
          u.matricula,
          u.data_vencimento,
          u.agendar_aula_experimental,
          u.aula_experimental_realizada,
          'Power Member' AS plano,

          IF(EXISTS(SELECT 1 FROM avaliacao_fisica af WHERE af.aluno_id = u.id), 1, 0) AS realizou_avaliacao,

          IF(
            u.aula_experimental_realizada = 1 OR 
            (u.agendar_aula_experimental IS NOT NULL AND u.agendar_aula_experimental < NOW()), 
            1, 
            0
          ) AS status_aula_experimental,

          IF(
            EXISTS(
              SELECT 1 FROM pagamentos p 
              WHERE p.usuario_id = u.id 
                AND p.status = 'PENDENTE' 
                AND p.data_pagamento < CURDATE()
            ),
            'INATIVO',
            'ATIVO'
          ) AS status_aluno

        FROM usuarios u
        WHERE u.tipo_usuario = 3 
        ORDER BY u.nome ASC
      `;

      const [rows] = await db.query(query);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      return res.status(500).json({ error: 'Erro ao buscar a lista de alunos' });
    }
  }

  // --- CADASTRAR USUÁRIO (POST) ---
  if (req.method === 'POST') {
    const { 
      nome, 
      email, 
      senha, 
      telefone, 
      data_nascimento, 
      foto_url, 
      data_vencimento, 
      agendar_aula_experimental, 
      realizou_avaliacao, 
      tipo_usuario 
    } = req.body;

    if (!nome || !email || !senha || !data_vencimento || !telefone) {
      return res.status(400).json({ error: 'Nome, E-mail, Senha, Telefone e Data de Vencimento são obrigatórios.' });
    }

    try {
      // 1. Gerar Matrícula: 1ª Letra do nome + 5 últimos dígitos do telefone
      const primeiraLetra = nome.trim().charAt(0).toUpperCase();
      const apenasNumerosTelefone = telefone.replace(/\D/g, ''); 
      const ultimos5Digitos = apenasNumerosTelefone.slice(-5);
      const matriculaGerada = `${primeiraLetra}${ultimos5Digitos}`;

      // 2. Criptografar Senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      // 3. Inserir no Banco
      const query = `
        INSERT INTO usuarios 
        (matricula, nome, email, senha, telefone, data_nascimento, foto_url, data_vencimento, agendar_aula_experimental, realizou_avaliacao, tipo_usuario) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        matriculaGerada,
        nome, 
        email, 
        senhaHash, 
        telefone, 
        data_nascimento || null, 
        foto_url || null, 
        data_vencimento, 
        agendar_aula_experimental || null, 
        realizou_avaliacao ? 1 : 0, 
        tipo_usuario !== undefined ? tipo_usuario : 3
      ];
      
      const [result] = await db.query(query, values);
      
      // O return abaixo encerra o fluxo e evita que caia no status 405
      return res.status(201).json({ 
        message: 'Cadastro realizado com sucesso!', 
        id: (result as any).insertId,
        matricula: matriculaGerada
      });

    } catch (error: any) {
      console.error('Erro ao salvar no banco:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
      }

      return res.status(500).json({ error: 'Erro interno ao salvar no banco de dados' });
    }
  }

  // --- ATUALIZAR STATUS MANUAL DA AULA EXPERIMENTAL (PUT) ---
  if (req.method === 'PUT') {
    const { aluno_id, aula_experimental_realizada } = req.body;

    try {
      await db.query(
        'UPDATE usuarios SET aula_experimental_realizada = ? WHERE id = ?',
        [aula_experimental_realizada ? 1 : 0, aluno_id]
      );
      return res.status(200).json({ message: 'Status da aula experimental atualizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar aula experimental:', error);
      return res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
  }

  // Se nenhum método (GET, POST, PUT, OPTIONS) bater, aí sim retorna 405
  return res.status(405).json({ error: 'Método não permitido' });
}