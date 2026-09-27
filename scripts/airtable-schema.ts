// Prints the base's tables and fields with their IDs, to fill in and check
// src/lib/recipes/fields.ts (docs/decisions/0002-airtable-as-source-of-truth.md).
// Usage: npm run airtable:schema (reads AIRTABLE_TOKEN and AIRTABLE_BASE_ID from .env)
import { env, exit } from 'node:process';
import { listTables } from '../src/lib/airtable/client.ts';

const { AIRTABLE_TOKEN: token, AIRTABLE_BASE_ID: baseId } = env;
if (!token || !baseId) {
  console.error('AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set in .env.');
  exit(1);
}

for (const table of await listTables({ token, baseId })) {
  console.log(`\n${table.name}  ${table.id}`);
  for (const field of table.fields) {
    const primary = field.id === table.primaryFieldId ? '  (primary)' : '';
    console.log(`  ${field.id}  ${field.type.padEnd(20)}  ${field.name}${primary}`);
  }
}
