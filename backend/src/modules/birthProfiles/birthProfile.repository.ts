import { BirthProfileModel, type BirthProfileDocument } from './birthProfile.model';
import type { NormalizedLocation, TimeConfidence } from '@astroai/shared-types';

export interface BirthProfileWriteData {
  name: string;
  dateOfBirth: string;
  birthTime: string | null;
  timeConfidence: TimeConfidence;
  location: NormalizedLocation;
}

export const birthProfileRepository = {
  create(userId: string, data: BirthProfileWriteData): Promise<BirthProfileDocument> {
    return BirthProfileModel.create({ userId, ...data });
  },

  findById(id: string): Promise<BirthProfileDocument | null> {
    return BirthProfileModel.findById(id).exec();
  },

  findByIdForUser(id: string, userId: string): Promise<BirthProfileDocument | null> {
    return BirthProfileModel.findOne({ _id: id, userId }).exec();
  },

  listForUser(userId: string): Promise<BirthProfileDocument[]> {
    return BirthProfileModel.find({ userId }).sort({ createdAt: -1 }).exec();
  },

  update(id: string, data: Partial<BirthProfileWriteData>): Promise<BirthProfileDocument | null> {
    return BirthProfileModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  deleteById(id: string): Promise<BirthProfileDocument | null> {
    return BirthProfileModel.findByIdAndDelete(id).exec();
  },
};
