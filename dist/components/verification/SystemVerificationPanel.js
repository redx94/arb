import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SystemVerifier } from '../../utils/verification/SystemVerifier';
export const SystemVerificationPanel = () => {
    const [verificationResult, setVerificationResult] = React.useState(null);
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [error, setError] = React.useState(null);
    const runVerification = async () => {
        setIsVerifying(true);
        setError(null);
        try {
            const verifier = SystemVerifier.getInstance();
            const result = await verifier.verifyComplete();
            setVerificationResult(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        }
        finally {
            setIsVerifying(false);
        }
    };
    const renderStatusIcon = (success) => {
        if (success === undefined)
            return null;
        return success ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500" })) : (_jsx(XCircle, { className: "h-5 w-5 text-red-500" }));
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold flex items-center", children: [_jsx(Shield, { className: "mr-2 h-6 w-6 text-blue-600" }), "System Verification"] }), _jsxs("button", { onClick: runVerification, disabled: isVerifying, className: "flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: [isVerifying ? (_jsx(RefreshCw, { className: "h-5 w-5 mr-2 animate-spin" })) : (_jsx(RefreshCw, { className: "h-5 w-5 mr-2" })), "Verify System"] })] }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-50 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-400 mr-2" }), _jsx("p", { className: "text-red-700", children: error })] }) })), verificationResult && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("h3", { className: "font-medium mb-4 flex items-center justify-between", children: ["Wallet Integration", renderStatusIcon(verificationResult.walletVerification.success)] }), _jsx("div", { className: "space-y-2", children: Object.entries(verificationResult.walletVerification.details).map(([key, value]) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: key.replace(/([A-Z])/g, ' $1').trim() }), renderStatusIcon(value)] }, key))) })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("h3", { className: "font-medium mb-4 flex items-center justify-between", children: ["Trading Functionality", renderStatusIcon(verificationResult.tradingVerification.success)] }), _jsx("div", { className: "space-y-2", children: Object.entries(verificationResult.tradingVerification.details).map(([key, value]) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: key.replace(/([A-Z])/g, ' $1').trim() }), renderStatusIcon(value)] }, key))) })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("h3", { className: "font-medium mb-4 flex items-center justify-between", children: ["Security Configuration", renderStatusIcon(verificationResult.securityVerification.success)] }), _jsx("div", { className: "space-y-2", children: Object.entries(verificationResult.securityVerification.details).map(([key, value]) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: key.replace(/([A-Z])/g, ' $1').trim() }), renderStatusIcon(value)] }, key))) })] }), _jsx("div", { className: `p-4 rounded-lg ${verificationResult.success ? 'bg-green-50' : 'bg-yellow-50'}`, children: _jsxs("div", { className: "flex items-center", children: [verificationResult.success ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-500 mr-2" })), _jsxs("div", { children: [_jsx("h3", { className: `font-medium ${verificationResult.success ? 'text-green-800' : 'text-yellow-800'}`, children: verificationResult.success
                                                ? 'System Verification Passed'
                                                : 'System Verification Incomplete' }), _jsxs("p", { className: `text-sm mt-1 ${verificationResult.success ? 'text-green-600' : 'text-yellow-600'}`, children: ["Last verified: ", new Date(verificationResult.timestamp).toLocaleString()] })] })] }) })] }))] }));
};
