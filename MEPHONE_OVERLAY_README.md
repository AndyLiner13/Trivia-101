# MePhone Overlay Setup

The MePhone now works as an **overlay** that appears when pressing the **M key**. This is a complete redesign from the proximity-based CustomUI approach.

## New Overlay System

### What Changed:
- **No physical gizmo required** - The MePhone is now an overlay on the player's screen
- **Keyboard-triggered** - Press M to show/hide the MePhone
- **Player-specific** - Only visible to the player who activated it
- **No proximity interaction** - No need to walk close to a gizmo and press E

### How It Works:
1. **Press M** to toggle the MePhone overlay
2. **First press** assigns the MePhone to you and shows the overlay
3. **Subsequent presses** toggle the overlay visibility
4. **Close button** (×) in top-right corner to close the overlay
5. **Only you can see** your MePhone overlay

## Setup Instructions

### 1. Create the Overlay Entity

1. In the Horizon Worlds Editor, create a new entity (invisible is fine)
2. Add a **TypeScript** component to the entity
3. Copy the `MePhoneOverlay.ts` script content into the component
4. **IMPORTANT**: Set the component to **Local execution mode**
5. Set the entity **owner** to the player who should control the MePhone

### 2. Configure Key Binding

The overlay uses `PlayerInputAction.LeftTertiary` which maps to:
- **Desktop**: M key
- **VR**: Y button (right controller)
- **Mobile**: On-screen button

To change the key, modify this line in `MePhoneOverlay.ts`:
```typescript
hz.PlayerControls.connectLocalInput(
  hz.PlayerInputAction.LeftTertiary, // Change this to your preferred action
  hz.ButtonIcon.Jump,
  this,
  { preferredButtonPlacement: hz.ButtonPlacement.Center }
);
```

### 3. Test the Overlay

1. Publish your world
2. Enter the world as a player
3. Press **M** to open the MePhone overlay
4. Use the **×** button to close it
5. Press **M** again to reopen it

## Key Differences from Previous Version

| Feature | Old (CustomUI) | New (Overlay) |
|---------|----------------|---------------|
| **Activation** | Walk close + Press E | Press M key |
| **Visibility** | All players see gizmo | Only activating player sees overlay |
| **Physical Space** | Requires gizmo placement | No physical presence needed |
| **Multiplayer** | One shared phone | Each player can have their own |
| **Setup** | Complex proximity setup | Simple entity + script |

## Troubleshooting

### Common Issues:

- **Overlay doesn't appear**: Make sure the component is set to Local execution mode
- **M key doesn't work**: Check that the entity has an owner assigned
- **Multiple players**: Each player needs their own MePhoneOverlay entity
- **Can't interact**: Ensure you're the owner of the entity

### Setup Verification:

1. Check console for: "MePhone overlay keyboard input connected successfully"
2. Verify entity ownership in the editor
3. Confirm Local execution mode is enabled
4. Test with a single player first

## Migration from CustomUI

If you were using the old CustomUI MePhone:

1. **Keep both** - The overlay and CustomUI can coexist
2. **Gradual migration** - Test the overlay with a few players first
3. **Data compatibility** - Both systems use the same app data
4. **Backward compatibility** - Old proximity interaction still works

## Advanced Features

### Multiple MePhones
- Create multiple MePhoneOverlay entities
- Each can have different key bindings
- Different players can have different MePhones

### Custom Key Bindings
Available actions include:
- `LeftPrimary` (T key)
- `LeftSecondary` (G key)
- `LeftTertiary` (M key) - current
- `RightPrimary` (R key)
- `RightSecondary` (F key)
- `RightTertiary` (Y key)</content>
<parameter name="filePath">c:\Users\conta\AppData\LocalLow\Meta\Horizon Worlds\1976511553160027\scripts\MEPHONE_OVERLAY_README.md
