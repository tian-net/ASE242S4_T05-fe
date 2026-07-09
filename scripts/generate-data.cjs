const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'import-data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function escCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCsv(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(escCsv).join(','))];
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, '\uFEFF' + lines.join('\r\n'), 'utf8');
  console.log(`  Created: ${filename}`);
}

function addSheet(wb, name, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

// ─────────────────────────────────────────
// 1. CUSTOMERS
// ─────────────────────────────────────────
const customers = [
  { firstName: 'Carlos', lastName: 'García', email: 'carlos.garcia@email.com', phone: '999111222', docType: 'DNI', docNum: '12345678', isFrequent: true },
  { firstName: 'María', lastName: 'López', email: 'maria.lopez@email.com', phone: '999333444', docType: 'DNI', docNum: '87654321', isFrequent: false },
  { firstName: 'José', lastName: 'Martínez', email: 'jose.martinez@email.com', phone: '999555666', docType: 'DNI', docNum: '11223344', isFrequent: true },
  { firstName: 'Ana', lastName: 'Rodríguez', email: 'ana.rodriguez@email.com', phone: '999777888', docType: 'CarnetExtranjeria', docNum: 'CE001122', isFrequent: false },
  { firstName: 'Luis', lastName: 'Fernández', email: 'luis.fernandez@email.com', phone: '999000111', docType: 'RUC', docNum: '20123456789', isFrequent: true },
  { firstName: 'Sofía', lastName: 'Torres', email: 'sofia.torres@email.com', phone: '998877665', docType: 'DNI', docNum: '44332211', isFrequent: false },
  { firstName: 'Diego', lastName: 'Ramírez', email: 'diego.ramirez@email.com', phone: '997766554', docType: 'Pasaporte', docNum: 'P1234567', isFrequent: false },
  { firstName: 'Valentina', lastName: 'Castro', email: 'valentina.castro@email.com', phone: '996655443', docType: 'DNI', docNum: '55667788', isFrequent: true },
];

const custHeaders = ['first_name', 'last_name', 'email', 'phone', 'doc_type', 'doc_num', 'is_frequent'];
const custRows = customers.map(c => [c.firstName, c.lastName, c.email, c.phone, c.docType, c.docNum, c.isFrequent]);
writeCsv('customers.csv', custHeaders, custRows);

// ─────────────────────────────────────────
// 2. TABLES
// ─────────────────────────────────────────
const tables = [
  { tableNum: 1,  capacity: 2, location: JSON.stringify({ area: 'terraza', vista: 'calle' }),  description: 'Mesa terraza frente a calle', status: 'AVAILABLE', isReservable: true },
  { tableNum: 2,  capacity: 2, location: JSON.stringify({ area: 'terraza', vista: 'interior' }), description: 'Mesa terraza interior',       status: 'AVAILABLE', isReservable: true },
  { tableNum: 3,  capacity: 4, location: JSON.stringify({ area: 'salon', seccion: 'central' }), description: 'Mesa salón central',            status: 'AVAILABLE', isReservable: true },
  { tableNum: 4,  capacity: 4, location: JSON.stringify({ area: 'salon', seccion: 'ventana' }), description: 'Mesa salón junto a ventana',    status: 'AVAILABLE', isReservable: true },
  { tableNum: 5,  capacity: 6, location: JSON.stringify({ area: 'salon', seccion: 'vip' }),     description: 'Mesa salón VIP',               status: 'AVAILABLE', isReservable: true },
  { tableNum: 6,  capacity: 6, location: JSON.stringify({ area: 'terraza', vista: 'jardin' }),  description: 'Mesa terraza jardín',           status: 'AVAILABLE', isReservable: true },
  { tableNum: 7,  capacity: 8, location: JSON.stringify({ area: 'salon', seccion: 'privado' }), description: 'Mesa salón privado',            status: 'AVAILABLE', isReservable: true },
  { tableNum: 8,  capacity: 4, location: JSON.stringify({ area: 'salon', seccion: 'barra' }),   description: 'Mesa barra',                    status: 'MAINTENANCE', isReservable: false },
  { tableNum: 9,  capacity: 10, location: JSON.stringify({ area: 'salon', seccion: 'privado' }),description: 'Mesa grande privada',           status: 'AVAILABLE', isReservable: true },
  { tableNum: 10, capacity: 2, location: JSON.stringify({ area: 'terraza', vista: 'calle' }),   description: 'Mesa terraza balcón',           status: 'AVAILABLE', isReservable: true },
];

const tableHeaders = ['table_num', 'capacity', 'location', 'description', 'status', 'is_reservable'];
const tableRows = tables.map(t => [t.tableNum, t.capacity, t.location, t.description, t.status, t.isReservable]);
writeCsv('tables.csv', tableHeaders, tableRows);

// ─────────────────────────────────────────
// 3. USERS
// ─────────────────────────────────────────
const users = [
  { fullName: 'Admin Principal',    email: 'admin@elchino.com',    password: 'Admin123!',   role: 'admin' },
  { fullName: 'Admin Secundario',   email: 'admin2@elchino.com',   password: 'Admin123!',   role: 'admin' },
  { fullName: 'Carlos García',      email: 'carlos.garcia@email.com', password: 'Cliente1!', role: 'cliente' },
  { fullName: 'María López',        email: 'maria.lopez@email.com',   password: 'Cliente1!', role: 'cliente' },
  { fullName: 'José Martínez',      email: 'jose.martinez@email.com', password: 'Cliente1!', role: 'cliente' },
  { fullName: 'Ana Rodríguez',      email: 'ana.rodriguez@email.com', password: 'Cliente1!', role: 'cliente' },
  { fullName: 'Luis Fernández',     email: 'luis.fernandez@email.com', password: 'Cliente1!', role: 'cliente' },
  { fullName: 'Sofía Torres',       email: 'sofia.torres@email.com',   password: 'Cliente1!', role: 'cliente' },
];

const userHeaders = ['full_name', 'email', 'password', 'role'];
const userRows = users.map(u => [u.fullName, u.email, u.password, u.role]);
writeCsv('users.csv', userHeaders, userRows);

// ─────────────────────────────────────────
// 4. EVENTS
// ─────────────────────────────────────────
const events = [
  { name: 'Alquiler Full Day',        eventType: 'FULL_DAY',           description: 'Alquiler del local por día completo',                         maxCapacity: 100, pricePerHour: 0,    pricePerDay: 2500, isActive: true },
  { name: 'Alquiler por Hora',        eventType: 'ALQUILER_POR_HORA',  description: 'Alquiler del local por hora',                                 maxCapacity: 80,  pricePerHour: 350,  pricePerDay: 0,    isActive: true },
  { name: 'Cumpleaños Infantil',      eventType: 'CUMPLEANOS',         description: 'Fiesta de cumpleaños para niños con animación',               maxCapacity: 50,  pricePerHour: 200,  pricePerDay: 1200, isActive: true },
  { name: 'Cumpleaños Adulto',        eventType: 'CUMPLEANOS',         description: 'Fiesta de cumpleaños para adultos',                            maxCapacity: 60,  pricePerHour: 250,  pricePerDay: 1500, isActive: true },
  { name: 'Boda',                     eventType: 'BODA',               description: 'Ceremonia y recepción de boda',                               maxCapacity: 150, pricePerHour: 0,    pricePerDay: 5000, isActive: true },
  { name: 'Matrimonio Civil',         eventType: 'MATRIMONIO',         description: 'Celebración de matrimonio civil',                              maxCapacity: 100, pricePerHour: 0,    pricePerDay: 3500, isActive: true },
  { name: 'Baby Shower',              eventType: 'BABY_SHOWER',        description: 'Celebración de baby shower',                                   maxCapacity: 40,  pricePerHour: 180,  pricePerDay: 1000, isActive: true },
  { name: 'Fiesta de Despedida',      eventType: 'DESPEDIDA',          description: 'Fiesta de despedida',                                          maxCapacity: 50,  pricePerHour: 220,  pricePerDay: 1300, isActive: true },
  { name: 'Fiesta de Grado',          eventType: 'GRADO',              description: 'Celebración de graduación',                                    maxCapacity: 70,  pricePerHour: 230,  pricePerDay: 1400, isActive: true },
  { name: 'Evento de Garantía',       eventType: 'GARANTIA',           description: 'Evento empresarial de garantía extendida',                     maxCapacity: 30,  pricePerHour: 150,  pricePerDay: 0,    isActive: true },
  { name: 'Conferencia Empresarial',  eventType: 'CONFERENCIA',        description: 'Conferencia y charlas empresariales',                          maxCapacity: 80,  pricePerHour: 280,  pricePerDay: 1800, isActive: true },
  { name: 'Taller de Cocina',         eventType: 'ALQUILER_POR_HORA',  description: 'Taller gastronómico',                                          maxCapacity: 20,  pricePerHour: 180,  pricePerDay: 0,    isActive: false },
];

const eventHeaders = ['name', 'event_type', 'description', 'max_capacity', 'price_per_hour', 'price_per_day', 'is_active'];
const eventRows = events.map(e => [e.name, e.eventType, e.description, e.maxCapacity, e.pricePerHour, e.pricePerDay, e.isActive]);
writeCsv('events.csv', eventHeaders, eventRows);

// ─────────────────────────────────────────
// 5. RESERVATIONS (table)
// ─────────────────────────────────────────
const reservations = [
  { customerId: '', resDate: '2026-07-15', resTime: '19:00', numPeople: 2,  status: 'pendiente',  totalAmt: 0,   tableIds: '1',    notes: 'Cena romántica' },
  { customerId: '', resDate: '2026-07-15', resTime: '20:00', numPeople: 4,  status: 'Confirmado', totalAmt: 0,   tableIds: '3,4',  notes: 'Cumpleaños' },
  { customerId: '', resDate: '2026-07-16', resTime: '18:30', numPeople: 6,  status: 'pendiente',  totalAmt: 0,   tableIds: '5',    notes: 'Reunión familiar' },
  { customerId: '', resDate: '2026-07-17', resTime: '19:30', numPeople: 2,  status: 'pendiente',  totalAmt: 0,   tableIds: '2',    notes: '' },
  { customerId: '', resDate: '2026-07-18', resTime: '20:30', numPeople: 8,  status: 'Planificado',totalAmt: 0,   tableIds: '7',    notes: 'Cena de negocios' },
  { customerId: '', resDate: '2026-07-19', resTime: '12:00', numPeople: 10, status: 'pendiente',  totalAmt: 0,   tableIds: '9',    notes: 'Almuerzo familiar' },
  { customerId: '', resDate: '2026-07-20', resTime: '21:00', numPeople: 4,  status: 'Confirmado', totalAmt: 0,   tableIds: '3',    notes: 'Aniversario' },
  { customerId: '', resDate: '2026-07-21', resTime: '19:00', numPeople: 2,  status: 'Cancelado',  totalAmt: 0,   tableIds: '1',    notes: 'Cancelado por el cliente' },
  { customerId: '', resDate: '2026-07-22', resTime: '13:00', numPeople: 6,  status: 'Finalizado', totalAmt: 320, tableIds: '5,6',  notes: 'Ejecutivo almuerzo' },
  { customerId: '', resDate: '2026-07-23', resTime: '20:00', numPeople: 4,  status: 'pendiente',  totalAmt: 0,   tableIds: '4',    notes: 'Cena con amigos' },
  { customerId: '', resDate: '2026-07-25', resTime: '18:00', numPeople: 2,  status: 'pendiente',  totalAmt: 0,   tableIds: '10',   notes: 'Mesa terraza' },
  { customerId: '', resDate: '2026-07-26', resTime: '19:30', numPeople: 8,  status: 'Planificado',totalAmt: 0,   tableIds: '7,9',  notes: 'Celebración de ascenso' },
];

const resHeaders = ['customer_id', 'res_date', 'res_time', 'num_people', 'status', 'total_amt', 'table_ids', 'notes'];
const resRows = reservations.map(r => [r.customerId, r.resDate, r.resTime, r.numPeople, r.status, r.totalAmt, r.tableIds, r.notes]);
writeCsv('reservations.csv', resHeaders, resRows);

// ─────────────────────────────────────────
// 6. EVENT RESERVATIONS
// ─────────────────────────────────────────
const eventReservations = [
  { customerId: '', totalPeople: 50,  venueCapacity: 80,  status: 'Planificado', details: '[{"eventId":"","eventDate":"2026-08-01","startTime":"10:00","endTime":"18:00","reservationType":"FULL_DAY","quantityHours":8,"totalPeople":50,"notes":"Cumpleaños infantil"}]', totalAmount: 2500 },
  { customerId: '', totalPeople: 20,  venueCapacity: 40,  status: 'Confirmado',  details: '[{"eventId":"","eventDate":"2026-07-25","startTime":"15:00","endTime":"19:00","reservationType":"BABY_SHOWER","quantityHours":4,"totalPeople":20,"notes":""}]', totalAmount: 720 },
  { customerId: '', totalPeople: 100, venueCapacity: 150, status: 'Planificado', details: '[{"eventId":"","eventDate":"2026-09-10","startTime":"09:00","endTime":"23:00","reservationType":"BODA","quantityHours":14,"totalPeople":100,"notes":"Boda completa"}]', totalAmount: 5000 },
  { customerId: '', totalPeople: 30,  venueCapacity: 50,  status: 'pendiente',   details: '[{"eventId":"","eventDate":"2026-07-30","startTime":"18:00","endTime":"22:00","reservationType":"DESPEDIDA","quantityHours":4,"totalPeople":30,"notes":"Despedida de soltero"}]', totalAmount: 880 },
  { customerId: '', totalPeople: 10,  venueCapacity: 30,  status: 'Cancelado',   details: '[{"eventId":"","eventDate":"2026-06-15","startTime":"11:00","endTime":"13:00","reservationType":"GARANTIA","quantityHours":2,"totalPeople":10,"notes":"Cancelado por lluvia"}]', totalAmount: 300 },
  { customerId: '', totalPeople: 70,  venueCapacity: 100, status: 'planificado', details: '[{"eventId":"","eventDate":"2026-08-05","startTime":"09:00","endTime":"23:00","reservationType":"MATRIMONIO","quantityHours":14,"totalPeople":70,"notes":"Matrimonio civil completo"}]', totalAmount: 3500 },
  { customerId: '', totalPeople: 15,  venueCapacity: 30,  status: 'pendiente',   details: '[{"eventId":"","eventDate":"2026-08-10","startTime":"14:00","endTime":"18:00","reservationType":"GRADO","quantityHours":4,"totalPeople":15,"notes":"Fiesta de graduación"}]', totalAmount: 920 },
  { customerId: '', totalPeople: 25,  venueCapacity: 50,  status: 'Confirmado',  details: '[{"eventId":"","eventDate":"2026-08-12","startTime":"11:00","endTime":"13:00","reservationType":"CONFERENCIA","quantityHours":2,"totalPeople":25,"notes":"Conferencia de ventas"}]', totalAmount: 560 },
  { customerId: '', totalPeople: 60,  venueCapacity: 80,  status: 'Planificado', details: '[{"eventId":"","eventDate":"2026-08-15","startTime":"10:00","endTime":"18:00","reservationType":"ALQUILER_POR_HORA","quantityHours":8,"totalPeople":60,"notes":"Evento corporativo"}]', totalAmount: 2800 },
  { customerId: '', totalPeople: 35,  venueCapacity: 50,  status: 'En curso',    details: '[{"eventId":"","eventDate":"2026-07-08","startTime":"09:00","endTime":"17:00","reservationType":"FULL_DAY","quantityHours":8,"totalPeople":35,"notes":"En curso ahora"}]', totalAmount: 2500 },
  { customerId: '', totalPeople: 10,  venueCapacity: 20,  status: 'Finalizado',  details: '[{"eventId":"","eventDate":"2026-06-20","startTime":"16:00","endTime":"20:00","reservationType":"CUMPLEANOS","quantityHours":4,"totalPeople":10,"notes":"Cumpleaños íntimo ya realizado"}]', totalAmount: 800 },
];

const evResHeaders = ['customer_id', 'total_people', 'venue_capacity', 'status', 'details', 'total_amount'];
const evResRows = eventReservations.map(er => [er.customerId, er.totalPeople, er.venueCapacity, er.status, er.details, er.totalAmount]);
writeCsv('event_reservations.csv', evResHeaders, evResRows);

// ─────────────────────────────────────────
// 7. EXCEL WORKBOOK
// ─────────────────────────────────────────
const wb = XLSX.utils.book_new();

addSheet(wb, 'Customers',     custHeaders, custRows);
addSheet(wb, 'Tables',        tableHeaders, tableRows);
addSheet(wb, 'Users',         userHeaders, userRows);
addSheet(wb, 'Events',        eventHeaders, eventRows);
addSheet(wb, 'Reservations',  resHeaders, resRows);
addSheet(wb, 'EventReservations', evResHeaders, evResRows);

const excelPath = path.join(outDir, 'elchino-import-data.xlsx');
XLSX.writeFile(wb, excelPath);
console.log(`  Created: elchino-import-data.xlsx`);

console.log(`\nAll files generated in: ${outDir}`);
