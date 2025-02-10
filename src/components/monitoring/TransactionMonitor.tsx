import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Download, Filter } from 'lucide-react';
import { useTradeStore } from '../../utils/store';
import type { Trade } from '../../types';

interface TransactionDetails extends Trade {
  percentComplete: number;
  remainingAmount: number;
  depositStatus: 'pending' | 'complete';
  confirmationNumber?: string;
  executionTime?: number;
  errors?: string[];
  warnings?: string[];
}

export const TransactionMonitor: React.FC = () => {
  const [transactions, setTransactions] = React.useState<TransactionDetails[]>([]);
  const [sortField, setSortField] = React.useState<keyof TransactionDetails>('timestamp');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const trades = useTradeStore(state => state.trades);

  // Update transactions every 2 seconds
  React.useEffect(() => {
    const updateTransactions = () => {
      const updatedTransactions = trades.map(trade => {
        const percentComplete = trade.status === 'COMPLETED' ? 100 :
          trade.status === 'PENDING' ? Math.floor(Math.random() * 90 + 10) : 0;

        return {
          ...trade,
          percentComplete,
          remainingAmount: Number(trade.amount) * (1 - percentComplete / 100),
          depositStatus: percentComplete === 100 ? 'complete' : 'pending',
          confirmationNumber: trade.status === 'COMPLETED' ?
            `TX${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
          executionTime: trade.status === 'COMPLETED' ?
            Math.floor(Math.random() * 5000 + 1000) : undefined
        };
      });

      setTransactions(updatedTransactions as TransactionDetails[]);
    };

    updateTransactions();
    const interval = setInterval(updateTransactions, 2000);
    return () => clearInterval(interval);
  }, [trades]);

  const handleSort = (field: keyof TransactionDetails) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction;
    }
    return String(aValue).localeCompare(String(bValue)) * direction;
  });

  const exportTransactions = () => {
    const csv = [
      ['Transaction ID', 'Type', 'Asset', 'Amount', 'Price', 'Status', 'Completion', 'Execution Time', 'Confirmation'],
      ...transactions.map(tx => [
        tx.id,
        tx.type,
        'ETH/USD',
        tx.amount,
        tx.price,
        tx.status,
        `${tx.percentComplete}%`,
        tx.executionTime || '',
        tx.confirmationNumber || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Activity className="mr-2 h-6 w-6 text-blue-600" />
          Transaction Monitor
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {}}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button
            onClick={exportTransactions}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                Transaction ID
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                Price
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tx.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Number(tx.amount).toFixed(4)} ETH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${tx.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className={`h-2.5 rounded-full ${
                        tx.percentComplete === 100 ? 'bg-green-600' :
                        tx.percentComplete > 50 ? 'bg-blue-600' :
                        'bg-yellow-600'
                      }`}
                      style={{ width: `${tx.percentComplete}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {tx.percentComplete}% Complete
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    {tx.confirmationNumber && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span>Conf: {tx.confirmationNumber}</span>
                      </div>
                    )}
                    {tx.executionTime && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-1" />
                        <span>{tx.executionTime}ms</span>
                      </div>
                    )}
                    {tx.warnings?.map((warning, index) => (
                      <div key={index} className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions to display
          </div>
        )}
      </div>
    </div>
  );
};
