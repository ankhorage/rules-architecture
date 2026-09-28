/*** A semantic role in one architecture model, independent of source layout. */
export interface ArchitectureRole {
  readonly id: string;
  readonly description: string;
}

/*** A permitted static source dependency between inferred roles. */
export interface ArchitectureRoleDependency {
  readonly source: string;
  readonly target: string;
}

/*** Built-in architecture semantics, separate from observed facts and inferred roles. */
export interface ArchitectureModel {
  readonly id: 'hexagonal' | 'clean' | 'onion' | 'layered';
  readonly name: string;
  readonly reference: string;
  readonly interpretation: string;
  readonly roles: readonly ArchitectureRole[];
  readonly allowedDependencies: readonly ArchitectureRoleDependency[];
}
