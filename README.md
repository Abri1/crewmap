# Crew Map

A real-time location tracking PWA for truck driver crews. Built with React, TypeScript, Mapbox GL JS, Supabase, and Traccar GPS.

## Features

- **Real-time GPS tracking** - See your crew's live locations and breadcrumb trails
- **Native GPS app** - Uses Traccar Client (iOS/Android) for accurate, battery-efficient tracking
- **No signup required** - Just create or join a crew with a simple code
- **Full-screen satellite map** - Top-down, north-up view with zoom-only controls
- **Color-coded drivers** - Each driver gets a unique color for easy identification
- **PWA support** - Install on mobile devices for a native app experience
- **Self-hosted** - Complete privacy with your own GPS server

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Map**: Mapbox GL JS (satellite-streets style)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **GPS Tracking**: Traccar open-source GPS server + Client apps
- **PWA**: vite-plugin-pwa + Workbox
- **Deployment**: Railway (all-in-one)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Mapbox account (free tier works)
- A Supabase project (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abri1/crewmap.git
   cd crewmap/crew-map
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and add your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your API keys:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up Supabase database**

   Run the SQL schema in your Supabase project (see `database/schema.sql`)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**

   Navigate to the URL shown in terminal (usually `http://localhost:5173`)

## Project Structure

```
crew-map/
├── src/
│   ├── components/
│   │   ├── MapView.tsx           # Mapbox map with controls
│   │   ├── OnboardingScreen.tsx  # Crew join/create UI
│   │   └── OnboardingScreen.css
│   ├── hooks/
│   │   └── useGeolocation.ts     # GPS tracking hook
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   └── storage.ts            # LocalStorage helpers
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── App.tsx                   # Main app logic
│   ├── App.css                   # App styles
│   └── main.tsx                  # Entry point
├── database/
│   └── schema.sql                # Supabase database schema
├── public/
│   └── (PWA icons)
└── vite.config.ts                # Vite + PWA config
```

## Database Schema

The app uses three main tables:

- **crews** - Stores crew codes
- **drivers** - Individual drivers in crews
- **locations** - GPS breadcrumb trail data

See `database/schema.sql` for the complete schema with indexes and RLS policies.

## Map Controls

The map is configured for truck driver use:

- ✅ **Zoom only** - Pinch to zoom in/out
- ❌ **No rotation** - Always north-up (bearing locked at 0°)
- ❌ **No tilt** - Always top-down (pitch locked at 0°)
- ❌ **No drag pan** - Map auto-centers on your location

This provides a consistent, easy-to-read view optimized for mobile devices.

## How It Works

1. **Deploy to Railway**: One-click deployment of entire stack (web + GPS server + database)
2. **Create or join a crew**: Use a simple crew code
3. **Setup Traccar GPS**: Download the free iOS/Android app and enter your server URL
4. **Start tracking**: Enable tracking in Traccar Client app
5. **View the map**: See your crew's real-time locations and trails
6. **Privacy-first**: Your own private GPS server - complete control of your data

For detailed deployment instructions, see [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Deployment

### One-Click Deploy to Railway (Recommended)

Deploy the ENTIRE stack (web app + GPS server + database) with one click:

1. Fork this repository to your GitHub
2. Go to [railway.app](https://railway.app) and sign in
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your forked `crewmap` repository
5. Railway will auto-detect `railway.json` and deploy all 3 services
6. Add your environment variables (Supabase URL/key, Mapbox token)
7. Done! Get your URLs from each service

See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete step-by-step instructions.

### Local Development Only

If you just want to run locally for development:

```bash
npm run dev
```

You'll need to set up your own Traccar server separately for GPS tracking.

## Environment Variables

Railway will prompt you for these during deployment:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Supabase project URL | Supabase project settings |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase project API settings |
| `MAPBOX_TOKEN` | Mapbox access token | [mapbox.com/account](https://account.mapbox.com/access-tokens/) |
| `DATABASE_PASSWORD` | PostgreSQL password | Auto-generated by Railway |

## Features Roadmap

- [x] Real-time location tracking
- [x] Crew codes (join/create)
- [x] Breadcrumb trails
- [x] PWA support
- [ ] Push notifications
- [ ] Trip recording/playback
- [ ] Distance tracking
- [ ] Crew chat
- [ ] Export trail data

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
