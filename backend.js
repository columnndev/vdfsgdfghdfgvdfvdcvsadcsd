// Public backend config (safe to expose — contains NO secrets).
// Point this at your deployed Cloudflare Worker.
const BACKEND = {
    url: "https://api.column.wtf",

    // Start Discord OAuth (identify + guilds.join) so the buyer can get auto-role.
    discordLoginUrl() { return `${this.url}/discord/login`; },

    // Create a crypto invoice. Returns { orderId, invoiceUrl }.
    async checkout({ itemId, itemName, priceUsd, discordRef }) {
        const r = await fetch(`${this.url}/checkout`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ itemId, itemName, priceUsd, discordRef })
        });
        const data = await r.json().catch(() => ({}));
        // 409 = the saved Discord link expired; caller should reconnect.
        if (r.status === 409 && data.needDiscord) return { needDiscord: true };
        if (!r.ok) throw new Error(data.error || 'checkout failed');
        return data;
    },

    // Poll order status until the key is delivered.
    async getOrder(orderId) {
        const r = await fetch(`${this.url}/order/${orderId}`);
        if (!r.ok) return null;
        return r.json();
    }
};
