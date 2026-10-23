import type { Filters, Severity } from '../models/types.js';
import { clientManagers } from './clientManagers.controller.js';
import { cm360 } from './cm360.controller.js';
import { drill, opportunity, targets } from './drill.controller.js';
import { exceptions } from './exceptions.controller.js';
import { executive } from './executive.controller.js';
import { options } from './options.controller.js';
import { pipeline } from './pipeline.controller.js';

type F = { filters: Filters };

/** GraphQL resolvers: thin controllers that hand inputs to the models and return view objects. */
export const resolvers = {
  Query: {
    options: () => options(),
    executive: (_: unknown, a: F) => executive(a.filters),
    clientManagers: (_: unknown, a: F) => clientManagers(a.filters),
    pipeline: (_: unknown, a: F) => pipeline(a.filters),
    cm360: (_: unknown, a: F) => cm360(a.filters),
    exceptions: (_: unknown, a: F & { severity?: Severity | null; ruleId?: string | null }) => exceptions(a.filters, a.severity, a.ruleId),
    drill: (_: unknown, a: { input: Parameters<typeof drill>[0] }) => drill(a.input),
    targets: (_: unknown, a: F) => targets(a.filters),
    opportunity: (_: unknown, a: { guid: string }) => opportunity(a.guid),
  },
};
