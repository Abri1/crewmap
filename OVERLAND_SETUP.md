# Overland GPS Setup Guide

Crew Map uses [Overland](https://overland.p3k.app/) - a free, open-source iOS app that tracks your location and sends it to our webhook endpoint.

## Why Overland?

- **Privacy-focused**: You control where your data goes
- **Battery efficient**: Smart tracking modes
- **Works offline**: Stores and batches location data
- **Simple setup**: Just 2 fields to configure
- **Free and open source**: No subscriptions or hidden costs

## Setup Instructions

### 1. Download Overland

- **iOS**: [Download from App Store](https://apps.apple.com/us/app/overland-gps-tracker/id1292426766)
- **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=com.openhumans.app.overland)

### 2. Get Your Configuration

After joining a crew in Crew Map, you'll see a setup screen with:
- **Receiver Endpoint**: The webhook URL where location data is sent
- **Device ID**: Your unique driver identifier (UUID)

### 3. Configure Overland

Open Overland app and go to Settings:

1. **Receiver Endpoint**: Paste your webhook URL
   - Format: `https://crewmap.vercel.app/api/overland-webhook`

2. **Device ID**: Paste your driver UUID
   - This links your location data to your crew profile

3. **Recommended Settings**:
   - **Monitoring**: Enable "Significant Location Changes"
   - **Trip Mode**: Enable for real-time tracking during drives
   - **Batch Size**: Set to 1 for instant updates (or higher for battery saving)
   - **Location Permission**: Grant "Always" access

### 4. Start Tracking

1. Tap "Start Tracking" in Overland
2. Enable "Trip Mode" when you're actively driving
3. Your location will appear on the crew map in real-time
4. Check that the app shows "OK" status for uploads

## How It Works

Overland sends location data to our webhook as GeoJSON:

```json
{
  "locations": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "timestamp": "2025-10-14T18:30:00Z",
        "speed": 15.5,
        "horizontal_accuracy": 10,
        "device_id": "your-uuid"
      }
    }
  ]
}
```

## Troubleshooting

### Location not showing on map?

1. **Check Overland status**: Look for "OK" in upload status
2. **Verify Device ID**: Must exactly match your driver UUID
3. **Check permissions**: Ensure "Always" location access
4. **Enable Trip Mode**: For frequent updates while driving
5. **Test webhook**: Look for "OK" response in Overland logs

### Battery drain?

- Increase **Batch Size** to send fewer requests
- Use "Significant Location Changes" instead of continuous tracking
- Only enable "Trip Mode" when actively driving

### Offline tracking?

Overland stores locations offline and uploads them in batches when internet is available. No data is lost!

## Technical Details

- **Protocol**: HTTP POST with JSON payload
- **Endpoint**: `/api/overland-webhook`
- **Response**: `{ "result": "ok", "saved": 1, "errors": 0 }`
- **Data retention**: Last 24 hours of location history

## Links

- [Overland Website](https://overland.p3k.app/)
- [Overland GitHub](https://github.com/aaronpk/Overland-iOS)
- [Crew Map Issues](https://github.com/Abri1/crewmap/issues)
