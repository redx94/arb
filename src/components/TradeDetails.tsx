import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { TradeDetails as TradeDetailsType } from '../types/index.js';
import { FunctionComponent } from 'react';

interface Props {
  trade: TradeDetailsType;
}

const TradeDetails: FunctionComponent<Props> = ({ trade }: { trade: TradeDetailsType }) => {
  const isSuccess = trade.status === 'COMPLETED';
  const hasWarnings = trade.warnings && trade.warnings.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trade #{trade.id.slice(0, 8)}</h3>
        <div className="flex items-center">
          {isSuccess ? (
            <CheckCircle className="text-green-500 h-5 w-5 mr-2" />
          ) : (
            <XCircle className="text-red-500 h-5 w-5 mr-2" />
          )}
          <span className={`font-medium ${isSuccess ? "text-green-600" : "text-red-600"}`}>{trade.status}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">{trade.type} on {trade.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 4 }).format(Number(trade.amount))} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(trade.price))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Effective Price:</span>
            <span className="font-medium">${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(trade.effectivePrice))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Profit/Loss:</span>
            <span className={`font-medium ${Number(trade.profitLoss) >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${Math.abs(Number(trade.profitLoss)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {Number(trade.profitLoss) >= 0 ? "(Profit)" : "(Loss)"}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Gas Cost:</span>
            <span className="font-medium">${trade.gasCost ? new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(trade.gasCost)) : "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Slippage:</span>
            <span className="font-medium">{(Number(trade.slippage) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price Impact:</span>
            <span className="font-medium">{(Number(trade.priceImpact) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Execution Time:</span>
            <span className="font-medium">{trade.executionTime}ms</span>
          </div>
          {trade.blockNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Block Number:</span>
              <span className="font-medium">#{trade.blockNumber}</span>
            </div>
          )}
        </div>
      </div>
      {trade.flashLoan && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Flash Loan Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-blue-700">Protocol:</span>
              <span className="font-medium">{trade.flashLoan?.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Amount:</span>
              <span className="font-medium">{trade.flashLoan ? new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 4 }).format(Number(trade.flashLoan.amount)) : 0} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Fee:</span>
              <span className="font-medium">${trade.flashLoan ? new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(trade.flashLoan.fee)) : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Net Profit:</span>
              <span className="font-medium text-green-600">${trade.flashLoan ? new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(trade.flashLoan.profit)) : 0}</span>
            </div>
          </div>
        </div>
      )}
      {trade.routingPath && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Routing Path</h4>
          <div className="flex items-center flex-wrap gap-2">
            {trade.routingPath?.map((step: string, index: number) => (
              <React.Fragment key={index}>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm">{step}</span>
                {trade.routingPath && index < trade.routingPath.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {hasWarnings && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Warnings</h4>
              <ul className="list-disc list-inside space-y-1">
                {trade.warnings?.map((warning: string, index: number) => (
                  <li key={index} className="text-sm text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {trade.transaction && (
        <div className="mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Transaction Hash:</span>
            <code className="font-mono bg-gray-100 px-2 py-1 rounded">
              {trade.transaction.hash}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeDetails;
