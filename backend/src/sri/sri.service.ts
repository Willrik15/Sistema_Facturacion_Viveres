import { BadRequestException, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as libxml from 'libxmljs2';
import { FacturaXmlData, generarXMLFactura } from './generarXML';
import { generarClaveAcceso } from './claveAcceso';
import { firmarXML } from './firmarXML';

interface ClaveAccesoInput {
  fechaEmision: Date;
  tipoComprobante: '01';
  ruc: string;
  ambiente: '1' | '2';
  estab: string;
  ptoEmi: string;
  secuencial: string;
  codigoNumerico: string;
  tipoEmision: '1';
}

interface SriMensaje {
  identificador?: string;
  mensaje: string;
  informacionAdicional?: string;
  tipo?: string;
}

interface ResultadoSri {
  estado: string;
  mensajes: SriMensaje[];
  xmlAutorizado?: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
}

interface ResultadoValidacionXsd {
  valido: boolean;
  errores: string[];
}

interface ProcesarComprobanteInput {
  claveAcceso: string;
  xmlSinFirmar: string;
  xmlFirmado: string;
  enviarASri: boolean;
}

interface ProcesarFacturaInput {
  claveAccesoInput: ClaveAccesoInput;
  xmlInput: FacturaXmlData;
}

interface XmlFindCapable {
  find: (xpath: string) => unknown;
}

interface XmlGetCapable {
  get: (xpath: string) => unknown;
}

interface XmlTextCapable {
  text: () => string;
}

const SRI_DEFAULTS = {
  recepcionPruebas:
    'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
  autorizacionPruebas:
    'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
  recepcionProduccion:
    'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
  autorizacionProduccion:
    'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
} as const;

@Injectable()
export class SriService {
  private readonly facturaXsdPath = join(
    process.cwd(),
    'src',
    'sri',
    'xsd',
    'factura_V2.1.0.xsd',
  );

  private readonly requestTimeoutMs = Number(
    process.env.SRI_TIMEOUT_MS || '20000',
  );

  private readonly autorizacionMaxIntentos = Number(
    process.env.SRI_AUTORIZACION_MAX_INTENTOS || '10',
  );

  private readonly autorizacionDelayMs = Number(
    process.env.SRI_AUTORIZACION_DELAY_MS || '5000',
  );

  /**
   * Genera la clave de acceso para una factura según las reglas del SRI
   * @returns Clave de acceso de 49 dígitos
   */
  generarClaveAcceso(input: ClaveAccesoInput): string {
    return generarClaveAcceso(input);
  }

  /**
   * Genera el XML de una factura
   * @param venta - Datos de la venta con detalles
   * @returns XML formateado de la factura
   */
  generarXMLFactura(data: FacturaXmlData): string {
    return generarXMLFactura(data);
  }

  /**
   * Firma digitalmente un XML utilizando certificado P12
   * @param xml - Contenido XML sin firmar
   * @returns XML firmado digitalmente
   */
  firmarXML(xml: string): string {
    return firmarXML(xml);
  }

  validarContraXsd(xml: string): ResultadoValidacionXsd {
    try {
      const xmlDoc = libxml.parseXml(xml);
      const xsd = readFileSync(this.facturaXsdPath, 'utf8');
      const xsdDoc = libxml.parseXml(xsd);
      const valido = xmlDoc.validate(xsdDoc);

      return {
        valido,
        errores: xmlDoc.validationErrors.map((error) => error.message.trim()),
      };
    } catch (error) {
      return {
        valido: false,
        errores: [
          error instanceof Error
            ? error.message
            : 'Error desconocido validando XSD',
        ],
      };
    }
  }

  async procesarComprobante(
    input: ProcesarComprobanteInput,
  ): Promise<ResultadoSri> {
    if (!input.enviarASri) {
      return {
        estado: 'PENDIENTE_ENVIO',
        mensajes: [
          {
            mensaje:
              'XML firmado. Configura SRI_ENVIAR_AUTOMATICO=true para envío SOAP.',
          },
        ],
      };
    }

    const recepcion = await this.enviarRecepcion(input.xmlFirmado);

    if (recepcion.estado !== 'RECIBIDA') {
      return recepcion;
    }

    for (let intento = 1; intento <= this.autorizacionMaxIntentos; intento++) {
      // El SRI suele tardar unos segundos en publicar la autorización
      // después de aceptar la recepción del comprobante.
      await new Promise((resolve) =>
        setTimeout(resolve, this.autorizacionDelayMs),
      );

      const resultado = await this.enviarAutorizacion(input.claveAcceso);

      const estadoUpper = this.normalizarEstado(resultado.estado);

      // Si ya está autorizado o rechazado definitivamente, retornar.
      if (this.esEstadoFinal(estadoUpper)) {
        return resultado;
      }

      // Si es el último intento, retornar lo más reciente.
      if (intento === this.autorizacionMaxIntentos) {
        return resultado;
      }
    }

    // Fallback (nunca debería llegar aquí)
    return await this.enviarAutorizacion(input.claveAcceso);
  }

  private normalizarEstado(estado?: string): string {
    return (estado || '').toUpperCase().trim();
  }

  private esEstadoFinal(estadoUpper: string): boolean {
    return (
      estadoUpper === 'AUTORIZADO' ||
      estadoUpper === 'AUTORIZADA' ||
      estadoUpper === 'RECHAZADO' ||
      estadoUpper === 'RECHAZADA' ||
      estadoUpper === 'NO AUTORIZADO' ||
      estadoUpper === 'ANULADO' ||
      estadoUpper === 'ANULADA'
    );
  }

  /**
   * Proceso completo: genera clave, XML y firma
   * @param venta - Datos de la venta
   * @returns Objeto con claveAcceso, xmlGenerado y xmlFirmado
   */
  procesarFactura(data: ProcesarFacturaInput): {
    claveAcceso: string;
    xmlGenerado: string;
    xmlFirmado: string;
  } {
    const claveAcceso = this.generarClaveAcceso(data.claveAccesoInput);
    const xmlGenerado = this.generarXMLFactura(data.xmlInput);
    const xmlFirmado = this.firmarXML(xmlGenerado);

    return {
      claveAcceso,
      xmlGenerado,
      xmlFirmado,
    };
  }

  private getEndpoints() {
    const ambiente = process.env.SRI_AMBIENTE === '2' ? '2' : '1';
    const esProduccion = ambiente === '2';

    return {
      recepcion: esProduccion
        ? process.env.SRI_RECEPCION_URL_PROD || SRI_DEFAULTS.recepcionProduccion
        : process.env.SRI_RECEPCION_URL_PRUEBAS ||
          SRI_DEFAULTS.recepcionPruebas,
      autorizacion: esProduccion
        ? process.env.SRI_AUTORIZACION_URL_PROD ||
          SRI_DEFAULTS.autorizacionProduccion
        : process.env.SRI_AUTORIZACION_URL_PRUEBAS ||
          SRI_DEFAULTS.autorizacionPruebas,
    };
  }

  private async enviarRecepcion(xmlFirmado: string): Promise<ResultadoSri> {
    const payloadBase64 = Buffer.from(xmlFirmado, 'utf8').toString('base64');
    const soapBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${payloadBase64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const xmlResponse = await this.postSoap(
      this.getEndpoints().recepcion,
      soapBody,
    );
    return this.parseRecepcionResponse(xmlResponse);
  }

  private async enviarAutorizacion(claveAcceso: string): Promise<ResultadoSri> {
    const soapBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const xmlResponse = await this.postSoap(
      this.getEndpoints().autorizacion,
      soapBody,
    );
    return this.parseAutorizacionResponse(xmlResponse);
  }

  private async postSoap(endpoint: string, body: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body,
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new BadRequestException(
          `Error HTTP SRI (${response.status}): ${responseText}`,
        );
      }

      return responseText;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `No fue posible comunicarse con el SRI: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseRecepcionResponse(xml: string): ResultadoSri {
    const doc = libxml.parseXml(xml);
    const estado =
      this.getNodeText(doc, "//*[local-name()='estado']") || 'SIN_ESTADO';

    return {
      estado,
      mensajes: this.extractMensajes(doc),
    };
  }

  private parseAutorizacionResponse(xml: string): ResultadoSri {
    const doc = libxml.parseXml(xml);
    const autorizaciones = this.findNodes(
      doc,
      "//*[local-name()='autorizacion']",
    );

    if (autorizaciones.length === 0) {
      return {
        estado: 'SIN_RESPUESTA_AUTORIZACION',
        mensajes: this.extractMensajes(doc),
      };
    }

    const autorizada = autorizaciones.find((node) => {
      const estadoNodo = this.normalizarEstado(
        this.getNodeText(node, "./*[local-name()='estado']"),
      );
      return estadoNodo === 'AUTORIZADO' || estadoNodo === 'AUTORIZADA';
    });

    const objetivo = autorizada || autorizaciones[0];

    const estadoObjetivo =
      this.getNodeText(objetivo, "./*[local-name()='estado']") ||
      this.getNodeText(doc, "//*[local-name()='estado']") ||
      'SIN_ESTADO';

    const numeroAutorizacion =
      this.getNodeText(objetivo, "./*[local-name()='numeroAutorizacion']") ||
      this.getNodeText(doc, "//*[local-name()='numeroAutorizacion']");

    const fechaAutorizacion =
      this.getNodeText(objetivo, "./*[local-name()='fechaAutorizacion']") ||
      this.getNodeText(doc, "//*[local-name()='fechaAutorizacion']");

    const xmlAutorizado =
      this.getNodeText(objetivo, "./*[local-name()='comprobante']") ||
      this.getNodeText(doc, "//*[local-name()='comprobante']");

    return {
      estado: estadoObjetivo,
      mensajes: this.extractMensajes(objetivo),
      numeroAutorizacion,
      fechaAutorizacion,
      xmlAutorizado,
    };
  }

  private isXmlFindCapable(value: unknown): value is XmlFindCapable {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<XmlFindCapable>;
    return typeof candidate.find === 'function';
  }

  private isXmlGetCapable(value: unknown): value is XmlGetCapable {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<XmlGetCapable>;
    return typeof candidate.get === 'function';
  }

  private isXmlTextCapable(value: unknown): value is XmlTextCapable {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<XmlTextCapable>;
    return typeof candidate.text === 'function';
  }

  private findNodes(node: unknown, xpath: string): XmlFindCapable[] {
    if (!this.isXmlFindCapable(node)) {
      return [];
    }
    const found = node.find(xpath);
    if (!Array.isArray(found)) {
      return [];
    }
    return found.filter((item): item is XmlFindCapable =>
      this.isXmlFindCapable(item),
    );
  }

  private extractMensajes(node: unknown): SriMensaje[] {
    return this.findNodes(node, ".//*[local-name()='mensaje']").map(
      (messageNode) => ({
        identificador: this.getNodeText(
          messageNode,
          "./*[local-name()='identificador']",
        ),
        mensaje:
          this.getNodeText(messageNode, "./*[local-name()='mensaje']") ||
          'Sin detalle',
        informacionAdicional: this.getNodeText(
          messageNode,
          "./*[local-name()='informacionAdicional']",
        ),
        tipo: this.getNodeText(messageNode, "./*[local-name()='tipo']"),
      }),
    );
  }

  private getNodeText(node: unknown, xpath: string): string | undefined {
    if (!this.isXmlGetCapable(node)) {
      return undefined;
    }
    const found = node.get(xpath);
    if (!this.isXmlTextCapable(found)) {
      return undefined;
    }
    const text = found.text();
    return text ? text.trim() : undefined;
  }
}
