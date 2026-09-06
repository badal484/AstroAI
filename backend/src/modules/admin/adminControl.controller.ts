import type { NextFunction, Request, Response } from 'express';
import { AdminRole, userActionSchema } from '@astroai/shared-types';
import { adminControlService } from './adminControl.service';
import { auditLogService } from './auditLog.service';

export class AdminControlController {
  async getUser360(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getUser360(req.params.id as string);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async executeUserAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = userActionSchema.parse(req.body);
      const data = await adminControlService.executeUserAction(
        req.admin!,
        req.params.id as string,
        input,
        req.ip,
        req.get('user-agent'),
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, total } = await auditLogService.list({
        adminId: req.query.adminId as string | undefined,
        action: req.query.action as string | undefined,
        targetType: req.query.targetType as string | undefined,
        targetId: req.query.targetId as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });
      res.json({ success: true, data: items, total });
    } catch (err) {
      next(err);
    }
  }

  async getAIConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getAIConfig();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAstrologyConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getAstrologyConfig();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateAstrologyConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.updateAstrologyConfig(
        req.admin!,
        req.body.config || req.body,
        req.body.reason || 'Admin configuration update',
        req.ip,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listHoroscopes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listHoroscopes();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listArticles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listArticles();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRemedies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listRemedies();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listFeatureFlags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listFeatureFlags();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async toggleFeatureFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.toggleFeatureFlag(
        req.admin!,
        req.params.key as string,
        Boolean(req.body.enabled),
        req.body.reason || 'Feature flag toggle',
        req.ip,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getExecutiveMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getExecutiveMetrics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRevenueChart(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getRevenueChart();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listSupportTickets(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listSupportTickets();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async replySupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.replySupportTicket(
        req.admin!,
        req.params.id as string,
        req.body.message || req.body.body,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async resolveSupportTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.resolveSupportTicket(
        req.admin!,
        req.params.id as string,
        req.body.resolutionNotes || 'Resolved by support agent',
        req.ip,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSystemSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.getSystemSettings();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async toggleMaintenanceMode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.toggleMaintenanceMode(
        req.admin!,
        Boolean(req.body.enabled),
        req.body.message || '',
        req.body.reason || 'Maintenance update',
        req.ip,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listAdminUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.listAdminUsers();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminControlService.createAdminUser(
        req.admin!,
        {
          email: req.body.email,
          name: req.body.name,
          role: req.body.role as AdminRole,
          password: req.body.password,
        },
        req.body.reason || 'New admin invite',
        req.ip,
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const adminControlController = new AdminControlController();
