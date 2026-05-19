import { Test } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type {
  LibroDiarioItem,
  ResumenPeriodo,
  FlujoCaja,
  ProductoMasVendido,
  ClienteMasFrecuente,
} from '../shared/types/reportes';

describe('ReportesController integration', () => {
  let app: INestApplication;

  type RequestWithUser = {
    user?: {
      id: number;
      rol: string;
    };
  };

  const mockLibroDiario: LibroDiarioItem[] = [
    {
      fecha: '2026-04-01',
      referencia: 'VENTA-1',
      descripcion: 'Venta de prueba',
      tipo: 'INGRESO',
      monto: 10,
      saldo_acumulado: 10,
    },
  ];

  const mockResumenVentas: ResumenPeriodo[] = [
    {
      periodo: 'Total',
      totalIngresos: 200,
      totalEgresos: 0,
      neto: 200,
      transacciones: 2,
    },
  ];

  const mockResumenCompras: ResumenPeriodo[] = [
    {
      periodo: 'Total',
      totalIngresos: 0,
      totalEgresos: 80,
      neto: -80,
      transacciones: 1,
    },
  ];

  const mockFlujoCaja: FlujoCaja = {
    periodo: '2026-04-01 a 2026-04-30',
    ingresos: 200,
    egresos: 80,
    neto: 120,
    margen: 60,
  };

  const mockProductos: ProductoMasVendido[] = [
    {
      id: 1,
      nombre: 'Arroz',
      cantidadVendida: 20,
      ingresoTotal: 100,
      porcentaje: 50,
    },
  ];

  const mockClientes: ClienteMasFrecuente[] = [
    {
      id: 1,
      nombre: 'Cliente Frecuente',
      transacciones: 3,
      totalComprado: 150,
      porcentaje: 75,
    },
  ];

  const servicioReportesMock = {
    getLibroDiario: jest
      .fn<
        (fechaDesde?: string, fechaHasta?: string) => Promise<LibroDiarioItem[]>
      >()
      .mockResolvedValue(mockLibroDiario),
    getResumenVentas: jest
      .fn<
        (
          periodo?: 'diario' | 'mensual' | 'anual',
          fechaDesde?: string,
          fechaHasta?: string,
        ) => Promise<ResumenPeriodo[]>
      >()
      .mockResolvedValue(mockResumenVentas),
    getResumenCompras: jest
      .fn<
        (
          periodo?: 'diario' | 'mensual' | 'anual',
          fechaDesde?: string,
          fechaHasta?: string,
        ) => Promise<ResumenPeriodo[]>
      >()
      .mockResolvedValue(mockResumenCompras),
    getFlujoCaja: jest
      .fn<(fechaDesde?: string, fechaHasta?: string) => Promise<FlujoCaja>>()
      .mockResolvedValue(mockFlujoCaja),
    getProductosMasVendidos: jest
      .fn<
        (
          limite?: number,
          fechaDesde?: string,
          fechaHasta?: string,
        ) => Promise<ProductoMasVendido[]>
      >()
      .mockResolvedValue(mockProductos),
    getClientesMasFrecuentes: jest
      .fn<
        (
          limite?: number,
          fechaDesde?: string,
          fechaHasta?: string,
        ) => Promise<ClienteMasFrecuente[]>
      >()
      .mockResolvedValue(mockClientes),
  };

  const guardJwtMock: CanActivate = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = { id: 1, rol: 'ADMIN' };
      return true;
    },
  };

  const guardRolesMock: CanActivate = {
    canActivate: () => true,
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        {
          provide: ReportesService,
          useValue: servicioReportesMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guardJwtMock)
      .overrideGuard(RolesGuard)
      .useValue(guardRolesMock)
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /reportes/resumen-ventas returns summary list', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/reportes/resumen-ventas')
      .expect(200);

    expect(servicioReportesMock.getResumenVentas).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(response.body).toEqual(mockResumenVentas);
  });

  it('GET /reportes/flujo-caja returns cashflow payload', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/reportes/flujo-caja')
      .expect(200);

    expect(servicioReportesMock.getFlujoCaja).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(response.body).toEqual(mockFlujoCaja);
  });

  it('GET /reportes/resumen-ventas forwards periodo and date filters', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .get('/reportes/resumen-ventas')
      .query({
        periodo: 'mensual',
        fechaDesde: '2026-04-01',
        fechaHasta: '2026-04-30',
      })
      .expect(200);

    expect(servicioReportesMock.getResumenVentas).toHaveBeenCalledWith(
      'mensual',
      '2026-04-01',
      '2026-04-30',
    );
  });

  it('GET /reportes/flujo-caja forwards date filters', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .get('/reportes/flujo-caja')
      .query({ fechaDesde: '2026-04-01', fechaHasta: '2026-04-30' })
      .expect(200);

    expect(servicioReportesMock.getFlujoCaja).toHaveBeenCalledWith(
      '2026-04-01',
      '2026-04-30',
    );
  });
});
