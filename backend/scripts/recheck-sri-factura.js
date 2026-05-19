require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const libxml = require('libxmljs2');

const prisma = new PrismaClient();

function getArg(name) {
  const pair = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return pair ? pair.split('=').slice(1).join('=') : undefined;
}

function normalize(value) {
  return (value || '').toUpperCase().trim();
}

function getNodeText(doc, xpath) {
  const node = doc.get(xpath);
  if (!node || typeof node.text !== 'function') {
    return undefined;
  }
  const text = node.text();
  return text ? text.trim() : undefined;
}

async function consultarAutorizacion(claveAcceso) {
  const esProd = process.env.SRI_AMBIENTE === '2';
  const endpoint = esProd
    ? process.env.SRI_AUTORIZACION_URL_PROD ||
      'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
    : process.env.SRI_AUTORIZACION_URL_PRUEBAS ||
      'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';

  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body,
  });

  const xml = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${xml}`);
  }

  const doc = libxml.parseXml(xml);
  const estado =
    getNodeText(doc, "//*[local-name()='autorizacion']/*[local-name()='estado']") ||
    getNodeText(doc, "//*[local-name()='estado']") ||
    'SIN_ESTADO';

  const numeroAutorizacion =
    getNodeText(
      doc,
      "//*[local-name()='autorizacion']/*[local-name()='numeroAutorizacion']",
    ) || getNodeText(doc, "//*[local-name()='numeroAutorizacion']");

  const fechaAutorizacion =
    getNodeText(
      doc,
      "//*[local-name()='autorizacion']/*[local-name()='fechaAutorizacion']",
    ) || getNodeText(doc, "//*[local-name()='fechaAutorizacion']");

  const comprobante =
    getNodeText(
      doc,
      "//*[local-name()='autorizacion']/*[local-name()='comprobante']",
    ) || getNodeText(doc, "//*[local-name()='comprobante']");

  return {
    estado,
    numeroAutorizacion,
    fechaAutorizacion,
    comprobante,
    rawXml: xml,
  };
}

(async () => {
  const idArg = getArg('id');
  const claveArg = getArg('clave');

  if (!idArg && !claveArg) {
    console.error('Uso: node scripts/recheck-sri-factura.js --id=50');
    console.error(' o : node scripts/recheck-sri-factura.js --clave=XXXXXXXX');
    process.exit(1);
  }

  const factura = idArg
    ? await prisma.factura.findUnique({
        where: { id: Number(idArg) },
        select: { id: true, claveAcceso: true, estadoSRI: true },
      })
    : await prisma.factura.findUnique({
        where: { claveAcceso: String(claveArg) },
        select: { id: true, claveAcceso: true, estadoSRI: true },
      });

  if (!factura) {
    throw new Error('Factura no encontrada');
  }

  const sri = await consultarAutorizacion(factura.claveAcceso);
  const estadoUpper = normalize(sri.estado);

  console.log('Factura local:', factura.id, factura.estadoSRI);
  console.log('Estado SRI:', sri.estado);

  if (estadoUpper === 'AUTORIZADO' || estadoUpper === 'AUTORIZADA') {
    await prisma.factura.update({
      where: { id: factura.id },
      data: {
        estadoSRI: 'AUTORIZADA',
        numeroAutorizacion: sri.numeroAutorizacion || factura.claveAcceso,
        fechaAutorizacion: sri.fechaAutorizacion
          ? new Date(sri.fechaAutorizacion)
          : new Date(),
        xmlAutorizado: sri.comprobante || sri.rawXml,
      },
    });

    console.log('Actualizada a AUTORIZADA.');
  } else {
    console.log('No se actualiza. Estado no autorizado.');
  }
})()
  .catch((error) => {
    console.error('Error:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
