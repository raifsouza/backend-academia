import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- BUSCAR USUÁRIOS ---
  if (req.method === 'GET') {
    try {
      // Busca apenas os usuários do tipo Aluno (tipo_usuario = 3)
      const [rows] = await db.query(
        `SELECT id, nome, matricula, telefone, tipo_usuario 
         FROM usuarios 
         WHERE tipo_usuario = 3 
         ORDER BY nome ASC`
      );

      return res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      return res.status(500).json({ error: 'Erro ao buscar a lista de alunos' });
    }
  }

  // --- CADASTRAR USUÁRIO ---
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
      const apenasNumerosTelefone = telefone.replace(/\D/g, ''); // Remove traços/parênteses/espaços
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
      
      // Retorna a matrícula gerada no JSON de resposta
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

  res.status(405).json({ error: 'Método não permitido' });
}