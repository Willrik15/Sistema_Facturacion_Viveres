import { PrismaClient, TipoMovimiento, EstadoVenta, EstadoCompra, RolUsuario, EstadoSRI, EstadoFio } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2) {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]
}

function pickManyUnique<T>(items: T[], count: number): T[] {
  const copy = [...items]
  const result: T[] = []
  const safeCount = Math.min(count, copy.length)

  for (let i = 0; i < safeCount; i += 1) {
    const idx = randomInt(0, copy.length - 1)
    result.push(copy[idx])
    copy.splice(idx, 1)
  }

  return result
}

function formatDateToDdMmYyyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = String(date.getFullYear())
  return `${dd}${mm}${yyyy}`
}

function fakeClaveAcceso(ventaId: number, fecha: Date) {
  const fechaStr = formatDateToDdMmYyyy(fecha)
  const base = `${fechaStr}01${String(1799999999001)}1${String(ventaId).padStart(18, '0')}1`
  return base.slice(0, 49)
}

function fakeNumeroFactura(index: number) {
  return `001-001-${String(index).padStart(9, '0')}`
}

async function main() {
  console.log('Iniciando seed...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const proveedorGeneral = await prisma.proveedor.upsert({
    where: { ruc: '0000000000000' },
    update: {},
    create: {
      nombre: 'PROVEEDOR GENERAL',
      ruc: '0000000000000',
      telefono: '0000000000',
    },
  })

  const proveedores = [
    { nombre: 'Distribuidora La Moderna', ruc: '0500001234567', telefono: '0987654321' },
    { nombre: 'Importadora Ecuador', ruc: '0500002234567', telefono: '0987654322' },
    { nombre: 'Productora Local', ruc: '0500003234567', telefono: '0987654323' },
  ]

  for (const prov of proveedores) {
    await prisma.proveedor.upsert({
      where: { ruc: prov.ruc },
      update: {},
      create: prov,
    })
  }

  await prisma.usuario.upsert({
    where: { email: 'superadmin@viveres.com' },
    update: { password: hashedPassword },
    create: {
      nombre: 'Super',
      apellido: 'Admin',
      email: 'superadmin@viveres.com',
      password: hashedPassword,
      rol: RolUsuario.SUPERADMIN,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'admin@viveres.com' },
    update: { password: hashedPassword },
    create: {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@viveres.com',
      password: hashedPassword,
      rol: RolUsuario.ADMIN,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'vendedor@viveres.com' },
    update: { password: hashedPassword },
    create: {
      nombre: 'Vendedor',
      apellido: 'Uno',
      email: 'vendedor@viveres.com',
      password: hashedPassword,
      rol: RolUsuario.VENDEDOR,
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'bodega@viveres.com' },
    update: { password: hashedPassword },
    create: {
      nombre: 'Bodega',
      apellido: 'Uno',
      email: 'bodega@viveres.com',
      password: hashedPassword,
      rol: RolUsuario.BODEGA,
    },
  })

  console.log('Usuarios base creados')

  const productos = [
    { nombre: 'Arroz 5kg', precio: 12.50, stock: 100, codigo: '7701234567890' },
    { nombre: 'Arroz 10kg', precio: 24.00, stock: 60, codigo: '7701234567891' },
    { nombre: 'Harina 1kg', precio: 3.50, stock: 150, codigo: '7701234567892' },
    { nombre: 'Avena 500g', precio: 4.00, stock: 80, codigo: '7701234567893' },
    { nombre: 'Maíz 5kg', precio: 8.99, stock: 70, codigo: '7701234567894' },
    { nombre: 'Lentejas 1kg', precio: 5.50, stock: 90, codigo: '7701234567895' },
    { nombre: 'Frijoles 1kg', precio: 4.99, stock: 100, codigo: '7701234567896' },
    { nombre: 'Chochos 1kg', precio: 3.99, stock: 50, codigo: '7701234567897' },
    { nombre: 'Garbanzos 1kg', precio: 6.50, stock: 60, codigo: '7701234567898' },
    { nombre: 'Aceite 1L', precio: 8.99, stock: 50, codigo: '7701234567899' },
    { nombre: 'Aceite 5L', precio: 40.00, stock: 25, codigo: '7701234567800' },
    { nombre: 'Mantequilla 250g', precio: 6.99, stock: 40, codigo: '7701234567801' },
    { nombre: 'Margarina 500g', precio: 4.99, stock: 60, codigo: '7701234567802' },
    { nombre: 'Azúcar 1kg', precio: 4.50, stock: 150, codigo: '7701234567803' },
    { nombre: 'Azúcar 5kg', precio: 20.00, stock: 80, codigo: '7701234567804' },
    { nombre: 'Miel 500g', precio: 12.99, stock: 30, codigo: '7701234567805' },
    { nombre: 'Chocolate 100g', precio: 2.99, stock: 100, codigo: '7701234567806' },
    { nombre: 'Café 500g', precio: 7.99, stock: 70, codigo: '7701234567807' },
    { nombre: 'Café 1kg', precio: 14.99, stock: 50, codigo: '7701234567808' },
    { nombre: 'Té 20 sobres', precio: 3.50, stock: 80, codigo: '7701234567809' },
    { nombre: 'Leche 1L', precio: 3.99, stock: 120, codigo: '7701234567810' },
    { nombre: 'Jugo Natural 1L', precio: 2.99, stock: 90, codigo: '7701234567811' },
    { nombre: 'Sal 1kg', precio: 1.50, stock: 200, codigo: '7701234567812' },
    { nombre: 'Comino 100g', precio: 3.99, stock: 50, codigo: '7701234567813' },
    { nombre: 'Pimienta 100g', precio: 4.99, stock: 40, codigo: '7701234567814' },
    { nombre: 'Ajo en polvo 100g', precio: 5.99, stock: 35, codigo: '7701234567815' },
    { nombre: 'Cebolla en polvo 100g', precio: 4.99, stock: 45, codigo: '7701234567816' },
    { nombre: 'Caldo de pollo 1L', precio: 4.99, stock: 60, codigo: '7701234567817' },
    { nombre: 'Sopa instantánea', precio: 1.99, stock: 150, codigo: '7701234567818' },
    { nombre: 'Consomé de pollo', precio: 2.99, stock: 100, codigo: '7701234567819' },
    { nombre: 'Pasta fideos 500g', precio: 2.50, stock: 120, codigo: '7701234567820' },
    { nombre: 'Pasta macarrones 500g', precio: 2.50, stock: 100, codigo: '7701234567821' },
    { nombre: 'Pasta integral 500g', precio: 3.50, stock: 60, codigo: '7701234567822' },
    { nombre: 'Atún enlatado', precio: 3.99, stock: 110, codigo: '7701234567823' },
    { nombre: 'Sardinas', precio: 2.99, stock: 80, codigo: '7701234567824' },
    { nombre: 'Durazno enlatado', precio: 3.50, stock: 70, codigo: '7701234567825' },
    { nombre: 'Piña enlatada', precio: 4.00, stock: 60, codigo: '7701234567826' },
    { nombre: 'Pasas 250g', precio: 5.99, stock: 40, codigo: '7701234567827' },
    { nombre: 'Dátiles 250g', precio: 7.99, stock: 30, codigo: '7701234567828' },
    { nombre: 'Nueces 250g', precio: 8.99, stock: 25, codigo: '7701234567829' },
    { nombre: 'Queso fresco 500g', precio: 8.99, stock: 50, codigo: '7701234567830' },
    { nombre: 'Yogur natural 500ml', precio: 3.99, stock: 80, codigo: '7701234567831' },
    { nombre: 'Crema de leche 200ml', precio: 4.50, stock: 60, codigo: '7701234567832' },
    { nombre: 'Pan integral 500g', precio: 3.99, stock: 100, codigo: '7701234567833' },
    { nombre: 'Galletas integrales 450g', precio: 4.99, stock: 90, codigo: '7701234567834' },
    { nombre: 'Cereal 500g', precio: 6.99, stock: 70, codigo: '7701234567835' },
    { nombre: 'Granola 500g', precio: 7.99, stock: 50, codigo: '7701234567836' },
  ]

  for (const prod of productos) {
    await prisma.producto.upsert({
      where: { codigoBarras: prod.codigo },
      update: {},
      create: {
        nombre: prod.nombre,
        precio: prod.precio,
        stock: prod.stock,
        codigoBarras: prod.codigo,
        stockMinimo: Math.ceil(prod.stock * 0.15),
        proveedorId: proveedorGeneral.id,
      },
    })
  }

  console.log(`${productos.length} productos creados`)

  const clientes = [
    { nombre: 'Juan Pérez', cedula: '1234567890', telefono: '0987654321' },
    { nombre: 'María García', cedula: '1234567891', telefono: '0987654322' },
    { nombre: 'Carlos López', cedula: '1234567892', telefono: '0987654323' },
    { nombre: 'Ana Martínez', cedula: '1234567893', telefono: '0987654324' },
    { nombre: 'Pedro Rodríguez', cedula: '1234567894', telefono: '0987654325' },
  ]

  for (const cliente of clientes) {
    await prisma.cliente.upsert({
      where: { cedula: cliente.cedula },
      update: {},
      create: cliente,
    })
  }

  console.log(`${clientes.length} clientes creados`)

  // Limpiar tablas transaccionales para regenerar data ficticia consistente en cada seed.
  await prisma.detalleConsumo.deleteMany()
  await prisma.consumoInterno.deleteMany()
  await prisma.pagoFio.deleteMany()
  await prisma.detalleFio.deleteMany()
  await prisma.fio.deleteMany()
  await prisma.detalleCompra.deleteMany()
  await prisma.compra.deleteMany()
  await prisma.inventarioMovimiento.deleteMany()
  await prisma.factura.deleteMany()
  await prisma.detalleVenta.deleteMany()
  await prisma.venta.deleteMany()

  const proveedoresDb = await prisma.proveedor.findMany()
  const usuariosDb = await prisma.usuario.findMany()
  const usuariosComerciales = usuariosDb.filter(
    (u) => u.rol === RolUsuario.ADMIN || u.rol === RolUsuario.VENDEDOR,
  )
  const clientesDb = await prisma.cliente.findMany()

  // Reiniciar stock base para que las relaciones de movimientos y ventas sean coherentes.
  const productosDbBase = await prisma.producto.findMany()
  for (const prod of productosDbBase) {
    await prisma.producto.update({
      where: { id: prod.id },
      data: { stock: randomInt(30, 180) },
    })
  }

  // Compras y detalle_compra.
  for (let i = 0; i < 18; i += 1) {
    const proveedor = pickRandom(proveedoresDb)
    const usuario = pickRandom(usuariosDb)
    const compraFecha = new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000)
    const productosDisponibles = await prisma.producto.findMany()
    const items = pickManyUnique(productosDisponibles, randomInt(2, 5))

    let totalCompra = 0
    const detallesCompra: Array<{ productoId: number; cantidad: number; costoUnitario: number; subtotal: number }> = []

    for (const item of items) {
      const cantidad = randomInt(5, 30)
      const costoUnitario = randomFloat(item.precio * 0.55, item.precio * 0.9)
      const subtotal = Number((cantidad * costoUnitario).toFixed(2))
      totalCompra += subtotal

      detallesCompra.push({
        productoId: item.id,
        cantidad,
        costoUnitario,
        subtotal,
      })
    }

    const compra = await prisma.compra.create({
      data: {
        proveedorId: proveedor.id,
        usuarioId: usuario.id,
        fecha: compraFecha,
        total: Number(totalCompra.toFixed(2)),
        estado: EstadoCompra.ACTIVA,
      },
    })

    for (const det of detallesCompra) {
      const productoActual = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!productoActual) continue

      const nuevoStock = productoActual.stock + det.cantidad

      await prisma.detalleCompra.create({
        data: {
          compraId: compra.id,
          productoId: det.productoId,
          cantidad: det.cantidad,
          costoUnitario: det.costoUnitario,
          subtotal: det.subtotal,
        },
      })

      await prisma.producto.update({
        where: { id: det.productoId },
        data: { stock: nuevoStock },
      })

      await prisma.inventarioMovimiento.create({
        data: {
          productoId: det.productoId,
          tipo: TipoMovimiento.ENTRADA,
          cantidad: det.cantidad,
          referencia: `COMPRA-${compra.id}`,
          refId: compra.id,
          fecha: compraFecha,
          saldo: nuevoStock,
        },
      })
    }
  }

  // Ventas, detalle_venta y factura.
  for (let i = 0; i < 28; i += 1) {
    const cliente = pickRandom(clientesDb)
    const usuario = pickRandom(usuariosComerciales)
    const ventaFecha = new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000)
    const productosConStock = (await prisma.producto.findMany()).filter((p) => p.stock > 0)
    const items = pickManyUnique(productosConStock, randomInt(1, 4))

    if (items.length === 0) continue

    const detalles: Array<{ productoId: number; cantidad: number; subtotal: number }> = []
    let totalVenta = 0

    for (const item of items) {
      const productoActual = await prisma.producto.findUnique({ where: { id: item.id } })
      if (!productoActual || productoActual.stock <= 0) continue

      const cantidad = randomInt(1, Math.min(5, productoActual.stock))
      const subtotal = Number((cantidad * productoActual.precio).toFixed(2))
      totalVenta += subtotal

      detalles.push({
        productoId: item.id,
        cantidad,
        subtotal,
      })
    }

    if (detalles.length === 0) continue

    const venta = await prisma.venta.create({
      data: {
        fecha: ventaFecha,
        total: Number(totalVenta.toFixed(2)),
        clienteId: cliente.id,
        usuarioId: usuario.id,
        estado: EstadoVenta.ACTIVA,
      },
    })

    for (const det of detalles) {
      const productoActual = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!productoActual) continue
      const nuevoStock = productoActual.stock - det.cantidad

      await prisma.detalleVenta.create({
        data: {
          ventaId: venta.id,
          productoId: det.productoId,
          cantidad: det.cantidad,
          subtotal: det.subtotal,
        },
      })

      await prisma.producto.update({
        where: { id: det.productoId },
        data: { stock: nuevoStock },
      })

      await prisma.inventarioMovimiento.create({
        data: {
          productoId: det.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: det.cantidad,
          referencia: `VENTA-${venta.id}`,
          refId: venta.id,
          fecha: ventaFecha,
          saldo: nuevoStock,
        },
      })
    }

    await prisma.factura.create({
      data: {
        ventaId: venta.id,
        fecha: ventaFecha,
        claveAcceso: fakeClaveAcceso(venta.id, ventaFecha),
        estadoSRI: EstadoSRI.GENERADA,
        numero: fakeNumeroFactura(venta.id),
        xmlGenerado: '<factura id="comprobante" version="2.1.0"></factura>',
      },
    })
  }

  // Fios, detalle_fio y pagos_fio.
  for (let i = 0; i < 10; i += 1) {
    const cliente = pickRandom(clientesDb)
    const fechaFio = new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000)
    const productosConStock = (await prisma.producto.findMany()).filter((p) => p.stock > 0)
    const items = pickManyUnique(productosConStock, randomInt(1, 3))
    if (items.length === 0) continue

    const detalles: Array<{ productoId: number; cantidad: number; precio: number; subtotal: number }> = []
    let totalFio = 0

    for (const item of items) {
      const actual = await prisma.producto.findUnique({ where: { id: item.id } })
      if (!actual || actual.stock <= 0) continue

      const cantidad = randomInt(1, Math.min(3, actual.stock))
      const subtotal = Number((cantidad * actual.precio).toFixed(2))
      totalFio += subtotal
      detalles.push({
        productoId: item.id,
        cantidad,
        precio: actual.precio,
        subtotal,
      })
    }

    if (detalles.length === 0) continue

    const estado = Math.random() > 0.5 ? EstadoFio.PENDIENTE : EstadoFio.PARCIAL
    const fio = await prisma.fio.create({
      data: {
        fecha: fechaFio,
        total: Number(totalFio.toFixed(2)),
        estado,
        clienteId: cliente.id,
      },
    })

    for (const det of detalles) {
      const productoActual = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!productoActual) continue
      const nuevoStock = productoActual.stock - det.cantidad

      await prisma.detalleFio.create({
        data: {
          fioId: fio.id,
          productoId: det.productoId,
          cantidad: det.cantidad,
          precio: det.precio,
          subtotal: det.subtotal,
        },
      })

      await prisma.producto.update({
        where: { id: det.productoId },
        data: { stock: nuevoStock },
      })

      await prisma.inventarioMovimiento.create({
        data: {
          productoId: det.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: det.cantidad,
          referencia: `FIO-${fio.id}`,
          refId: fio.id,
          fecha: fechaFio,
          saldo: nuevoStock,
        },
      })
    }

    const pagosCount = estado === EstadoFio.PENDIENTE ? randomInt(0, 1) : randomInt(1, 2)
    for (let p = 0; p < pagosCount; p += 1) {
      await prisma.pagoFio.create({
        data: {
          fioId: fio.id,
          fecha: new Date(fechaFio.getTime() + randomInt(1, 15) * 24 * 60 * 60 * 1000),
          monto: Number((totalFio * randomFloat(0.1, 0.4)).toFixed(2)),
        },
      })
    }
  }

  // Consumo interno y detalle_consumo.
  const motivos = ['Merma por caducidad', 'Consumo del personal', 'Producto dañado', 'Muestra interna']
  for (let i = 0; i < 14; i += 1) {
    const usuario = pickRandom(usuariosDb)
    const fechaConsumo = new Date(Date.now() - randomInt(1, 40) * 24 * 60 * 60 * 1000)
    const consumo = await prisma.consumoInterno.create({
      data: {
        fecha: fechaConsumo,
        motivo: pickRandom(motivos),
        usuarioId: usuario.id,
      },
    })

    const productosConStock = (await prisma.producto.findMany()).filter((p) => p.stock > 0)
    const items = pickManyUnique(productosConStock, randomInt(1, 3))

    for (const item of items) {
      const actual = await prisma.producto.findUnique({ where: { id: item.id } })
      if (!actual || actual.stock <= 0) continue

      const cantidad = randomInt(1, Math.min(3, actual.stock))
      const nuevoStock = actual.stock - cantidad

      await prisma.detalleConsumo.create({
        data: {
          consumoId: consumo.id,
          productoId: item.id,
          cantidad,
        },
      })

      await prisma.producto.update({
        where: { id: item.id },
        data: { stock: nuevoStock },
      })

      await prisma.inventarioMovimiento.create({
        data: {
          productoId: item.id,
          tipo: TipoMovimiento.SALIDA,
          cantidad,
          referencia: `CONSUMO-${consumo.id}`,
          refId: consumo.id,
          fecha: fechaConsumo,
          saldo: nuevoStock,
        },
      })
    }
  }

  const conteos = {
    usuarios: await prisma.usuario.count(),
    clientes: await prisma.cliente.count(),
    proveedores: await prisma.proveedor.count(),
    productos: await prisma.producto.count(),
    compras: await prisma.compra.count(),
    detalleCompra: await prisma.detalleCompra.count(),
    ventas: await prisma.venta.count(),
    detalleVenta: await prisma.detalleVenta.count(),
    facturas: await prisma.factura.count(),
    inventarioMovimientos: await prisma.inventarioMovimiento.count(),
    fios: await prisma.fio.count(),
    detalleFio: await prisma.detalleFio.count(),
    pagosFio: await prisma.pagoFio.count(),
    consumosInternos: await prisma.consumoInterno.count(),
    detalleConsumo: await prisma.detalleConsumo.count(),
  }

  console.table(conteos)

  console.log('Seed completado correctamente')
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })