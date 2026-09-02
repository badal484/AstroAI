import {
  TimeConfidence,
  type BirthProfile,
  type CreateBirthProfileInput,
  type UpdateBirthProfileInput,
} from '@astroai/shared-types';
import { locationService } from '../location';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { eventBus } from '../../shared/eventBus';
import { assertNotFutureDateOfBirth, assertValidCivilDate } from './birthDateTime';
import { birthProfileRepository, type BirthProfileWriteData } from './birthProfile.repository';
import { toBirthProfile, toNormalizedLocation } from './birthProfile.types';
import type { BirthProfileDocument } from './birthProfile.model';

async function buildWriteData(input: CreateBirthProfileInput): Promise<BirthProfileWriteData> {
  const location = await locationService.resolveInput(input.location);
  const birthTime = input.birthTime ?? null;

  assertValidCivilDate(input.dateOfBirth);
  assertNotFutureDateOfBirth({
    dateOfBirth: input.dateOfBirth,
    birthTime,
    timezone: location.timezone,
  });

  return {
    name: input.name,
    dateOfBirth: input.dateOfBirth,
    birthTime,
    timeConfidence: input.timeConfidence,
    location,
  };
}

async function requireOwned(userId: string, id: string): Promise<BirthProfileDocument> {
  const profile = await birthProfileRepository.findByIdForUser(id, userId);
  // Not found and not-owned both 404, identically — never confirm to a
  // caller that a birth profile id belonging to someone else exists.
  if (!profile) throw new NotFoundError('Birth profile not found');
  return profile;
}

export const birthProfileService = {
  async create(userId: string, input: CreateBirthProfileInput): Promise<BirthProfile> {
    const data = await buildWriteData(input);
    const doc = await birthProfileRepository.create(userId, data);
    return toBirthProfile(doc);
  },

  async list(userId: string): Promise<BirthProfile[]> {
    const docs = await birthProfileRepository.listForUser(userId);
    return docs.map(toBirthProfile);
  },

  async getById(userId: string, id: string): Promise<BirthProfile> {
    const doc = await requireOwned(userId, id);
    return toBirthProfile(doc);
  },

  async update(userId: string, id: string, input: UpdateBirthProfileInput): Promise<BirthProfile> {
    const existing = await requireOwned(userId, id);

    const timeConfidence = input.timeConfidence ?? existing.timeConfidence;
    const dateOfBirth = input.dateOfBirth ?? existing.dateOfBirth;

    let birthTime: string | null;
    if (input.birthTime !== undefined) {
      birthTime = input.birthTime;
    } else if (timeConfidence === TimeConfidence.UNKNOWN) {
      birthTime = null;
    } else {
      birthTime = existing.birthTime ?? null;
    }
    if (timeConfidence !== TimeConfidence.UNKNOWN && birthTime === null) {
      throw new ValidationError('Birth time is required for "exact" or "approximate" confidence');
    }

    const location = input.location
      ? await locationService.resolveInput(input.location)
      : toNormalizedLocation(existing.location);

    assertValidCivilDate(dateOfBirth);
    assertNotFutureDateOfBirth({
      dateOfBirth,
      birthTime: birthTime ?? null,
      timezone: location.timezone,
    });

    const updated = await birthProfileRepository.update(id, {
      name: input.name ?? existing.name,
      dateOfBirth,
      birthTime: birthTime ?? null,
      timeConfidence,
      location,
    });
    if (!updated) throw new NotFoundError('Birth profile not found');

    eventBus.emit('birthProfile.changed', { birthProfileId: id });
    return toBirthProfile(updated);
  },

  async remove(userId: string, id: string): Promise<void> {
    await requireOwned(userId, id);
    await birthProfileRepository.deleteById(id);
    eventBus.emit('birthProfile.deleted', { birthProfileId: id });
  },
};
