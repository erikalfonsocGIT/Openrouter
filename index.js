const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');

const app = express();

// Agentes Keep-Alive optimizados para la red de ETECSA en Cuba
const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

app.get('/', (req, res) => {
    res.send('Servidor Adaptador OpenRouter (z-ai/glm-5.2:free) activo en Render');
});

// INTERCEPTOR INTELIGENTE Y CONEXIÓN ROBUSTA PARA OPENROUTER
app.use('/', createProxyMiddleware({
    target: 'https://openrouter.ai/api/v1',
    changeOrigin: true,
    logLevel: 'debug',
    agent: httpsAgent,

    // Amplía el timeout a 2 minutos para soportar latencias en Cuba
    proxyTimeout: 120000,
    timeout: 120000,

    pathRewrite: (path, req) => {
        return path;
    },
    onProxyReq: (proxyReq, req, res) => {
        // Mantiene intacta la cabecera Authorization: Bearer <OPENROUTER_API_KEY> enviada desde Chatbox
    },
    onError: (err, req, res) => {
        console.error('Error de red/timeout en el Proxy OpenRouter:', err.message);
        if (!res.headersSent) {
            res.status(504).send('Error de tiempo de espera en la red. Conexión inestable.');
        }
    }
}));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Adaptador OpenRouter corriendo en el puerto ${PORT}`));

// CONFIGURACIÓN DE TIMEOUTS PARA RENDER Y ETECSA
server.timeout = 180000;         // 3 minutos
server.keepAliveTimeout = 65000;   // Por encima del límite de 60s de Render
server.headersTimeout = 66000;
