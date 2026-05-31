# Bonzai — Seller Dashboard

Aplicación **vendedora** de un marketplace multi-vendedor de plantas. Los vendedores gestionan productos, órdenes e inventario. La API es consumida por una Buyer App (tienda externa), una Payments App y una Shipping App.

---

## Arquitectura

```
Buyer App ──x-service-key──> Seller API
Payments App ──x-service-key──> Seller API
Shipping App <── link de tracking ── Seller Dashboard

Vendedor (navegador) ──Clerk auth──> Dashboard UI ──> API
Admin (navegador) ──Clerk auth──> Admin UI ──> API
```

Desarrollada con **Next.js 16 (App Router)**, **Prisma ORM**, **PostgreSQL (Neon)**, **Clerk** para autenticación, **Resend** para emails, **Google Gemini** para chat IA, **Cloudinary** para imágenes, **Recharts** para gráficos, **Lucide React** para íconos, **Zod** para validación, y desplegada en **Vercel**.

---

## Autenticación y Autorización

Tres niveles de acceso:

**Service key** — Header `x-service-key` debe coincidir con la variable de entorno `SERVICE_API_KEY`. Usado por Buyer App, Payments App y tareas programadas (cron). No requiere sesión de Clerk.

**Vendedor** — Sesión de Clerk obligatoria. El usuario debe tener un `SellerProfile` activo y aprobado vinculado a su cuenta de Clerk. Se crea mediante `POST /api/user/activate-role` y es aprobado por un administrador.

**Admin** — Sesión de Clerk obligatoria. El usuario debe tener el rol `seller_admin` o `super_admin` en los metadatos públicos de Clerk.

Funciones auxiliares en `src/lib/auth-helpers.ts`:
- `getSellerId()` — devuelve el ID del perfil del vendedor autenticado o lanza un error
- `requireAdmin()` — verifica el rol de administrador o lanza un error
- `verifyProductOwnership(id)` — verifica que el producto pertenezca al vendedor autenticado

---

## Estructura de la base de datos

### Ciclo de vida de una orden
`PENDING` → `PAID` → `AWAITING_TRACKING` → `SHIPPED` — cualquier estado puede ir a `CANCELLED`

### Ciclo de vida de una reserva
`ACTIVE` (15 min) → `COMPLETED` (se creó la orden) / `CANCELLED` (manual) / `EXPIRED` (cron)

### Modelos principales

| Modelo | Propósito |
|---|---|
| **SellerProfile** | Vincula el usuario de Clerk con los datos del vendedor |
| **Product** | Producto del catálogo, cada uno pertenece a un vendedor |
| **Category** | Categorías de productos |
| **Reservation** | Reserva temporal de stock (15 min) cuando el comprador agrega al carrito |
| **Order** | Orden de compra, siempre vinculada a exactamente un vendedor |
| **OrderItem** | Líneas de detalle dentro de una orden |
| **Purchase** | Agrupa múltiples órdenes (una por vendedor) bajo un solo pago |
| **SellerReview** | Reseña del vendedor sobre la plataforma (una por vendedor) |

Todas las tablas tienen índices en `buyerId`, `sellerId`, `status` y `productId`.

---

## Flujo de compra completo (Paso a paso)

### 1. El comprador navega productos (público)
`GET /api/products/browse?page=1&limit=10`

Devuelve productos activos, no suspendidos, moderados como ACTIVE, de vendedores aprobados y no suspendidos. Paginado con `{ products, total, page, limit }`.

### 2. El comprador reserva stock (Buyer App → Seller API)
`POST /api/reservations/bulk`
```json
{
  "buyerId": "clerk-123",
  "orderId": "cart-abc",
  "items": [{ "productId": "...", "quantity": 2, "sellerId": "..." }]
}
```

Valida cada producto: existe, está activo, no suspendido, vendedor no suspendido, stock suficiente. Descuenta el stock **atómicamente** (`where: { stock: { gte: quantity } }` — evita condiciones de carrera donde dos compras simultáneas vendan la misma unidad). Crea las reservas con vencimiento a 15 minutos. Devuelve los IDs de las reservas creadas.

### 3. Se crean las órdenes (Buyer App → Seller API)
`POST /api/orders/new`
```json
{
  "orderId": "cart-abc",
  "buyerId": "clerk-123",
  "reservationIds": ["res-1", "res-2"],
  "shippingName": "...",
  "shippingLastName": "...",
  "shippingAddress": "...",
  "shippingCity": "...",
  "shippingProvince": "...",
  "shippingZip": "..."
}
```

El sistema agrupa las reservas por `sellerId` y crea **una Orden por vendedor**. Cada orden se crea con estado `PENDING`, incluye los OrderItems y los datos de envío. Las reservas se consumen (`ACTIVE` → `COMPLETED`). Se envía un email de notificación a cada vendedor mediante Resend (no bloqueante — si falla el email, la orden igual se crea). Devuelve el array de IDs de órdenes creadas.

**Importante**: todavía no se crea el Purchase. El Purchase se crea recién cuando se confirma el pago.

### 4. Se confirma el pago (Payments App → Seller API)
`POST /api/payments/confirm`
```json
{
  "buyerId": "clerk-123",
  "orderIds": ["order-1", "order-2"],
  "transactionId": "pay-txn-456"
}
```

Valida todas las órdenes: deben existir, pertenecer al comprador, estar en estado `PENDING`, no pagadas, no canceladas. Crea un solo **Purchase** que agrupa todas las órdenes bajo un mismo pago. Marca todas las órdenes como `PAID`, asignándoles el `purchaseId` y el `transactionId`. El `transactionId` es la referencia de pago que viene de la Payments App.

### 5. El vendedor envía el pedido
`PATCH /api/orders/[id]` con `{ "action": "ship" }`

Solo el vendedor dueño de la orden puede enviar. Valida que la orden esté en estado `PAID`. Transiciona a `AWAITING_TRACKING`.

### 6. Se envía el número de seguimiento (Buyer App → Seller API)
`POST /api/orders/[id]/tracking` con `{ "trackingId": "ship-789" }`

Valida que la orden esté en `AWAITING_TRACKING`. Transiciona a `SHIPPED` y guarda el tracking ID.

### 7. El comprador ve el seguimiento
En la Buyer App, el `trackingId` se muestra como un enlace clickeable:
```
https://proyecto-c-shipping-bonzai.vercel.app/shipping/{trackingId}
```

### 8. Cancelar una orden
`DELETE /api/orders/[id]`

Solo se puede cancelar si el estado es `PENDING` o `PAID`. Restaura el stock de todos los productos de la orden. Transiciona a `CANCELLED`. Accesible mediante service key (con razón opcional) o por el vendedor dueño de la orden.

---

## Referencia de la API

### Público (sin autenticación)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | Lista todas las categorías |
| GET | `/api/products/browse?page=&limit=` | Catálogo público de productos (paginado) |
| GET | `/api/reviews?page=&limit=` | Reseñas de vendedores (paginado) |
| POST | `/api/chat` | Chat con Leafy (asistente IA, solo español y plantas) |
| POST | `/api/auth/check-email` | Verifica si un email existe en Clerk con roles |

### Service key (`x-service-key`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/orders/my?buyerId=` | Órdenes de un comprador |
| GET | `/api/purchases?buyerId=` | Historial de compras (Purchase con órdenes) |
| POST | `/api/orders/new` | Crea órdenes desde reservas |
| POST | `/api/orders/[id]/tracking` | Envía número de seguimiento (→ SHIPPED) |
| POST | `/api/payments/confirm` | Confirma pago batch de múltiples órdenes |
| POST | `/api/reservations` | Crea una reserva individual |
| POST | `/api/reservations/bulk` | Crea múltiples reservas atómicamente |
| POST | `/api/cron/release-reservations` | Libera todas las reservas expiradas |

### Service key O auth de vendedor

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/orders/[id]` | Detalle de una orden con sus items |
| DELETE | `/api/orders/[id]` | Cancela una orden (restaura stock) |
| DELETE | `/api/reservations/[id]` | Cancela una reserva (restaura stock) |

### Vendedor autenticado (sesión Clerk)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/products` | Lista mis productos |
| POST | `/api/products` | Crea un producto |
| PATCH | `/api/products/[id]` | Actualiza un producto |
| DELETE | `/api/products/[id]` | Elimina lógicamente un producto (isActive = false) |
| PUT | `/api/products/[id]/status` | Suspende o reactiva un producto |
| PATCH | `/api/orders/[id]` | Marca orden como enviada (PAID → AWAITING_TRACKING) |
| GET | `/api/statistics` | Estadísticas de mi dashboard |
| POST | `/api/reviews` | Envía una reseña |
| GET | `/api/reviews/mine` | Obtiene mi reseña existente |
| POST | `/api/upload` | Sube imagen a Cloudinary |

### Admin (`seller_admin` o `super_admin`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/admin/orders` | Todas las órdenes con búsqueda, filtros, paginación |
| GET | `/api/admin/products` | Todos los productos con búsqueda |
| DELETE | `/api/admin/products/[id]` | Desactiva cualquier producto |
| PATCH | `/api/admin/products/[id]/status` | Modera un producto (marcar inapropiado) |
| GET | `/api/admin/sellers` | Lista todos los vendedores |
| POST | `/api/admin/sellers/[id]/approve` | Aprueba un vendedor |
| POST | `/api/admin/sellers/[id]/suspend` | Suspende un vendedor |
| POST | `/api/admin/sellers/[id]/unsuspend` | Reactiva un vendedor suspendido |
| GET | `/api/admin/statistics` | Estadísticas globales de la plataforma |

### Otros

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| POST | `/api/user/activate-role` | Sesión Clerk | Activa el rol de vendedor para el usuario actual |
| POST | `/api/webhooks/clerk` | Svix | Sincroniza email en user.updated; limpia en user.deleted |

---

## Páginas del Frontend

| Ruta | Página |
|---|---|
| `/` | Landing page |
| `/sign-in` / `/sign-up` | Páginas de autenticación Clerk |
| `/reviews` | Reseñas públicas de vendedores |
| `/activate-seller` | Auto-activación de rol vendedor |
| `/dashboard` | Dashboard del vendedor (tarjetas, gráficos, órdenes recientes) |
| `/dashboard/inventory` | Lista de productos con vista previa, editar, suspender, eliminar |
| `/dashboard/inventory/new` | Crear producto |
| `/dashboard/inventory/[id]/edit` | Editar producto |
| `/dashboard/orders` | Órdenes con filtros, botones de enviar/cancelar, link de tracking |
| `/dashboard/reservations` | Reservas activas |
| `/dashboard/statistics` | Gráficos de ingresos, categorías, tendencias |
| `/dashboard/admin/sellers` | Admin — gestionar vendedores |
| `/dashboard/admin/products` | Admin — gestionar productos |
| `/dashboard/admin/orders` | Admin — todas las órdenes |
| `/dashboard/admin/statistics` | Admin — estadísticas globales |
| `/dashboard/admin/reviews` | Admin — gestionar reseñas |

---

## Seguridad

### Defensa en profundidad
Cada transición de estado se valida en **tres niveles**:

```
Ruta (HTTP + permisos)
  → Servicio (lógica de negocio)
    → Repositorio (guarda a nivel de base de datos)
```

Por ejemplo, cancelar una orden verifica estado PENDING/PAID en la ruta, en el servicio y en el repositorio (evita doble restauración de stock).

### Guardas atómicas
- **Descuento de stock**: `where: { id, stock: { gte: quantity } }` — falla atómicamente si no hay stock, previene condiciones de carrera
- **Enviar pedido**: `where: { status: PAID }` — evita enviar órdenes no pagadas
- **Ingresar tracking**: `where: { status: AWAITING_TRACKING }` — evita doble envío
- **Confirmar pago**: verifica cada orden: existe, pertenece al comprador, está PENDING, no cancelada, no ya pagada
- **Reseña duplicada**: restricción `@unique` en `sellerId` + verificación en servicio → 409 si ya existe

### Manejo de errores
Todos los bloques catch registran el error mediante `console.error("[tag]", err)` antes de devolver la respuesta de error. Todas las respuestas de error incluyen tanto un código `error` como una descripción `message`.

---

## Decisiones de diseño 

- **El Purchase se crea al confirmar el pago**, no al hacer checkout. En un carrito multi-vendedor se crean N órdenes (una por vendedor). El Purchase como agrupador debe crearse cuando el pago se confirma, no antes, para evitar Purchases huérfanos si el pago falla.

- **Una orden por vendedor por carrito**. Si el carrito tiene productos de 3 vendedores, se crean 3 órdenes, todas agrupadas bajo un solo Purchase.

- **`prisma db push` en vez de migrations**. Un incidente con `migrate diff` usando la base de producción como shadow causó pérdida de datos. El proyecto usa `db push` exclusivamente.

- **Guardas de estado en el repositorio** como última línea de defensa, aunque el servicio ya valide. Esto evita que bugs se propaguen si una validación del servicio se omite accidentalmente.

- **Olive `#8B7355`** es el color unificado de advertencia/cancelación, evolucionó de rojo → ámbar → olive para una apariencia profesional distinta del verde primario.

- **Filtros con aplicación automática** (sin botón "Aplicar"). La búsqueda usa debounce, los cambios de estado/fecha se aplican inmediatamente.

- **El envío de email es fire-and-forget** (disparar y olvidar). Si Resend falla, la orden igual se crea exitosamente. El error se captura silenciosamente.

- **Leafy (asistente IA) responde solo en español**, restringido a temas de plantas y ventas mediante el prompt de sistema de Gemini.

- **Exportación CSV** usa BOM (`\uFEFF`) para compatibilidad con Excel en caracteres especiales.

- **Filas táctiles** usan estado JavaScript `data-revealed` para mostrar/ocultar botones de acción en móvil/tablet, en vez de enfoques solo CSS.

