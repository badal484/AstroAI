/**
 * Creates the first super-admin account from ADMIN_SEED_EMAIL /
 * ADMIN_SEED_PASSWORD / ADMIN_SEED_NAME. There is no public admin
 * registration route (CLAUDE.md §51 — no hardcoded admin credentials in
 * application code) — this script, run manually, is the only way an admin
 * account is created until an "invite another admin" feature exists.
 *
 * Usage:
 *   ADMIN_SEED_EMAIL=you@astroai.app ADMIN_SEED_PASSWORD=... ADMIN_SEED_NAME="Your Name" \
 *     npm run seed:admin --workspace=backend
 */
import argon2 from 'argon2';
import { AdminRole } from '@astroai/shared-types';
import { env } from '../src/config/env';
import { connectMongo, disconnectMongo } from '../src/lib/mongo';
import { adminUserRepository } from '../src/modules/admin/adminUser.repository';
import { logger } from '../src/shared/logger';

async function main(): Promise<void> {
  const { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME } = env;

  if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD || !ADMIN_SEED_NAME) {
    logger.error(
      {},
      'ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD and ADMIN_SEED_NAME must all be set to run this script',
    );
    process.exit(1);
  }

  await connectMongo();

  const existing = await adminUserRepository.findByEmail(ADMIN_SEED_EMAIL);
  if (existing) {
    logger.info({ email: ADMIN_SEED_EMAIL }, 'Admin account already exists — nothing to do');
    await disconnectMongo();
    return;
  }

  const passwordHash = await argon2.hash(ADMIN_SEED_PASSWORD, { type: argon2.argon2id });
  await adminUserRepository.create({
    email: ADMIN_SEED_EMAIL,
    passwordHash,
    name: ADMIN_SEED_NAME,
    role: AdminRole.SUPER_ADMIN,
  });

  logger.info({ email: ADMIN_SEED_EMAIL }, 'Super-admin account created');
  await disconnectMongo();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to seed admin account');
  process.exit(1);
});
