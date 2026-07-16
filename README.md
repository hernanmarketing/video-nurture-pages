# Video Nurture Pages

Branded landing pages for YouTube videos + tracking beacon + analytics backend + stats dashboard.

Built for **Hernan Vazquez** / **Scale Driven**.

## Tech Stack

- **Frontend**: Plain HTML, CSS, JS — no framework
- **Backend**: FastAPI (Python, serverless on Vercel)
- **Database**: Neon Postgres (serverless PostgreSQL)
- **Deployment**: Vercel

## Project Structure

```
video-nurture-pages/
├── api/
│   └── index.py          # FastAPI app — tracking + stats endpoints
├── public/
│   ├── index.html         # Overview page listing all video pages
│   ├── low-ticket-book.html  # Video nurture page for Low Ticket Profits
│   └── t.js               # Tracking beacon (deployed to /t.js)
├── dashboard/
│   └── index.html         # Password-protected analytics dashboard
├── schema.sql             # Neon Postgres schema
├── vercel.json            # Vercel deployment config
├── requirements.txt       # Python dependencies
└── README.md
```

## Pages

| Slug | Title | Video ID |
|------|-------|----------|
| `/low-ticket-book` | How I Made $223,000 With Low Ticket Offers | 18CpZ8rq3SE |

## Setup

### 1. Database

Create a Neon Postgres database and run:

```bash
psql $DATABASE_URL < schema.sql
```

### 2. Environment Variables

Set these in your Vercel project:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `DASHBOARD_PASSWORD` | Password for the stats dashboard |

### 3. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### 4. Access the Dashboard

```
https://your-domain.vercel.app/dashboard?password=YOUR_PASSWORD
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/track` | Record a page visit |
| POST | `/api/click` | Record a CTA click |
| GET | `/api/stats?password=xxx` | Aggregated analytics |
| GET | `/api/stats/recent?password=xxx` | Recent visits with details |
| GET | `/api/health` | Health check |

## Tracking

Every video page includes `<script defer src="/t.js"></script>` which:

1. Generates a persistent visitor ID (localStorage)
2. Tracks page views with referrer, screen size, user agent
3. Tracks CTA button clicks
4. Sends heartbeats every 30s while tab is visible
5. Uses Page Visibility API to pause when hidden
6. Uses `navigator.sendBeacon` for reliable delivery on unload

Zero cookies, zero dependencies, ~2KB.

## Branding

- Primary red: `#E41E1E`
- Dark reds: `#9F1C1F`, `#8F1008`, `#A61E01`
- Background: near-black (`#0a0a0a`) for video pages
- Font: Inter (system sans-serif stack fallback)

## License

© 2024 Hernan Vazquez / Scale Driven
