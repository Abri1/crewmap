# Crew Map

A real-time location tracking PWA for truck driver crews. Built with React, TypeScript, Mapbox GL JS, and Supabase.

## Features

- **Real-time GPS tracking** - See your crew's live locations and breadcrumb trails
- **No signup required** - Just create or join a crew with a simple code
- **Full-screen satellite map** - Top-down, north-up view with zoom-only controls
- **Color-coded drivers** - Each driver gets a unique color for easy identification
- **PWA support** - Install on mobile devices for a native app experience
- **Offline-ready** - Queues location updates when offline

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Map**: Mapbox GL JS (satellite-streets style)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **PWA**: vite-plugin-pwa + Workbox

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

1. **First time**: Create a crew or join with a code
2. **Onboarding**: Enter your nickname
3. **Map view**: Your location is tracked and synced every 15 seconds
4. **Real-time**: See other crew members' locations update live
5. **Trails**: Breadcrumb trails show where everyone has been

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

Build and deploy to any static hosting provider (Vercel, Netlify, etc.):

```bash
npm run build
```

The `dist/` folder contains your production-ready PWA.

## Environment Variables

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VITE_MAPBOX_TOKEN` | Mapbox access token | [mapbox.com/account](https://account.mapbox.com/access-tokens/) |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase project API settings |

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
