import {
  AdminRole,
  AuditAction,
  AuditLogDTO,
  AuditTargetType,
} from '@astroai/shared-types';
import { AuditLogModel } from './auditLog.model';

export class AuditLogService {
  /**
   * Records an immutable audit log entry.
   */
  async record(params: {
    adminId: string;
    adminName: string;
    adminEmail: string;
    adminRole: AdminRole;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    reason: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLogDTO> {
    const doc = await AuditLogModel.create({
      ...params,
      beforeState: params.beforeState ?? null,
      afterState: params.afterState ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.toDTO(doc);
  }

  /**
   * Lists audit logs with flexible filtering and pagination.
   */
  async list(filters?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: AuditLogDTO[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.adminId) query.adminId = filters.adminId;
    if (filters?.action) query.action = filters.action;
    if (filters?.targetType) query.targetType = filters.targetType;
    if (filters?.targetId) query.targetId = filters.targetId;
    if (filters?.search) {
      query.$or = [
        { reason: { $regex: filters.search, $options: 'i' } },
        { adminEmail: { $regex: filters.search, $options: 'i' } },
        { adminName: { $regex: filters.search, $options: 'i' } },
        { targetId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(filters?.limit ?? 50, 200);
    const offset = filters?.offset ?? 0;

    const [docs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);

    return {
      items: docs.map((d) => this.toDTO(d)),
      total,
    };
  }

  private toDTO(doc: any): AuditLogDTO {
    return {
      id: doc._id.toString(),
      adminId: doc.adminId,
      adminName: doc.adminName,
      adminEmail: doc.adminEmail,
      adminRole: doc.adminRole,
      action: doc.action,
      targetType: doc.targetType,
      targetId: doc.targetId,
      reason: doc.reason,
      beforeState: doc.beforeState ?? null,
      afterState: doc.afterState ?? null,
      ipAddress: doc.ipAddress ?? null,
      userAgent: doc.userAgent ?? null,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  }
}

export const auditLogService = new AuditLogService();
