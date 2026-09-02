import type { ClientSession } from 'mongoose';
import { AccountStatus } from '@astroai/shared-types';
import { UserModel, type UserDocument } from './user.model';

export const userRepository = {
  findById(id: string) {
    return UserModel.findById(id).exec();
  },

  findActiveById(id: string) {
    return UserModel.findOne({ _id: id, status: { $ne: AccountStatus.DELETED } }).exec();
  },

  create(
    data: { email: string | null; name: string | null; avatarUrl: string | null },
    session?: ClientSession,
  ) {
    return UserModel.create([data], { session }).then((docs) => docs[0] as UserDocument);
  },

  updateStatus(id: string, status: AccountStatus) {
    return UserModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  },

  async list(params: { limit: number; cursor?: string }): Promise<{
    items: UserDocument[];
    nextCursor: string | null;
  }> {
    const query = params.cursor ? { _id: { $gt: params.cursor } } : {};
    const items = await UserModel.find(query)
      .sort({ _id: 1 })
      .limit(params.limit + 1)
      .exec();

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    const last = page.at(-1);
    return {
      items: page,
      nextCursor: hasMore && last ? last._id.toString() : null,
    };
  },

  anonymizeAndDelete(id: string) {
    return UserModel.findByIdAndUpdate(
      id,
      {
        status: AccountStatus.DELETED,
        email: null,
        name: null,
        avatarUrl: null,
      },
      { new: true },
    ).exec();
  },
};
