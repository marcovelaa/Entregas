import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ALL_PERMISSIONS } from '@repo/rbac-contract';

function collectControllerFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectControllerFiles(fullPath));
    } else if (entry.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectEnforcedCodes(srcDir: string): Set<string> {
  const codes = new Set<string>();
  const pattern = /@RequierePermiso\('([a-z_:]+)'\)/g;
  for (const file of collectControllerFiles(srcDir)) {
    const content = readFileSync(file, 'utf-8');
    for (const match of content.matchAll(pattern)) {
      codes.add(match[1]);
    }
  }
  return codes;
}

describe('RBAC enforcement audit', () => {
  const srcDir = join(__dirname, '..', '..', '..');
  const enforcedCodes = collectEnforcedCodes(srcDir);

  it('every declared permission is either enforced or has a documented exception', () => {
    const gaps = ALL_PERMISSIONS.filter(
      (permission) =>
        !enforcedCodes.has(permission.codigo) && !permission.excepcion,
    ).map((permission) => permission.codigo);

    expect(gaps).toEqual([]);
  });
});
