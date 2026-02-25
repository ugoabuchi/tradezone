import * as NFTModel from '../models/NFTHolding';
import axios from 'axios';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';
const OPENSEA_API = 'https://api.opensea.io/api/v2';

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const fetchNFTMetadata = async (
  contractAddress: string,
  tokenId: string,
  blockchain: string
): Promise<NFTMetadata | null> => {
  try {
    // Try to fetch from OpenSea
    if (OPENSEA_API_KEY) {
      const response = await axios.get(
        `${OPENSEA_API}/chain/${blockchain}/contract/${contractAddress}/nfts/${tokenId}`,
        {
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
          },
        }
      );

      if (response.data.nft) {
        return {
          name: response.data.nft.name,
          description: response.data.nft.description,
          image: response.data.nft.image_url,
          attributes: response.data.nft.traits,
        };
      }
    }

    // Fallback: try to fetch from contract directly (for ERC721/ERC1155)
    return null;
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    return null;
  }
};

export const getNFTFloorPrice = async (
  collectionName: string,
  blockchain: string
): Promise<number | null> => {
  try {
    if (OPENSEA_API_KEY) {
      const response = await axios.get(`${OPENSEA_API}/collections`, {
        params: {
          chains: blockchain,
        },
        headers: {
          'X-API-KEY': OPENSEA_API_KEY,
        },
      });

      const collection = response.data.collections.find(
        (c: any) => c.name.toLowerCase() === collectionName.toLowerCase()
      );

      if (collection) {
        return collection.floor_price;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch floor price:', error);
    return null;
  }
};

export const importNFT = async (
  userId: string,
  contractAddress: string,
  tokenId: string,
  blockchain: string,
  collectionName: string
) => {
  // Check if already imported
  const existing = await NFTModel.getNFTByTokenId(contractAddress, tokenId);
  if (existing) {
    throw new Error('This NFT is already imported');
  }

  // Fetch metadata
  const metadata = await fetchNFTMetadata(contractAddress, tokenId, blockchain);

  // Try to get floor price as current price estimate
  const floorPrice = await getNFTFloorPrice(collectionName, blockchain);

  return NFTModel.createNFTHolding(userId, {
    contractAddress,
    tokenId,
    name: metadata?.name || `${collectionName} #${tokenId}`,
    description: metadata?.description,
    imageUrl: metadata?.image,
    collectionName,
    blockchain,
    currentPrice: floorPrice || undefined,
  });
};

export const getUserNFTs = async (userId: string) => {
  return NFTModel.getNFTHoldings(userId);
};

export const getUserNFTsByBlockchain = async (userId: string, blockchain: string) => {
  return NFTModel.getNFTsByBlockchain(userId, blockchain);
};

export const updateNFTPrice = async (nftId: string, currentPrice: number) => {
  return NFTModel.updateNFTHolding(nftId, { currentPrice });
};

export const listNFTForSale = async (nftId: string, price: number) => {
  return NFTModel.updateNFTHolding(nftId, { currentPrice: price, status: 'listed' });
};

export const calculateNFTPortfolioValue = async (userId: string) => {
  const nfts = await NFTModel.getNFTHoldings(userId);

  const portfolio = {
    totalNFTs: nfts.length,
    totalValue: nfts.reduce((sum, nft) => sum + (nft.current_price || 0), 0),
    listedNFTs: nfts.filter(nft => nft.status === 'listed').length,
    listedValue: nfts
      .filter(nft => nft.status === 'listed')
      .reduce((sum, nft) => sum + (nft.current_price || 0), 0),
    topNFT: nfts.reduce(
      (top, nft) =>
        (nft.current_price || 0) > (top.current_price || 0)
          ? nft
          : top,
      nfts[0] || null
    ),
    blockchains: [...new Set(nfts.map(nft => nft.blockchain))],
  };

  return portfolio;
};

export const suggestNFTArtist = async (nftDescription: string): Promise<string[]> => {
  // This could be enhanced with AI to suggest similar artists
  return ['Bored Ape Yacht Club', 'CryptoPunks', 'Art Blocks', 'Pudgy Penguins'];
};
