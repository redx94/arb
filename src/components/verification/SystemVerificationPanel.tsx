import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SystemVerifier } from '../../utils/verification/SystemVerifier';
import type { VerificationResult } from '../../utils/verification/types';

export const SystemVerificationPanel: React.FC = () => {
  const [verificationResult, setVerificationResult] = React.useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runVerification = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const verifier = SystemVerifier.getInstance();
      const result = await verifier.verifyComplete();
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderStatusIcon = (success?: boolean) => {
    if (success === undefined) return null;
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Shield className="mr-2 h-6 w-6 text-blue-600" />
          System Verification
        </h2>
        <button
          onClick={runVerification}
          disabled={isVerifying}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isVerifying ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 mr-2" />
          )}
          Verify System
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="space-y-6">
          {/* Wallet Verification */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center justify-between">
              Wallet Integration
              {renderStatusIcon(verificationResult.walletVerification.success)}
            </h3>
            <div className="space-y-2">
              {Object.entries(verificationResult.walletVerification.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {renderStatusIcon(value)}
                </div>
              ))}
            </div>
          </div>

          {/* Trading Verification */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center justify-between">
              Trading Functionality
              {renderStatusIcon(verificationResult.tradingVerification.success)}
            </h3>
            <div className="space-y-2">
              {Object.entries(verificationResult.tradingVerification.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {renderStatusIcon(value)}
                </div>
              ))}
            </div>
          </div>

          {/* Security Verification */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center justify-between">
              Security Configuration
              {renderStatusIcon(verificationResult.securityVerification.success)}
            </h3>
            <div className="space-y-2">
              {Object.entries(verificationResult.securityVerification.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {renderStatusIcon(value)}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Summary */}
          <div className={`p-4 rounded-lg ${
            verificationResult.success ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center">
              {verificationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              )}
              <div>
                <h3 className={`font-medium ${
                  verificationResult.success ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {verificationResult.success
                    ? 'System Verification Passed'
                    : 'System Verification Incomplete'
                }
                </h3>
                <p className={`text-sm mt-1 ${
                  verificationResult.success ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  Last verified: {new Date(verificationResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};