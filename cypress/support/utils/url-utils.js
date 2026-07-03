/**
 * Pure URL helpers shared by browser navigation and API requests.
 */
class UrlUtils {
  /**
   * Resolves a relative resource path against a required absolute base URL.
   * Absolute resource URLs are returned unchanged by the URL constructor.
   * @param {string} baseUrl Absolute environment base URL.
   * @param {string} resourcePath Relative path or absolute URL.
   * @returns {string} Fully resolved URL.
   */
  static resolve(baseUrl, resourcePath) {
    if (/^https?:\/\//i.test(resourcePath)) {
      return new URL(resourcePath).toString();
    }
    if (!baseUrl) {
      throw new Error('A base URL is required to resolve a resource path.');
    }
    return new URL(resourcePath, baseUrl).toString();
  }
}

module.exports = { UrlUtils };
