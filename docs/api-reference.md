# API Reference

## REST API Endpoints

### Price Data

#### Get Current Prices
```http
GET /api/v1/prices
```

Response:
```json
{
  "dex": 1000.50,
  "cex": 1002.25,
  "timestamp": 1679825167000
}
```

#### Get Historical Prices
```http
GET /api/v1/prices/history
```

Parameters:
- `start` (timestamp): Start time
- `end` (timestamp): End time
- `interval` (string): Time interval

### Trading

#### Execute Trade
```http
POST /api/v1/trades
```

Request Body:
```json
{
  "type": "BUY",
  "platform": "DEX",
  "amount": "1.5",
  "price": 1000.50
}
```

Response:
```json
{
  "success": true,
  "trade": {
    "id": "trade_123",
    "status": "COMPLETED",
    "timestamp": 1679825167000
  }
}
```

## WebSocket API

### Price Feed
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.example.com/ws');

// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  pairs: ['ETH/USD']
}));

// Handle price updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

### Trade Events
```javascript
// Subscribe to trade events
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));

// Handle trade events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Trade event:', data);
};
```