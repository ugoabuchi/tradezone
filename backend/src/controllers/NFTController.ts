import { Request, Response } from 'express';
import * as NFTService from '../services/NFTService';

export const importNFT = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { contractAddress, tokenId, blockchain, collectionName } = req.body;

    if (!contractAddress || !tokenId || !blockchain || !collectionName) {
      return res.status(400).json({ 
        error: 'contractAddress, tokenId, blockchain, and collectionName required' 
      });
    }

    const nft = await NFTService.importNFT(
      userId,
      contractAddress,
      tokenId,
      blockchain,
      collectionName
    );
    res.json(nft);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getNFTs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const nfts = await NFTService.getUserNFTs(userId);
    res.json(nfts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getNFTsByBlockchain = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { blockchain } = req.params;

    if (!blockchain) {
      return res.status(400).json({ error: 'Blockchain required' });
    }

    const nfts = await NFTService.getUserNFTsByBlockchain(userId, blockchain);
    res.json(nfts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listNFTForSale = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { nftId, price } = req.body;

    if (!nftId || !price) {
      return res.status(400).json({ error: 'NFT ID and price required' });
    }

    const nft = await NFTService.listNFTForSale(nftId, price);
    res.json(nft);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getNFTPortfolioValue = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const portfolio = await NFTService.calculateNFTPortfolioValue(userId);
    res.json(portfolio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateNFTPrice = async (req: Request, res: Response) => {
  try {
    const { nftId } = req.params;
    const { currentPrice } = req.body;

    if (!currentPrice) {
      return res.status(400).json({ error: 'Current price required' });
    }

    const nft = await NFTService.updateNFTPrice(nftId, currentPrice);
    res.json(nft);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
