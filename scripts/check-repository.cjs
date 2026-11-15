const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const failures = [];
for (const file of tracked) {
  const name = path.posix.basename(file);
  if ((name === '.env' || name.startsWith('.env.')) && name !== '.env.example') failures.push(`Environment file is tracked: ${file}`);
  if (/(^|\/)(node_modules|dist|coverage)\//.test(file)) failures.push(`Generated file is tracked: ${file}`);
}
const docs = ['README.md', 'SECURITY.md', 'Frontend/README.md', ...fs.readdirSync(path.join(root, 'docs')).filter(file => file.endsWith('.md')).map(file => `docs/${file}`)];
for (const file of docs) {
  const contents = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of contents.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (/^[a-z]+:|^#|^\//i.test(target)) continue;
    const localPath = decodeURIComponent(target.split('#')[0]);
    if (!fs.existsSync(path.resolve(root, path.dirname(file), localPath))) failures.push(`Broken documentation link in ${file}: ${target}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Repository checks passed: no tracked environment/build files; documentation links resolve.');
