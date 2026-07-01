/**
 * Pure text helpers shared by UI and API validation code.
 */
class TextUtils {
  /**
   * Collapses repeated whitespace and trims the result for stable comparisons.
   * @param {string|number|null|undefined} value Value to normalize.
   * @returns {string} Normalized text.
   */
  static normalize(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = { TextUtils };
