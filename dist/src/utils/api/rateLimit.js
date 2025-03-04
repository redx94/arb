export const rateLimit = (limit, interval) => {
    const requests = [];
    return {
        async acquire() {
            const now = Date.now();
            requests.push(now);
            // Remove expired timestamps
            while (requests.length > 0 && requests[0] < now - interval) {
                requests.shift();
            }
            if (requests.length > limit) {
                const oldestRequest = requests[0];
                const delay = interval - (now - oldestRequest);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };
};
