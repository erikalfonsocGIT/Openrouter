const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');

const app = express();

const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

app.get('/', (req, res) => {
    res.send('Servidor Adaptador OpenRouter activo y listo');
});

app.use('/', createProxyMiddleware({
    target: 'https://openrouter.ai/api/v1',
    changeOrigin: true,
    logLevel: 'debug',
    agent: httpsAgent,
    proxyTimeout: 120000,
    timeout: 120000,

    // CORRECCIÓN DE RUTA: Elimina duplicaciones de /v1 si Chatbox las envía
    pathRewrite: (path) => {
        return path.replace(/^\/v1/, '');
    },

    onProxyReq: (proxyReq, req, res) => {
        // Asegura que el formato de las cabeceras sea correcto para OpenRouter
        if (req.headers['authorization']) {
            proxyReq.setHeader('Authorization', req.headers['authorization']);
        }
    },
    onError: (err, req, res) => {
        console.error('Error en el Proxy:', err.message);
        if (!res.headersSent) {
            res.status(504).send('Error de conexión o timeout.');
        }
    }
}));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));

server.timeout = 180000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
