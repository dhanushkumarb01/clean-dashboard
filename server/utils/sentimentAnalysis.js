// Simple sentiment analysis utility for Telegram messages
// Lightweight alternative to NLTK VADER for Node.js

class SentimentAnalyzer {
  constructor() {
    // Positive and negative word lists for basic sentiment analysis
    this.positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect',
      'love', 'like', 'enjoy', 'happy', 'joy', 'pleased', 'satisfied', 'content', 'grateful',
      'thank', 'thanks', 'appreciate', 'helpful', 'support', 'kind', 'nice', 'friendly',
      'success', 'win', 'victory', 'achieve', 'accomplish', 'improve', 'better', 'best',
      'safe', 'secure', 'trust', 'reliable', 'honest', 'genuine', 'authentic', 'real'
    ]);

    this.negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'disgusting', 'hate', 'dislike',
      'angry', 'furious', 'mad', 'upset', 'sad', 'depressed', 'miserable', 'unhappy',
      'scam', 'fraud', 'fake', 'fake', 'spam', 'suspicious', 'dangerous', 'risky',
      'threat', 'attack', 'harm', 'hurt', 'damage', 'destroy', 'kill', 'death',
      'money', 'cash', 'bank', 'account', 'password', 'credit', 'card', 'bitcoin',
      'urgent', 'emergency', 'quick', 'fast', 'limited', 'offer', 'deal', 'discount'
    ]);

    this.scamKeywords = new Set([
      'scam', 'fraud', 'fake', 'spam', 'suspicious', 'money', 'cash', 'bank', 'account',
      'password', 'credit', 'card', 'bitcoin', 'urgent', 'emergency', 'quick', 'fast',
      'limited', 'offer', 'deal', 'discount', 'free', 'winner', 'prize', 'lottery',
      'inheritance', 'million', 'dollar', 'euro', 'pound', 'investment', 'profit',
      'urgent action', 'immediate', 'now', 'today', 'limited time', 'once in a lifetime'
    ]);
  }

  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return { sentiment: 'Neutral', score: 0, compound: 0 };
    }

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let scamCount = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.positiveWords.has(cleanWord)) {
        positiveCount++;
      }
      if (this.negativeWords.has(cleanWord)) {
        negativeCount++;
      }
      if (this.scamKeywords.has(cleanWord)) {
        scamCount++;
      }
    });

    const totalWords = words.length;
    const positiveScore = totalWords > 0 ? positiveCount / totalWords : 0;
    const negativeScore = totalWords > 0 ? negativeCount / totalWords : 0;
    const scamScore = totalWords > 0 ? scamCount / totalWords : 0;

    // Calculate compound score (similar to VADER)
    const compound = positiveScore - negativeScore;

    let sentiment = 'Neutral';
    if (compound >= 0.05) {
      sentiment = 'Positive';
    } else if (compound <= -0.05) {
      sentiment = 'Negative';
    }

    return {
      sentiment,
      score: { positive: positiveScore, negative: negativeScore, scam: scamScore },
      compound
    };
  }

  analyzeMessages(messages) {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        overallSentiment: 'Neutral',
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        scamRisk: 'Low',
        scamKeywords: [],
        summary: 'No messages available for analysis.'
      };
    }

    const sentiments = messages.map(msg => this.analyzeSentiment(msg.text || ''));
    const scamKeywords = new Set();
    let totalCompound = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let scamCount = 0;

    messages.forEach((msg, index) => {
      const sentiment = sentiments[index];
      totalCompound += sentiment.compound;

      if (sentiment.sentiment === 'Positive') positiveCount++;
      else if (sentiment.sentiment === 'Negative') negativeCount++;
      else neutralCount++;

      if (sentiment.score.scam > 0) scamCount++;

      // Extract scam keywords from messages
      const words = (msg.text || '').toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (this.scamKeywords.has(cleanWord)) {
          scamKeywords.add(cleanWord);
        }
      });
    });

    const avgCompound = totalCompound / messages.length;
    let overallSentiment = 'Neutral';
    if (avgCompound >= 0.05) overallSentiment = 'Positive';
    else if (avgCompound <= -0.05) overallSentiment = 'Negative';

    const scamRisk = scamCount > messages.length * 0.3 ? 'High' : 
                    scamCount > messages.length * 0.1 ? 'Medium' : 'Low';

    return {
      overallSentiment,
      sentimentBreakdown: { positive: positiveCount, negative: negativeCount, neutral: neutralCount },
      scamRisk,
      scamKeywords: Array.from(scamKeywords),
      avgCompound,
      totalMessages: messages.length,
      scamMessageCount: scamCount
    };
  }

  generateSummary(userData, sentimentAnalysis) {
    const { firstName, lastName, messageCount, joinedGroups } = userData;
    const { overallSentiment, sentimentBreakdown, scamRisk, scamKeywords, totalMessages, scamMessageCount } = sentimentAnalysis;
    
    const userName = firstName || lastName || 'User';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : userName;
    
    let summary = `${fullName} has sent ${messageCount} messages across ${joinedGroups.length} groups. `;
    
    if (scamRisk === 'High') {
      summary += `⚠️ This user shows HIGH RISK behavior with ${scamMessageCount} suspicious messages. `;
      summary += `Detected scam keywords: ${scamKeywords.slice(0, 5).join(', ')}. `;
      summary += `The user appears to be engaging in fraudulent activities and should be monitored closely.`;
    } else if (scamRisk === 'Medium') {
      summary += `⚠️ This user shows MEDIUM RISK with ${scamMessageCount} potentially suspicious messages. `;
      summary += `Some concerning keywords detected: ${scamKeywords.slice(0, 3).join(', ')}. `;
      summary += `Recommend monitoring this user's activity.`;
    } else {
      summary += `✅ This user appears to be SAFE with no significant scam indicators. `;
      summary += `Message sentiment is ${overallSentiment.toLowerCase()} `;
      summary += `(${sentimentBreakdown.positive} positive, ${sentimentBreakdown.negative} negative, ${sentimentBreakdown.neutral} neutral messages). `;
      summary += `The user demonstrates normal communication patterns.`;
    }

    return summary;
  }
}

module.exports = new SentimentAnalyzer(); 