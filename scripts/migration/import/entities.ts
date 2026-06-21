import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedClient, ExportedCrewMember, ExportedPlatform } from '../export/entities';
import { readJson } from '../lib/fs';
import { clientId, crewMemberId, platformId } from '../lib/ids';
import { createOrReplace } from '../lib/sanity-client';

function slugField(slug: string) {
  return { _type: 'slug' as const, current: slug };
}

export async function importEntities(): Promise<Record<string, number>> {
  const clients = readJson<ExportedClient[]>(
    path.join(PATHS.migrationData, 'entities', 'clients.json')
  );
  const crewMembers = readJson<ExportedCrewMember[]>(
    path.join(PATHS.migrationData, 'entities', 'crew-members.json')
  );
  const platforms = readJson<ExportedPlatform[]>(
    path.join(PATHS.migrationData, 'entities', 'platforms.json')
  );

  for (const c of clients) {
    await createOrReplace({
      _id: clientId(c.slug),
      _type: 'client',
      name: c.name,
      slug: slugField(c.slug),
    });
  }

  for (const c of crewMembers) {
    await createOrReplace({
      _id: crewMemberId(c.role, c.slug),
      _type: 'crewMember',
      name: c.name,
      slug: slugField(c.slug),
      role: c.role,
    });
  }

  for (const p of platforms) {
    await createOrReplace({
      _id: platformId(p.slug),
      _type: 'platform',
      name: p.name,
      slug: slugField(p.slug),
    });
  }

  const counts = {
    clients: clients.length,
    crewMembers: crewMembers.length,
    platforms: platforms.length,
  };
  console.log('Imported entities:', counts);
  return counts;
}
