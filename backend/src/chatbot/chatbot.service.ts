import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntentDetectionService } from './services/intent-detection.service';
import { ChatbotMessageDto, ChatbotResponseDto } from './dto/message.dto';
import { Prisma } from '@prisma/client';

type ProductoConProveedor = Prisma.ProductoGetPayload<{
  include: {
    proveedor: true;
  };
}>;

type FioConRelaciones = Prisma.FioGetPayload<{
  include: {
    cliente: true;
    detalles: { include: { producto: true } };
    pagos: true;
  };
}>;

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly intentDetection: IntentDetectionService,
  ) {}

  async procesarMensaje(dto: ChatbotMessageDto): Promise<ChatbotResponseDto> {
    const mensaje = dto.mensaje.trim();

    // Detectar intención
    const intent = this.intentDetection.detectIntent(mensaje);

    let respuesta = '';
    let tipo = intent.tipo;
    let datos: ProductoConProveedor | FioConRelaciones[] | null = null;

    try {
      switch (intent.tipo) {
        case 'SALUDO':
          respuesta = this.intentDetection.getResponseText('SALUDO');
          break;

        case 'AYUDA':
          respuesta = this.intentDetection.getResponseText('AYUDA');
          break;

        case 'PRODUCTO':
        case 'PRECIO':
        case 'STOCK':
          if (intent.parametro) {
            const resultado = await this.buscarProducto(intent.parametro);
            if (resultado) {
              tipo = 'PRODUCTO';
              datos = resultado;
              respuesta = this.generarRespuestaProducto(resultado);
            } else {
              respuesta = `No encontré productos con "${intent.parametro}". Intenta con otro nombre`;
              tipo = 'ERROR';
            }
          } else {
            respuesta = 'Por favor, especifica qué producto buscas';
            tipo = 'ERROR';
          }
          break;

        case 'DEUDA': {
          const deudaResultado = await this.consultarDeudas(intent.parametro);
          if (deudaResultado && deudaResultado.length > 0) {
            tipo = 'DEUDA';
            datos = deudaResultado;
            respuesta = this.generarRespuestaDeudas(deudaResultado);
          } else {
            respuesta = 'No hay deudas registradas en el sistema';
          }
          break;
        }

        case 'DESCONOCIDO':
          respuesta = `No entendí tu pregunta. Puedo ayudarte a buscar: productos, precios, stock o consultar deudas. ¿Qué necesitas?`;
          tipo = 'GENERAL';
          break;

        default:
          respuesta = 'Disculpa, no pude procesar tu solicitud.';
          tipo = 'ERROR';
      }
    } catch {
      respuesta =
        'Ocurrió un error al procesar tu solicitud. Intenta de nuevo.';
      tipo = 'ERROR';
    }

    return {
      respuesta,
      tipo,
      datos,
      timestamp: new Date(),
    };
  }

  private async buscarProducto(
    termino: string,
  ): Promise<ProductoConProveedor | null> {
    if (!termino || termino.length < 2) {
      return null;
    }

    const producto = await this.prisma.producto.findFirst({
      where: {
        OR: [
          {
            nombre: {
              contains: termino,
              mode: 'insensitive',
            },
          },
          {
            codigoBarras: {
              contains: termino,
            },
          },
        ],
      },
      include: {
        proveedor: true,
      },
    });

    return producto;
  }

  private async consultarDeudas(
    nombreCliente?: string,
  ): Promise<FioConRelaciones[]> {
    const where: Prisma.FioWhereInput = {
      estado: { in: ['PENDIENTE', 'PARCIAL'] },
    };

    if (nombreCliente) {
      where.cliente = {
        nombre: { contains: nombreCliente, mode: 'insensitive' },
      };
    }

    const fios = await this.prisma.fio.findMany({
      where,
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true,
          },
        },
        pagos: true,
      },
      orderBy: {
        total: 'desc',
      },
      take: 10,
    });

    return fios;
  }

  private generarRespuestaProducto(producto: ProductoConProveedor): string {
    const baseInfo = `📦 *${producto.nombre}*\n`;

    let detalles = '';

    detalles += `💰 Precio: $${producto.precio.toFixed(2)}\n`;
    detalles += `📊 Stock disponible: ${producto.stock} unidades\n`;

    if (producto.codigoBarras) {
      detalles += `🔍 Código: ${producto.codigoBarras}\n`;
    }

    if (producto.stock < producto.stockMinimo) {
      detalles += `⚠️ ¡Stock bajo! Mínimo: ${producto.stockMinimo}\n`;
    }

    if (producto.proveedor) {
      detalles += `🏢 Proveedor: ${producto.proveedor.nombre}\n`;
    }

    return baseInfo + detalles;
  }

  private generarRespuestaDeudas(fios: FioConRelaciones[]): string {
    if (!fios || fios.length === 0) {
      return 'No hay deudas pendientes';
    }

    let respuesta = `📋 *Deudas Pendientes/Parciales* (${fios.length})\n\n`;

    let totalDeudas = 0;

    for (const fio of fios.slice(0, 5)) {
      const totalPagado = (fio.pagos ?? []).reduce((s, p) => s + p.monto, 0);
      const saldo = fio.total - totalPagado;
      respuesta += `👤 ${fio.cliente.nombre}\n`;
      respuesta += `   Total: $${fio.total.toFixed(2)} | Pagado: $${totalPagado.toFixed(2)} | Saldo: $${saldo.toFixed(2)}\n`;
      respuesta += `   Estado: ${fio.estado} | Fecha: ${new Date(fio.fecha).toLocaleDateString('es-ES')}\n\n`;
      totalDeudas += saldo;
    }

    respuesta += `━━━━━━━━━━━━━━━━━\n`;
    respuesta += `💰 Total deudas mostradas: $${totalDeudas.toFixed(2)}\n`;

    if (fios.length > 5) {
      respuesta += `📌 +${fios.length - 5} deudas más...`;
    }

    return respuesta;
  }

  async obtenerEstadisticas() {
    const [totalProductos, productosBajoStock, totalDeudas, deudaPendiente] =
      await Promise.all([
        this.prisma.producto.count(),
        this.prisma.producto.count({
          where: {
            stock: {
              lte: this.prisma.producto.fields.stockMinimo,
            },
          },
        }),
        this.prisma.fio.count({
          where: {
            estado: 'PENDIENTE',
          },
        }),
        this.prisma.fio.aggregate({
          where: {
            estado: 'PENDIENTE',
          },
          _sum: {
            total: true,
          },
        }),
      ]);

    return {
      totalProductos,
      productosBajoStock,
      deudasPendientes: totalDeudas,
      montoDeudasPendientes: deudaPendiente._sum.total || 0,
    };
  }
}
