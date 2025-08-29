/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

/**
 * Console interface for logging
 */
interface Console {
  /**
   * Logs data to scripting console
   * @param args - values to log
   */
  log(...args: unknown[]): void;
  /**
   * Logs a warning to scripting console with provided arguments
   * @param args - values to log
   */
  warn(...args: unknown[]): void;
  /**
   * Logs an error to scripting console with provided arguments
   * @param args - values to log
   */
  error(...args: unknown[]): void;
}

/**
 * Global console object that allows logging
 */
declare const console: Console;
