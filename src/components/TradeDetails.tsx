import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { TradeDetails as TradeDetailsType } from '../types';
import { FunctionComponent, createElement } from 'react';

interface Props {
  trade: TradeDetailsType;
}

const TradeDetails: FunctionComponent<Props> = ({ trade }: { trade: TradeDetailsType }) => {
  const isSuccess = trade.status === 'COMPLETED';
  const hasWarnings = trade.warnings && trade.warnings.length > 0;

  return (
    createElement("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-4" },
      createElement("div", { className: "flex items-center justify-between mb-4" },
        createElement("h3", { className: "text-lg font-semibold" }, "Trade #", trade.id.slice(0, 8)),
        createElement("div", { className: "flex items-center" },
          isSuccess ?
            createElement(CheckCircle, { className: "text-green-500 h-5 w-5 mr-2" }) :
            createElement(XCircle, { className: "text-red-500 h-5 w-5 mr-2" }),
          createElement("span", { className: `font-medium ${isSuccess ? "text-green-600" : "text-red-600"}` }, trade.status)
        )
      ),
      createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        createElement("div", { className: "space-y-2" },
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Type:"),
            createElement("span", { className: "font-medium" }, trade.type, " on ", trade.platform)
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Amount:"),
            createElement("span", { className: "font-medium" }, Number(trade.amount), " ETH")
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Price:"),
            createElement("span", { className: "font-medium" }, "$", Number(trade.price).toFixed(4))
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Effective Price:"),
            createElement("span", { className: "font-medium" }, "$", Number(trade.effectivePrice).toFixed(2))
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Profit/Loss:"),
            createElement("span", { className: `font-medium ${Number(trade.profitLoss) >= 0 ? "text-green-600" : "text-red-600"}` },
              "$", Math.abs(Number(trade.profitLoss)).toFixed(2), " ", Number(trade.profitLoss) >= 0 ? "(Profit)" : "(Loss)")
          )
        ),
        createElement("div", { className: "space-y-2" },
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Gas Cost:"),
            createElement("span", { className: "font-medium" }, "$", trade.gasCost ? Number(trade.gasCost).toFixed(4) : "0.00")
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Slippage:"),
            createElement("span", { className: "font-medium" }, ((Number(trade.slippage) || 0) * 100).toFixed(2), "%")
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Price Impact:"),
            createElement("span", { className: "font-medium" }, (Number(trade.priceImpact) * 100).toFixed(2), "%")
          ),
          createElement("div", { className: "flex justify-between" },
            createElement("span", { className: "text-gray-600" }, "Execution Time:"),
            createElement("span", { className: "font-medium" }, trade.executionTime, "ms")
          ),
          trade.blockNumber &&
            createElement("div", { className: "flex justify-between" },
              createElement("span", { className: "text-gray-600" }, "Block Number:"),
              createElement("span", { className: "font-medium" }, "#", trade.blockNumber)
            )
        )
      ),
      trade.flashLoan &&
        createElement("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg" },
          createElement("h4", { className: "font-medium text-blue-800 mb-2" }, "Flash Loan Details"),
          createElement("div", { className: "grid grid-cols-2 gap-4" },
            createElement("div", { className: "flex justify-between" },
              createElement("span", { className: "text-blue-700" }, "Protocol:"),
              createElement("span", { className: "font-medium" }, trade.flashLoan?.protocol)
            ),
            createElement("div", { className: "flex justify-between" },
              createElement("span", { className: "text-blue-700" }, "Amount:"),
              createElement("span", { className: "font-medium" }, trade.flashLoan ? Number(trade.flashLoan.amount) : 0, " ETH")
            ),
            createElement("div", { className: "flex justify-between" },
              createElement("span", { className: "text-blue-700" }, "Fee:"),
              createElement("span", { className: "font-medium" }, "$", trade.flashLoan ? Number(trade.flashLoan.fee) : 0)
            ),
            createElement("div", { className: "flex justify-between" },
              createElement("span", { className: "text-blue-700" }, "Net Profit:"),
              createElement("span", { className: "font-medium text-green-600" }, "$", trade.flashLoan ? Number(trade.flashLoan.profit) : 0)
            )
          )
        ),
      trade.routingPath &&
        createElement("div", { className: "mt-4" },
          createElement("h4", { className: "font-medium mb-2" }, "Routing Path"),
          createElement("div", { className: "flex items-center flex-wrap gap-2" },
            trade.routingPath?.map((step, index) => (
              React.createElement(React.Fragment, { key: index },
                createElement("span", { className: "px-2 py-1 bg-gray-100 rounded text-sm" }, step),
                trade.routingPath && index < trade.routingPath.length - 1 &&
                  createElement(ArrowRight, { className: "h-4 w-4 text-gray-400" })
              )
            ))
          )
        ),
      hasWarnings &&
        createElement("div", { className: "mt-4 p-4 bg-yellow-50 rounded-lg" },
          createElement("div", { className: "flex items-start" },
            createElement(AlertTriangle, { className: "h-5 w-5 text-yellow-500 mt-0.5 mr-2" }),
            createElement("div", null,
              createElement("h4", { className: "font-medium text-yellow-800 mb-1" }, "Warnings"),
              createElement("ul", { className: "list-disc list-inside space-y-1" },
                trade.warnings?.map((warning, index) => (
                  createElement("li", { key: index, className: "text-sm text-yellow-700" }, warning)
                ))
              )
            )
          )
        ),
      trade.transaction &&
        createElement("div", { className: "mt-4 text-sm" },
          createElement("div", { className: "flex items-center space-x-2" },
            createElement("span", { className: "text-gray-600" }, "Transaction Hash:"),
            createElement("code", { className: "font-mono bg-gray-100 px-2 py-1 rounded" },
              trade.transaction.hash
            )
          )
        )
    )
  );
};

export default TradeDetails;
