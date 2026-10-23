/**
 * `npm run erp:discover` — connects to the Airgen ERP MCP server and writes erp-discovery.json:
 * the tool catalog, the field list of every relevant find_many tool, 3 full sample records each,
 * and how the current data/erp-mapping.json resolves against them.
 * Share erp-discovery.json (it contains sample records, not the API key) when a field is not mapped.
 */
import { writeFileSync } from 'node:fs';
import { McpClient, extractPage } from '../models/erp/mcpClient.js';
import { fieldNamesFromLearn, loadErpData, toolNamesFrom } from '../models/erp/erpSource.js';

try {
  process.loadEnvFile('.env');
} catch {
  /* no .env: use the shell environment */
}


async function main() {
  const client = McpClient.fromEnv();
  await client.connect();
  const catalog = await client.catalog();
  const all = toolNamesFrom(catalog).concat(client.listedToolNames());
  const findMany = [...new Set(all.filter((t) => t.startsWith('find_many_')))];
  const relevant = findMany.filter((t) => t.startsWith('find_many_arc_')); // the ARC niko tables only

  const out: Record<string, unknown> = { generatedAt: new Date().toISOString(), listedTools: client.listedToolNames(), findManyTools: findMany, objects: {} };
  for (const tool of relevant) {
    const entry: Record<string, unknown> = {};
    try {
      const schema = await client.learn([tool]);
      entry.fields = fieldNamesFromLearn(schema, tool);
    } catch (e) {
      entry.schemaError = (e as Error).message;
    }
    try {
      const raw = await client.run(tool, { limit: 3, offset: 0, select: ['*'] });
      const page = extractPage(raw);
      entry.total = page.total;
      entry.sample = page.rows;
      if (!page.rows.length) entry.rawReply = JSON.stringify(raw).slice(0, 1500);
    } catch (e) {
      entry.sampleError = (e as Error).message;
    }
    (out.objects as Record<string, unknown>)[tool] = entry;
    console.log(`✓ ${tool}`);
  }

  try {
    const raw = await loadErpData();
    out.mappingCheck = {
      source: raw.source.label,
      opportunities: raw.records.length,
      goals: raw.goals.length,
      clientManagers: raw.clientManagers.length,
      warnings: raw.source.warnings,
      firstOpportunity: raw.records[0] ?? null,
      firstGoal: raw.goals[0] ?? null,
    };
  } catch (e) {
    out.mappingCheck = { error: (e as Error).message };
  }

  writeFileSync('erp-discovery.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote erp-discovery.json (${findMany.length} find_many tools, ${relevant.length} inspected).`);
  console.log('Mapping check:', JSON.stringify((out.mappingCheck as object) ?? {}, null, 2).slice(0, 2000));
}

main().catch((e) => {
  console.error('Discovery failed:', (e as Error).message);
  process.exit(1);
});
