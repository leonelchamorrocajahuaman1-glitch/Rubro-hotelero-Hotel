# Hotel Paraíso

Página web de un hotel de lujo hecha solo con HTML, CSS y JavaScript puro (sin frameworks).
Su portada reutiliza el motor visual de **Lumen Roof**: el hotel se hunde en una niebla WebGL, cambia entre día y noche mientras está oculto y vuelve a subir con la nueva luz.

## Estructura

```
index.html          Página principal (7 secciones + reserva)
css/styles.css      Estilos, animaciones y diseño adaptable
js/config.js        ⚠ Datos del hotel: teléfono, WhatsApp, correo, dirección y precios
js/hero.js          Portada día/noche: niebla WebGL2, hundimiento y parallax
js/main.js          Menú, animaciones al desplazarse, reservas, galería, contacto
assets/img/         Fotografías (Unsplash), optimizadas en WebP
lumen-roof/         Proyecto original Lumen Roof, intacto
inti-travel/        Inti Travel: hoteles y experiencias en Perú (index.html + img/)
krung-travel/       Krung Travel: la misma web, versión Bangkok
```

## Inti Travel (`inti-travel/`)

Sitio de reservas de hoteles en Perú: portada con transición de niebla y nubes, buscador por destino
(Cusco, Lima, Arequipa, Ica, Madre de Dios), calendario y huéspedes, 8 hoteles con página de detalle,
experiencias, opiniones, preguntas frecuentes y reservas por WhatsApp. Precios en soles, dólares o euros.

- Ábrelo con Live Server en `http://127.0.0.1:5500/inti-travel/`.
- ⚠ El número de WhatsApp (`const WHATSAPP`), el correo y las opiniones son ejemplos: reemplázalos antes de publicar.
- Favoritos, reservas y calificaciones se guardan en el navegador del visitante; la reserva real se confirma por WhatsApp.

## Ejecutar con Live Server (VS Code)

1. Abre la carpeta del proyecto en VS Code (`Archivo → Abrir carpeta…`).
2. Instala la extensión **Live Server** (de Ritwick Dey) desde el panel de Extensiones.
3. Haz clic derecho en `index.html` → **Open with Live Server** (o pulsa **Go Live** en la barra inferior).
4. Se abrirá `http://127.0.0.1:5500/index.html`. Cada vez que guardes un archivo, la página se recarga sola.

El proyecto original está en `http://127.0.0.1:5500/lumen-roof/`.

## Antes de publicar

Edita `js/config.js`: el teléfono, el número de WhatsApp, el correo y la dirección son **ejemplos**.
Al cambiarlos ahí se actualizan en toda la página (cabecera, contacto, pie, botón flotante y mensajes de WhatsApp).

## Formularios

No hay servidor, así que los formularios validan los datos y luego preparan el envío:

- **Reserva**: calcula noches y total, genera un código y abre WhatsApp con la solicitud ya escrita.
- **Contacto**: deja elegir entre enviarlo por WhatsApp o por correo (abre el programa de correo con el mensaje listo).

Ambos guardan una copia en el navegador (`localStorage`). Para recibirlos en un correo sin intervención del usuario, se puede conectar un servicio como Formspree más adelante.
