import assert from 'node:assert/strict';
import test from 'node:test';

import { collectImports } from './import-specifiers.mjs';

test('FSD inspection covers static, re-export, dynamic and TypeScript imports', () => {
  const source = `
    import { a } from '@/entities/a';
    export { b } from '@/entities/b';
    export * from '@/entities/c';
    const load = () => import('@/entities/d');
    type E = import('@/entities/e').E;
    const loadTemplate = () => import(\`@/entities/f\`);
  `;
  assert.deepEqual(
    collectImports('fixture.ts', source).sort(),
    ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => `@/entities/${name}`),
  );
});

test('comments and ordinary strings are not imports', () => {
  assert.deepEqual(
    collectImports(
      'fixture.ts',
      `// import x from '@/pages/x';
    const text = "import x from '@/pages/x'";
    const dynamic = (name: string) => import(name);
  `,
    ),
    [],
  );
});

test('invalid syntax cannot silently pass architecture checks', () => {
  assert.throws(() => collectImports('fixture.ts', 'import {'), /fixture.ts/);
});
