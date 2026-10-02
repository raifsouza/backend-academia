import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configuração de CORS Dinâmico
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { fatura_id, valor, descricao } = req.body;

  if (!fatura_id || !valor) {
    return res.status(400).json({ error: 'fatura_id e valor são obrigatórios.' });
  }

  // Definição dinâmica das URLs de Redirecionamento e Webhook
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:53641';

  const redirectUrl = `${frontendUrl}/pagamento-concluido`;
  const webhookUrl = process.env.INFINITEPAY_WEBHOOK_URL || `${baseUrl}/api/webhooks/infinitepay`;

  try {
    const response = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: process.env.INFINITEPAY_HANDLE, // Sua InfiniteTag sem o $
        order_nsu: String(fatura_id),
        items: [
          {
            description: descricao || `Fatura #${fatura_id}`,
            quantity: 1,
            price: Math.round(Number(valor) * 100), // Preço em centavos (ex: R$ 80,00 -> 8000)
          },
        ],
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na resposta da InfinitePay:', data);
      return res.status(400).json({ error: 'Erro ao gerar link de pagamento na InfinitePay', details: data });
    }

    return res.status(200).json({
      checkout_url: data.url || data.checkout_url,
      order_nsu: String(fatura_id),
    });
  } catch (error: any) {
    console.error('Erro interno ao gerar PIX InfinitePay:', error);
    return res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
}