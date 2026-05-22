import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specPath = join(__dirname, '../../openapi.yaml');

export const openapiSpec = yaml.parse(readFileSync(specPath, 'utf8'));
export const openapiSpecPath = specPath;
