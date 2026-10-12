import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';

import { collectImports } from './import-specifiers.mjs';

const root = resolve('src');
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const sliced = new Set(['pages', 'widgets', 'features', 'entities']);
const errors = [];
let count = 0;

function identity(path) {
  const parts = relative(root, path).split(/[\\/]/);
  const layer = layers.includes(parts[0]) ? parts[0] : 'app';
  return { layer, slice: sliced.has(layer) ? parts[1] : undefined, parts };
}

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const source = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      visit(source);
      continue;
    }
    if (!['.ts', '.tsx'].includes(extname(source)) || source === resolve(root, 'app/router/routeTree.gen.ts')) continue;
    count++;
    const owner = identity(source);
    for (const specifier of collectImports(source, readFileSync(source, 'utf8'))) {
      const target = specifier.startsWith('@/')
        ? resolve(root, specifier.slice(2))
        : specifier.startsWith('.')
          ? resolve(dirname(source), specifier)
          : undefined;
      if (!target) continue;
      const imported = identity(target);
      const prefix = `${relative(root, source)}: ${specifier}`;
      if (relative(root, target).startsWith('..')) {
        errors.push(`${prefix}: import escapes src`);
      } else if (layers.indexOf(imported.layer) < layers.indexOf(owner.layer)) {
        errors.push(`${prefix}: cannot import a higher layer`);
      } else if (owner.layer === imported.layer && sliced.has(owner.layer) && owner.slice !== imported.slice) {
        if (owner.layer !== 'entities' || imported.parts.slice(2).join('/') !== `@x/${owner.slice}`) {
          errors.push(`${prefix}: same-layer slice import requires an entity @x API`);
        }
      } else if (sliced.has(imported.layer) && (owner.layer !== imported.layer || owner.slice !== imported.slice)) {
        if (imported.parts.length > 2 && imported.parts.slice(2).join('/') !== 'index') {
          errors.push(`${prefix}: import through the slice public API`);
        }
      }
    }
  }
}

visit(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`FSD boundaries passed (${count} files)`);
}
