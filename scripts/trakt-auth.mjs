/**
 * One-time Trakt OAuth device flow.
 * Prints the access token + refresh token to add to your .env file.
 *
 * Run with: npm run trakt-auth
 * Requires TRAKT_CLIENT_ID and TRAKT_CLIENT_SECRET in .env
 */

import { readFileSync, existsSync } from 'fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set TRAKT_CLIENT_ID and TRAKT_CLIENT_SECRET in .env first.');
  process.exit(1);
}

// Step 1: request a device code
const codeResp = await fetch('https://api.trakt.tv/oauth/device/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: CLIENT_ID }),
});
const { device_code, user_code, verification_url, expires_in, interval } = await codeResp.json();

console.log('\n──────────────────────────────────────────');
console.log(`  Go to: ${verification_url}`);
console.log(`  Enter code: ${user_code}`);
console.log('──────────────────────────────────────────\n');
console.log('Waiting for authorization...');

// Step 2: poll until authorized
const deadline = Date.now() + expires_in * 1000;
const pollInterval = (interval + 1) * 1000; // add 1s buffer to avoid 429s

while (Date.now() < deadline) {
  await new Promise(r => setTimeout(r, pollInterval));

  const tokenResp = await fetch('https://api.trakt.tv/oauth/device/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: device_code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });

  if (tokenResp.status === 200) {
    const { access_token, refresh_token } = await tokenResp.json();
    console.log('\n✓ Authorized! Add these to your .env:\n');
    console.log(`TRAKT_ACCESS_TOKEN=${access_token}`);
    console.log(`TRAKT_REFRESH_TOKEN=${refresh_token}`);
    console.log('\nThen run: npm run sync');
    process.exit(0);
  }

  if (tokenResp.status === 400) {
    process.stdout.write('.');
    continue; // still pending
  }

  console.error(`\nUnexpected response: ${tokenResp.status}`);
  process.exit(1);
}

console.error('\nExpired — run the script again.');
process.exit(1);
