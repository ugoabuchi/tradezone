import express from 'express';
import * as MarketplaceController from '../controllers/MarketplaceController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/search', MarketplaceController.searchListings);
router.get('/listings/:listingId', MarketplaceController.getListingDetails);
router.get('/stats', MarketplaceController.getMarketplaceStats);

// Protected routes
router.use(verifyToken);

router.post('/listings', MarketplaceController.createListing);
router.get('/listings', MarketplaceController.getUserListings);
router.post('/purchase', MarketplaceController.purchaseItem);
router.post('/payment', MarketplaceController.processPayment);
router.post('/ship', MarketplaceController.shipItem);
router.post('/orders/:orderId/complete', MarketplaceController.completeDelivery);
router.get('/orders/buyer', MarketplaceController.getBuyerOrders);
router.get('/orders/seller', MarketplaceController.getSellerOrders);
router.get('/seller/stats', MarketplaceController.getSellerStats);

export default router;
