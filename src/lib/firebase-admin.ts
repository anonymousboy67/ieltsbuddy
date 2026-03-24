import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Ensure we handle private key formatting correctly
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
    }
  } else {
    console.warn('⚠️ Firebase Admin credentials missing. Sign-up/OTP features will not work until FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are added to .env.local.');
  }
} else {
  adminApp = admin.app();
}

export const adminAuth = adminApp ? adminApp.auth() : null as any;

