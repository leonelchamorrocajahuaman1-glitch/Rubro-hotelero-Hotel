/* =========================================================
   DATOS DEL HOTEL — edita solo este archivo.
   Teléfono, WhatsApp, correo, dirección y precios se aplican
   automáticamente en toda la página.
   ⚠ Los datos de contacto de abajo son EJEMPLOS: reemplázalos
   por los reales antes de publicar la web.
   ========================================================= */
window.HOTEL = {
  nombre: 'Hotel Paraíso',
  telefono: '+51 999 000 000',          // como se muestra en pantalla
  whatsapp: '51999000000',              // solo dígitos, con código de país (sin +)
  email: 'reservas@hotelparaiso.com',
  direccion: 'Av. Malecón del Mar 1250',
  ciudad: 'Bahía Paraíso',
  moneda: 'US$',

  // Habitaciones: precio por noche, máximo de adultos y máximo total (adultos + niños)
  habitaciones: {
    individual:  { nombre: 'Individual',  precio: 89,  adultos: 1, total: 1 },
    doble:       { nombre: 'Doble',       precio: 129, adultos: 2, total: 3 },
    matrimonial: { nombre: 'Matrimonial', precio: 149, adultos: 2, total: 3 },
    suite:       { nombre: 'Suite',       precio: 279, adultos: 4, total: 4 }
  },
  maxNoches: 30
};
