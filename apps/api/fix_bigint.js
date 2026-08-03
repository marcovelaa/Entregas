const fs = require('fs');
const glob = require('glob');

const files = glob.sync('E:/Entregas2/apps/api/src/modules/catalogo/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace Entity id type: `id: number;` to `id: bigint;`
  if (content.includes('id: number;')) {
    content = content.replace(/id:\s*number;/g, 'id: bigint;');
    changed = true;
  }
  
  // Replace method arguments: `id: number` to `id: bigint`
  if (content.includes('id: number')) {
    content = content.replace(/id:\s*number/g, 'id: bigint');
    changed = true;
  }
  
  // Replace ParseIntPipe with custom ParseBigIntPipe or just handle strings
  // Actually let's just make sure id is parsed correctly in controllers if we can.
  // We'll leave controllers alone for a second.

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
