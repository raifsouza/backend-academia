import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let firebaseInicializado = false;

// Verifica se todas as chaves do Firebase existem antes de tentar inicializar
if (projectId && clientEmail && privateKey) {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseInicializado = true;
  } catch (err) {
    console.error('Erro ao inicializar Firebase Admin:', err);
  }
} else {
  console.warn('⚠️ Chaves do Firebase ausentes no .env.local. Notificações Push desativadas.');
}

export const adminAuth = firebaseInicializado ? getAuth() : null;
export const adminDb = firebaseInicializado ? getFirestore() : null;

/**
 * Helper para envio de push que se falhar ou não tiver Firebase não quebra a API
 */
export async function enviarNotificacaoPush(
  token: string,
  titulo: string,
  mensagem: string,
  dadosAdicionais?: Record<string, string>
) {
  if (!firebaseInicializado || !token) return false;

  try {
    const messaging = getMessaging();
    await messaging.send({
      token,
      notification: {
        title: titulo,
        body: mensagem,
      },
      data: dadosAdicionais,
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return false;
  }
}