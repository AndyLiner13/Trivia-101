import { Component, TextGizmo, Player, PlayerDeviceType, PropTypes, PlayerVisibilityMode } from 'horizon/core';

/**
 * Simple VR Only Text Gizmo Script
 * 
 * This is a simpler version that checks all players periodically.
 * It makes a text gizmo visible only to VR users.
 * Desktop and Mobile users will not be able to see this text.
 * 
 * Instructions:
 * 1. Attach this script to a Text Gizmo in your world
 * 2. The text will automatically hide from non-VR users
 * 3. The text will show for VR users
 */
class SimpleVROnlyTextGizmo extends Component<typeof SimpleVROnlyTextGizmo> {
  
  static propsDefinition = {
    // Text content to display (only visible to VR users)
    displayText: { type: PropTypes.String, default: "✅ VR Only Text - You're using VR!" },
    // How often to check for new players (in seconds)
    checkInterval: { type: PropTypes.Number, default: 2.0 },
    // Whether to log device types for debugging
    enableDebugLogging: { type: PropTypes.Boolean, default: false }
  };

  private textGizmo: TextGizmo | null = null;
  private lastPlayerCount: number = 0;

  preStart() {
    // Cast the entity as a TextGizmo
    this.textGizmo = this.entity.as(TextGizmo);
    
    if (!this.textGizmo) {
      console.log("❌ SimpleVROnlyTextGizmo: This script must be attached to a Text Gizmo!");
      return;
    }

    // Set the text content
    this.textGizmo.text.set(this.props.displayText!);
    
    if (this.props.enableDebugLogging!) {
      console.log("✅ SimpleVROnlyTextGizmo: Component initialized");
    }
  }

  start() {
    if (!this.textGizmo) return;

    // Initial check for all players
    this.updateVisibilityForAllPlayers();

    // Set up periodic checking for new players
    this.async.setInterval(() => {
      this.checkForPlayerChanges();
    }, this.props.checkInterval! * 1000);
  }

  /**
   * Check if the number of players has changed and update visibility
   */
  private checkForPlayerChanges() {
    if (!this.textGizmo) return;

    const currentPlayers = this.world.getPlayers();
    
    if (currentPlayers.length !== this.lastPlayerCount) {
      if (this.props.enableDebugLogging!) {
        console.log(`✅ SimpleVROnlyTextGizmo: Player count changed from ${this.lastPlayerCount} to ${currentPlayers.length}`);
      }
      
      this.updateVisibilityForAllPlayers();
      this.lastPlayerCount = currentPlayers.length;
    }
  }

  /**
   * Update visibility for all players currently in the world
   */
  private updateVisibilityForAllPlayers() {
    if (!this.textGizmo) return;

    const allPlayers = this.world.getPlayers();
    const vrPlayers: Player[] = [];
    const nonVRPlayers: Player[] = [];
    
    // Categorize players by device type
    allPlayers.forEach(player => {
      const deviceType = player.deviceType.get();
      
      if (this.props.enableDebugLogging!) {
        console.log(`✅ SimpleVROnlyTextGizmo: Player ${player.name.get()} has device type: ${deviceType}`);
      }
      
      if (deviceType === PlayerDeviceType.VR) {
        vrPlayers.push(player);
      } else {
        nonVRPlayers.push(player);
      }
    });

    // Show text to VR users only
    if (vrPlayers.length > 0) {
      this.textGizmo.setVisibilityForPlayers(vrPlayers, PlayerVisibilityMode.VisibleTo);
      
      if (this.props.enableDebugLogging!) {
        console.log(`✅ SimpleVROnlyTextGizmo: Text made visible to ${vrPlayers.length} VR users`);
      }
    }

    // Hide text from non-VR users
    if (nonVRPlayers.length > 0) {
      this.textGizmo.setVisibilityForPlayers(nonVRPlayers, PlayerVisibilityMode.HiddenFrom);
      
      if (this.props.enableDebugLogging!) {
        console.log(`✅ SimpleVROnlyTextGizmo: Text hidden from ${nonVRPlayers.length} non-VR users`);
      }
    }

    this.lastPlayerCount = allPlayers.length;
  }
}

// Register the component so it can be used in Horizon Worlds
Component.register(SimpleVROnlyTextGizmo);