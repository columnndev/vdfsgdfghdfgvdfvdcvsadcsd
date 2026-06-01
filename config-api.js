// Column Config Cloud API
// Stores configs as JSON files in the GitHub repo under configs/
// Each config = configs/COL-XXXX.json

const CONFIG_API = {
    token: atob('Z2hwX0FxZUczT251ckVoYWdNZjVNSG90WUxxWkNtV1UwM0luT0NL'),
    owner: 'columnndev',
    repo:  'column',

    // Generate a random 4-char code
    _genCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'COL-';
        for (let i = 0; i < 4; i++)
            code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },

    async _githubRequest(method, path, body) {
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
        return res.ok ? res.json() : null;
    },

    // Upload a config — returns the code or null on failure
    async shareConfig(configString, label, hero, username) {
        let code = this._genCode();
        // Try up to 5 times in case of collision
        for (let attempt = 0; attempt < 5; attempt++) {
            const filePath = `configs/${code}.json`;
            const payload = {
                code,
                label:    label    || 'Unnamed',
                hero:     hero     || 'General',
                author:   username || 'Anonymous',
                date:     new Date().toISOString().split('T')[0],
                config:   configString
            };
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
            const result = await this._githubRequest('PUT', filePath, {
                message: `Add config ${code} by ${payload.author}`,
                content
            });
            if (result) return code;
            code = this._genCode(); // collision — try new code
        }
        return null;
    },

    // Fetch a single config by code
    async loadConfig(code) {
        code = code.toUpperCase().trim();
        if (!code.startsWith('COL-')) code = 'COL-' + code;
        const filePath = `configs/${code}.json`;
        const result = await this._githubRequest('GET', filePath);
        if (!result || !result.content) return null;
        try {
            const json = JSON.parse(decodeURIComponent(escape(atob(result.content.replace(/\n/g, '')))));
            return json;
        } catch { return null; }
    },

    // List all configs (for browse page)
    async listConfigs() {
        const result = await this._githubRequest('GET', 'configs');
        if (!Array.isArray(result)) return [];

        const configs = [];
        for (const file of result) {
            if (!file.name.endsWith('.json')) continue;
            try {
                const fileData = await this._githubRequest('GET', `configs/${file.name}`);
                if (!fileData || !fileData.content) continue;
                const json = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, '')))));
                configs.push(json);
            } catch { continue; }
        }
        return configs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
};
