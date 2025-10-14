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

#### Server Connection:
1. **Server URL**: Paste your webhook URL
   - Example: `https://crewmap.vercel.app/api/overland-webhook`

2. **Device ID**: Paste your driver UUID
   - This links your location data to your crew profile

3. **Access Token**: Leave blank (not required)

#### Location Settings:
1. **Tracking Mode**: Set to "Standard" (for detailed tracking)
   - "Significant Location" uses less battery but updates less frequently
   - "Both" provides a balance

2. **Desired Accuracy**: Set to "Best" or "Nav"
   - "Best" = Most accurate, uses more battery
   - "Nav" = Good balance for driving
   - Lower accuracy = battery saving

3. **Logging Mode**: Set to "All Data"
   - Sends comprehensive location information
   - Alternative: "Only Latest" (sends just current position)

4. **Locations per Batch**: 50-200 recommended
   - Lower number = more frequent uploads (better real-time)
   - Higher number = less battery usage

5. **Location Permission**: Grant "Always" access in iOS Settings

### 4. Start Tracking

1. Toggle **"Tracking Enabled"** to ON in Overland
2. Your location will appear on the crew map
3. Check that the app shows successful uploads in the log
4. For best results while driving, use "Standard" tracking mode

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

1. **Check Overland status**: Look for successful uploads in the app log
2. **Verify Server URL**: Must be exact: `https://crewmap.vercel.app/api/overland-webhook`
3. **Verify Device ID**: Must exactly match your driver UUID (copy/paste from setup screen)
4. **Check permissions**: Ensure "Always" location access in iOS Settings
5. **Enable Tracking**: Toggle "Tracking Enabled" to ON in Overland
6. **Check Tracking Mode**: Set to "Standard" for real-time updates
7. **Test webhook**: Look for `{"result":"ok"}` response in Overland logs

### Battery drain?

- Increase **Locations per Batch** to send fewer requests (e.g., 500-1000)
- Use "Significant Location" tracking mode instead of "Standard"
- Lower **Desired Accuracy** to "100m" or "1km"
- Disable **Visit Tracking** if not needed

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
