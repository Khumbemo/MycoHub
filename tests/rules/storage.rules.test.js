import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';

let env;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mycohub',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

const storageAs = (uid) => (uid ? env.authenticatedContext(uid).storage() : env.unauthenticatedContext().storage());

describe('observation photos', () => {
  it('lets the owner upload an image into their own folder', async () => {
    await assertSucceeds(
      uploadBytes(ref(storageAs('alice'), 'observations/alice/r1/photo-1'), jpeg, { contentType: 'image/jpeg' }),
    );
  });

  it("blocks uploads into another user's folder", async () => {
    await assertFails(
      uploadBytes(ref(storageAs('mallory'), 'observations/alice/r1/photo-2'), jpeg, { contentType: 'image/jpeg' }),
    );
  });

  it('blocks non-image files and anonymous uploads', async () => {
    await assertFails(
      uploadBytes(ref(storageAs('alice'), 'observations/alice/r1/script.js'), jpeg, {
        contentType: 'application/javascript',
      }),
    );
    await assertFails(
      uploadBytes(ref(storageAs(), 'observations/alice/r1/photo-3'), jpeg, { contentType: 'image/jpeg' }),
    );
  });

  it('blocks files of 10 MB or more', async () => {
    const big = new Uint8Array(10 * 1024 * 1024);
    await assertFails(
      uploadBytes(ref(storageAs('alice'), 'observations/alice/r1/huge'), big, { contentType: 'image/jpeg' }),
    );
  });

  it("blocks deleting another user's photo", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'observations/alice/r2/photo-1'), jpeg, { contentType: 'image/jpeg' });
    });
    await assertFails(deleteObject(ref(storageAs('mallory'), 'observations/alice/r2/photo-1')));
    await assertSucceeds(deleteObject(ref(storageAs('alice'), 'observations/alice/r2/photo-1')));
  });

  it('closes every other path', async () => {
    await assertFails(uploadBytes(ref(storageAs('alice'), 'public/x.jpg'), jpeg, { contentType: 'image/jpeg' }));
  });
});
