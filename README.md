# Sistema de Facturación de Víveres

Sistema web para gestión de ventas, compras, inventario y facturación electrónica, orientado a negocios de víveres.

## Tecnologías

- Backend: NestJS + Prisma ORM
- Frontend: React + Vite + TypeScript
- Base de datos: PostgreSQL (ajustar según entorno)
- Facturación electrónica: Integración con SRI

## Módulos principales

- Autenticación y autorización por roles
- Usuarios
- Clientes
- Proveedores
- Productos
- Ventas
- Compras
- Inventario y Kardex
- Consumo interno
- Fio (cuentas por cobrar)
- Reportes
- Facturación electrónica (SRI)

## Estructura del proyecto

- `backend/`: API, reglas de negocio, Prisma, integraciones SRI.
- `frontend/`: aplicación web administrativa.
- `docs/`: documentación adicional del proyecto.

## Requisitos previos

- Node.js 20+ (recomendado LTS)
- npm 10+
- Base de datos PostgreSQL activa
- Certificado digital válido para SRI (en entornos que lo requieran) .p12

## Instalación

1. Clonar repositorio:
   ```bash
   - git clone https://github.com/Willrik15/Sistema_Facturacion_Viveres.git
   - cd Sistema_Facturacion_Viveres
   
2. Instalar dependencias:
   ```bash
   - cd backend
   - npm install
   - cd ../frontend
   - npm install

3. Configurar variables de entorno:
  - Crear backend/.env a partir de backend/.env.example
  - Crear frontend/.env a partir de frontend/.env.example

4. Configurar base de datos del backend:
  - cd backend
  - npx prisma migrate deploy
  - npx prisma db seed

## Ejecución
  Backend
    - cd backend
    - npm run start:dev

  frontend
    - cd frontend
    - npm run dev

## Scripts Utiles
  Backend
   - npm run start:dev: iniciar API en modo desarrollo
   - npm run build: compilar backend
   - npm run start:prod: ejecutar compilado
   - npm run lint: ejecutar lint
   - npm run test: ejecutar pruebas
  Frontend
   - npm run dev: iniciar frontend en desarrollo
   - npm run build: compilar frontend
   - npm run preview: previsualizar build
   - npm run lint: ejecutar lint

## Variables de Entorno
  Backend
   - DATABASE_URL: cadena de conexión a base de datos
   - JWT_SECRET: clave de firma JWT
   - PORT: puerto del backend
   - Variables SRI/correo según configuración del sistema
  
  Frontend
   - VITE_API_URL: URL base del backend

## Por Seguridad del Sistema
 - No está subido el archivo .env .
 - No está subido certificados ni claves privadas como (.p12, .key, .pem).
 - Se uso secretos diferentes para desarrollo, pruebas y producción.

Este proyecto es software propietario.
Copyright (c) 2026 Erik López. Todos los derechos reservados.
No se permite el uso, copia, modificación ni distribución sin autorización expresa por escrito del autor
