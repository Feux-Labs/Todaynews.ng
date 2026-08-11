/**
 * SYSTEM DESIGN: Circuit Breaker Pattern
 * Protects the application from cascading failures when external APIs (Gemini, RSS sources, Mailer) are down or slow.
 * States:
 *  - CLOSED: Normal operation. Requests pass through.
 *  - OPEN: Threshold reached (e.g. 3 consecutive failures). Requests fail-fast to fallback instantly.
 *  - HALF-OPEN: Trial period after reset timeout. Allows 1 test request to check recovery.
 */

type CircuitState = "CLOSED" | "OPEN" | "HALF-OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of consecutive failures to trip
  resetTimeoutMs?: number;   // Time to stay OPEN before testing recovery
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private failureThreshold: number;
  private resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000; // 60s default
  }

  async execute<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T> | T): Promise<T> {
    const now = Date.now();

    // Check if OPEN state should transition to HALF-OPEN
    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF-OPEN";
        console.log("[CircuitBreaker] Transitioning to HALF-OPEN to test service recovery.");
      } else {
        console.warn("[CircuitBreaker] Circuit is OPEN. Executing fallback directly.");
        return fallbackFn();
      }
    }

    try {
      const result = await fn();

      // On success in HALF-OPEN, reset to CLOSED
      if (this.state === "HALF-OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
        console.log("[CircuitBreaker] Service recovered. Resetting circuit to CLOSED.");
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = now;
      console.error(`[CircuitBreaker] Error caught (${this.failureCount}/${this.failureThreshold}):`, err);

      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        console.error(`[CircuitBreaker] Failure threshold reached! Circuit is now OPEN for ${this.resetTimeoutMs}ms.`);
      }

      return fallbackFn();
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Global Circuit Breaker instances for key external dependencies
const globalForBreakers = global as unknown as {
  geminiBreaker: CircuitBreaker;
  rssBreaker: CircuitBreaker;
};

export const geminiBreaker = globalForBreakers.geminiBreaker || new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 });
export const rssBreaker = globalForBreakers.rssBreaker || new CircuitBreaker({ failureThreshold: 4, resetTimeoutMs: 60000 });

if (process.env.NODE_ENV !== "production") {
  globalForBreakers.geminiBreaker = geminiBreaker;
  globalForBreakers.rssBreaker = rssBreaker;
}
