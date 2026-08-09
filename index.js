const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');

const app = express();
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

app.get('/', (req, res) => {
    res.send('Adaptador Universal OpenRouter Activo');
});

app.use('/', createProxyMiddleware({
    target: 'https://openrouter.ai/api',
    changeOrigin: true,
    agent: httpsAgent,
    proxyTimeout: 120000,
    timeout: 120000,
    onError: (err, req, res) => {
        console.error('Error de red en OpenRouter:', err.message);
        if (!res.headersSent) {
            res.status(504).send('Tiempo de espera agotado.');
        }
    }
}));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));

server.timeout = 180000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
