// Creates an administrator in the LOCAL Firebase emulators so the admin panel can be tried without a real project.
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long password' npm run emulators:seed
// It only talks to 127.0.0.1 and refuses to run against anything else.
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const project = process.env.FIREBASE_PROJECT_ID || 'demo-portfolio';
const host = '127.0.0.1';

if (!email || !password || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) before running this script.');
  process.exit(1);
}

const json = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `HTTP ${response.status}`);
  return body;
};

try {
  let uid;
  try {
    ({ localId: uid } = await json(await fetch(`http://${host}:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
    })));
  } catch (error) {
    if (!String(error.message).includes('EMAIL_EXISTS')) throw error;
    ({ localId: uid } = await json(await fetch(`http://${host}:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
    })));
  }
  // "Bearer owner" is the emulator's way of bypassing security rules, which is how /admins is created by hand in production too.
  await json(await fetch(`http://${host}:8080/v1/projects/${project}/databases/(default)/documents/admins/${uid}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: { createdBy: { stringValue: 'seed-emulator' } } }),
  }));
  console.log(`Administrator ready in the emulators: ${email} (uid ${uid})`);
} catch (error) {
  console.error(`Could not seed the emulators. Are they running (npm run emulators)? ${error.message}`);
  process.exit(1);
}
