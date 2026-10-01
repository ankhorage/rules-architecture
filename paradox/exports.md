# Public API

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

## listArchitectureModels

Kind: `function`
Module: `src/features/models/domain/listArchitectureModels.ts`
Source: `src/features/models/domain/listArchitectureModels.ts:5:1`

List established architecture models without inferring a project's target.

### Signatures

- `() => readonly ArchitectureModel[]`
  - returns: `readonly ArchitectureModel[]`
