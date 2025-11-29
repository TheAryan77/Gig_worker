# Agora Video Call Integration

This guide explains how to set up and use the Agora video calling feature in TrustHire.

## Setup

### 1. Get Agora App ID

1. Go to [Agora Console](https://console.agora.io/)
2. Sign up or log in
3. Create a new project
4. Copy your App ID

### 2. Add to Environment Variables

Add your Agora App ID to your `.env` file:

```env
NEXT_PUBLIC_AGORA_APP_ID=your_actual_agora_app_id
```

### 3. Install Dependencies

Dependencies are already installed:
- `agora-rtc-sdk-ng` - Agora RTC SDK for video calling
- `agora-access-token` - For generating access tokens (optional)

## Usage

### Starting a Video Call

1. Navigate to any project page (`/project/[projectId]`)
2. Click the **Video** button in the Quick Actions panel (bottom left)
3. You'll be redirected to the video call page
4. Click "Join Call" to start the video conference

### Video Call Features

✅ **Real-time Video & Audio**
- HD video streaming
- Crystal clear audio
- Multiple participants support

✅ **Controls**
- Toggle camera on/off
- Mute/unmute microphone
- Leave call

✅ **TrustHire Theme**
- Orange and white color scheme
- Modern, clean interface
- Smooth animations

✅ **Project Integration**
- Automatic room naming based on project ID
- Project name displayed in header
- User name from Firebase auth

## File Structure

```
app/
  video-call/
    [projectId]/
      page.tsx          # Video call page component

hooks/
  useAgora.ts          # Custom hook for Agora functionality
```

## How It Works

1. **Room Creation**: Each project gets a unique room ID (`project-{projectId}`)
2. **Joining**: When users click the video button, they're redirected to the video call page
3. **Connection**: Agora SDK connects users in the same room
4. **Streaming**: Local and remote video/audio streams are displayed

## Customization

### Change Video Layout

Edit `/app/video-call/[projectId]/page.tsx`:

```tsx
// Change grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* video components */}
</div>
```

### Add More Controls

Add additional buttons in the controls section:

```tsx
<button onClick={yourFunction}>
  <YourIcon />
</button>
```

### Modify Theme Colors

Update the Tailwind classes:
- `from-orange-500` → your primary color
- `border-orange-200` → your border color

## Security Notes

⚠️ **Important**:
- The current implementation uses a simple channel name without tokens
- For production, implement [Agora Token Authentication](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- Add server-side token generation
- Implement user permissions and access control

## Troubleshooting

### Video not working?
- Check camera permissions in browser
- Ensure HTTPS is enabled (required for WebRTC)
- Verify Agora App ID is correct

### Can't hear audio?
- Check microphone permissions
- Ensure browser has audio access
- Check system audio settings

### Connection issues?
- Verify internet connection
- Check firewall settings
- Ensure ports 80, 443, 3478-3497 are open

## Production Deployment

Before deploying to production:

1. ✅ Add Agora token authentication
2. ✅ Implement room access control
3. ✅ Add recording functionality (optional)
4. ✅ Set up monitoring and analytics
5. ✅ Test with multiple participants
6. ✅ Optimize for mobile devices

## Resources

- [Agora Documentation](https://docs.agora.io/)
- [Agora SDK Reference](https://api-ref.agora.io/en/video-sdk/web/4.x/index.html)
- [TrustHire Support](mailto:support@trusthire.com)
