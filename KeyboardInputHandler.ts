import * as hz from 'horizon/core';

// Keyboard Input Handler for MePhone
// This component handles keyboard input and communicates with MePhone via network events
class KeyboardInputHandler extends hz.Component<typeof KeyboardInputHandler> {
  static propsDefinition = {};

  private inputConnection: hz.PlayerInput | null = null;

  start() {
    this.setupKeyboardInput();
  }

  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available
      if (typeof hz.PlayerControls === 'undefined') {
        // PlayerControls not available in this context
        // Make sure this component is set to Local execution mode in the editor
        return;
      }

      // Check if we're running locally (required for PlayerControls)
      const localPlayer = this.world.getLocalPlayer();
      const entityOwner = this.entity.owner.get();

      if (!localPlayer) {
        // No local player found - cannot set up keyboard input
        return;
      }

      if (!entityOwner) {
        // Entity has no owner - cannot set up keyboard input
        // Set the entity owner to a player in the Horizon Worlds editor
        return;
      }

      if (entityOwner.id !== localPlayer.id) {
        // Component not running locally - PlayerControls requires local execution
        // Entity owner ID: [entityOwner.id], Local player ID: [localPlayer.id]
        // Make sure the entity owner is set to the local player
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary);
      } catch (contextError) {
        // PlayerControls context error: [contextError instanceof Error ? contextError.message : contextError]
        // This usually means:
        // 1. The component execution mode is not set to Local
        // 2. The entity is not owned by the local player
        // 3. The script is running on the server instead of locally
        // Please check your Horizon Worlds editor setup
        return;
      }

      // Try to use LeftTertiary action (maps to 'H' key on desktop)
      // You can change this to any available PlayerInputAction
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        this.inputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftTertiary,
          hz.ButtonIcon.Jump,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Center }
        );

        this.inputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Send network event to trigger MePhone interaction
            this.sendNetworkBroadcastEvent(
              new hz.NetworkEvent<{ playerId: string }>('mePhoneKeyboardTrigger'),
              { playerId: localPlayer.id.toString() }
            );
          }
        });

        // Keyboard input handler connected successfully
        // Press the key bound to LeftTertiary action to interact with MePhone
        // On desktop, this is typically the H key
      } else {
        // LeftTertiary input action not supported on this platform
      }
    } catch (error) {
      // Keyboard input handler setup failed
      if (error instanceof Error) {
        // Error message: [error.message]
        // Error stack: [error.stack]
      } else {
        // Error details: [typeof error] [error]
      }
      // Make sure this component is set to Local execution mode in the Horizon Worlds editor
    }
  }

  // Cleanup when component is destroyed
  stop() {
    if (this.inputConnection) {
      this.inputConnection.disconnect();
      this.inputConnection = null;
    }
  }
}

hz.Component.register(KeyboardInputHandler);
