#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const spec = readFileSync(join(root, 'docs/openapi.yaml'), 'utf8');
const endpointCount = (spec.match(/^\s+(get|post|put|patch|delete):/gm) ?? []).length;

const targets = [
  {
    name: 'Android (kotlin)',
    dir: 'apps/marketplace/android/api-client/src/main/kotlin/com/citybox/api/apis',
    pattern: /^\s+(suspend )?fun /gm,
    expected: endpointCount,
  },
  {
    name: 'iOS (swift5)',
    dir: 'apps/marketplace/ios/Generated/CityBoxAPI/Classes/OpenAPIs/APIs',
    pattern: /open class func /gm,
    expected: endpointCount * 2,
  },
  {
    name: 'Web (typescript-fetch)',
    dir: 'apps/marketplace/web/src/api/generated/src/apis',
    pattern: /async \w+\(/gm,
    expected: endpointCount * 3,
  },
];

let ok = true;

console.log(`OpenAPI: ${endpointCount} endpoints\n`);

for (const target of targets) {
  const abs = join(root, target.dir);
  if (!existsSync(abs)) {
    console.log(`✗ ${target.name}: diretório ausente (${target.dir})`);
    ok = false;
    continue;
  }

  const apiFiles = readdirSync(abs).filter((f) => f.endsWith('.kt') || f.endsWith('.swift') || f.endsWith('.ts'));
  let methods = 0;
  for (const file of apiFiles) {
    const content = readFileSync(join(abs, file), 'utf8');
    methods += (content.match(target.pattern) ?? []).length;
  }

  const match = methods === target.expected;
  console.log(`${match ? '✓' : '✗'} ${target.name}: ${methods} métodos (esperado ${target.expected})`);
  if (!match) ok = false;
}

if (!ok) process.exit(1);

console.log('\nGeração OK.');
