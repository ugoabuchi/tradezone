import * as AIBotModel from '../models/AITradingBot';
import * as AIAnalysis from './AIAnalysisService';
import * as OrderService from './OrderService';
import { query } from '../config/database';

export const createAIBot = async (
  userId: string,
  data: {
    botName: string;
    strategy: string;
    symbol: string;
    initialCapital: number;
    allocatedPercentage: number;
    aiModel: 'deepseek' | 'gemini' | 'hybrid';
    riskLevel: 'low' | 'medium' | 'high';
    parameters?: Record<string, any>;
  }
) => {
  // Validate allocated percentage
  if (data.allocatedPercentage <= 0 || data.allocatedPercentage > 100) {
    throw new Error('Allocated percentage must be between 1 and 100');
  }

  // Validate capital
  if (data.initialCapital <= 0) {
    throw new Error('Initial capital must be greater than 0');
  }

  return AIBotModel.createAIBot(userId, data);
};

export const activateAIBot = async (botId: string) => {
  const bot = await AIBotModel.getAIBot(botId);
  if (!bot) throw new Error('Bot not found');

  return AIBotModel.updateAIBot(botId, { status: 'active' });
};

export const deactivateAIBot = async (botId: string) => {
  return AIBotModel.updateAIBot(botId, { status: 'inactive' });
};

export const pauseAIBot = async (botId: string) => {
  return AIBotModel.updateAIBot(botId, { status: 'paused' });
};

export const executeAITrade = async (
  botId: string,
  userId: string,
  priceHistory: number[],
  currentPrice: number
) => {
  const bot = await AIBotModel.getAIBot(botId);
  if (!bot) throw new Error('Bot not found');

  if (bot.status !== 'active') {
    throw new Error('Bot is not active');
  }

  try {
    // Get AI analysis
    const analysis = await AIAnalysis.analyzeMarket(
      bot.symbol,
      priceHistory,
      currentPrice,
      bot.ai_model,
      bot.risk_level
    );

    // Only execute if confidence is high enough
    const minConfidence = bot.risk_level === 'low' ? 75 : bot.risk_level === 'medium' ? 60 : 45;

    if (analysis.confidence < minConfidence) {
      console.log(`Confidence ${analysis.confidence} below threshold ${minConfidence}, skipping trade`);
      return null;
    }

    // Calculate trade size based on allocation percentage and current balance
    const tradeCapital = bot.current_balance * (bot.allocated_percentage / 100);
    const quantity = tradeCapital / currentPrice;

    // Execute trade
    const tradeRecord = await AIBotModel.createAITrade(botId, userId, {
      symbol: bot.symbol,
      action: analysis.signal === 'buy' ? 'buy' : 'sell',
      price: currentPrice,
      quantity,
      confidenceScore: analysis.confidence,
      aiReasoning: analysis.reasoning,
    });

    // Update bot stats
    const staleBot = await AIBotModel.getAIBot(botId);
    const newBalance = staleBot!.current_balance + (analysis.signal === 'buy' ? -tradeCapital : tradeCapital);

    await AIBotModel.updateAIBot(botId, {
      currentBalance: newBalance,
      tradesExecuted: staleBot!.trades_executed + 1,
    });

    return {
      trade: tradeRecord,
      analysis,
    };
  } catch (error) {
    console.error('AI trade execution error:', error);
    throw error;
  }
};

export const getUserAIBots = async (userId: string) => {
  return AIBotModel.getAIBots(userId);
};

export const getAIBotPerformance = async (botId: string) => {
  const bot = await AIBotModel.getAIBot(botId);
  if (!bot) throw new Error('Bot not found');

  const history = await AIBotModel.getAITradeHistory(botId);

  const performance = {
    botId,
    botName: bot.bot_name,
    totalTrades: history.length,
    winningTrades: history.filter(t => t.pnl && t.pnl > 0).length,
    losingTrades: history.filter(t => t.pnl && t.pnl < 0).length,
    totalPnL: history.reduce((sum, t) => sum + (t.pnl || 0), 0),
    averageReturn: history.length > 0 
      ? history.reduce((sum, t) => sum + (t.pnl || 0), 0) / history.length 
      : 0,
    winRate: history.length > 0
      ? (history.filter(t => t.pnl && t.pnl > 0).length / history.length) * 100
      : 0,
    roi: bot.initial_capital > 0
      ? ((bot.current_balance - bot.initial_capital) / bot.initial_capital) * 100
      : 0,
    status: bot.status,
    lastTrade: history[0] || null,
  };

  return performance;
};

export const deleteAIBot = async (botId: string) => {
  return AIBotModel.deleteAIBot(botId);
};

export const runAutomatedTrading = async (userId: string) => {
  const bots = await AIBotModel.getAIBots(userId);
  const activeBots = bots.filter(b => b.status === 'active');

  const results = [];

  for (const bot of activeBots) {
    try {
      // In a real implementation, you'd fetch actual price history
      const priceHistory = Array(30)
        .fill(0)
        .map((_, i) => 50000 + Math.random() * 1000);
      const currentPrice = 50000 + Math.random() * 1000;

      const result = await executeAITrade(bot.id, userId, priceHistory, currentPrice);
      results.push(result);
    } catch (error) {
      console.error(`Error executing trade for bot ${bot.id}:`, error);
    }
  }

  return results;
};
