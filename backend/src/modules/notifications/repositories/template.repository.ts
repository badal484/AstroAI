import {
  NotificationTemplateModel,
  type ITemplateDoc,
} from '../models/template.model';
import type {
  CreateNotificationTemplateInput,
  NotificationEventType,
  UpdateNotificationTemplateInput,
} from '@astroai/shared-types';

export const templateRepository = {
  async findByCode(templateCode: string): Promise<ITemplateDoc | null> {
    return NotificationTemplateModel.findOne({ templateCode, isActive: true });
  },

  async findByEventType(eventType: NotificationEventType): Promise<ITemplateDoc | null> {
    return NotificationTemplateModel.findOne({ eventType, isActive: true });
  },

  async findById(id: string): Promise<ITemplateDoc | null> {
    return NotificationTemplateModel.findById(id);
  },

  async list(filter: { isActive?: boolean } = {}): Promise<ITemplateDoc[]> {
    const query: any = {};
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    return NotificationTemplateModel.find(query).sort({ createdAt: -1 });
  },

  async create(data: CreateNotificationTemplateInput): Promise<ITemplateDoc> {
    return NotificationTemplateModel.create(data);
  },

  async update(id: string, updates: UpdateNotificationTemplateInput): Promise<ITemplateDoc | null> {
    return NotificationTemplateModel.findByIdAndUpdate(id, updates, { new: true });
  },

  async upsertByCode(data: CreateNotificationTemplateInput): Promise<ITemplateDoc> {
    return NotificationTemplateModel.findOneAndUpdate(
      { templateCode: data.templateCode },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  },
};
