import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type {
  ClienteMasFrecuente,
  FlujoCaja,
  GananciaDiaria,
  GananciaProducto,
  LibroDiarioItem,
  ProductoMasVendido,
  ResumenPeriodo,
} from '../shared/types/reportes';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
    * Libro diario disponible solo para ADMIN.
   */
  @Get('libro-diario')
    @Roles('ADMIN')
  async getLibroDiario(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<LibroDiarioItem[]> {
    return this.reportesService.getLibroDiario(fechaDesde, fechaHasta);
  }

  /**
    * Resumen de ventas disponible solo para ADMIN.
   */
  @Get('resumen-ventas')
    @Roles('ADMIN')
  async getResumenVentas(
    @Query('periodo') periodo?: 'diario' | 'mensual' | 'anual',
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<ResumenPeriodo[]> {
    return this.reportesService.getResumenVentas(
      periodo,
      fechaDesde,
      fechaHasta,
    );
  }

  /**
    * Resumen de compras disponible solo para ADMIN.
   */
  @Get('resumen-compras')
    @Roles('ADMIN')
  async getResumenCompras(
    @Query('periodo') periodo?: 'diario' | 'mensual' | 'anual',
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<ResumenPeriodo[]> {
    return this.reportesService.getResumenCompras(
      periodo,
      fechaDesde,
      fechaHasta,
    );
  }

  /**
    * Flujo de caja disponible solo para ADMIN.
   */
  @Get('flujo-caja')
    @Roles('ADMIN')
  async getFlujoCaja(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<FlujoCaja> {
    return this.reportesService.getFlujoCaja(fechaDesde, fechaHasta);
  }

  /**
    * Productos mas vendidos disponibles solo para ADMIN.
   */
  @Get('productos-mas-vendidos')
    @Roles('ADMIN')
  async getProductosMasVendidos(
    @Query('limite') limite?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<ProductoMasVendido[]> {
    return this.reportesService.getProductosMasVendidos(
      limite ? Number(limite) : undefined,
      fechaDesde,
      fechaHasta,
    );
  }

  /**
    * Clientes mas frecuentes disponibles solo para ADMIN.
   */
  @Get('clientes-mas-frecuentes')
    @Roles('ADMIN')
  async getClientesMasFrecuentes(
    @Query('limite') limite?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<ClienteMasFrecuente[]> {
    return this.reportesService.getClientesMasFrecuentes(
      limite ? Number(limite) : undefined,
      fechaDesde,
      fechaHasta,
    );
  }

  @Get('ganancia-por-producto')
  @Roles('ADMIN')
  async getGananciaPorProducto(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<GananciaProducto[]> {
    return this.reportesService.getGananciaPorProducto(fechaDesde, fechaHasta);
  }

  @Get('ganancia-diaria')
  @Roles('ADMIN')
  async getGananciaDiaria(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<GananciaDiaria[]> {
    return this.reportesService.getGananciaDiaria(fechaDesde, fechaHasta);
  }

  /**
   * Resumen financiero del dashboard disponible para roles operativos.
   */
  @Get('dashboard-resumen')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  async getDashboardResumen(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ): Promise<FlujoCaja> {
    return this.reportesService.getFlujoCaja(fechaDesde, fechaHasta);
  }
}
