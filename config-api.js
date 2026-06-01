// Column Config Cloud API
// Uses raw.githubusercontent.com for reads (no auth needed, no CORS issues)
// Uses GitHub API only for writes (upload from in-game via PowerShell)
const CONFIG_API = {
    owner: 'columnndev',
    repo:  'column',
    branch: 'main',

    _rawUrl(path) {
        return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
    },

    async _fetchJson(path) {
        try {
            const res = await fetch(this._rawUrl(path) + '?t=' + Date.now());
            if (!res.ok) return null;
            return res.json();
        } catch(e) { return null; }
    },

    async listConfigs() {
        try {
            // Use GitHub API dir listing (needs token) — but only for file names
            const token = atob('Z2hwX0FxZUczT251ckVoYWdNZjVNSG90WUxxWkNtV1UwM0luT0NL');
            const res = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/configs`, {
                headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
            });
            if (!res.ok) return [];
            const dir = await res.json();
            if (!Array.isArray(dir)) return [];

            const configs = [];
            for (const f of dir) {
                if (!f.name.endsWith('.json') || f.name === 'COL-TEST.json') continue;
                // Fetch raw content — no auth, no rate limit
                const json = await this._fetchJson(`configs/${f.name}`);
                if (json) configs.push(json);
            }
            return configs.sort((a,b) => (b.date||'').localeCompare(a.date||''));
        } catch(e) { return []; }
    },

    async loadConfig(code) {
        try {
            code = code.toUpperCase().trim();
            if (!code.startsWith('COL-')) code = 'COL-' + code;
            return await this._fetchJson(`configs/${code}.json`);
        } catch(e) { return null; }
    }
};
