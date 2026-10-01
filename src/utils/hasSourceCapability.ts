import type { SourceCapability, SourceGraph } from '@ankhorage/dependency-graph';

/*** Report whether every observed project has at least one analyzer that provides a capability. */
export function hasSourceCapability(graph: SourceGraph, capability: SourceCapability): boolean {
  const projectIds = new Set(graph.capabilities.map(({ projectId }) => projectId));
  if (projectIds.size === 0) return false;

  return [...projectIds].every((projectId) =>
    graph.capabilities.some(
      (report) => report.projectId === projectId && report.available.includes(capability),
    ),
  );
}
