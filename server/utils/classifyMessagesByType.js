const classifyMessagesByType = (messages) => {
  const result = {
    safe: [],
    fraud: [],
    sensitive: [],
    spam: [],
    other: [],
    flagged: [],
    highRisk: [],
    mediumRisk: [],
    lowRisk: [],
    stats: {
      total: 0,
      safe: 0,
      fraud: 0,
      sensitive: 0,
      spam: 0,
      other: 0,
      flagged: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0
    }
  };

  messages.forEach(msg => {
    // Label-based classification
    switch (msg.label) {
      case 'fraud':
        result.fraud.push(msg);
        result.stats.fraud++;
        break;
      case 'sensitive':
        result.sensitive.push(msg);
        result.stats.sensitive++;
        break;
      case 'spam':
        result.spam.push(msg);
        result.stats.spam++;
        break;
      case 'safe':
        result.safe.push(msg);
        result.stats.safe++;
        break;
      default:
        result.other.push(msg);
        result.stats.other++;
        break;
    }
    // Flagged
    if (msg.isFlagged) {
      result.flagged.push(msg);
      result.stats.flagged++;
    }
    // Risk score
    if (typeof msg.riskScore === 'number') {
      if (msg.riskScore >= 7) {
        result.highRisk.push(msg);
        result.stats.highRisk++;
      } else if (msg.riskScore >= 4) {
        result.mediumRisk.push(msg);
        result.stats.mediumRisk++;
      } else {
        result.lowRisk.push(msg);
        result.stats.lowRisk++;
      }
    }
    result.stats.total++;
  });

  return result;
};

module.exports = classifyMessagesByType; 