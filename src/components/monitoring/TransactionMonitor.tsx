import React, { useEffect, useState } from 'react';

export const TransactionMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Stub: subscribe to transaction events
    const interval = setInterval(() => {
      // Simulate fetching new transaction data
      setTransactions(prev => [...prev, { id: Date.now(), status: 'PENDING' }]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Transaction Monitor</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-600">No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((tx) => (
            <li key={tx.id} className="p-3 bg-gray-50 rounded">
              Transaction ID: {tx.id} - Status: {tx.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
