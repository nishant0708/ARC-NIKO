import { buildRepository, loadFileData, repository, setRepository } from './repository.js';
import { loadErpData } from './erp/erpSource.js';

/**
 * Chooses and refreshes the data source.
 *   DATA_SOURCE=file    PILOT export files in /data (default)
 *   DATA_SOURCE=airgen  live Airgen ERP over MCP (needs AGENTIC_ERP_URL and AGENTIC_ERP_TOKEN)
 * A failed ERP load at start-up stops the server: it never falls back to old files silently.
 * A failed refresh keeps the last good data and records a warning.
 */
export async function initDataSource(): Promise<void> {
  const kind = (process.env.DATA_SOURCE ?? 'file').toLowerCase();
  if (kind !== 'airgen') {
    setRepository(buildRepository(loadFileData()));
    return;
  }
  await refreshFromErp();
  const minutes = Number(process.env.ERP_REFRESH_MINUTES ?? 15);
  if (minutes > 0) {
    setInterval(() => {
      refreshFromErp().catch((e: Error) => {
        const current = repository();
        current.source.warnings = [
          `Last refresh failed at ${new Date().toISOString()}: ${e.message}. Showing data loaded at ${current.source.loadedAt}.`,
          ...current.source.warnings.filter((w) => !w.startsWith('Last refresh failed')),
        ];
        console.error('[erp] refresh failed:', e.message);
      });
    }, minutes * 60_000).unref();
  }
}

async function refreshFromErp() {
  const started = Date.now();
  const raw = await loadErpData();
  const repo = buildRepository(raw);
  setRepository(repo);
  console.log(
    `[erp] loaded ${repo.opportunities.length} opportunities, ${repo.goals.length} GP targets, ${repo.clientManagers.length} client managers in ${Date.now() - started} ms`,
  );
  repo.source.warnings.forEach((w) => console.warn('[erp] warning:', w));
}
