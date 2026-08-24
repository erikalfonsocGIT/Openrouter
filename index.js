const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');

const app = express();
app.use(express.json());

const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

app.get('/', (req, res) => {
    res.json({
        service: 'Proxy OpenRouter para Cuba',
        status: 'activo',
        version: '2.0.0',
        modelos_gratuitos: [
            'glm-5.2-free',
            'llama-3.3-70b-free',
            'gemma-3-27b-free',
            'deepseek-r1-free',
            'qwen-2.5-72b-free',
            'openrouter/free'
        ]
    });
});

app.post('/v1/chat/completions', async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('📨 NUEVA PETICIÓN RECIBIDA');
    console.log('='.repeat(60));
    
    try {
        const authHeader = req.headers['authorization'] || '';
        const apiKey = authHeader.replace('Bearer ', '').trim();

        if (!apiKey) {
            return res.status(401).json({ 
                error: { message: "API Key de OpenRouter requerida" } 
            });
        }

        // Mapeo de modelos - AHORA CON VARIAS OPCIONES GRATUITAS
        const modelMap = {
            // Modelos específicos
            'glm': 'z-ai/glm-5.2:free',
            'glm-5.2': 'z-ai/glm-5.2:free',
            'llama': 'meta-llama/llama-3.3-70b-instruct:free',
            'llama-3.3': 'meta-llama/llama-3.3-70b-instruct:free',
            'gemma': 'google/gemma-3-27b-it:free',
            'gemma-3': 'google/gemma-3-27b-it:free',
            'deepseek': 'deepseek/deepseek-r1-0528:free',
            'deepseek-r1': 'deepseek/deepseek-r1-0528:free',
            'qwen': 'qwen/qwen-2.5-72b-instruct:free',
            'qwen-2.5': 'qwen/qwen-2.5-72b-instruct:free',
            // Router automático (elige el mejor modelo gratuito disponible)
            'free': 'openrouter/free'
        };

        let requestedModel = req.body.model || 'glm-5.2';
        // Si el modelo contiene "free", usar el router automático
        if (requestedModel.includes('free') || requestedModel === 'free') {
            requestedModel = 'free';
        }
        
        const model = modelMap[requestedModel] || modelMap['glm-5.2'];
        
        console.log(`🔄 Modelo solicitado: ${requestedModel}`);
        console.log(`📌 Modelo real: ${model}`);

        const messages = req.body.messages || [];

        const payload = {
            model: model,
            messages: messages,
            temperature: req.body.temperature || 0.7,
            max_tokens: req.body.max_tokens || 2000
        };

        console.log('📤 Enviando a OpenRouter...');

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://tu-servicio.onrender.com',
                    'X-Title': 'Proxy GLM-5.2 Cuba'
                },
                timeout: 120000,
                httpAgent,
                httpsAgent
            }
        );

        console.log('✅ Respuesta exitosa');

        return res.json({
            id: response.data.id || `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: requestedModel,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: response.data.choices[0].message.content
                },
                finish_reason: 'stop'
            }],
            usage: response.data.usage
        });

    } catch (error) {
        console.error('❌ ERROR:');
        console.error(`📌 ${error.message}`);
        
        if (error.response) {
            console.error(`📌 Status: ${error.response.status}`);
            console.error(`📌 Data:`, JSON.stringify(error.response.data, null, 2));
            
            // Manejar ERROR 429 específicamente
            if (error.response.status === 429) {
                console.error('\n🔴 ERROR 429: Límite de peticiones alcanzado');
                
                // Devolver mensaje AMIGABLE para Chatbox
                return res.status(429).json({
                    error: {
                        message: "⚠️ Has alcanzado el límite diario de este modelo gratuito (200 peticiones/día).",
                        details: "Cambia a otro modelo gratuito o espera hasta mañana.",
                        modelos_disponibles: [
                            "glm-5.2-free", 
                            "llama-3.3-70b-free", 
                            "gemma-3-27b-free",
                            "deepseek-r1-free",
                            "qwen-2.5-72b-free",
                            "free (router automático)"
                        ],
                        sugerencia: "En Chatbox, cambia el modelo a 'free' para usar el router automático",
                        type: "rate_limit_error"
                    }
                });
            }
        }
        
        return res.status(500).json({
            error: {
                message: "Error al procesar la solicitud",
                details: error.message,
                type: "openrouter_error"
            }
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PROXY OPENROUTER PARA CUBA v2.0');
    console.log('='.repeat(60));
    console.log(`📡 Puerto: ${PORT}`);
    console.log('🤖 Modelos gratuitos disponibles:');
    console.log('   - glm-5.2-free (GLM-5.2)');
    console.log('   - llama-3.3-70b-free (Llama 3.3 70B)');
    console.log('   - gemma-3-27b-free (Gemma 3 27B)');
    console.log('   - deepseek-r1-free (DeepSeek R1)');
    console.log('   - qwen-2.5-72b-free (Qwen 2.5 72B)');
    console.log('   - free (Router automático)');
    console.log('\n💡 Usa "free" para evitar errores 429');
    console.log('='.repeat(60) + '\n');
});

server.timeout = 180000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
