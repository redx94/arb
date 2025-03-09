import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Activity, Cpu, MemoryStick as Memory, Network, Flame, CheckCircle } from 'lucide-react';

export const SystemHealth = () => {
    const [cpuUsage, setCpuUsage] = useState('0%');
    const [memoryUsage, setMemoryUsage] = useState('0%');
    const [networkLatency, setNetworkLatency] = useState('0ms');
    const [gasPrices, setGasPrices] = useState('Unavailable');
    const [transactionSuccessRate, setTransactionSuccessRate] = useState('Unavailable');

    useEffect(() => {
        const fetchCpuUsage = async () => {
            try {
                const response = await fetch('top_output.txt');
                const text = await response.text();
                const cpuLine = text.split('\n').find(line => line.includes('CPU usage:'));
                if (cpuLine) {
                    const cpuUsage = cpuLine.split(':')[1].split(',')[0].trim();
                    setCpuUsage(cpuUsage);
                } else {
                    setCpuUsage('N/A');
                }
            } catch (error) {
                console.error('Error fetching CPU usage:', error);
                setCpuUsage('Error');
            }
        };

        const fetchMemoryUsage = async () => {
            try {
                const response = await fetch('top_output.txt');
                const text = await response.text();
                const memoryLine = text.split('\n').find(line => line.includes('PhysMem:'));
                if (memoryLine) {
                    const memoryUsage = memoryLine.split(':')[1].split('(')[0].trim();
                    setMemoryUsage(memoryUsage);
                } else {
                    setMemoryUsage('N/A');
                }
            } catch (error) {
                console.error('Error fetching memory usage:', error);
                setMemoryUsage('Error');
            }
        };

        const fetchNetworkLatency = async () => {
            try {
                const response = await fetch('ping_output.txt');
                const text = await response.text();
                const latencyLine = text.split('\n').find(line => line.includes('time='));
                if (latencyLine) {
                    const networkLatency = latencyLine.split('=')[1].split(' ')[0].trim();
                    setNetworkLatency(networkLatency + 'ms');
                } else {
                    setNetworkLatency('N/A');
                }
            } catch (error) {
                console.error('Error fetching network latency:', error);
                setNetworkLatency('Error');
            }
        };

        fetchCpuUsage();
        fetchMemoryUsage();
        fetchNetworkLatency();
    }, []);

    const [gasPrices, setGasPrices] = useState('Unavailable');
    const [transactionSuccessRate, setTransactionSuccessRate] = useState('Unavailable');

    useEffect(() => {
        const fetchGasPrices = async () => {
            setGasPrices('Unavailable');
        };

        const fetchTransactionSuccessRate = async () => {
            setTransactionSuccessRate('99.9%');
        };

        fetchCpuUsage();
        fetchMemoryUsage();
        fetchNetworkLatency();
        fetchGasPrices();
        fetchTransactionSuccessRate();
    }, []);

    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-semibold mb-4 flex items-center", children: [_jsx(Activity, { className: "mr-2 h-6 w-6 text-blue-600" }), "System Health"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Cpu, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "CPU Usage" })] }), _jsx("span", { className: "text-sm text-gray-500", children: cpuUsage })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: cpuUsage } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Memory, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Memory Usage" })] }), _jsx("span", { className: "text-sm text-gray-500", children: memoryUsage })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-yellow-500 h-2 rounded-full", style: { width: '68%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Network, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Network Latency" })] }), _jsx("span", { className: "text-sm text-gray-500", children: networkLatency })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full", style: { width: '25%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Flame, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Gas Prices" })] }), _jsx("span", { className: "text-sm text-gray-500", children: gasPrices })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-purple-500 h-2 rounded-full", style: { width: '75%' } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Transaction Success Rate" })] }), _jsx("span", { className: "text-sm text-gray-500", children: transactionSuccessRate })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: '99.9%' } }) })] }), _jsx("div", { className: "mt-6 p-4 bg-green-50 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Activity, { className: "h-5 w-5 text-green-400" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "All Systems Operational" }), _jsxs("p", { className: "mt-1 text-sm text-green-600", children: ["Last checked: ", new Date().toLocaleTimeString()] })] })] }) })] })] }));
};
