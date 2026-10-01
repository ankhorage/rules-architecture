# Public API

## ArchitectureContradiction

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:23:1`

One observed dependency that contradicts an inferred model role direction.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| message | property | `string` | yes |  |
| relationKind | property | `string` | yes |  |
| sourceRole | property | `string` | yes |  |
| sourceSemanticPath | property | `string` | yes |  |
| targetRole | property | `string` | yes |  |
| targetSemanticPath | property | `string` | yes |  |

## ArchitectureDetectionCandidate

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:33:1`

A plausible architecture interpretation with explicit uncertainty and limitations.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| confidence | property | `number` | yes |  |
| contradictions | property | `readonly ArchitectureContradiction[]` | yes |  |
| modelId | property | `"hexagonal" \| "clean" \| "onion" \| "layered"` | yes |  |
| roleAssignments | property | `readonly ArchitectureRoleAssignment[]` | yes |  |
| score | property | `number` | yes |  |
| supportingEvidence | property | `readonly ArchitectureDetectionEvidence[]` | yes |  |
| unavailableCapabilities | property | `readonly SourceCapability[]` | yes |  |

## ArchitectureDetectionEvidence

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:7:1`

One serializable reason supporting an inferred architecture role or candidate.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| kind | property | `"capability" \| "declaration" \| "dependency" \| "path" \| "topology"` | yes |  |
| message | property | `string` | yes |  |
| semanticPath | property | `string \| undefined` | no |  |
| weight | property | `number` | yes |  |

## ArchitectureDetectionResult

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:44:1`

Architecture analysis result that may contain several plausible models.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| candidates | property | `readonly ArchitectureDetectionCandidate[]` | yes |  |

## ArchitectureEvaluationOptions

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:56:1`

Optional generic Rules configuration for explicit architecture evaluation.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| config | property | `RulesConfig \| undefined` | no |  |

## ArchitectureEvaluationResult

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:61:1`

Generic Rules result plus the explicit target and inferred role evidence used for evaluation.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| diagnostics | property | `readonly RuleEvaluationDiagnostic[]` | yes |  |
| findings | property | `readonly RuleFinding<JsonValue>[]` | yes |  |
| modelId | property | `"hexagonal" \| "clean" \| "onion" \| "layered"` | yes |  |
| roleAssignments | property | `readonly ArchitectureRoleAssignment[]` | yes |  |

## ArchitectureModel

Kind: `type`
Module: `src/types/architectureModel.ts`
Source: `src/types/architectureModel.ts:14:1`

Built-in architecture semantics, separate from observed facts and inferred roles.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| allowedDependencies | property | `readonly ArchitectureRoleDependency[]` | yes |  |
| id | property | `"hexagonal" \| "clean" \| "onion" \| "layered"` | yes |  |
| interpretation | property | `string` | yes |  |
| name | property | `string` | yes |  |
| reference | property | `string` | yes |  |
| roles | property | `readonly ArchitectureRole[]` | yes |  |

## ArchitectureRole

Kind: `type`
Module: `src/types/architectureModel.ts`
Source: `src/types/architectureModel.ts:2:1`

A semantic role in one architecture model, independent of source layout.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| description | property | `string` | yes |  |
| id | property | `string` | yes |  |

## ArchitectureRoleAssignment

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:15:1`

One semantic role inferred from graph evidence without changing observed source facts.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| confidence | property | `number` | yes |  |
| evidence | property | `readonly ArchitectureDetectionEvidence[]` | yes |  |
| roleId | property | `string` | yes |  |
| semanticPath | property | `string` | yes |  |

## ArchitectureRoleDependency

Kind: `type`
Module: `src/types/architectureModel.ts`
Source: `src/types/architectureModel.ts:8:1`

A permitted static source dependency between inferred roles.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| source | property | `string` | yes |  |
| target | property | `string` | yes |  |

## ArchitectureRuleContext

Kind: `type`
Module: `src/types/architectureAnalysis.ts`
Source: `src/types/architectureAnalysis.ts:49:1`

Architecture-specific Rules context built from an explicit target model.

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| graph | property | `SourceGraph` | yes |  |
| model | property | `ArchitectureModel` | yes |  |
| roleAssignments | property | `readonly ArchitectureRoleAssignment[]` | yes |  |

## createArchitectureRuleSet

Kind: `function`
Module: `src/features/rules/domain/createArchitectureRuleSet.ts`
Source: `src/features/rules/domain/createArchitectureRuleSet.ts:17:1`

Create architecture rules for one explicitly selected target model.

### Signatures

- `(modelId: "hexagonal" | "clean" | "onion" | "layered") => RuleSet<ArchitectureRuleContext>`
  - modelId: `"hexagonal" | "clean" | "onion" | "layered"`
  - returns: `RuleSet<ArchitectureRuleContext>`

## detectArchitecture

Kind: `function`
Module: `src/features/detection/domain/detectArchitecture.ts`
Source: `src/features/detection/domain/detectArchitecture.ts:28:1`

Detect plausible architecture models from observed graph facts without selecting an enforcement target.

### Signatures

- `(graph: SourceGraph) => ArchitectureDetectionResult`
  - graph: `SourceGraph`
  - returns: `ArchitectureDetectionResult`

## evaluateArchitecture

Kind: `function`
Module: `src/features/evaluation/domain/evaluateArchitecture.ts`
Source: `src/features/evaluation/domain/evaluateArchitecture.ts:22:1`

Evaluate one explicitly selected architecture model through the generic Rules engine.

### Signatures

- `(graph: SourceGraph, modelId: "hexagonal" | "clean" | "onion" | "layered", options?: ArchitectureEvaluationOptions) => ArchitectureEvaluationResult`
  - graph: `SourceGraph`
  - modelId: `"hexagonal" | "clean" | "onion" | "layered"`
  - options: `ArchitectureEvaluationOptions` (optional)
  - returns: `ArchitectureEvaluationResult`

## inferArchitectureRoles

Kind: `function`
Module: `src/features/detection/domain/inferArchitectureRoles.ts`
Source: `src/features/detection/domain/inferArchitectureRoles.ts:76:1`

Infer semantic model roles from generic source facts while keeping path names weak evidence.

### Signatures

- `(graph: SourceGraph, model: ArchitectureModel) => readonly ArchitectureRoleAssignment[]`
  - graph: `SourceGraph`
  - model: `ArchitectureModel`
  - returns: `readonly ArchitectureRoleAssignment[]`

## listArchitectureModels

Kind: `function`
Module: `src/features/models/domain/listArchitectureModels.ts`
Source: `src/features/models/domain/listArchitectureModels.ts:5:1`

List established architecture models without inferring a project's target.

### Signatures

- `() => readonly ArchitectureModel[]`
  - returns: `readonly ArchitectureModel[]`
