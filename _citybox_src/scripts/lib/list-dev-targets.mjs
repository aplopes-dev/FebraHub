// Lista pacotes do workspace que têm script "dev".
// Saída: uma linha por alvo, no formato  <short>\t<name>
// onde <name> é o nome do pacote (ex.: @citybox/food-api) e
// <short> é o nome sem o escopo (ex.: food-api).

import { globSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const files = globSync(['apps/**/package.json', 'services/**/package.json', 'packages/**/package.json'], {
  exclude: (p) => p.includes('node_modules'),
})

const targets = []
for (const file of files) {
  try {
    const pkg = JSON.parse(readFileSync(file, 'utf8'))
    if (pkg?.name && pkg?.scripts?.dev) {
      targets.push({ name: pkg.name, short: pkg.name.split('/').pop(), dir: dirname(file) })
    }
  } catch {
    // ignora package.json inválido
  }
}

// Ordem amigável: núcleo da plataforma primeiro, depois APIs de verticais, depois o resto.
const priority = (t) => {
  const order = ['admin-api', 'admin-web', 'erp-web', 'erp-api']
  const i = order.indexOf(t.short)
  if (i !== -1) return i
  if (t.dir.includes('verticals')) return 100
  return 200
}

targets.sort((a, b) => priority(a) - priority(b) || a.short.localeCompare(b.short))

for (const t of targets) {
  process.stdout.write(`${t.short}\t${t.name}\n`)
}
