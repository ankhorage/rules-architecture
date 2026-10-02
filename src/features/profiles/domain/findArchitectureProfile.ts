import type { ArchitectureProfile } from '../../../types/architectureProfile.js';
import { ARCHITECTURE_PROFILES } from '../constants/architectureProfiles.js';

/*** Resolve one built-in architecture profile or reject a missing provider definition. */
export function findArchitectureProfile(profileId: ArchitectureProfile['id']): ArchitectureProfile {
  const profile = ARCHITECTURE_PROFILES[0];
  if (profile === undefined) throw new Error('Unknown architecture profile: ' + profileId);
  return profile;
}
