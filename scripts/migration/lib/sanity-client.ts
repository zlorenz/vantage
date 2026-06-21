import { createClient } from '@sanity/client';
import { SANITY } from '../config';

export function getWriteClient() {
  if (!SANITY.token) {
    throw new Error(
      'SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN is required for import. Set it in .env.local'
    );
  }
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token,
    useCdn: false,
  });
}

export async function createOrReplace(doc: Record<string, unknown>): Promise<void> {
  const client = getWriteClient();
  await client.createOrReplace(doc);
}

export async function patchSet(
  id: string,
  set: Record<string, unknown>
): Promise<void> {
  const client = getWriteClient();
  await client.patch(id).set(set).commit();
}
