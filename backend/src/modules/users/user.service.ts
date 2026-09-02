import type { ClientSession } from 'mongoose';
import { AccountStatus } from '@astroai/shared-types';
import { NotFoundError } from '../../shared/errors';
import { userRepository } from './user.repository';
import type { UserDocument } from './user.model';

export interface CreateUserProfile {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export const userService = {
  async getById(id: string): Promise<UserDocument> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  createUser(profile: CreateUserProfile, session?: ClientSession): Promise<UserDocument> {
    return userRepository.create(profile, session);
  },

  list(params: { limit: number; cursor?: string }) {
    return userRepository.list(params);
  },

  async suspend(id: string): Promise<UserDocument> {
    const user = await userRepository.updateStatus(id, AccountStatus.SUSPENDED);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async reactivate(id: string): Promise<UserDocument> {
    const user = await userRepository.updateStatus(id, AccountStatus.ACTIVE);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  /** Self-service account deletion (CLAUDE.md §56): soft-delete + scrub PII,
   * keeping the document for referential integrity with future records
   * (wallet transactions, reports, ...) that will reference this userId. */
  async softDelete(id: string): Promise<UserDocument> {
    const user = await userRepository.anonymizeAndDelete(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },
};
