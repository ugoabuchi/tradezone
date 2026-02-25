import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface MarketAnalysis {
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  indicators: {
    rsi: number;
    macd: string;
    movingAverage: string;
  };
}

export const analyzeWithDeepSeek = async (
  symbol: string,
  priceHistory: number[],
  currentPrice: number,
  riskLevel: string
): Promise<MarketAnalysis> => {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  try {
    const prompt = `
      You are a professional cryptocurrency trading analyst. Analyze the following data and provide a trading signal.
      
      Symbol: ${symbol}
      Current Price: $${currentPrice}
      Price History (last 30 days): ${priceHistory.join(', ')}
      Risk Level: ${riskLevel}
      
      Provide your analysis in JSON format with the following fields:
      {
        "signal": "buy" | "sell" | "hold",
        "confidence": 0-100,
        "reasoning": "detailed explanation",
        "indicators": {
          "rsi": number,
          "macd": "string",
          "movingAverage": "string"
        }
      }
    `;

    const response = await axios.post(
      'https://api.deepseek.com/v1/messages',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]) as MarketAnalysis;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
};

export const analyzeWithGemini = async (
  symbol: string,
  priceHistory: number[],
  currentPrice: number,
  riskLevel: string
): Promise<MarketAnalysis> => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const prompt = `
      You are a professional cryptocurrency trading analyst. Analyze the following data and provide a trading signal.
      
      Symbol: ${symbol}
      Current Price: $${currentPrice}
      Price History (last 30 days): ${priceHistory.join(', ')}
      Risk Level: ${riskLevel}
      
      Provide your analysis in JSON format with the following fields:
      {
        "signal": "buy" | "sell" | "hold",
        "confidence": 0-100,
        "reasoning": "detailed explanation",
        "indicators": {
          "rsi": number,
          "macd": "string",
          "movingAverage": "string"
        }
      }
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
        },
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]) as MarketAnalysis;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

export const analyzeMarket = async (
  symbol: string,
  priceHistory: number[],
  currentPrice: number,
  aiModel: 'deepseek' | 'gemini' | 'hybrid',
  riskLevel: string = 'medium'
): Promise<MarketAnalysis> => {
  if (aiModel === 'deepseek') {
    return analyzeWithDeepSeek(symbol, priceHistory, currentPrice, riskLevel);
  } else if (aiModel === 'gemini') {
    return analyzeWithGemini(symbol, priceHistory, currentPrice, riskLevel);
  } else {
    // Hybrid: try Deepseek first, fall back to Gemini
    try {
      return await analyzeWithDeepSeek(symbol, priceHistory, currentPrice, riskLevel);
    } catch {
      return analyzeWithGemini(symbol, priceHistory, currentPrice, riskLevel);
    }
  }
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
};

export const calculateMovingAverage = (prices: number[], period: number): number => {
  const relevant = prices.slice(-period);
  return relevant.reduce((a, b) => a + b, 0) / relevant.length;
};
