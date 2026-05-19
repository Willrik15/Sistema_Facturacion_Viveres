import { create } from 'xmlbuilder2';

interface FacturaVentaCliente {
  nombre: string;
  cedula?: string;
}

interface FacturaVentaDetalle {
  cantidad: number;
  subtotal: number;
  productoId: number;
  producto?: {
    id: number;
    nombre: string;
    codigoBarras?: string | null;
  } | null;
}

interface FacturaVentaInput {
  fecha: Date | string;
  total: number;
  cliente: FacturaVentaCliente;
  detalles: FacturaVentaDetalle[];
}

export interface FacturaXmlData {
  venta: FacturaVentaInput;
  factura: {
    claveAcceso: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    ambiente: string;
    tipoEmision: string;
  };
  emisor: {
    ruc: string;
    razonSocial: string;
    nombreComercial: string;
    dirMatriz: string;
    dirEstablecimiento: string;
  };
}

const formatearFecha = (fecha: Date) => {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const tipoIdentificacionComprador = (identificacion?: string) => {
  const limpia = String(identificacion || '').replace(/\D/g, '');
  if (limpia.length === 13) return '04';
  if (limpia.length === 10) return '05';
  return '07';
};

export function generarXMLFactura(data: FacturaXmlData) {
  const { venta, factura, emisor } = data;
  const fechaVenta =
    venta.fecha instanceof Date ? venta.fecha : new Date(venta.fecha);
  const totalSinImpuestos = Number(venta.total || 0);
  const identificacionComprador = venta.cliente?.cedula || '9999999999999';
  const obligadoContabilidad =
    (process.env.SRI_OBLIGADO_CONTABILIDAD || 'NO').toUpperCase() === 'SI'
      ? 'SI'
      : 'NO';
  const formaPago = process.env.SRI_FORMA_PAGO || '01';
  const agenteRetencion = process.env.SRI_AGENTE_RETENCION;
  const contribuyenteRimpe = process.env.SRI_CONTRIBUYENTE_RIMPE;

  const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele('factura', {
    id: 'comprobante',
    version: '2.1.0',
  });

  // Datos del emisor del comprobante.
  const infoTributaria = doc
    .ele('infoTributaria')
    .ele('ambiente')
    .txt(factura.ambiente)
    .up()
    .ele('tipoEmision')
    .txt(factura.tipoEmision)
    .up()
    .ele('razonSocial')
    .txt(emisor.razonSocial)
    .up()
    .ele('nombreComercial')
    .txt(emisor.nombreComercial)
    .up()
    .ele('ruc')
    .txt(emisor.ruc)
    .up()
    .ele('claveAcceso')
    .txt(factura.claveAcceso)
    .up()
    .ele('codDoc')
    .txt('01')
    .up()
    .ele('estab')
    .txt(factura.estab)
    .up()
    .ele('ptoEmi')
    .txt(factura.ptoEmi)
    .up()
    .ele('secuencial')
    .txt(factura.secuencial)
    .up()
    .ele('dirMatriz')
    .txt(emisor.dirMatriz)
    .up();

  if (agenteRetencion) {
    infoTributaria.ele('agenteRetencion').txt(agenteRetencion).up();
  }

  if (contribuyenteRimpe) {
    infoTributaria.ele('contribuyenteRimpe').txt(contribuyenteRimpe).up();
  }

  infoTributaria.up();

  doc

    // Datos del comprador y totales de la factura.
    .ele('infoFactura')
    .ele('fechaEmision')
    .txt(formatearFecha(fechaVenta))
    .up()
    .ele('dirEstablecimiento')
    .txt(emisor.dirEstablecimiento)
    .up()
    .ele('obligadoContabilidad')
    .txt(obligadoContabilidad)
    .up()
    .ele('tipoIdentificacionComprador')
    .txt(tipoIdentificacionComprador(identificacionComprador))
    .up()
    .ele('razonSocialComprador')
    .txt(venta.cliente.nombre)
    .up()
    .ele('identificacionComprador')
    .txt(identificacionComprador)
    .up()
    .ele('totalSinImpuestos')
    .txt(totalSinImpuestos.toFixed(2))
    .up()
    .ele('totalDescuento')
    .txt('0.00')
    .up()
    .ele('totalConImpuestos')
    .ele('totalImpuesto')
    .ele('codigo')
    .txt('2')
    .up()
    .ele('codigoPorcentaje')
    .txt('0')
    .up()
    .ele('baseImponible')
    .txt(totalSinImpuestos.toFixed(2))
    .up()
    .ele('valor')
    .txt('0.00')
    .up()
    .up()
    .up()
    .ele('propina')
    .txt('0.00')
    .up()
    .ele('importeTotal')
    .txt(totalSinImpuestos.toFixed(2))
    .up()
    .ele('moneda')
    .txt('DOLAR')
    .up()
    .ele('pagos')
    .ele('pago')
    .ele('formaPago')
    .txt(formaPago)
    .up()
    .ele('total')
    .txt(totalSinImpuestos.toFixed(2))
    .up()
    .up()
    .up()
    .up();

  // Detalle de productos facturados.

  const detallesEl = doc.ele('detalles');

  venta.detalles.forEach((detalle) => {
    const precioUnitario =
      detalle.cantidad > 0 ? detalle.subtotal / detalle.cantidad : 0;
    const codigoPrincipal =
      detalle.producto?.codigoBarras ||
      String(detalle.producto?.id || detalle.productoId || 'ITEM');
    const descripcion =
      detalle.producto?.nombre ?? `Producto ${detalle.productoId}`;

    detallesEl
      .ele('detalle')
      .ele('codigoPrincipal')
      .txt(codigoPrincipal)
      .up()
      .ele('codigoAuxiliar')
      .txt(codigoPrincipal)
      .up()
      .ele('descripcion')
      .txt(descripcion)
      .up()
      .ele('cantidad')
      .txt(detalle.cantidad.toString())
      .up()
      .ele('precioUnitario')
      .txt(precioUnitario.toFixed(2))
      .up()
      .ele('descuento')
      .txt('0.00')
      .up()
      .ele('precioTotalSinImpuesto')
      .txt(detalle.subtotal.toFixed(2))
      .up()
      .ele('impuestos')
      .ele('impuesto')
      .ele('codigo')
      .txt('2')
      .up()
      .ele('codigoPorcentaje')
      .txt('0')
      .up()
      .ele('tarifa')
      .txt('0')
      .up()
      .ele('baseImponible')
      .txt(detalle.subtotal.toFixed(2))
      .up()
      .ele('valor')
      .txt('0.00')
      .up()
      .up()
      .up()
      .up();
  });

  const xml = doc.end({ prettyPrint: true });

  return xml;
}
