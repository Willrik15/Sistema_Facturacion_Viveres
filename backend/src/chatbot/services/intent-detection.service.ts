import { Injectable } from '@nestjs/common';

export interface IntentMatch {
  tipo:
    | 'PRODUCTO'
    | 'PRECIO'
    | 'STOCK'
    | 'CLIENTE'
    | 'DEUDA'
    | 'GENERAL'
    | 'SALUDO'
    | 'AYUDA'
    | 'DESCONOCIDO'
    | 'ERROR';
  parametro?: string;
  confidence: number;
}

interface IntentConfig {
  palabras: string[];
  respuestas?: string[];
  parametros?: string[];
}

@Injectable()
export class IntentDetectionService {
  private intentMap: Record<string, IntentConfig> = {
    SALUDO: {
      palabras: [
        'hola',
        'hey',
        'buenos',
        'buenas',
        'saludos',
        'qué tal',
        'cómo estás',
      ],
      respuestas: [
        'Hola, bienvenido a la tienda. ¿En qué puedo ayudarte?',
        '¡Hola! Puedo ayudarte a buscar productos, revisar precios, stock o deudas.',
      ],
    },
    PRODUCTO: {
      palabras: [
        'producto',
        'buscar',
        'tienes',
        'hay',
        'existe',
        'disponible',
        'cual',
        'que productos',
        'qué venden',
      ],
      parametros: ['nombre'],
    },
    PRECIO: {
      palabras: [
        'precio',
        'costo',
        'cuánto cuesta',
        'cuál es el precio',
        'vale',
      ],
      parametros: ['nombre'],
    },
    STOCK: {
      palabras: [
        'stock',
        'cantidad',
        'cuántos hay',
        'disponible',
        'queda',
        'existe',
      ],
      parametros: ['nombre'],
    },
    DEUDA: {
      palabras: ['deuda', 'debo', 'fío', 'crédito', 'pendiente', 'cuánto debo'],
      parametros: ['cliente'],
    },
    AYUDA: {
      palabras: ['ayuda', 'help', 'qué puedo hacer', 'comandos', 'opciones'],
      respuestas: [
        'Puedo ayudarte con: 1. Buscar productos, 2. Ver precios, 3. Consultar stock, 4. Ver deudas (fios)',
      ],
    },
  };

  detectIntent(mensaje: string): IntentMatch {
    const raw = mensaje.trim();
    const norm = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // --- SALUDO ---
    if (/^(hola|hey|buenas?|saludos?|que tal|como estas?)\b/.test(norm)) {
      return { tipo: 'SALUDO', confidence: 1 };
    }

    // --- AYUDA ---
    if (/\b(ayuda|help|que puedo|comandos?|opciones?)\b/.test(norm)) {
      return { tipo: 'AYUDA', confidence: 1 };
    }

    // --- DEUDA / FIO ---
    if (
      /\b(deuda|debo|fio|fiado|credito|pendiente|cuanto debo|debe)\b/.test(norm)
    ) {
      // intentar extraer nombre de cliente
      const matchCliente =
        norm.match(/\bdeuda\s+d[eo]\s+(.+)$/) ||
        norm.match(/\bcuanto debe\s+(.+)$/) ||
        norm.match(/\bfio\s+d[eo]\s+(.+)$/);
      return {
        tipo: 'DEUDA',
        parametro: matchCliente?.[1]?.trim() || undefined,
        confidence: 0.9,
      };
    }

    // Patrones para producto: precio de X / stock de X / hay X / tienes X / cuanto cuesta X
    const precioMatch =
      norm.match(/\bprecio\s+(?:de\s+)?(.+)$/) ||
      norm.match(
        /\bcuanto\s+(?:cuesta|vale|es)\s+(?:el\s+|la\s+|un\s+|una\s+)?(.+)$/,
      ) ||
      norm.match(/\bcosto\s+(?:de\s+)?(.+)$/);

    if (precioMatch) {
      return {
        tipo: 'PRECIO',
        parametro: precioMatch[1].trim(),
        confidence: 0.9,
      };
    }

    const stockMatch =
      norm.match(/\bstock\s+(?:de\s+)?(.+)$/) ||
      norm.match(/\bcuantos?\s+(?:hay|quedan?|tienes?)\s+(?:de\s+)?(.+)$/) ||
      norm.match(/\bqueda\s+(.+)$/) ||
      norm.match(/\bdisponible\s+(?:el\s+|la\s+)?(.+)$/);

    if (stockMatch) {
      return {
        tipo: 'STOCK',
        parametro: stockMatch[1].trim(),
        confidence: 0.9,
      };
    }

    const productoMatch =
      norm.match(
        /\b(?:buscar?|busca|tienes?|hay|existe|buscas?)\s+(?:el\s+|la\s+|un\s+|una\s+)?(.+)$/,
      ) || norm.match(/\bproducto\s+(.+)$/);

    if (productoMatch) {
      return {
        tipo: 'PRODUCTO',
        parametro: productoMatch[1].trim(),
        confidence: 0.8,
      };
    }

    // Fallback: si el mensaje es corto (1-3 palabras) tratar como búsqueda de producto
    const words = norm.split(/\s+/).filter((w) => w.length > 1);
    if (words.length >= 1 && words.length <= 3) {
      return { tipo: 'PRODUCTO', parametro: raw.trim(), confidence: 0.5 };
    }

    return { tipo: 'DESCONOCIDO', confidence: 0 };
  }

  getResponseText(tipo: string): string {
    const config = this.intentMap[tipo];
    if (!config || !config.respuestas) {
      return '';
    }
    return config.respuestas[
      Math.floor(Math.random() * config.respuestas.length)
    ];
  }
}
