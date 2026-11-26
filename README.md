# CLEANFLOW AI

CLEANFLOW AI is an English-language web app for selling home and office cleaning services.

Customers can:

- Browse cleaning services with prices, durations, and included tasks.
- Get an instant price estimate with a line-by-line breakdown.
- Submit a booking request and receive a booking reference.
- Ask the assistant about services, pricing, scheduling, and the cleaning process.

## Run locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

No package installation is required; the app uses Node.js built-in modules only.

## Data storage

Booking requests are saved to `data/bookings.json` at runtime. That file is ignored by Git so customer booking data is not committed. For production use, connect a hosted database before accepting real customer bookings.

## API

- `GET /api/catalog` — services, add-ons, frequencies, property types, time slots, and FAQs.
- `POST /api/estimate` — calculates an approximate price range and duration.
- `POST /api/bookings` — creates a booking request and returns a reference such as `CF-1001`.
- `POST /api/assistant` — answers catalog-grounded questions about services, pricing, scheduling, and process.
