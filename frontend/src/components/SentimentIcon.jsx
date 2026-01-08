import React from 'react';
import {
  SentimentVerySatisfied, // 😊
  SentimentSatisfied,     // 🙂
  SentimentNeutral,       // 😐
  SentimentDissatisfied,  // 😕
  SentimentVeryDissatisfied // 😠
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';

const SentimentIcon = ({ sentiment, size = 'medium' }) => {
  if (!sentiment || !sentiment.label) {
    return null;
  }

  const getIcon = () => {
    switch (sentiment.label.toLowerCase()) {
      case 'positive':
        return <SentimentVerySatisfied color="success" fontSize={size} />;
      case 'negative':
        return <SentimentVeryDissatisfied color="error" fontSize={size} />;
      case 'neutral':
      default:
        return <SentimentNeutral color="action" fontSize={size} />;
    }
  };

  const getTooltipText = () => {
    const label = sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1);
    const score = sentiment.score ? ` (${Math.round(sentiment.score * 100)}%)` : '';
    return `${label}${score}`;
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {getIcon()}
      </span>
    </Tooltip>
  );
};

export default SentimentIcon;