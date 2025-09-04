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
        console.log('PlayerControls not available in this context');
        console.log('Make sure this component is set to Local execution mode in the editor');
        return;
      }

      // Check if we're running locally (required for PlayerControls)
      const localPlayer = this.world.getLocalPlayer();
      const entityOwner = this.entity.owner.get();

      if (!localPlayer) {
        console.log('No local player found - cannot set up keyboard input');
        return;
      }

      if (!entityOwner) {
        console.log('Entity has no owner - cannot set up keyboard input');
        console.log('Set the entity owner to a player in the Horizon Worlds editor');
        return;
      }

      if (entityOwner.id !== localPlayer.id) {
        console.log('Component not running locally - PlayerControls requires local execution');
        console.log('Entity owner ID:', entityOwner.id, 'Local player ID:', localPlayer.id);
        console.log('Make sure the entity owner is set to the local player');
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary);
      } catch (contextError) {
        console.log('PlayerControls context error:', contextError instanceof Error ? contextError.message : contextError);
        console.log('This usually means:');
        console.log('1. The component execution mode is not set to Local');
        console.log('2. The entity is not owned by the local player');
        console.log('3. The script is running on the server instead of locally');
        console.log('Please check your Horizon Worlds editor setup');
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

        console.log('Keyboard input handler connected successfully');
        console.log('Press the key bound to LeftTertiary action to interact with MePhone');
        console.log('On desktop, this is typically the H key');
      } else {
        console.log('LeftTertiary input action not supported on this platform');
      }
    } catch (error) {
      console.log('Keyboard input handler setup failed');
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      } else {
        console.log('Error details:', typeof error, error);
      }
      console.log('Make sure this component is set to Local execution mode in the Horizon Worlds editor');
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
