const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');

const app = express();
app.use(express.json());

// Agentes optimizados para conexiones lentas (Cuba)
const httpAgent = new http.Agent({ 
    keepAlive: true, 
    keepAliveMsecs: 10000,
    maxSockets: 10,
    maxFreeSockets: 5
});
const httpsAgent = new https.Agent({ 
    keepAlive: true, 
    keepAliveMsecs: 10000,
    maxSockets: 10,
    maxFreeSockets: 5
});

// Página de inicio
app.get('/', (req, res) => {
    res.json({
        service: 'Proxy OpenRouter para Cuba',
        status: 'activo',
        version: '1.0.0',
        modelo_actual: 'z-ai/glm-5.2:free',
        endpoints: ['POST /v1/chat/completions'],
        instrucciones: 'Usa con Chatbox o cualquier cliente OpenAI compatible'
    });
});

// Endpoint principal para Chatbox
app.post('/v1/chat/completions', async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('📨 NUEVA PETICIÓN RECIBIDA');
    console.log('='.repeat(60));
    
    try {
        // 1. Obtener API Key de OpenRouter
        const authHeader = req.headers['authorization'] || '';
        const apiKey = authHeader.replace('Bearer ', '').trim();

        if (!apiKey) {
            console.log('❌ Error: Falta API Key');
            return res.status(401).json({ 
                error: { 
                    message: "API Key de OpenRouter requerida",
                    type: "authentication_error"
                } 
            });
        }

        console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

        // 2. Obtener modelo (por defecto GLM-5.2 FREE)
        let requestedModel = req.body.model || 'glm-5.2';
        
        // Mapeo de modelos de Chatbox a OpenRouter
        const modelMap = {
            'glm': 'z-ai/glm-5.2:free',
            'glm-5.2': 'z-ai/glm-5.2:free',
            'glm-free': 'z-ai/glm-5.2:free',
            'glm52': 'z-ai/glm-5.2:free'
        };

        // Si el modelo no está en el mapa, usar GLM-5.2 por defecto
        const model = modelMap[requestedModel] || 'z-ai/glm-5.2:free';
        
        console.log(`🔄 Modelo solicitado: ${requestedModel}`);
        console.log(`📌 Modelo real: ${model}`);

        // 3. Preparar mensajes
        const messages = req.body.messages || [];
        console.log(`📝 Mensajes: ${messages.length}`);

        if (messages.length === 0) {
            return res.status(400).json({
                error: { message: "No se enviaron mensajes" }
            });
        }

        // 4. Construir payload para OpenRouter
        const payload = {
            model: model,
            messages: messages,
            temperature: req.body.temperature || 0.7,
            max_tokens: req.body.max_tokens || 2000,
            top_p: req.body.top_p || 0.9,
            // Opciones adicionales para OpenRouter
            provider: {
                order: ['OpenRouter']
            }
        };

        console.log('📤 Enviando a OpenRouter...');
        console.log(`🌐 URL: https://openrouter.ai/api/v1/chat/completions`);

        // 5. Enviar a OpenRouter
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
                timeout: 120000, // 2 minutos
                httpAgent,
                httpsAgent
            }
        );

        console.log('✅ Respuesta exitosa de OpenRouter');

        // 6. Formatear respuesta para Chatbox
        const content = response.data.choices[0].message.content || '';

        return res.json({
            id: response.data.id || `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: requestedModel,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: content
                },
                finish_reason: response.data.choices[0].finish_reason || 'stop'
            }],
            usage: response.data.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            }
        });

    } catch (error) {
        console.error('❌ ERROR DETALLADO:');
        console.error(`📌 Mensaje: ${error.message}`);
        
        if (error.response) {
            console.error(`📌 Status: ${error.response.status}`);
            console.error(`📌 Data:`, JSON.stringify(error.response.data, null, 2));
            
            // Mensajes de error específicos
            if (error.response.status === 401) {
                console.error('\n🔴 ERROR 401: API Key de OpenRouter inválida');
                console.error('Soluciones:');
                console.error('1. Ve a https://openrouter.ai/keys');
                console.error('2. Crea una nueva API Key');
                console.error('3. Cópiala y pégala en Chatbox sin espacios');
            } else if (error.response.status === 429) {
                console.error('\n🔴 ERROR 429: Límite de peticiones alcanzado');
                console.error('Soluciones:');
                console.error('1. Espera unos minutos y vuelve a intentar');
                console.error('2. Los modelos gratuitos tienen límites de uso diario');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('⏰ Timeout: La petición tardó demasiado');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🌐 Error de red: No se puede conectar a OpenRouter');
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

// Endpoint de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        modelo: 'z-ai/glm-5.2:free'
    });
});

// Puerto
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PROXY OPENROUTER PARA CUBA');
    console.log('='.repeat(60));
    console.log(`📡 Puerto: ${PORT}`);
    console.log('🤖 Modelo: z-ai/glm-5.2:free (GRATUITO)');
    console.log('📋 Características:');
    console.log('   - Contexto: 128K tokens');
    console.log('   - Multimodal: Sí (texto, imágenes)');
    console.log('   - Idiomas: Español, Chino, Inglés y más');
    console.log('\n📌 URL para Chatbox:');
    console.log(`   https://TU-SERVICIO.onrender.com/v1/chat/completions`);
    console.log('='.repeat(60) + '\n');
});

// Configuración para redes lentas
server.timeout = 180000;        // 3 minutos
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
