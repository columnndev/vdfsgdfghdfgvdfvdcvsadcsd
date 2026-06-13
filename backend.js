// Public backend config (safe to expose — contains NO secrets).
// Point this at your deployed Cloudflare Worker.
const BACKEND = {
    url: "https://column-backend.gustavsimsbussines.workers.dev",

    // Start Discord OAuth (identify + guilds.join) so the buyer can get auto-role.
    discordLoginUrl() { return `${this.url}/discord/login`; },

    // Create a crypto invoice. Returns { orderId, invoiceUrl }.
    async checkout({ itemId, itemName, priceUsd, discordRef }) {
        const r = await fetch(`${this.url}/checkout`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ itemId, itemName, priceUsd, discordRef })
        });
        if (!r.ok) throw new Error('checkout failed');
        return r.json();
    },

    // Poll order status until the key is delivered.
    async getOrder(orderId) {
        const r = await fetch(`${this.url}/order/${orderId}`);
        if (!r.ok) return null;
        return r.json();
    }
};
