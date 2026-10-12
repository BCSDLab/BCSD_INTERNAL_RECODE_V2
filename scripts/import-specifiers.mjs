import { parseSync } from 'oxc-parser';

/** Read actual module syntax, including dynamic imports and TS import types. */
export function collectImports(filename, source) {
  const { program, errors } = parseSync(filename, source);
  if (errors.length) throw new Error(`${filename}: ${errors.map((error) => error.message).join('; ')}`);
  const imports = [];
  const pending = [program];
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if (
      [
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
        'ImportExpression',
        'TSImportType',
      ].includes(node.type)
    ) {
      const value = node.source;
      if (value?.type === 'Literal' && typeof value.value === 'string') imports.push(value.value);
      if (value?.type === 'TemplateLiteral' && value.expressions.length === 0)
        imports.push(value.quasis[0].value.cooked);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) pending.push(...value);
      else if (value && typeof value === 'object') pending.push(value);
    }
  }
  return imports;
}
