import { AdminUserModel } from './adminUser.model';

export const adminUserRepository = {
  findByEmail(email: string) {
    return AdminUserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  },

  findById(id: string) {
    return AdminUserModel.findById(id).exec();
  },

  create(data: { email: string; passwordHash: string; name: string; role: string }) {
    return AdminUserModel.create(data);
  },
};
