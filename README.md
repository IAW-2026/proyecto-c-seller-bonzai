# Bonzai — Seller Dashboard

**Deploy**: [https://proyecto-c-seller-bonzai.vercel.app](https://proyecto-c-seller-bonzai.vercel.app)

---

## Usuarios de prueba

| Email | Rol |
|---|---|
| `seller+clerktest@iaw.com` | Vendedor estándar |
| `seller_admin+clerktest@iaw.com` | Administrador |
| `seller_2+clerktest@iaw.com` | Segundo vendedor |

Contraseña de todos los usuarios: `iawuser#`

---

## Instrucciones de uso

1. Ingresar con cualquier usuario vendedor en `/sign-in`.
2. Si es la primera vez que ingresa, activar el rol en `/activate-seller`. Los administradores deben aprobar al vendedor desde `/dashboard/admin/sellers` (el usuario `seller_admin+clerktest@iaw.com` ya tiene permisos para aprobar).
3. Explorar el dashboard en `/dashboard`: tarjetas de estadísticas, órdenes recientes, gráficos de ingresos.
4. Gestionar productos en `/dashboard/inventory`: crear, editar, suspender, eliminar (lógica).
5. Gestionar órdenes en `/dashboard/orders`: filtrar por estado/fecha, enviar pedido (Ship), cancelar.
6. El usuario admin puede acceder a `/dashboard/admin/*` para gestionar vendedores, productos y reseñas.
7. Enviar reseña como vendedor en `/dashboard` (formulario en la página principal).
8. Chatear con Leafy (asistente IA) usando el botón flotante — solo en español, sobre plantas y ventas.

---

## Descripción del proyecto

Bonzai es un marketplace multi-vendedor de plantas, compuesto por cuatro aplicaciones independientes: Seller Dashboard (esta app, backend + panel vendedor/admin), Buyer App (frontend de compras externo), Payments App (procesamiento de pagos) y Shipping App (gestión de envíos). La aplicación vendedora expone una API REST que es consumida por las otras apps mediante una service key compartida (`x-service-key`).

El dashboard permite a los vendedores gestionar su catálogo de productos y sus órdenes. El flujo de compra completo incluye: reserva de stock con vencimiento a 15 minutos, creación de órdenes multi-vendedor agrupadas bajo un Purchase, confirmación de pago batch, envío con notificación a una Shipping App externa y seguimiento con tracking ID. La seguridad implementa defensa en profundidad con guardas atómicas a nivel de ruta, servicio y repositorio.

El frontend está desarrollado con Next.js 16 App Router, la base de datos es PostgreSQL en Neon con Prisma ORM, la autenticación usa Clerk, los emails se envían con Resend, el chat IA usa Google Gemini, y las imágenes se almacenan en Cloudinary. El deploy es en Vercel.

---

## Notas para la corrección

- **Endpoint de tracking**: `POST /api/orders/[id]/tracking` recibe `{ "trackingId": "..." }` con header `x-service-key`. Transiciona la orden de `AWAITING_TRACKING` a `SHIPPED`.
- **Confirmación de pago**: `POST /api/payments/confirm` acepta múltiples `orderIds` en batch. Crea un Purchase que las agrupa y las marca como PAID.
- **Cancelación de orden**: `DELETE /api/orders/[id]` — solo si está PENDING o PAID. Restaura el stock atómicamente.
- **Reseñas**: una por vendedor (`@unique` + verificación en servicio). Rating 1–5, máximo 500 caracteres.
- **Color de advertencia**: `#8B7355` (olive) usado para cancelación, suspensión y advertencias.
- **Shipping App**: al hacer Ship, el dashboard notifica a la Shipping App externa vía `POST /api/shipping/dispatch` (fire-and-forget). La Shipping App debe llamar de vuelta a `POST /api/orders/[id]/tracking` con el tracking ID. Esta integración está en etapa intermedia — el dispatch se envía correctamente, pero el callback completo entre todas las apps se terminará de integrar en una tercera etapa.
- **Exclusión de responsabilidad**: esta aplicación no implementa un frontend de compras ni de pagos. Es únicamente el panel del vendedor y la API que consumen las otras apps.

Para documentación más detallada (arquitectura multi-app, flujo multi-vendedor, referencia completa de la API, decisiones de diseño) ver [DOCS.md](./DOCS.md).

---

## Stack técnico

Next.js 16, Prisma ORM, PostgreSQL (Neon), Clerk, Resend, Google Gemini, Cloudinary, Recharts, Lucide React, Zod.
