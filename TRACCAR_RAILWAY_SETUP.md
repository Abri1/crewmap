# Deploy Traccar Server on Railway

This guide shows you how to deploy your own Traccar GPS tracking server on Railway's free tier.

## Why Traccar Server?

- **Reliable & Mature**: Battle-tested open-source GPS tracking
- **iOS & Android**: Works with official Traccar Client apps
- **Full Features**: Speed, heading, battery, geofencing, and more
- **Privacy**: Your own server, your data
- **Free Tier**: Railway provides $5/month credit (enough for Traccar)

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub account (to fork this repo)

## Step 1: Fork This Repository

1. Go to https://github.com/Abri1/crewmap
2. Click "Fork" in the top right
3. This creates your own copy under your GitHub account

## Step 2: Deploy to Railway from GitHub

### Method 1: One-Click Deploy (Easiest)

1. **Click the deploy button:**

   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/traccar)

2. **Sign in to Railway**
   - Use your GitHub account
   - Grant Railway access to your repositories

3. **Configure the deployment:**
   - Select your forked `crewmap` repository
   - Railway will automatically detect `railway.json`
   - Environment variable `DATABASE_PASSWORD` will be auto-generated

4. **Deploy!**
   - Click "Deploy Now"
   - Wait 2-3 minutes for deployment

### Method 2: Deploy from GitHub Dashboard

1. **Go to Railway Dashboard**
   - Visit [railway.app/new](https://railway.app/new)
   - Sign in with GitHub

2. **Create New Project**
   - Click "Deploy from GitHub repo"
   - Select your forked `Abri1/crewmap` repository
   - Branch: `main`

3. **Railway Auto-Detection**
   - Railway will detect `railway.json` configuration
   - Two services will be created:
     - `traccar` - GPS server
     - `postgres` - Database

4. **Set Environment Variables**
   - Railway will prompt for `DATABASE_PASSWORD`
   - Use the auto-generated value or create your own strong password
   - Example: `Tr4cc@r2025!SecureDB`

5. **Deploy**
   - Click "Deploy"
   - Monitor logs in Railway dashboard
   - Deployment takes ~2-3 minutes

### Method 3: Railway CLI (Advanced)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Step 3: Configure Traccar

After deployment (takes ~2-3 minutes):

1. **Get Your Server URL**:
   - In Railway dashboard, click your Traccar service
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Your URL will be: `https://your-app.railway.app`

2. **Access Traccar Web Interface**:
   - Open: `https://your-app.railway.app:8082`
   - Default credentials:
     - Username: `admin`
     - Password: `admin`
   - **IMPORTANT**: Change password immediately!

3. **Configure Crew Map Integration**:
   - In Traccar web interface, go to "Settings" → "Server"
   - Note down your server's public URL
   - You'll use this in the Crew Map app

## Step 4: Update Crew Map

Update your `.env.local` or Vercel environment variables:

```env
VITE_TRACCAR_SERVER=your-app.railway.app
VITE_TRACCAR_PORT=5055
```

Redeploy Crew Map on Vercel.

## Step 5: Use Traccar Client Apps

### For Users (Drivers):

1. **Download Traccar Client**:
   - iOS: https://apps.apple.com/app/traccar-client/id843156974
   - Android: https://play.google.com/store/apps/details?id=org.traccar.client

2. **Configure in App**:
   - Server URL: `https://your-app.railway.app:5055`
   - Device Identifier: Copy from Crew Map setup screen
   - Frequency: 5 seconds
   - Distance: 0 meters
   - Angle: 0 degrees

3. **Enable Tracking**:
   - Grant "Always" location permission
   - Toggle service to ON
   - You'll see tracking notification

## Architecture

```
Traccar Client (Phone)
    ↓
Railway Traccar Server (Port 5055)
    ↓
PostgreSQL Database
    ↓
Crew Map queries Traccar API
    ↓
Shows on Mapbox
```

## Cost Breakdown

**Railway Free Tier**:
- $5/month credit for new users
- Traccar uses ~$2-3/month
- PostgreSQL uses ~$1-2/month
- **Total: FREE for small crews (under 10 drivers)**

For larger crews, Railway Pro ($20/month) gives unlimited usage.

## Connecting Crew Map to Traccar

Instead of using our webhook, Crew Map will query Traccar's API:

```typescript
// Example API call
GET https://your-app.railway.app:8082/api/positions
Authorization: Basic base64(email:password)
```

This gives us real-time location data from all devices!

## Troubleshooting

### Deployment Failed?
- Check Railway logs: Dashboard → Service → "Logs"
- Verify `DATABASE_PASSWORD` is set
- Ensure ports 5055 and 8082 are exposed

### Can't Access Web Interface?
- Railway generates HTTPS by default
- Use: `https://your-app.railway.app:8082`
- Not: `http://` (won't work)

### Devices Not Connecting?
- Verify Server URL in app: `https://your-app.railway.app:5055`
- Check device identifier matches driver UUID
- Enable location permissions (Always)
- Check Railway logs for connection attempts

### Database Connection Error?
- Railway auto-connects PostgreSQL
- Check environment variable `DATABASE_PASSWORD` is set
- Restart both services: Traccar and PostgreSQL

## Monitoring

Railway provides:
- **Logs**: Real-time server logs
- **Metrics**: CPU, memory, network usage
- **Alerts**: Email notifications for issues

Access via Railway Dashboard → Your Service → Metrics/Logs

## Scaling

For larger deployments:
- **Upgrade Railway**: Pro plan ($20/month)
- **Optimize Database**: Add indexes for device queries
- **CDN**: Use Cloudflare for web interface
- **Multiple Regions**: Deploy in regions closer to your users

## Security Best Practices

1. **Change default password** immediately after first login
2. **Use strong DATABASE_PASSWORD**
3. **Enable HTTPS** (Railway does this by default)
4. **Restrict API access** to your Crew Map domain
5. **Regular backups** (Railway has automatic backups)

## Resources

- [Traccar Documentation](https://www.traccar.org/documentation/)
- [Railway Documentation](https://docs.railway.app/)
- [Traccar GitHub](https://github.com/traccar/traccar)
- [Crew Map Issues](https://github.com/Abri1/crewmap/issues)

## Next Steps

Once Traccar is deployed:
1. Update Crew Map to use Traccar API
2. Remove Overland webhook code
3. Update setup instructions for Traccar Client
4. Test with multiple devices
