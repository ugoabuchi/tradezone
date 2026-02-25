import express from 'express';
import * as NFTController from '../controllers/NFTController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.use(verifyToken);

// Import and manage NFTs
router.post('/import', NFTController.importNFT);
router.get('/', NFTController.getNFTs);
router.get('/blockchain/:blockchain', NFTController.getNFTsByBlockchain);
router.post('/:nftId/list', NFTController.listNFTForSale);
router.post('/:nftId/price', NFTController.updateNFTPrice);

// Portfolio
router.get('/portfolio/value', NFTController.getNFTPortfolioValue);

export default router;
