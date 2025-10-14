# Railway Deployment for Traccar Server

This folder contains the configuration files to deploy a private Traccar GPS server on Railway.

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/traccar)

## What's Included

- **docker-compose.yml** - Docker Compose configuration for Traccar + PostgreSQL
- **traccar.xml** - Traccar server configuration (PostgreSQL, ports, settings)
- **railway.toml** - Railway build and deploy configuration
- **start.sh** - Startup script for Traccar container

## Deployment Steps

1. **Fork the main repository** at https://github.com/Abri1/crewmap

2. **Deploy from GitHub:**
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select your forked repository
   - Railway will auto-detect `railway.json`

3. **Set environment variable:**
   - `DATABASE_PASSWORD` - Automatically generated or set your own

4. **Wait for deployment** (~2-3 minutes)

5. **Get your URLs:**
   - Traccar Web UI: `https://your-project.railway.app:8082`
   - Device Port (for Traccar Client): `your-project.railway.app:5055`

## Configuration Files Explained

### docker-compose.yml
Defines two services:
- `traccar`: The GPS server (port 8082 web, port 5055 devices)
- `db`: PostgreSQL 15 database

### traccar.xml
Server configuration:
- Database connection to PostgreSQL
- OsmAnd protocol on port 5055
- Web interface on port 8082
- Geocoding enabled (Nominatim)

### railway.toml
Railway-specific configuration:
- Build with Dockerfile
- Health checks
- Service dependencies

## After Deployment

1. Access web interface: `https://your-project.railway.app:8082`
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin`
3. **IMPORTANT:** Change password immediately!
4. Create a new user for Crew Map API access
5. Note your Railway URL for Crew Map environment variables

## Environment Variables for Crew Map

Add these to your Vercel deployment:

```env
VITE_TRACCAR_SERVER=https://your-project.railway.app
VITE_TRACCAR_EMAIL=your-email@example.com
VITE_TRACCAR_PASSWORD=your-password
```

## Monitoring

- **Logs**: Railway Dashboard → Project → Service → Logs
- **Metrics**: Railway Dashboard → Project → Service → Metrics
- **Health**: Check `https://your-project.railway.app:8082/api/server`

## Cost

- Railway free tier: $5/month credit
- Traccar usage: ~$2-3/month
- PostgreSQL: ~$1-2/month
- **Total: FREE** for small crews (under 10 devices)

## Troubleshooting

**Can't access web interface?**
- Ensure port 8082 is exposed in Railway
- Use HTTPS: `https://your-project.railway.app:8082`
- Check deployment logs for errors

**Devices not connecting?**
- Port 5055 must be exposed
- Check traccar.xml has osmand.port=5055
- Verify device configuration in Traccar Client app

**Database errors?**
- Verify DATABASE_PASSWORD environment variable is set
- Check PostgreSQL container is running
- Review logs: Railway Dashboard → postgres service → Logs

## Support

For issues:
- [Traccar Documentation](https://www.traccar.org/documentation/)
- [Railway Documentation](https://docs.railway.app/)
- [Crew Map Issues](https://github.com/Abri1/crewmap/issues)
