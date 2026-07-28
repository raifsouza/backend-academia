import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Configuração de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const { login, senha } = req.body; // 'login' pode ser o e-mail ou a matrícula

        if (!login || !senha) {
            return res.status(400).json({ error: 'Informe o E-mail/Matrícula e a Senha.' });
        }

        try {
            // Busca o usuário onde o e-mail OU a matrícula coincida com o valor informado
            const [rows]: any = await db.query(
                `SELECT id, matricula, nome, email, senha, telefone, foto_url, data_cadastro, data_vencimento, tipo_usuario 
                    FROM usuarios 
                    WHERE email = ? OR matricula = ?`,
                [login.trim(), login.trim()]
            );

            if (rows.length === 0) {
                return res.status(401).json({ error: 'E-mail/Matrícula ou senha incorretos.' });
            }

            const usuario = rows[0];

            // Compara a senha informada com o Hash salvo no banco de dados
            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (!senhaValida) {
                return res.status(401).json({ error: 'E-mail/Matrícula ou senha incorretos.' });
            }

            // Remove a senha do objeto antes de enviar de volta para o cliente
            delete usuario.senha;

            return res.status(200).json({
                message: 'Login realizado com sucesso!',
                usuario
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ error: 'Erro interno ao tentar realizar login.' });
        }
    }

    res.status(405).json({ error: 'Método não permitido' });
}