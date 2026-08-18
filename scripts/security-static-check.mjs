import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

function filesUnder(path) {
  const absolute = resolve(root, path);
  if (!statSync(absolute).isDirectory()) return [absolute];
  const files = [];
  for (const entry of readdirSync(absolute)) {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) files.push(...filesUnder(relative(root, child)));
    else files.push(child);
  }
  return files;
}

const failures = [];

const migrationFiles = filesUnder('supabase/migrations');

for (const file of migrationFiles) {
  const text = readFileSync(file, 'utf8');
  if (/encrypted_password\s*=\s*crypt\s*\(\s*['"]/i.test(text)) {
    failures.push(`${relative(root, file)}: literal password assignment in migration`);
  }
  if (/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.auto_assign_admin_role/i.test(text)) {
    failures.push(`${relative(root, file)}: signup-time privileged role bootstrap is forbidden`);
  }
  if (/hpulse\d+@g(?:mail|amil)\.com/i.test(text)) {
    failures.push(`${relative(root, file)}: privileged identity is embedded in migration history`);
  }
  if (/NEW\.email[\s\S]{0,800}['"]super_admin['"]/i.test(text)) {
    failures.push(`${relative(root, file)}: email comparison can grant super_admin`);
  }
}

for (const target of ['src/pages', 'src/components', 'public', 'docs', 'index.html']) {
  for (const file of filesUnder(target)) {
    const text = readFileSync(file, 'utf8');
    if (/hpulse\d+@g(?:mail|amil)\.com/i.test(text)) {
      failures.push(`${relative(root, file)}: privileged login identity exposed in public/client content`);
    }
  }
}

for (const target of ['src', 'public']) {
  for (const file of filesUnder(target)) {
    const text = readFileSync(file, 'utf8');
    if (text.includes('local-build-placeholder')) {
      failures.push(`${relative(root, file)}: placeholder runtime asset is forbidden`);
    }
  }
}

const hardeningMigration = readFileSync(
  resolve(root, 'supabase/migrations/20260817000100_remove_email_admin_bootstrap.sql'),
  'utf8',
);
if (!/DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth\.users/i.test(hardeningMigration)) {
  failures.push('admin hardening migration does not remove the email bootstrap trigger');
}

const privilegedRpcHardening = readFileSync(
  resolve(root, 'supabase/migrations/20260818000100_harden_privileged_rpcs.sql'),
  'utf8',
);

function sqlFunctionBody(sql, name) {
  const declaration = new RegExp(
    `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.${name}\\s*\\(`,
    'i',
  );
  const start = sql.search(declaration);
  if (start < 0) return '';
  const bodyStart = sql.indexOf('AS $$', start);
  const bodyEnd = bodyStart < 0 ? -1 : sql.indexOf('$$;', bodyStart);
  return bodyStart < 0 || bodyEnd < 0 ? '' : sql.slice(start, bodyEnd + 3);
}

for (const name of [
  'admin_update_user_level',
  'admin_update_user_status',
  'admin_delete_user',
  'admin_grant_temp_ai_uses',
]) {
  const body = sqlFunctionBody(privilegedRpcHardening, name);
  if (!body || !/auth\.uid\(\)\s*<>\s*p_admin_id/i.test(body)) {
    failures.push(`${name}: privileged RPC is not bound to auth.uid()`);
  }
}

for (const name of ['can_use_ai', 'consume_ai_use']) {
  const body = sqlFunctionBody(privilegedRpcHardening, name);
  if (!body || !/auth\.uid\(\)\s*<>\s*p_user_id/i.test(body)) {
    failures.push(`${name}: quota RPC is not bound to the authenticated user`);
  }
}

if (!/CREATE OR REPLACE FUNCTION public\.consume_ai_use[\s\S]*FOR UPDATE;/i.test(privilegedRpcHardening)) {
  failures.push('consume_ai_use: row lock is required for atomic quota consumption');
}

for (const signature of [
  'admin_update_user_level',
  'admin_update_user_status',
  'admin_delete_user',
  'admin_grant_temp_ai_uses',
  'admin_get_all_users',
  'admin_batch_update_level',
  'admin_batch_update_status',
  'can_use_ai',
  'consume_ai_use',
]) {
  const revoke = new RegExp(
    `REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.${signature}\\([^;]+FROM\\s+PUBLIC,\\s*anon`,
    'i',
  );
  if (!revoke.test(privilegedRpcHardening)) {
    failures.push(`${signature}: PUBLIC/anon execution privilege was not revoked`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`Static security gate failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write('Static security gate passed.\n');
