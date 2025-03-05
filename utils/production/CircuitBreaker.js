import { logEvent } from '../../src/utils/monitoring.ts';

export class CircuitBreaker {
    constructor() {
        Object.defineProperty(this, "incidentCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lastIncident", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "TRIGGER_THRESHOLD", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        }); // 3 incidents in 5 minutes
        Object.defineProperty(this, "COOLDOWN_PERIOD", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 300000
        }); // 5 minutes in ms
    }
    isTriggered() {
        return this.incidentCount >= this.TRIGGER_THRESHOLD &&
            Date.now() - this.lastIncident < this.COOLDOWN_PERIOD;
    }
    recordIncident() {
        this.incidentCount++;
        this.lastIncident = Date.now();
        if (this.isTriggered()) {
            this.sendAlert();
        }
    }
    reset() {
        this.incidentCount = 0;
        this.lastIncident = 0;
    }
    sendAlert() {
        console.error('[CIRCUIT BREAKER] Safety threshold exceeded!');
        logEvent('Circuit Breaker Triggered', { incidentCount: this.incidentCount });
    }
}
