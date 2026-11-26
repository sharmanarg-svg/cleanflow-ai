const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const catalog = {
  services: [
    {
      slug: 'standard-home',
      name: 'Standard Home Cleaning',
      category: 'home',
      tagline: 'The regular reset for homes and condos',
      description: 'Regular cleaning for homes and condos, including kitchens, bathrooms, floors, and living areas.',
      basePrice: 129,
      durationMinutes: 120,
      popular: true,
      includes: [
        'Kitchen counters, sink, and appliance exteriors',
        'Bathrooms scrubbed and sanitized',
        'Floors vacuumed and mopped',
        'Dusting, mirrors, and glass',
        'Trash emptied throughout'
      ]
    },
    {
      slug: 'deep-home',
      name: 'Deep Cleaning',
      category: 'home',
      tagline: 'Top-to-bottom detail, room by room',
      description: 'Detailed top-to-bottom cleaning for kitchens, bathrooms, baseboards, and hard-to-reach areas.',
      basePrice: 249,
      durationMinutes: 240,
      popular: true,
      includes: [
        'Everything in a Standard Cleaning',
        'Kitchen degreased in detail, inside microwave',
        'Bathroom grout and fixtures descaled',
        'Baseboards, door frames, vents, and ceiling fans',
        'Hard-to-reach and behind-furniture areas'
      ]
    },
    {
      slug: 'move-in-out',
      name: 'Move-In / Move-Out Cleaning',
      category: 'home',
      tagline: 'Empty-home cleaning, deposit-ready',
      description: 'Cleaning for empty homes before moving in or after moving out.',
      basePrice: 299,
      durationMinutes: 300,
      popular: false,
      includes: [
        'Inside all cabinets, drawers, and closets',
        'Inside oven and fridge included',
        'Walls and baseboards spot-cleaned',
        'Floors vacuumed, mopped, and detailed',
        'Bathrooms fully sanitized'
      ]
    },
    {
      slug: 'office',
      name: 'Office Cleaning',
      category: 'office',
      tagline: 'Scheduled cleaning for workplaces',
      description: 'Scheduled cleaning for offices, clinics, studios, and small workplaces.',
      basePrice: 179,
      durationMinutes: 180,
      popular: false,
      includes: [
        'Desks, workstations, and common areas',
        'Washrooms cleaned and sanitized',
        'Kitchenette and break room cleaned',
        'Floors vacuumed and mopped',
        'Trash and recycling emptied'
      ]
    },
    {
      slug: 'airbnb',
      name: 'Airbnb Turnover',
      category: 'home',
      tagline: 'Guest-ready between every stay',
      description: 'Fast turnover cleaning, linen reset, and guest-ready preparation.',
      basePrice: 99,
      durationMinutes: 90,
      popular: false,
      includes: [
        'Full clean between guests',
        'Linen change and beds made hotel-style',
        'Bathrooms sanitized and restocked',
        'Kitchen reset and dishes done',
        'Guest-ready final walkthrough'
      ]
    },
    {
      slug: 'post-construction',
      name: 'Post-Construction Cleaning',
      category: 'specialty',
      tagline: 'From job site to move-in ready',
      description: 'Dust and debris cleanup after renovation or construction work.',
      basePrice: 399,
      durationMinutes: 360,
      popular: false,
      includes: [
        'Fine construction dust removed throughout',
        'Paint and adhesive spots removed',
        'Windows, tracks, and frames detailed',
        'Floors scrubbed and polished',
        'Loose debris bagged for disposal'
      ]
    }
  ],
  addOns: [
    { slug: 'inside-oven', name: 'Inside oven cleaning', price: 35 },
    { slug: 'inside-fridge', name: 'Inside fridge cleaning', price: 30 },
    { slug: 'interior-windows', name: 'Interior windows', price: 45 },
    { slug: 'laundry', name: 'Laundry wash & fold', price: 25 },
    { slug: 'carpet-shampoo', name: 'Carpet shampoo (per room)', price: 40 },
    { slug: 'pet-hair', name: 'Pet hair treatment', price: 25 },
    { slug: 'garage', name: 'Garage sweep-out', price: 35 }
  ],
  frequencies: [
    { slug: 'one-time', label: 'One-time', multiplier: 1 },
    { slug: 'monthly', label: 'Monthly', multiplier: 0.95 },
    { slug: 'biweekly', label: 'Every 2 weeks', multiplier: 0.9 },
    { slug: 'weekly', label: 'Weekly', multiplier: 0.85 }
  ],
  propertyTypes: [
    { slug: 'house', label: 'House' },
    { slug: 'condo', label: 'Condo / Apartment' },
    { slug: 'townhouse', label: 'Townhouse' },
    { slug: 'office', label: 'Office' }
  ],
  timeSlots: ['Morning (8–11 AM)', 'Midday (11 AM–2 PM)', 'Afternoon (2–5 PM)', 'Evening (5–8 PM)'],
  faqs: [
    {
      slug: 'price-calculation',
      category: 'pricing',
      question: 'How is the price calculated?',
      answer: 'The estimate depends on the service type, home or office size, bedrooms, bathrooms, frequency, and selected add-ons. The final price is confirmed before the cleaning starts.'
    },
    {
      slug: 'booking-time',
      category: 'scheduling',
      question: 'How far in advance should I book?',
      answer: 'You can request a preferred date and time in the booking form. Same-day or next-day availability depends on the schedule and service area.'
    },
    {
      slug: 'supplies',
      category: 'process',
      question: 'Do you bring cleaning supplies?',
      answer: 'Yes, standard cleaning supplies and equipment can be included. If you prefer specific products, add a note in the booking request.'
    },
    {
      slug: 'duration',
      category: 'process',
      question: 'How long does cleaning take?',
      answer: 'A standard home cleaning usually takes about 2 hours. Deep, move-out, office, and post-construction cleanings take longer depending on size and condition.'
    },
    {
      slug: 'reschedule',
      category: 'scheduling',
      question: 'Can I reschedule?',
      answer: 'Yes. Send a reschedule request as early as possible so the team can confirm a new time.'
    }
  ]
};

function findBySlug(items, slug) {
  return items.find((item) => item.slug === slug);
}

function estimatePrice(input) {
  const service = findBySlug(catalog.services, input.serviceSlug);
  if (!service) throw new Error('Unknown service');

  const frequency = findBySlug(catalog.frequencies, input.frequency) || catalog.frequencies[0];
  const bedrooms = Number(input.bedrooms || 0);
  const bathrooms = Number(input.bathrooms || 0);
  const squareFeet = Number(input.squareFeet || 0);
  const addOnSlugs = Array.isArray(input.addOnSlugs) ? input.addOnSlugs : [];

  const lines = [{ label: `${service.name} (base)`, amount: service.basePrice }];
  let durationMinutes = service.durationMinutes;

  const extraBedrooms = Math.max(0, bedrooms - 2);
  if (extraBedrooms > 0) {
    lines.push({ label: `Bedrooms over 2 (${extraBedrooms} extra)`, amount: extraBedrooms * 25 });
    durationMinutes += extraBedrooms * 15;
  }

  const extraBathrooms = Math.max(0, bathrooms - 1);
  if (extraBathrooms > 0) {
    lines.push({ label: `Bathrooms over 1 (${extraBathrooms} extra)`, amount: Math.round(extraBathrooms * 20) });
    durationMinutes += Math.round(extraBathrooms * 20);
  }

  const extraAreaBlocks = squareFeet > 1000 ? Math.ceil((squareFeet - 1000) / 500) : 0;
  if (extraAreaBlocks > 0) {
    lines.push({ label: `Floor area over 1,000 sq ft (${extraAreaBlocks} × 500 sq ft)`, amount: extraAreaBlocks * 15 });
    durationMinutes += extraAreaBlocks * 10;
  }

  for (const slug of addOnSlugs) {
    const addOn = findBySlug(catalog.addOns, slug);
    if (addOn) {
      lines.push({ label: addOn.name, amount: addOn.price });
      durationMinutes += 20;
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = Math.round(subtotal * (1 - frequency.multiplier));
  if (discount > 0) {
    lines.push({ label: `${frequency.label} discount`, amount: -discount });
  }

  const total = subtotal - discount;
  return {
    low: Math.round(total * 0.9),
    high: Math.round(total * 1.1),
    durationMinutes,
    lines
  };
}

function readBookings() {
  if (!fs.existsSync(BOOKINGS_FILE)) return [];
  const raw = fs.readFileSync(BOOKINGS_FILE, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

function writeBookings(bookings) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

function createBooking(input) {
  const required = ['customerName', 'customerEmail', 'serviceSlug', 'propertyType', 'preferredDate', 'preferredTime'];
  for (const field of required) {
    if (!input[field]) throw new Error(`Missing ${field}`);
  }

  const estimate = estimatePrice(input);
  const bookings = readBookings();
  const booking = {
    reference: `CF-${1001 + bookings.length}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone || '',
    serviceSlug: input.serviceSlug,
    propertyType: input.propertyType,
    bedrooms: Number(input.bedrooms || 0),
    bathrooms: Number(input.bathrooms || 0),
    squareFeet: Number(input.squareFeet || 0),
    frequency: input.frequency || 'one-time',
    addOnSlugs: Array.isArray(input.addOnSlugs) ? input.addOnSlugs : [],
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    address: input.address || '',
    city: input.city || '',
    notes: input.notes || '',
    estimate
  };

  bookings.push(booking);
  writeBookings(bookings);
  return booking;
}

function answerAssistant(question) {
  const q = String(question || '').toLowerCase();
  const service = catalog.services.find((item) => q.includes(item.slug.replace('-', ' ')) || q.includes(item.name.toLowerCase().split(' ')[0]));

  if (q.includes('deep')) {
    const deep = findBySlug(catalog.services, 'deep-home');
    return `Our Deep Cleaning starts from $${deep.basePrice} and takes about ${Math.round(deep.durationMinutes / 60)} hours. This is an approximate estimate, and the final price will be confirmed before the cleaning starts.`;
  }
  if (q.includes('office')) {
    const office = findBySlug(catalog.services, 'office');
    return `Office Cleaning starts from $${office.basePrice} and usually takes about ${Math.round(office.durationMinutes / 60)} hours. It covers desks, workstations, washrooms, kitchenette areas, floors, trash, and recycling.`;
  }
  if (q.includes('move')) {
    const move = findBySlug(catalog.services, 'move-in-out');
    return `Move-In / Move-Out Cleaning starts from $${move.basePrice} and takes about ${Math.round(move.durationMinutes / 60)} hours. It includes inside cabinets and drawers, inside oven and fridge, floors, walls, baseboards, and bathrooms.`;
  }
  if (q.includes('airbnb')) {
    const airbnb = findBySlug(catalog.services, 'airbnb');
    return `Airbnb Turnover starts from $${airbnb.basePrice} and takes about ${airbnb.durationMinutes} minutes. It includes a full clean between guests, linen reset, bathroom sanitizing, kitchen reset, and a guest-ready walkthrough.`;
  }
  if (q.includes('construction') || q.includes('renovation')) {
    const post = findBySlug(catalog.services, 'post-construction');
    return `Post-Construction Cleaning starts from $${post.basePrice} and takes about ${Math.round(post.durationMinutes / 60)} hours. It focuses on construction dust, paint spots, windows and tracks, floors, and loose debris.`;
  }
  if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
    return findBySlug(catalog.faqs, 'price-calculation').answer;
  }
  if (q.includes('book') || q.includes('schedule') || q.includes('when') || q.includes('advance')) {
    return findBySlug(catalog.faqs, 'booking-time').answer;
  }
  if (q.includes('supplies') || q.includes('products') || q.includes('equipment')) {
    return findBySlug(catalog.faqs, 'supplies').answer;
  }
  if (q.includes('long') || q.includes('duration') || q.includes('hours')) {
    return findBySlug(catalog.faqs, 'duration').answer;
  }
  if (q.includes('reschedule') || q.includes('change')) {
    return findBySlug(catalog.faqs, 'reschedule').answer;
  }
  if (service) {
    return `${service.name} starts from $${service.basePrice} and takes about ${service.durationMinutes} minutes. ${service.description}`;
  }

  return 'I can help with services, approximate pricing, scheduling, and the cleaning process. Tell me the service, property size, bedrooms, bathrooms, and preferred date, and I can point you to the right estimate or booking step.';
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  const filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const type = ext === '.css' ? 'text/css' : ext === '.js' ? 'text/javascript' : 'text/html';
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      sendJson(res, 200, catalog);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/estimate') {
      sendJson(res, 200, estimatePrice(await readBody(req)));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/bookings') {
      sendJson(res, 201, createBooking(await readBody(req)));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/assistant') {
      const body = await readBody(req);
      sendJson(res, 200, { answer: answerAssistant(body.question) });
      return;
    }
    if (req.method === 'GET') {
      serveStatic(req, res, url.pathname);
      return;
    }
    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`CLEANFLOW AI running at http://localhost:${PORT}`);
});
