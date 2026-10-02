import type { SourceEdgeData, SourceGraph, SourceNodeData } from '@ankhorage/dependency-graph';
import type { Rule, RuleFinding, RuleSet } from '@ankhorage/rules';

import type {
  ArchitectureProfile,
  ArchitectureProfileRole,
  ArchitectureProfileRuleContext,
} from '../../../types/architectureProfile.js';
import { findArchitectureProfile } from './findArchitectureProfile.js';

/*** Create the rule set for one explicitly selected project architecture profile. */
export function createArchitectureProfileRuleSet(
  profileId: ArchitectureProfile['id'],
): RuleSet<ArchitectureProfileRuleContext> {
  const profile = findArchitectureProfile(profileId);
  return {
    id: 'architecture-profile.' + profile.id,
    rules: [
      featureOwnershipRule(),
      roleCombinationRule(),
      ...profile.source.roles.map(roleDirectionRule),
      thinDeliveryAdapterRule(),
    ],
  };
}

/*** Require source implementation ownership below canonical feature or package-wide roots. */
function featureOwnershipRule(): Rule<ArchitectureProfileRuleContext> {
  return createRule(
    'package.architecture.feature-ownership.required',
    'Implementation source must live below an owning feature, package-wide root, or delivery edge.',
    ({ graph, profile }) =>
      sourceFilePaths(graph).flatMap((path) =>
        isAllowedSourcePath(path, profile)
          ? []
          : [
              finding(
                'package.architecture.feature-ownership.required',
                'Source implementation is outside canonical Ankhorage ownership: ' + path + '.',
                path,
                { path },
              ),
            ],
      ),
  );
}

/*** Require adapters and composition roles to coexist with a meaningful inward owner. */
function roleCombinationRule(): Rule<ArchitectureProfileRuleContext> {
  return createRule(
    'package.architecture.role-combination.invalid',
    'Feature architecture roles must form a meaningful inward/outward combination.',
    ({ graph, profile }) => {
      const rolesByFeature = collectFeatureRoles(graph, profile);
      return [...rolesByFeature.entries()].flatMap(([feature, roles]) =>
        profile.source.featureCombinations.flatMap((combination) =>
          roles.has(combination.role) &&
          !combination.requiresAnyOf.some((required) => roles.has(required))
            ? [
                finding(
                  combination.ruleId,
                  combination.role +
                    '/ requires at least one inward role in feature ' +
                    feature +
                    '.',
                  profile.source.featureRoot + '/' + feature,
                  {
                    feature,
                    role: combination.role,
                    requiresAnyOf: combination.requiresAnyOf,
                  },
                ),
              ]
            : [],
        ),
      );
    },
  );
}

/*** Reject imports from one configured inward role into its outward implementation roles. */
function roleDirectionRule(
  role: ArchitectureProfileRole,
): Rule<ArchitectureProfileRuleContext> {
  return createRule(
    role.ruleId,
    role.label + ' must not import outward implementation roles.',
    ({ graph }) =>
      importRelations(graph).flatMap(({ edge, sourcePath, targetPath }) => {
        const sourceSegments = splitPath(sourcePath);
        if (!sourceSegments.some((segment) => role.segments.includes(segment))) return [];
        const targetSegments = splitPath(targetPath);
        const outwardRole = targetSegments.find((segment) =>
          role.forbiddenOutwardSegments.includes(segment),
        );
        if (outwardRole === undefined) return [];
        return [
          finding(
            role.ruleId,
            role.label + ' must not import outward ' + outwardRole + '/ implementation.',
            sourcePath,
            {
              outwardRole,
              sourcePath,
              targetPath,
            },
            firstEvidence(edge),
          ),
        ];
      }),
    true,
  );
}

/*** Keep package-level CLI commands thin by rejecting direct imports of concrete adapters. */
function thinDeliveryAdapterRule(): Rule<ArchitectureProfileRuleContext> {
  return createRule(
    'package.architecture.delivery-concrete-adapter-import.disallowed',
    'Thin delivery adapters must not wire concrete adapter implementations directly.',
    ({ graph, profile }) => {
      const delivery = profile.source.thinDeliveryAdapter;
      return importRelations(graph).flatMap(({ edge, sourcePath, targetPath }) => {
        const sourceSegments = splitPath(sourcePath);
        const targetSegments = splitPath(targetPath);
        return includesSegmentSequence(sourceSegments, delivery.pathSegments) &&
          targetSegments.includes(delivery.concreteAdapterSegment)
          ? [
              finding(
                delivery.ruleId,
                'Thin delivery adapter must import an application operation or composition boundary instead of a concrete adapter.',
                sourcePath,
                { sourcePath, targetPath },
                firstEvidence(edge),
              ),
            ]
          : [];
      });
    },
    true,
  );
}

/*** Build one error-level architecture-profile rule. */
function createRule(
  id: string,
  summary: string,
  evaluate: (context: ArchitectureProfileRuleContext) => readonly RuleFinding[],
  requiresImports = false,
): Rule<ArchitectureProfileRuleContext> {
  return {
    id,
    summary,
    defaultSeverity: 'error',
    ...(requiresImports ? { requiredCapabilities: ['source-graph.imports'] } : {}),
    evaluate: ({ context }) => evaluate(context),
  };
}

/*** Build one portable profile finding with optional graph source evidence. */
function finding(
  ruleId: string,
  message: string,
  path: string,
  evidence: RuleFinding['evidence'],
  relationEvidence?: SourceEdgeData['evidence'][number],
): RuleFinding {
  return {
    ruleId,
    severity: 'error',
    message,
    subjects: [{ id: path, kind: 'source-file', path }],
    evidence,
    sourceLocation:
      relationEvidence?.location === undefined
        ? undefined
        : { ...relationEvidence.location, path: relationEvidence.sourcePath },
  };
}

/*** Collect intrinsic source file paths once from the factual graph. */
function sourceFilePaths(graph: SourceGraph): readonly string[] {
  return graph.graph.nodes.flatMap(({ data }) => {
    if (data.kind !== 'file' || data.classification === 'vendor') return [];
    const path = nodePath(data);
    return path?.startsWith('src/') === true ? [path] : [];
  });
}

/*** Return whether one source file belongs to an allowed Ankhorage ownership root. */
function isAllowedSourcePath(path: string, profile: ArchitectureProfile): boolean {
  const sourcePath = path.slice('src/'.length);
  if (profile.source.facadeFiles.includes(sourcePath)) return true;
  if (path === profile.source.featureRoot || path.startsWith(profile.source.featureRoot + '/')) {
    return true;
  }
  const root = splitPath(sourcePath)[0] ?? '';
  return (
    profile.source.packageWideDirectories.includes(root) ||
    profile.source.deliveryEdgeDirectories.includes(root)
  );
}

/*** Collect direct feature role directories from factual file paths. */
function collectFeatureRoles(
  graph: SourceGraph,
  profile: ArchitectureProfile,
): ReadonlyMap<string, ReadonlySet<string>> {
  const prefix = profile.source.featureRoot + '/';
  const roles = new Map<string, Set<string>>();
  for (const path of sourceFilePaths(graph)) {
    if (!path.startsWith(prefix)) continue;
    const [feature, role] = splitPath(path.slice(prefix.length));
    if (feature === undefined || role === undefined) continue;
    const featureRoles = roles.get(feature) ?? new Set<string>();
    featureRoles.add(role);
    roles.set(feature, featureRoles);
  }
  return roles;
}

interface ImportRelation {
  readonly edge: {
    readonly data: SourceEdgeData;
    readonly source: number;
    readonly target: number;
  };
  readonly sourcePath: string;
  readonly targetPath: string;
}

/*** Project factual import edges into source/target file paths. */
function importRelations(graph: SourceGraph): readonly ImportRelation[] {
  const nodeById = new Map(graph.graph.nodes.map((node) => [node.id, node.data]));
  return graph.graph.edges.flatMap((edge) => {
    if (edge.data.kind !== 'imports') return [];
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source === undefined || target === undefined) return [];
    const sourcePath = nodePath(source);
    const targetPath = nodePath(target);
    return sourcePath === undefined || targetPath === undefined
      ? []
      : [{ edge, sourcePath, targetPath }];
  });
}

/*** Resolve the project-relative path represented by a factual source node. */
function nodePath(node: SourceNodeData): string | undefined {
  return node.path ?? node.filePath;
}

/*** Return the first source-location evidence for one observed import. */
function firstEvidence(edge: {
  readonly data: SourceEdgeData;
}): SourceEdgeData['evidence'][number] | undefined {
  return edge.data.evidence[0];
}

/*** Check whether one path segment sequence occurs contiguously in another. */
function includesSegmentSequence(
  segments: readonly string[],
  expected: readonly string[],
): boolean {
  return segments.some((_, index) =>
    expected.every((segment, offset) => segments[index + offset] === segment),
  );
}

/*** Split portable source paths into normalized architecture segments. */
function splitPath(path: string): readonly string[] {
  return path.split('/').filter(Boolean);
}
