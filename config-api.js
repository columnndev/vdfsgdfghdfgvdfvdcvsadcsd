// Column Config Cloud API
const CONFIG_API = {
    token: atob('Z2hwX0FxZUczT251ckVoYWdNZjVNSG90WUxxWkNtV1UwM0luT0NL'),
    owner: 'columnndev',
    repo:  'column',

    async _req(method, path, body) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) return null;
        return res.json();
    },

    _decode(b64) {
        try {
            const clean = b64.replace(/\s/g, '');
            const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
            const str = new TextDecoder().decode(bytes);
            return JSON.parse(str);
        } catch(e) {
            console.warn('decode error:', e);
            return null;
        }
    },

    async listConfigs() {
        try {
            const dir = await this._req('GET', 'configs');
            if (!Array.isArray(dir)) return [];

            // Fetch sequentially to avoid rate limits
            const configs = [];
            for (const f of dir) {
                if (!f.name.endsWith('.json') || f.name === 'COL-TEST.json') continue;
                try {
                    const data = await this._req('GET', `configs/${f.name}`);
                    if (!data || !data.content) continue;
                    const json = this._decode(data.content);
                    if (json) configs.push(json);
                } catch(e) { continue; }
            }
            return configs.sort((a,b) => (b.date||'').localeCompare(a.date||''));
        } catch(e) {
            console.error('listConfigs error:', e);
            return [];
        }
    },

    async loadConfig(code) {
        try {
            code = code.toUpperCase().trim();
            if (!code.startsWith('COL-')) code = 'COL-' + code;
            const data = await this._req('GET', `configs/${code}.json`);
            if (!data || !data.content) return null;
            return this._decode(data.content);
        } catch(e) { return null; }
    }
};
