import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Checking Monorepo Workspace Circular Dependencies...');

const workspaces = [
  'apps/web',
  'apps/admin',
  'apps/api',
  'packages/config',
  'packages/types',
  'packages/ui',
  'packages/validation',
  'packages/eslint-config',
];

const graph = new Map();
const nameToPath = new Map();

for (const ws of workspaces) {
  const pkgJsonPath = path.join(rootDir, ws, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    nameToPath.set(pkg.name, ws);
    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    const internalDeps = Object.keys(deps).filter((d) => d.startsWith('@palnadu/'));
    graph.set(pkg.name, internalDeps);
  }
}

let hasCycle = false;
const visited = new Set();
const recStack = new Set();

function isCyclic(node, pathStack = []) {
  visited.add(node);
  recStack.add(node);
  pathStack.push(node);

  const neighbors = graph.get(node) || [];
  for (const neighbor of neighbors) {
    if (!graph.has(neighbor)) continue;
    if (!visited.has(neighbor)) {
      if (isCyclic(neighbor, [...pathStack])) return true;
    } else if (recStack.has(neighbor)) {
      console.error(`❌ Cycle detected: ${[...pathStack, neighbor].join(' -> ')}`);
      return true;
    }
  }

  recStack.delete(node);
  return false;
}

for (const node of graph.keys()) {
  if (!visited.has(node)) {
    if (isCyclic(node)) {
      hasCycle = true;
      break;
    }
  }
}

if (hasCycle) {
  console.error('❌ Circular dependency detected in monorepo packages!');
  process.exit(1);
} else {
  console.log(
    `✅ Circular Dependency Check: Passed (${graph.size} packages analyzed, 0 cycles found)`,
  );
}
