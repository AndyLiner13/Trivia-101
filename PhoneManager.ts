import * as hz from "horizon/core";
import * as ui from "horizon/ui";

// Interface for tracking phone assignments
interface PhoneAssignment {
  phoneEntity: hz.Entity;
  assignedPlayer: hz.Player | null;
  isInUse: boolean;
}

/**
 * PhoneManager handles spawning and assigning TriviaPhone entities to players
 * Uses dynamic asset spawning instead of pre-placed phones with tags
 */
export class PhoneManager extends ui.UIComponent {
  static propsDefinition = {
    triviaPhoneAsset: { type: hz.PropTypes.Asset, default: null }
  };

  private phoneAssignments: PhoneAssignment[] = [];
  private triviaPhoneAsset: hz.Asset | null = null;

  initializeUI() {
    // PhoneManager doesn't render UI, but must return a valid UINode
    return ui.View({
      style: {
        width: 0,
        height: 0
      },
      children: []
    });
  }

  async start() {
    
    // Get the TriviaPhone asset from props (if set directly)
    this.triviaPhoneAsset = this.props.triviaPhoneAsset;
    
    // Note: TriviaGame will call initialize() with the asset after start()
    // So we don't spawn phones here yet
    
    // Set up player enter/exit event handlers
    this.setupPlayerEvents();
    
  }

  /**
   * Initialize PhoneManager with a TriviaPhone asset and spawn phones for existing players
   * This should be called by TriviaGame after start()
   */
  public async initialize(triviaPhoneAsset: hz.Asset): Promise<void> {
    
    this.triviaPhoneAsset = triviaPhoneAsset;
    
    if (!this.triviaPhoneAsset) {
      
      return;
    }
    
    
    // Spawn phones for existing players
    const existingPlayers = this.world.getPlayers();
    
    for (const player of existingPlayers) {
      await this.spawnPhoneForPlayer(player);
    }

  }

  /**
   * Spawns a TriviaPhone asset for a specific player
   */
  private async spawnPhoneForPlayer(player: hz.Player): Promise<void> {
    if (!this.triviaPhoneAsset) {
      
      return;
    }

    try {
      
      // Get player position for initial spawn location
      const playerPosition = player.position.get();
      const spawnPosition = new hz.Vec3(playerPosition.x, playerPosition.y + 0.5, playerPosition.z);
      
      // Spawn the phone asset
      const spawnedEntities = await this.world.spawnAsset(
        this.triviaPhoneAsset,
        spawnPosition,
        hz.Quaternion.one,
        hz.Vec3.one
      );
      
      if (spawnedEntities.length === 0) {
        
        return;
      }
      
      const phoneEntity = spawnedEntities[0];
      
      // Add to phone assignments
      this.phoneAssignments.push({
        phoneEntity: phoneEntity,
        assignedPlayer: player,
        isInUse: true
      });
      
      // Set ownership and visibility
      this.ensurePhoneOwnership({ phoneEntity, assignedPlayer: player, isInUse: true }, player);
      
    } catch (error) {
      
    }
  }

  /**
   * Sets up player enter/exit event handlers
   */
  private setupPlayerEvents(): void {
    // Handle player joining
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => this.onPlayerEnter(player)
    );

    // Handle player leaving
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player: hz.Player) => this.onPlayerExit(player)
    );

  }

  /**
   * Handles player entering the world - spawns a phone for them
   */
  private async onPlayerEnter(player: hz.Player): Promise<void> {
    
    await this.spawnPhoneForPlayer(player);
  }

  /**
   * Handles player exiting the world - despawns their phone
   */
  private async onPlayerExit(player: hz.Player): Promise<void> {
    
    await this.despawnPlayerPhone(player);
  }

  /**
   * Assigns an available phone to a player (for backward compatibility)
   */
  public async assignPhoneToPlayer(player: hz.Player): Promise<boolean> {
    const playerId = player.id.toString();
    
    // Check if player already has a phone assigned
    const existingAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (existingAssignment) {
      
      // Ensure it's visible and owned by the player
      this.ensurePhoneOwnership(existingAssignment, player);
      return true;
    }

    // Spawn a new phone for this player
    
    await this.spawnPhoneForPlayer(player);
    return true;
  }

  /**
   * Ensures proper ownership and visibility of a phone for a player
   */
  private ensurePhoneOwnership(assignment: PhoneAssignment, player: hz.Player): void {
    try {
      // Set ownership to the specific player
      assignment.phoneEntity.owner.set(player);
      
      // Make the phone visible
      assignment.phoneEntity.visible.set(true);
      
      
    } catch (error) {
    }
  }

  /**
   * Despawns a player's phone when they leave
   */
  public async despawnPlayerPhone(player: hz.Player): Promise<void> {
    const playerAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (playerAssignment) {
      
      try {
        // Delete the phone entity from the world
        await this.world.deleteAsset(playerAssignment.phoneEntity, true);
        
        // Remove from assignments array
        const index = this.phoneAssignments.indexOf(playerAssignment);
        if (index > -1) {
          this.phoneAssignments.splice(index, 1);
        }
        
      } catch (error) {
        
        // Still remove from tracking even if despawn fails
        const index = this.phoneAssignments.indexOf(playerAssignment);
        if (index > -1) {
          this.phoneAssignments.splice(index, 1);
        }
      }
    } else {
      
    }
  }

  /**
   * Releases a player's phone assignment (backward compatibility wrapper)
   */
  public async releasePlayerPhone(player: hz.Player): Promise<void> {
    await this.despawnPlayerPhone(player);
  }

  /**
   * Gets the phone entity assigned to a specific player
   */
  public getPlayerPhone(player: hz.Player): hz.Entity | null {
    const assignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );
    
    return assignment ? assignment.phoneEntity : null;
  }

  /**
   * Gets all current phone assignments (for debugging)
   */
  public getPhoneAssignments(): PhoneAssignment[] {
    return [...this.phoneAssignments];
  }

  /**
   * Forces a refresh of all phone assignments (if needed for troubleshooting)
   */
  public async refreshAllAssignments(): Promise<void> {
    
    const currentPlayers = this.world.getPlayers();
    
    // First, despawn all existing phones
    for (const assignment of [...this.phoneAssignments]) {
      try {
        await this.world.deleteAsset(assignment.phoneEntity, true);
      } catch (error) {
        
      }
    }
    this.phoneAssignments = [];

    // Then spawn new phones for current players
    for (const player of currentPlayers) {
      await this.spawnPhoneForPlayer(player);
    }

  }

  /**
   * Debug method to log current phone assignment state
   */
  public debugPhoneAssignments(): void {
    
  }

  /**
   * Gets the total number of available phones
   */
  public getAvailablePhoneCount(): number {
    return this.phoneAssignments.filter(a => !a.isInUse).length;
  }

  /**
   * Gets the total number of phones
   */
  public getTotalPhoneCount(): number {
    return this.phoneAssignments.length;
  }
}

// Register the component so it can be attached to entities
ui.UIComponent.register(PhoneManager);
