/**
 * EJEMPLOS DE USO DEL CHATBOT
 * ============================
 *
 * El chatbot se accede a través de los endpoints: POST /chatbot/mensaje
 *
 * EJEMPLOS DE MENSAJES:
 *
 * 1. BUSCAR PRODUCTO
 *    - "¿Tienes leche?"
 *    - "Busco pan integral"
 *    - "Qué productos hay disponibles?"
 *
 * 2. CONSULTAR PRECIO
 *    - "Cuánto cuesta la leche?"
 *    - "Cual es el precio del pan?"
 *    - "¿Precio de arroz?"
 *
 * 3. CONSULTAR STOCK
 *    - "Cuánto stock hay de leche?"
 *    - "Existe aceite disponible?"
 *    - "Stock de frijoles"
 *
 * 4. CONSULTAR DEUDAS (FIOS)
 *    - "Cuántas deudas hay?"
 *    - "Mostrar fios pendientes"
 *    - "Deudas del cliente"
 *
 * 5. SALUDOS
 *    - "Hola"
 *    - "Buenos días"
 *    - "Hey"
 *
 * 6. AYUDA
 *    - "¿Qué puedo hacer?"
 *    - "Ayuda"
 *    - "Comandos"
 *
 *
 * EJEMPLO HTTP REQUEST:
 * =====================
 *
 * POST http://localhost:3000/chatbot/mensaje
 * Content-Type: application/json
 *
 * {
 *   "mensaje": "¿Tienes leche?"
 * }
 *
 * RESPUESTA:
 * ----------
 * {
 *   "respuesta": "📦 *Leche Integral*\n💰 Precio: \$2.50\n📊 Stock disponible: 45 unidades\n🏢 Proveedor: Lácteos XYZ",
 *   "tipo": "PRODUCTO",
 *   "datos": {
 *     "id": 1,
 *     "nombre": "Leche Integral",
 *     "precio": 2.50,
 *     "stock": 45,
 *     "stockMinimo": 10,
 *     "codigoBarras": "1234567890123"
 *   },
 *   "timestamp": "2026-04-10T15:30:42.123Z"
 * }
 *
 *
 * CARACTERÍSTICAS PRINCIPALES:
 * ============================
 *
 * ✅ Detección de intenciones por palabras clave
 * ✅ Búsqueda de productos en tiempo real desde BD
 * ✅ Consulta de precios, stock y disponibilidad
 * ✅ Visualización de deudas (fios) pendientes
 * ✅ Respuestas dinámicas y personalizadas
 * ✅ Respuestas formateadas con emojis y markdown
 * ✅ Endpoint de estadísticas (solo autenticado)
 *
 *
 * DIAGRAMA DE FLUJO:
 * ==================
 *
 * Usuario envía mensaje
 *       ↓
 * ChatbotController recibe
 *       ↓
 * ChatbotService procesa
 *       ↓
 * IntentDetectionService detecta intención
 *       ↓
 * Consulta BD según intención
 *       ↓
 * Genera respuesta dinámica
 *       ↓
 * Retorna ChatbotResponseDto
 */
