import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

export interface FacturaEmailData {
  clienteEmail: string;
  clienteNombre: string;
  numeroFactura: string;
  fecha: Date;
  total: number;
  detalles: Array<{
    producto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: process.env.MAIL_FROM,
      pass: process.env.MAIL_PASS,
    },
  } as nodemailer.TransportOptions);

  private generarPDF(data: FacturaEmailData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer | Uint8Array | string) => {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(0, 0, doc.page.width, 80).fill('#16a34a');
      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('VIVERES LUPITA', 50, 25);
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#bbf7d0')
        .text('Factura de Venta', 50, 52);

      doc.fillColor('#111827').fontSize(10).font('Helvetica');
      doc.moveDown(4);

      const y1 = 105;
      doc.font('Helvetica-Bold').text('N° Factura:', 50, y1);
      doc.font('Helvetica').text(data.numeroFactura, 140, y1);
      doc.font('Helvetica-Bold').text('Fecha:', 320, y1);
      doc.font('Helvetica').text(
        new Date(data.fecha).toLocaleDateString('es-EC', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        380,
        y1,
      );

      doc.font('Helvetica-Bold').text('Cliente:', 50, y1 + 20);
      doc.font('Helvetica').text(data.clienteNombre, 140, y1 + 20);

      doc
        .moveTo(50, y1 + 50)
        .lineTo(545, y1 + 50)
        .strokeColor('#e5e7eb')
        .stroke();

      const yTable = y1 + 60;
      doc.rect(50, yTable, 495, 22).fill('#f3f4f6');
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
      doc.text('Producto', 55, yTable + 6);
      doc.text('Cant.', 310, yTable + 6, { width: 50, align: 'right' });
      doc.text('P. Unit.', 370, yTable + 6, { width: 70, align: 'right' });
      doc.text('Subtotal', 450, yTable + 6, { width: 90, align: 'right' });

      let yRow = yTable + 22;
      data.detalles.forEach((d, i) => {
        if (i % 2 === 0) doc.rect(50, yRow, 495, 20).fill('#fafafa');
        doc.fillColor('#111827').fontSize(9).font('Helvetica');
        doc.text(d.producto, 55, yRow + 5, { width: 250 });
        doc.text(String(d.cantidad), 310, yRow + 5, {
          width: 50,
          align: 'right',
        });
        doc.text(`$${d.precio.toFixed(2)}`, 370, yRow + 5, {
          width: 70,
          align: 'right',
        });
        doc.text(`$${d.subtotal.toFixed(2)}`, 450, yRow + 5, {
          width: 90,
          align: 'right',
        });
        doc
          .moveTo(50, yRow + 20)
          .lineTo(545, yRow + 20)
          .strokeColor('#e5e7eb')
          .stroke();
        yRow += 20;
      });

      doc.rect(370, yRow + 5, 175, 28).fill('#f0fdf4');
      doc.fillColor('#15803d').fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 375, yRow + 12);
      doc.text(`$${data.total.toFixed(2)}`, 430, yRow + 12, {
        width: 110,
        align: 'right',
      });

      doc.fillColor('#9ca3af').fontSize(8).font('Helvetica');
      doc.text(
        'Este documento fue generado automaticamente por el sistema de facturacion de Viveres Lupita.',
        50,
        doc.page.height - 50,
        { align: 'center', width: 495 },
      );

      doc.end();
    });
  }

  async enviarFactura(data: FacturaEmailData): Promise<void> {
    if (!process.env.MAIL_FROM || !process.env.MAIL_PASS) {
      this.logger.warn(
        'MAIL_FROM o MAIL_PASS no configurados - correo omitido',
      );
      return;
    }

    try {
      const pdfBuffer = await this.generarPDF(data);

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#16a34a;padding:20px 32px;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">VIVERES LUPITA</h1>
            <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px;">Factura de Venta</p>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p style="color:#374151;">Estimado/a <strong>${data.clienteNombre}</strong>,</p>
            <p style="color:#374151;">Adjunto encontrara su factura <strong>${data.numeroFactura}</strong> en formato PDF.</p>
            <p style="color:#374151;font-size:18px;font-weight:bold;color:#15803d;">Total: $${data.total.toFixed(2)}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
            <p style="color:#9ca3af;font-size:12px;">Este correo fue generado automaticamente. No responder.</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"Viveres Lupita" <${process.env.MAIL_FROM}>`,
        to: data.clienteEmail,
        subject: `Factura ${data.numeroFactura} - Viveres Lupita`,
        html,
        attachments: [
          {
            filename: `factura-${data.numeroFactura}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      this.logger.log(
        `Factura ${data.numeroFactura} enviada a ${data.clienteEmail}`,
      );
    } catch (err) {
      this.logger.error(`Error enviando correo a ${data.clienteEmail}: ${err}`);
    }
  }

  async enviarRecuperacionPassword(
    email: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    if (!process.env.MAIL_FROM || !process.env.MAIL_PASS) {
      this.logger.warn(
        'MAIL_FROM o MAIL_PASS no configurados - correo omitido',
      );
      return;
    }

    const frontendBase =
      (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')[0]
        ?.trim() || 'http://localhost:5173';

    const resetUrl = `${frontendBase}/login?resetToken=${token}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2563eb;padding:20px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Recuperación de contraseña</h1>
          <p style="color:#dbeafe;margin:4px 0 0;font-size:13px;">Viveres Lupita</p>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="color:#374151;">Hola <strong>${nombre}</strong>,</p>
          <p style="color:#374151;">Recibimos una solicitud para restablecer tu contraseña.</p>
          <p style="color:#374151;">Puedes hacerlo desde este enlace:</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;">Si el botón no funciona, copia y pega esta URL:</p>
          <p style="color:#2563eb;font-size:12px;word-break:break-all;">${resetUrl}</p>
          <p style="color:#9ca3af;font-size:12px;">Este enlace expira en 30 minutos.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Viveres Lupita" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: 'Recuperación de contraseña - Viveres Lupita',
      html,
    });
  }
}
