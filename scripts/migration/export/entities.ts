import path from 'node:path';
import { PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { fetchTerms } from '../lib/wp-helpers';

export interface ExportedClient {
  wpTermId: number;
  name: string;
  slug: string;
}

export interface ExportedCrewMember {
  wpTermId: number;
  name: string;
  slug: string;
  role: 'director' | 'dop' | 'art-director';
}

export interface ExportedPlatform {
  wpTermId: number;
  name: string;
  slug: string;
}

const CREW_TAXONOMIES: Record<string, ExportedCrewMember['role']> = {
  director: 'director',
  dop: 'dop',
  'art-director': 'art-director',
};

export async function exportEntities(): Promise<{
  clients: ExportedClient[];
  crewMembers: ExportedCrewMember[];
  platforms: ExportedPlatform[];
}> {
  const clientTerms = await fetchTerms(['client']);
  const crewTerms = await fetchTerms(['director', 'dop', 'art-director']);
  const platformTerms = await fetchTerms(['platform']);

  const clients: ExportedClient[] = clientTerms.map((t) => ({
    wpTermId: t.termId,
    name: t.name,
    slug: t.slug,
  }));

  const crewMembers: ExportedCrewMember[] = crewTerms.map((t) => ({
    wpTermId: t.termId,
    name: t.name,
    slug: t.slug,
    role: CREW_TAXONOMIES[t.taxonomy],
  }));

  const platforms: ExportedPlatform[] = platformTerms.map((t) => ({
    wpTermId: t.termId,
    name: t.name,
    slug: t.slug,
  }));

  const outDir = path.join(PATHS.migrationData, 'entities');
  writeJson(path.join(outDir, 'clients.json'), clients);
  writeJson(path.join(outDir, 'crew-members.json'), crewMembers);
  writeJson(path.join(outDir, 'platforms.json'), platforms);

  return { clients, crewMembers, platforms };
}
