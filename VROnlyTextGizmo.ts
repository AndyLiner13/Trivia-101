import { Component, TextGizmo, Player, PlayerDeviceType, PropTypes, CodeBlockEvents, PlayerVisibilityMode } from 'horizon/core';

/**
 * VR Only Text Gizmo Script
 * 
 * This script makes a text gizmo visible only to VR users.
 * Desktop and Mobile users will not be able to see this text.
 * 
 * Instructions:
 * 1. Attach this script to a Text Gizmo in your world
 * 2. The text will automatically hide from non-VR users when they join
 * 3. The text will show for VR users when they join
 */
class VROnlyTextGizmo extends Component<typeof VROnlyTextGizmo> {
  
  static propsDefinition = {
    // Text content to display (only visible to VR users)
    displayText: { type: PropTypes.String, default: "✅ VR Only Text - You're using VR!" },
    // Whether to log device types for debugging
    enableDebugLogging: { type: PropTypes.Boolean, default: false }
  };

  private textGizmo: TextGizmo | null = null;

  preStart() {
    // Cast the entity as a TextGizmo
    this.textGizmo = this.entity.as(TextGizmo);
    
    if (!this.textGizmo) {
      return;
    }

    // Set the text content
    this.textGizmo.text.set(this.props.displayText!);
  }

  start() {
    if (!this.textGizmo) return;

    // Listen for player join events to check their device type
    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterWorld,
      this.onPlayerEnterWorld
    );

    // Check all players already in the world when the script starts
    this.checkAllPlayersInWorld();
  }

  /**
   * Handles when a player enters the world
   */
  private onPlayerEnterWorld = (player: Player) => {
    if (!this.textGizmo) return;
    
    this.updateTextVisibilityForPlayer(player);
  }

  /**
   * Updates text visibility for a specific player based on their device type
   */
  private updateTextVisibilityForPlayer(player: Player) {
    if (!this.textGizmo) return;

    const deviceType = player.deviceType.get();

    if (deviceType === PlayerDeviceType.VR) {
      // Show text to VR users
      this.textGizmo.setVisibilityForPlayers([player], PlayerVisibilityMode.VisibleTo);
    } else {
      // Hide text from Desktop and Mobile users
      this.textGizmo.setVisibilityForPlayers([player], PlayerVisibilityMode.HiddenFrom);
    }
  }

  /**
   * Check all players currently in the world and update visibility
   */
  private checkAllPlayersInWorld() {
    if (!this.textGizmo) return;

    // Get all players in the world
    const allPlayers = this.world.getPlayers();

    // Update visibility for each player
    allPlayers.forEach(player => {
      this.updateTextVisibilityForPlayer(player);
    });
  }
}

// Register the component so it can be used in Horizon Worlds
Component.register(VROnlyTextGizmo);