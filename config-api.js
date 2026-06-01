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
            return JSON.parse(new TextDecoder().decode(
                Uint8Array.from(atob(b64.replace(/\n/g,'')), c => c.charCodeAt(0))
            ));
        } catch { return null; }
    },

    async listConfigs() {
        const dir = await this._req('GET', 'configs');
        if (!Array.isArray(dir)) return [];

        const results = await Promise.all(
            dir.filter(f => f.name.endsWith('.json'))
               .map(async f => {
                   const data = await this._req('GET', `configs/${f.name}`);
                   if (!data || !data.content) return null;
                   return this._decode(data.content);
               })
        );
        return results.filter(Boolean).sort((a,b) => (b.date||'').localeCompare(a.date||''));
    },

    async loadConfig(code) {
        code = code.toUpperCase().trim();
        if (!code.startsWith('COL-')) code = 'COL-' + code;
        const data = await this._req('GET', `configs/${code}.json`);
        if (!data || !data.content) return null;
        return this._decode(data.content);
    }
};
