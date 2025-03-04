import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Logger } from './monitoring';
export class GlobalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Logger.getInstance()
        });
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.logger.error('Uncaught error:', error, {
            componentStack: errorInfo.componentStack
        });
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 max-w-md w-full", children: [_jsx("div", { className: "flex items-center justify-center mb-4", children: _jsx(AlertTriangle, { className: "h-12 w-12 text-red-500" }) }), _jsx("h1", { className: "text-xl font-semibold text-center mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 text-center mb-4", children: "We've encountered an error and our team has been notified. Please try refreshing the page." }), _jsx("button", { onClick: () => window.location.reload(), className: "w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors", children: "Refresh Page" })] }) }));
        }
        return this.props.children;
    }
}
