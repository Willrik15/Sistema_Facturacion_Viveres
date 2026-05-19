import { useRef } from 'react'
import { Printer, Download, X } from 'lucide-react'
import type { Venta } from '@/services/venta'

interface FacturaViewerProps {
  venta: Venta
  onClose?: () => void
}

const IVA_RATE = 0

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function maskClave(clave: string) {
  if (!clave || clave.length <= 8) return clave
  return clave.slice(0, 8) + '...'
}

export function FacturaViewer({ venta, onClose }: FacturaViewerProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const subtotal = venta.total / (1 + IVA_RATE)
  const iva = venta.total - subtotal
  const factura = venta.factura

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank', 'width=420,height=700')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Factura ${factura?.numero ?? ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px; }
          .grand-total { font-size: 15px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { border-bottom: 1px solid #000; padding: 3px 2px; text-align: left; }
          th.right, td.right { text-align: right; }
          td { padding: 3px 2px; vertical-align: top; }
          tr:nth-child(even) td { background: #f5f5f5; }
          .footer { text-align: center; margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 400)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg">Factura generada</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Printer size={15} /> Imprimir
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── Ticket ── */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div
            ref={printRef}
            style={{ fontFamily: "'Courier New', monospace", fontSize: 13 }}
            className="text-black bg-white"
          >
            {/* Encabezado empresa */}
            <div className="center bold" style={{ fontSize: 15 }}>
              {import.meta.env.VITE_EMPRESA_NOMBRE ?? 'VÍVERES LUPITA'}
            </div>
            <div className="center" style={{ fontSize: 12 }}>
              RUC: {import.meta.env.VITE_EMPRESA_RUC ?? '0400672887001'}
            </div>
            <div className="center" style={{ fontSize: 11 }}>
              {import.meta.env.VITE_EMPRESA_DIRECCION ?? 'San Gabriel - Carchi'}
            </div>
            <div className="center" style={{ fontSize: 11 }}>
              Tel: {import.meta.env.VITE_EMPRESA_TELEFONO ?? ''}
            </div>

            <Dashed />

            {/* Info factura */}
            <Row label="FACTURA N°:" value={factura?.numero ?? '---'} bold />
            <div style={{ fontSize: 10, marginBottom: 2 }}>
              <span className="bold">CLAVE DE ACCESO:</span>
              <br />
              <span style={{ wordBreak: 'break-all', fontSize: 9 }}>
                {factura?.claveAcceso ?? '---'}
              </span>
            </div>
            <Row label="Fecha:" value={formatDate(venta.fecha)} />
            <Row label="Estado SRI:" value={factura?.estadoSRI ?? 'GENERADA'} />

            <Dashed />

            {/* Cliente */}
            <div className="bold" style={{ marginBottom: 3 }}>DATOS DEL CLIENTE</div>
            <Row label="Cliente:" value={venta.cliente?.nombre ?? '---'} />
            <Row label="CI / RUC:" value={venta.cliente?.cedula ?? '---'} />
            {venta.cliente?.direccion && (
              <Row label="Dirección:" value={venta.cliente.direccion} />
            )}
            {venta.cliente?.email && (
              <Row label="Email:" value={venta.cliente.email} />
            )}

            <Dashed />

            {/* Tabla productos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #000', padding: '2px 1px', textAlign: 'left' }}>CANT</th>
                  <th style={{ borderBottom: '1px solid #000', padding: '2px 1px', textAlign: 'left' }}>DESCRIPCIÓN</th>
                  <th style={{ borderBottom: '1px solid #000', padding: '2px 1px', textAlign: 'right' }}>P.U.</th>
                  <th style={{ borderBottom: '1px solid #000', padding: '2px 1px', textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(venta.detalles ?? []).map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '2px 1px', verticalAlign: 'top' }}>{d.cantidad}</td>
                    <td style={{ padding: '2px 1px', verticalAlign: 'top' }}>{d.producto.nombre}</td>
                    <td style={{ padding: '2px 1px', textAlign: 'right', verticalAlign: 'top' }}>
                      ${d.producto.precio.toFixed(2)}
                    </td>
                    <td style={{ padding: '2px 1px', textAlign: 'right', verticalAlign: 'top' }}>
                      ${d.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Dashed />

            {/* Totales */}
            <Row label="Subtotal:" value={`$${subtotal.toFixed(2)}`} />
            <Row label="IVA (0%):" value={`$${iva.toFixed(2)}`} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: 15,
                borderTop: '2px solid #000',
                paddingTop: 4,
                marginTop: 4,
              }}
            >
              <span>TOTAL:</span>
              <span>${venta.total.toFixed(2)}</span>
            </div>

            <Dashed />

            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11 }}>
              ¡Gracias por su compra!
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 2 }}>
              Documento generado electrónicamente
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── helpers de layout ──────────────────────────────────────────────────────
function Dashed() {
  return (
    <div
      style={{
        borderTop: '1px dashed #000',
        margin: '6px 0',
      }}
    />
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2,
        fontWeight: bold ? 'bold' : 'normal',
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      <span style={{ textAlign: 'right', maxWidth: '65%', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}
