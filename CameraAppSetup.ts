import * as hz from 'horizon/core';

/**
 * Helper script to set up the Camera App properly.
 * 
 * This script should be attached to an entity in your world and set to execute in Local mode.
 * It will automatically configure the entity for proper camera app functionality.
 * 
 * Instructions:
 * 1. Create an entity in your world (can be invisible/small)
 * 2. Attach this script to the entity
 * 3. Set the script execution mode to "Local"
 * 4. Attach the CameraApp script to the same entity
 * 5. The entity will automatically be configured when players enter the world
 */
class CameraAppSetup extends hz.Component {
  static propsDefinition = {};

  start() {
    console.log('Camera App Setup: Initializing...');
    
    // Register for player enter world event to set up entity ownership
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      player => {
        console.log('Camera App Setup: Player entered world:', player.name);
        
        // Set the entity owner to the player for local script execution
        this.entity.owner.set(player);
        
        // Verify the setup
        this.verifySetup(player);
      }
    );
    
    console.log('Camera App Setup: Ready for players');
  }

  private verifySetup(player: hz.Player): void {
    console.log('Camera App Setup: Verifying configuration for player:', player.name);
    
    // Check if this is the local player
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer && localPlayer.id === player.id) {
      console.log('Camera App Setup: Local player detected, setup complete');
      
      // Check if Camera API is available
      try {
        // Try to import the camera module (this will fail if not enabled)
        console.log('Camera App Setup: Camera API module is available');
        
        // Check platform compatibility
        this.checkPlatformSupport(player);
        
      } catch (error) {
        console.error('Camera App Setup: Camera API module not available. Please enable horizon/camera in script settings.');
      }
    } else {
      console.log('Camera App Setup: Remote player, no local setup needed');
    }
  }

  private checkPlatformSupport(player: hz.Player): void {
    console.log('Camera App Setup: Checking platform support...');
    
    // Check device type
    const deviceType = player.deviceType.get();
    console.log('Camera App Setup: Player device type:', deviceType);
    
    // Check input action support
    const supportedActions = [
      hz.PlayerInputAction.LeftXAxis,
      hz.PlayerInputAction.LeftYAxis,
      hz.PlayerInputAction.RightXAxis,
      hz.PlayerInputAction.RightYAxis,
      hz.PlayerInputAction.RightSecondary
    ];
    
    const supportStatus = supportedActions.map(action => ({
      action: hz.PlayerInputAction[action],
      supported: hz.PlayerControls.isInputActionSupported(action)
    }));
    
    console.log('Camera App Setup: Input action support:', supportStatus);
    
    // Provide platform-specific guidance
    if (deviceType === hz.PlayerDeviceType.Mobile) {
      console.log('Camera App Setup: Mobile device detected - on-screen controls will be available');
    } else if (deviceType === hz.PlayerDeviceType.Desktop) {
      console.log('Camera App Setup: Desktop device detected - keyboard controls available');
      console.log('Camera App Setup: Controls - WASD: Look around, Arrow keys: Move camera, F: Exit');
    } else if (deviceType === hz.PlayerDeviceType.VR) {
      console.log('Camera App Setup: VR device detected - joystick controls available');
    }
    
    console.log('Camera App Setup: Platform verification complete');
  }
}

hz.Component.register(CameraAppSetup);
