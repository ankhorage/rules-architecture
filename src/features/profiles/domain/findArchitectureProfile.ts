import type { ArchitectureProfile } from '../../../types/architectureProfile.js';
import { ARCHITECTURE_PROFILES } from '../constants/architectureProfiles.js';

/*** Resolve one built-in architecture profile or reject an unsupported explicit target. */
export function findArchitectureProfile(
  profileId: ArchitectureProfile['id'],
): ArchitectureProfile {
  const profile = ARCHITECTURE_PROFILES.find(({ id }) => id === profileId);
  if (profile === undefined) throw new Error('Unknown architecture profile: ' + profileId);
  return profile;
}
