import { Router } from 'express';
import { AdminPermission, adminWalletAdjustmentSchema } from '@astroai/shared-types';
import { walletController } from './wallet.controller';
import { authenticate } from '../../middleware/authenticate.middleware';
import { authenticateAdmin } from '../../middleware/authenticateAdmin.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validateBody } from '../../middleware/validate.middleware';

/**
 * User Wallet routes mounted at /api/v1/wallet
 */
export const walletRouter = Router();
walletRouter.use('/wallet', authenticate);

walletRouter.get('/wallet', walletController.getBalance);
walletRouter.get('/wallet/transactions', walletController.getTransactions);

/**
 * Admin Wallet routes mounted at /api/v1/admin/wallets
 */
export const adminWalletRouter = Router();
adminWalletRouter.use('/wallets', authenticateAdmin);

adminWalletRouter.get(
  '/wallets',
  requirePermission(AdminPermission.WALLET_READ),
  walletController.adminListWallets,
);

adminWalletRouter.get(
  '/wallets/:userId',
  requirePermission(AdminPermission.WALLET_READ),
  walletController.adminGetUserWallet,
);

adminWalletRouter.post(
  '/wallets/:userId/adjust',
  requirePermission(AdminPermission.WALLET_MANAGE),
  validateBody(adminWalletAdjustmentSchema),
  walletController.adminAdjustWallet,
);

adminWalletRouter.post(
  '/wallets/:userId/reconcile',
  requirePermission(AdminPermission.WALLET_MANAGE),
  walletController.adminReconcileWallet,
);
