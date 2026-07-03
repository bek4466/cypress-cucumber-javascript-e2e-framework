/**
 * Posts pre-rendered JSON to Slack or Teams without ever logging webhook URLs.
 */
class WebhookNotifier {
  /** @param {Function} fetchImplementation Injectable fetch for mock tests. */
  constructor(fetchImplementation = fetch) {
    this.fetch = fetchImplementation;
  }

  /**
   * @param {object} input Webhook request.
   * @param {string} input.channel Safe channel name used only in errors.
   * @param {string} input.webhookUrl Secret webhook URL.
   * @param {object} input.payload Slack/Teams JSON payload.
   */
  async send({ channel, webhookUrl, payload }) {
    if (!webhookUrl) throw new Error(`${channel} webhook URL is not configured.`);
    const response = await this.fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${channel} notification failed with HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
  }
}

module.exports = { WebhookNotifier };
