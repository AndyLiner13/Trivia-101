import * as ui from 'horizon/ui';

/**
 * Manages timeouts and async operations for trivia components
 */
export class TriviaTimeoutManager {
  private pendingTimeouts: Set<any> = new Set();
  private componentAsync: any; // Will be set to component's this.async
  
  constructor(componentAsync: any) {
    this.componentAsync = componentAsync;
  }
  
  /**
   * Set a timeout and track it for cleanup
   */
  setTimeout(callback: () => void, delay: number): any {
    const timeoutId = this.componentAsync.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      callback();
    }, delay);
    
    this.pendingTimeouts.add(timeoutId);
    return timeoutId;
  }
  
  /**
   * Clear a specific timeout
   */
  clearTimeout(timeoutId: any): void {
    if (this.pendingTimeouts.has(timeoutId)) {
      this.componentAsync.clearTimeout(timeoutId);
      this.pendingTimeouts.delete(timeoutId);
    }
  }
  
  /**
   * Clear all pending timeouts
   */
  clearAllTimeouts(): void {
    this.pendingTimeouts.forEach(timeoutId => {
      this.componentAsync.clearTimeout(timeoutId);
    });
    this.pendingTimeouts.clear();
  }
  
  /**
   * Set a delayed action with automatic cleanup tracking
   */
  setDelayedAction(action: () => void, delay: number): any {
    return this.setTimeout(action, delay);
  }
  
  /**
   * Set multiple delayed actions
   */
  setDelayedActions(actions: { action: () => void; delay: number }[]): any[] {
    return actions.map(({ action, delay }) => this.setTimeout(action, delay));
  }
  
  /**
   * Get count of pending timeouts (for debugging)
   */
  getPendingTimeoutCount(): number {
    return this.pendingTimeouts.size;
  }
  
  /**
   * Check if there are any pending timeouts
   */
  hasPendingTimeouts(): boolean {
    return this.pendingTimeouts.size > 0;
  }
}
