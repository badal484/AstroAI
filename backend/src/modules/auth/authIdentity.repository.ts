import type { ClientSession } from 'mongoose';
import type { AuthProviderType } from '@astroai/shared-types';
import { AuthIdentityModel } from './authIdentity.model';

export const authIdentityRepository = {
  findByProvider(provider: AuthProviderType, providerId: string) {
    return AuthIdentityModel.findOne({ provider, providerId }).exec();
  },

  create(userId: string, provider: AuthProviderType, providerId: string, session?: ClientSession) {
    return AuthIdentityModel.create([{ userId, provider, providerId }], { session }).then(
      (docs) => docs[0],
    );
  },
};
