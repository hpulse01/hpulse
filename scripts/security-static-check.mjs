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

for (const file of filesUnder('supabase/migrations')) {
  const text = readFileSync(file, 'utf8');
  if (/encrypted_password\s*=\s*crypt\s*\(\s*['"]/i.test(text)) {
    failures.push(`${relative(root, file)}: literal password assignment in migration`);
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

if (failures.length > 0) {
  process.stderr.write(`Static security gate failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write('Static security gate passed.\n');
