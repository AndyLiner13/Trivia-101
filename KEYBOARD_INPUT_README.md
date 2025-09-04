# MePhone Keyboard Input Setup

The MePhone now support### 3. Test the Setup

1. Enter the world
2. Press the configured key (H by default)
3. The MePhone should either:
   - Assign to you if unassigned
   - Navigate to home screen if already assigned to you
   - Reassign to you if assigned to someone else

## What the Keyboard Shortcut Does

The H key (or configured key) performs these actions:

1. **Assignment**: If no one owns the MePhone, assigns it to you
2. **Reassignment**: If someone else owns it, reassigns it to you  
3. **Navigation**: Ensures the MePhone shows the home screen
4. **Preparation**: Prepares the UI for interaction

**Important**: The keyboard shortcut **does not** automatically open the MePhone UI on your device. You still need to:
- Be in proximity to the MePhone CustomUI gizmo
- Press **E** (or your interaction key) to actually open the interface

The keyboard shortcut essentially "claims" the MePhone and ensures it's ready for you when you interact with it normally.oard input** - it tries to handle keyboard input directly within the MePhone CustomUI script, but falls back to a separate component if needed.

## How It Works

1. **Primary Method**: MePhone tries to set up keyboard input directly using PlayerControls
2. **Fallback Method**: If direct setup fails, it automatically switches to using a separate KeyboardInputHandler component
3. **Automatic Detection**: The system detects which method works and provides appropriate guidance

## Setup Instructions

### Option 1: Direct Integration (Recommended)

For the MePhone to handle keyboard input directly:

1. In the Horizon Worlds Editor, select your MePhone CustomUI gizmo
2. Ensure the gizmo has an **owner** set to the player
3. The MePhone will automatically try to set up keyboard input
4. If successful, you'll see: "MePhone keyboard input connected successfully"

### Option 2: Separate Component (Fallback)

If the direct method doesn't work:

1. Create a new entity (can be invisible)
2. Add a TypeScript component to the entity
3. Copy the `KeyboardInputHandler.ts` script content into the component
4. **IMPORTANT**: Set the script execution mode to **Local**
5. Set the entity owner to the player
6. The MePhone will automatically detect and use this fallback method

### 2. Configure Key Binding

The current setup uses `PlayerInputAction.LeftTertiary` which typically maps to:
- **Desktop**: H key
- **VR**: Y button (right controller)
- **Mobile**: On-screen button

To change the key binding, modify this line in `KeyboardInputHandler.ts`:
```typescript
hz.PlayerControls.connectLocalInput(
  hz.PlayerInputAction.LeftTertiary, // Change this to your preferred action
  hz.ButtonIcon.Jump,
  this,
  { preferredButtonPlacement: hz.ButtonPlacement.Center }
);
```

Available actions include:
- `LeftPrimary` (T key)
- `LeftSecondary` (G key)
- `LeftTertiary` (H key) - current
- `RightPrimary` (R key)
- `RightSecondary` (F key)
- `RightTertiary` (Y key)

### 3. Test the Setup

1. Enter the world
2. Press the configured key (H by default)
3. The MePhone should either:
   - Assign to you if unassigned
   - Navigate to home screen if already assigned to you
   - Reassign to you if assigned to someone else

## How It Works

1. `KeyboardInputHandler` component uses PlayerControls to detect key presses
2. When a key is pressed, it sends a network event to the MePhone
3. MePhone receives the event and handles the interaction appropriately
4. This separation is necessary because CustomUI scripts cannot access PlayerControls directly

## Troubleshooting

### Common Issues:

- **"PlayerControls context error"**: The CustomUI gizmo needs proper ownership. Set the gizmo owner to the player.
- **"Falling back to separate keyboard input component"**: This is normal - the system will automatically use the fallback method.
- **"LeftTertiary input action not supported"**: The platform doesn't support this input action.
- **No response to key press**: Check that the appropriate setup method is working.

### Error Messages:

- **"Exception encountered running bridge method 'IsInputActionSupported'"**: The CustomUI gizmo ownership needs to be set correctly.
- **"PlayerControls not available in this context"**: The script isn't running in the right context.
- **"No local player found"**: The world hasn't initialized the local player yet.
- **"=== FALLBACK MODE: Using separate KeyboardInputHandler ==="**: This indicates the system is using the fallback method (normal behavior).

### Setup Verification:

**For Direct Integration:**
1. Select your MePhone CustomUI gizmo in the editor
2. Check that it has an owner assigned
3. Look for "MePhone keyboard input connected successfully" in console

**For Fallback Method:**
1. Create the separate KeyboardInputHandler entity
2. Set execution mode to Local
3. Set entity owner to player
4. Look for "=== FALLBACK MODE ===" messages in console

## Alternative Interaction

The MePhone also supports proximity-based interaction:
- Walk close to the MePhone CustomUI gizmo
- Click on app icons to navigate
- All functionality works without keyboard input

## Advanced Configuration

### Changing the Key Binding

To use a different key, replace `PlayerInputAction.LeftTertiary` with another action:

```typescript
// For Spacebar
hz.PlayerInputAction.Jump

// For R key
hz.PlayerInputAction.RightPrimary

// For T key
hz.PlayerInputAction.LeftPrimary
```

### Multiple Keyboard Handlers

You can create multiple KeyboardInputHandler entities for different players, each with their own key binding preferences.
