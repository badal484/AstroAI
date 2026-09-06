import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware';
import { promotionsController } from './promotions.controller';

const router = Router();

// All user promotion routes require user authentication
router.use(authenticate);

router.post('/validate', (req, res, next) => promotionsController.validatePromoCode(req, res, next));
router.get('/offers', (req, res, next) => promotionsController.getAvailableOffers(req, res, next));
router.get('/referral', (req, res, next) => promotionsController.getUserReferralSummary(req, res, next));
router.post('/referral/claim', (req, res, next) => promotionsController.claimReferralCode(req, res, next));

export const promotionRoutes = router;
