# Trading System API Documentation

## Overview
This document describes the API endpoints and interfaces for the decentralized trading system.

## Authentication
All API requests require JWT authentication except for public endpoints.

## Rate Limits
- 100 requests per minute per IP
- 1000 requests per hour per account

## Endpoints

### Price Feeds
\`\`\`typescript
GET /api/v1/prices
Response: {
  dex: number;
  cex: number;
  timestamp: number;
}
\`\`\`

### Trading
\`\`\`typescript
POST /api/v1/trades
Body: {
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  platform: 'DEX' | 'CEX';
}
\`\`\`

### Error Responses
All errors follow the format:
\`\`\`typescript
{
  error: string;
  code: number;
  details?: any;
}
\`\`\`