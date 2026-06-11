const { io } = require('socket.io-client');

const SERVER = process.env.SERVER || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'localtest';

const socket = io(SERVER, { reconnectionAttempts: 5, timeout: 20000 });

socket.on('connect', () => {
  console.log('Conectado ao servidor socket:', SERVER);
  socket.emit('register', USER_ID);
  console.log('Registrado como user:', USER_ID);

  // Escutar logs de extração
  socket.on('maps-log', (data) => {
    console.log('[maps-log]', data.timestamp, data.message);
  });
  socket.on('maps-status', (status) => {
    console.log('[maps-status]', status);
  });
  socket.on('maps-item-scraped', (data) => {
    console.log('[maps-item-scraped]', data);
  });

  // Iniciar extração curta
  socket.emit('start-maps-scrape', {
    query: 'Médicos',
    limit: 5,
    onlyCellphones: true,
    excludeFixedPhones: true,
    onlyWithInstagramOrWhatsapp: false
  });
});

socket.on('connect_error', (err) => {
  console.error('Erro ao conectar socket:', err.message);
  process.exit(1);
});

// Sair após 2 minutos
setTimeout(() => {
  console.log('Timeout: finalizando cliente.');
  socket.close();
  process.exit(0);
}, 120000);
