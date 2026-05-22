import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const moduleDir = dirname(fileURLToPath(import.meta.url));

function resolveSpecPath() {
  const candidates = [
    join(moduleDir, '../../openapi.yaml'),
    join(process.cwd(), 'openapi.yaml'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

let cachedSpec = null;
let cachedSpecPath = null;

export function getOpenapiSpec() {
  if (cachedSpec) {
    return cachedSpec;
  }

  const specPath = resolveSpecPath();
  if (!specPath) {
    throw new Error('openapi.yaml not found');
  }

  cachedSpecPath = specPath;
  cachedSpec = yaml.parse(readFileSync(specPath, 'utf8'));
  return cachedSpec;
}

export function getOpenapiSpecPath() {
  if (!cachedSpecPath) {
    getOpenapiSpec();
  }

  return cachedSpecPath;
}
