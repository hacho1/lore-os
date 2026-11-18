const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
for (const field of ['dependencies','devDependencies']) {
 for (const name of Object.keys(pkg[field] || {})) {
  pkg[field][name] = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'),'utf8')).version;
 }
 lock.packages[''][field] = pkg[field];
}
fs.writeFileSync(path.join(root,'package.json'), JSON.stringify(pkg,null,2)+'\n');
fs.writeFileSync(path.join(root,'package-lock.json'), JSON.stringify(lock,null,2)+'\n');
console.log('설치된 버전으로 package.json과 lock 파일을 고정했습니다.');
