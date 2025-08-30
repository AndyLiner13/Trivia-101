# MePhone - Integrated Phone System for Horizon Worlds

## Overview

MePhone is a comprehensive phone interface that integrates all the existing individual app files into a seamless, unified phone experience for Horizon Worlds. This system provides a native mobile phone UI using the Horizon Worlds CustomUI API.

## Features

- **Unified Interface**: All existing apps (PhoneApp, CalculatorApp, ContactsApp, etc.) are integrated into a single phone system
- **Realistic Phone Design**: Complete with phone frame, status bar, and realistic proportions
- **Navigation System**: Intuitive navigation between apps with back/forward functionality
- **State Management**: Maintains app states across navigation using UI bindings
- **Extensible Architecture**: Easy to add new apps or modify existing ones

## File Structure

```
MePhone.ts                 # Main phone interface component
MePhone/
├── index.ts              # Type definitions and app configurations
├── components/
│   ├── PhoneFrame.ts     # Physical phone container and status bar
│   ├── HomeScreen.ts     # App grid home screen
│   └── AppHeader.ts      # Standard header for all apps
└── apps/
    └── DemoApp.ts        # Template for app integration
```

## Integration with Existing Apps

The MePhone system integrates with the following existing root directory files:

- `HomeScreen.ts` - App launcher interface
- `PhoneApp.ts` - Phone dialer functionality
- `CalculatorApp.ts` - Calculator functionality
- `ContactsApp.ts` - Contact management
- `MeMailApp.ts` - Email interface
- `BrowserApp.ts` - Web browser
- `SettingsApp.ts` - Phone settings
- `MeShop.ts` - Shopping interface
- `MeBank.ts` - Banking interface
- `MeNews.ts` - News reader

## How It Works

1. **Main Component**: `MePhone.ts` serves as the primary UIComponent that manages the entire phone interface
2. **Navigation**: Uses UI bindings to manage current app state and navigation history
3. **App Rendering**: Each app is conditionally rendered based on the current navigation state
4. **State Persistence**: App states are maintained across navigation using bindings

## Usage

1. Attach the `MePhone` component to a Custom UI gizmo in Horizon Worlds
2. The phone will start on the home screen showing all available apps
3. Touch/click any app icon to navigate to that app
4. Use the back arrow or home button to navigate between apps

## App Structure

Each integrated app follows this pattern:

```typescript
// App renders within the phone frame
private renderAppName(): ui.UINode {
  return ui.View({
    style: { /* app styles */ },
    children: [
      this.renderAppHeader('App Name', '📱'),
      // App content here
    ]
  });
}
```

## Navigation API

The MePhone system provides these navigation methods:

- `navigateToApp(app, data?)` - Navigate to a specific app
- `navigateToHome()` - Return to home screen
- `navigateBack()` - Go back to previous screen

## Customization

### Adding New Apps

1. Add the app type to `ScreenType` in `index.ts`
2. Add app configuration to `APP_CONFIGS`
3. Create render method in `MePhone.ts`
4. Add conditional rendering in `renderCurrentApp()`

### Modifying Existing Apps

The existing root directory app files can be modified independently. The MePhone system provides the framework and navigation, while the actual app logic remains in the original files.

## Technical Details

- **Panel Size**: 250x450 pixels optimized for phone proportions
- **Framework**: Uses Horizon Worlds CustomUI API v2.0.0
- **Styling**: Follows mobile design patterns with appropriate spacing and colors
- **Performance**: Efficient conditional rendering minimizes UI updates

## Reference Implementation

The MePhoneReference folder contains a React/TypeScript implementation that demonstrates the target user experience. The Horizon Worlds implementation follows the same interaction patterns and visual design.

## Future Enhancements

- Integration of actual app functionality from root directory files
- Cross-app communication and data sharing
- Enhanced animations and transitions
- More sophisticated state management
- Additional system apps (camera, music player, etc.)

---

This MePhone system transforms individual app components into a cohesive mobile phone experience within the Horizon Worlds environment.
