# Traccar Integration Guide

This guide explains how to use the Traccar mobile app (iOS/Android) for native GPS tracking instead of browser-based tracking.

## Why Use Traccar?

- **Native GPS**: Uses device's GPS chip directly (more accurate)
- **Background tracking**: Works even when phone is locked
- **Battery optimized**: Better than keeping browser open
- **Works offline**: Queues locations when no internet
- **No browser required**: Runs as a native app

## Setup Steps

### 1. Download Traccar App

**iOS:** [Traccar Client on App Store](https://apps.apple.com/app/traccar-client/id843156974)

**Android:** [Traccar Manager on Google Play](https://play.google.com/store/apps/details?id=org.traccar.manager)

### 2. Get Your Crew Code and Nickname

First, create or join a crew on the Crew Map web app:
1. Go to https://crewmap.vercel.app
2. Create a new crew OR join with a crew code
3. Note your **Crew Code** (e.g., `CONVOY-ABC123`)
4. Note your **Nickname** (e.g., `John`)

### 3. Configure Traccar App

Open the Traccar app and configure it:

#### iOS (Traccar Client):

1. **Device ID**: Enter `CREW_CODE:NICKNAME`
   - Example: `CONVOY-ABC123:John`
   - Format: `YourCrewCode:YourNickname`

2. **Server URL**: `https://crewmap.vercel.app/api/traccar-webhook`

3. **Frequency**: `30` seconds (or your preferred interval)

4. **Distance**: `0` meters (send every update)

5. **Angle**: `0` degrees (optional)

6. **Enable Service**: Toggle ON

#### Android (Traccar Manager):

1. Tap **Settings** (gear icon)

2. **Device identifier**: Enter `CREW_CODE:NICKNAME`
   - Example: `CONVOY-ABC123:John`

3. **Server address**: `https://crewmap.vercel.app/api/traccar-webhook`

4. **Location accuracy**: `High`

5. **Frequency**: `30` seconds

6. **Distance**: `0` meters

7. **Angle**: `0` degrees

8. Toggle **Enable service** to ON

### 4. Grant Location Permissions

**iOS:**
- Go to Settings → Traccar Client → Location
- Select **Always** (for background tracking)

**Android:**
- Go to Settings → Apps → Traccar Manager → Permissions → Location
- Select **Allow all the time**

### 5. Verify It's Working

1. Open Crew Map web app: https://crewmap.vercel.app
2. You should see your location updating every 30 seconds
3. Check the "Last updated" time in the driver list

## Device ID Format

The webhook supports two formats:

### Format 1: Crew Code + Nickname (Recommended)
```
CONVOY-ABC123:John
```
- Crew Code: `CONVOY-ABC123`
- Nickname: `John`

### Format 2: Driver ID (Advanced)
```
550e8400-e29b-41d4-a716-446655440000
```
Use your actual driver UUID from the database.

## Troubleshooting

### Location Not Updating?

1. **Check Device ID format**:
   - Must be exactly `CREW_CODE:NICKNAME`
   - Case-sensitive
   - No spaces before/after colon

2. **Check Server URL**:
   - Must be: `https://crewmap.vercel.app/api/traccar-webhook`
   - No trailing slash

3. **Check Permissions**:
   - Location must be set to "Always" (iOS) or "All the time" (Android)
   - Background App Refresh must be enabled (iOS)

4. **Check Service Status**:
   - Service toggle should be ON
   - You should see a notification/status icon

5. **Check Internet Connection**:
   - App needs internet to send data
   - Will queue updates when offline and send when connected

### Battery Drain?

1. **Increase update frequency**:
   - Try 60 or 120 seconds instead of 30
   - Less frequent updates = better battery

2. **Adjust distance threshold**:
   - Set to 10-50 meters
   - Only updates when you move that distance

3. **Disable when not needed**:
   - Toggle service OFF when not driving

## Advanced Configuration

### Custom Update Logic

You can use distance + angle for smarter updates:

- **Distance**: `50` meters - only update after moving 50m
- **Angle**: `30` degrees - only update after turning 30°
- **Frequency**: `300` seconds - heartbeat every 5 min

This reduces updates when stationary or driving straight.

### Testing the Webhook

Test if your webhook is working:

```bash
curl "https://crewmap.vercel.app/api/traccar-webhook?lat=39.8283&lon=-98.5795&deviceid=CONVOY-ABC123:John"
```

Expected response: `OK`

### Using Your Own Traccar Server

If you want to run your own Traccar server:

1. Set up a Traccar server: https://www.traccar.org/server/
2. Point Traccar app to your server
3. Use Traccar's webhook/forwarding to send data to Crew Map webhook

## FAQ

**Q: Can I use both browser and Traccar?**
A: Yes! They'll both send updates to the same driver. The most recent update wins.

**Q: Does this work internationally?**
A: Yes, as long as you have GPS and internet connection.

**Q: Can I use different intervals for highway vs city?**
A: Traccar doesn't support this directly, but you can manually adjust the frequency setting.

**Q: What if I change crews?**
A: Update the Device ID in Traccar app to your new crew code.

**Q: Is my location data private?**
A: Only people in your crew (with the crew code) can see your location.

## Support

Issues or questions? Open an issue on GitHub: https://github.com/Abri1/crewmap/issues
