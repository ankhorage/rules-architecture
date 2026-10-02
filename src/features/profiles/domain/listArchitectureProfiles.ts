import type { ArchitectureProfile } from '../../../types/architectureProfile.js';
import { ARCHITECTURE_PROFILES } from '../constants/architectureProfiles.js';

/*** List built-in architecture profiles without selecting one implicitly. */
export function listArchitectureProfiles(): readonly ArchitectureProfile[] {
  return ARCHITECTURE_PROFILES;
}
