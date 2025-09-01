# Per Platform Scripting Documentation

You can use TypeScript to identify the type of device that the user is playing on. Use the [Player.deviceType property](https://horizon.meta.com/resources/scripting-api/core.player.devicetype.md/?api_version=2.0.0) and the [PlayerDeviceType enum](https://horizon.meta.com/resources/scripting-api/core.player.devicetype.md/?api_version=2.0.0) in a switch block.

## Usage Example

```typescript
switch (player.deviceType.get()) {
  case PlayerDeviceType.VR:
    // Handle VR-specific logic
    // - Full 6DOF motion tracking
    // - Hand controllers
    // - Room-scale movement
    break;
    
  case PlayerDeviceType.Desktop:
    // Handle Desktop-specific logic
    // - Keyboard and mouse input
    // - Screen-based interaction
    // - Point-and-click navigation
    break;
    
  case PlayerDeviceType.Mobile:
    // Handle Mobile-specific logic
    // - Touch screen input
    // - Gyroscope/accelerometer
    // - On-screen controls
    break;
    
  default:
    // Handle unknown or future device types
    // Fallback logic for new platforms
    break;
}
```

## PlayerDeviceType Enum Values

The `PlayerDeviceType` enum includes the following values:

- **`PlayerDeviceType.VR`** - Virtual Reality headsets (Meta Quest, etc.)
- **`PlayerDeviceType.Desktop`** - Desktop computers with keyboard/mouse
- **`PlayerDeviceType.Mobile`** - Mobile devices (smartphones, tablets)

## Common Use Cases

### Platform-Specific UI
```typescript
// Show different UI elements based on device type
if (player.deviceType.get() === PlayerDeviceType.Mobile) {
  // Show touch-friendly UI with larger buttons
  showMobileUI();
} else if (player.deviceType.get() === PlayerDeviceType.Desktop) {
  // Show cursor-based UI with hover states
  showDesktopUI();
} else {
  // VR - show 3D spatial UI
  showVRUI();
}
```

### Input Method Selection
```typescript
// Configure input based on device capabilities
switch (player.deviceType.get()) {
  case PlayerDeviceType.VR:
    // Use hand tracking and controller input
    enableVRControls();
    break;
  case PlayerDeviceType.Desktop:
    // Use keyboard shortcuts and mouse
    enableKeyboardControls();
    break;
  case PlayerDeviceType.Mobile:
    // Use touch gestures and on-screen buttons
    enableTouchControls();
    break;
}
```

### Performance Optimization
```typescript
// Adjust graphics settings based on device
const deviceType = player.deviceType.get();

if (deviceType === PlayerDeviceType.Mobile) {
  // Lower settings for mobile devices
  setGraphicsQuality('low');
  disableExpensiveEffects();
} else if (deviceType === PlayerDeviceType.Desktop) {
  // Medium to high settings for desktop
  setGraphicsQuality('high');
} else {
  // VR - optimize for frame rate
  setGraphicsQuality('vr-optimized');
}
```

### Feature Availability
```typescript
// Enable features based on device capabilities
const deviceType = player.deviceType.get();

// Camera API is only available on mobile and desktop
if (deviceType === PlayerDeviceType.Mobile || deviceType === PlayerDeviceType.Desktop) {
  enableCameraFeatures();
}

// Hand tracking is VR-specific
if (deviceType === PlayerDeviceType.VR) {
  enableHandTracking();
}
```

## Best Practices

1. **Always include a default case** - Handle unknown device types for future compatibility
2. **Test on all platforms** - Ensure your logic works correctly on VR, desktop, and mobile
3. **Consider device limitations** - Mobile devices may have performance constraints
4. **Use progressive enhancement** - Start with basic functionality, then add platform-specific features
5. **Provide fallbacks** - If a platform-specific feature isn't available, provide an alternative

## Integration with Other APIs

### Custom Input API
```typescript
// Use device type to determine input configuration
if (player.deviceType.get() === PlayerDeviceType.Mobile) {
  // Mobile gets on-screen buttons
  hz.PlayerControls.connectLocalInput(
    hz.PlayerInputAction.Jump,
    hz.ButtonIcon.Jump,
    this,
    { preferredButtonPlacement: hz.ButtonPlacement.BottomRight }
  );
}
```

### Camera API
```typescript
// Camera behavior varies by platform
if (player.deviceType.get() !== PlayerDeviceType.VR) {
  // Only non-VR platforms support camera mode changes
  LocalCamera.setCameraModeThirdPerson();
}
```

## Additional Links
- [Meta home](https://developers.meta.com/horizon-worlds/)
- [Login](https://developers.meta.com/login/?redirect_uri=https%3A%2F%2Fdevelopers.meta.com%2Fhorizon-worlds%2Flearn%2Fdocumentation%2Fcreate-for-web-and-mobile%2Ftypescript-apis-for-mobile%2Fper-platform-scripting%2F)