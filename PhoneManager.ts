import * as hz from "horizon/core";
import * as ui from "horizon/ui";

// Interface for tracking phone assignments
interface PhoneAssignment {
  phoneEntity: hz.Entity;
  assignedPlayer: hz.Player | null;
  isInUse: boolean;
}

/**
 * PhoneManager handles ownership and assignment of TriviaPhone entities to players
 * Replaces Asset Pool Gizmo functionality with direct entity ownership management
 */
export class PhoneManager extends ui.UIComponent {
  private phoneAssignments: PhoneAssignment[] = [];

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
    
    // Discover all TriviaPhone entities with the "TriviaPhone" tag
    this.discoverPhoneEntities();
    
    // Set up player enter/exit event handlers
    this.setupPlayerEvents();

  }

  /**
   * Discovers all entities with the "TriviaPhone" tag and adds them to management
   */
  private discoverPhoneEntities(): void {
    
    const phoneEntities = this.world.getEntitiesWithTags(['TriviaPhone']);

    phoneEntities.forEach((phoneEntity: hz.Entity, index: number) => {
      this.phoneAssignments.push({
        phoneEntity: phoneEntity,
        assignedPlayer: null,
        isInUse: false
      });
      
      // Initially hide all phones - they'll be shown when assigned to players
      phoneEntity.visible.set(false);
      
    });

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
   * Handles player entering the world - assigns them a phone
   */
  private onPlayerEnter(player: hz.Player): void {
    this.assignPhoneToPlayer(player);
  }

  /**
   * Handles player exiting the world - releases their phone
   */
  private onPlayerExit(player: hz.Player): void {
    this.releasePlayerPhone(player);
  }

  /**
   * Assigns an available phone to a player
   */
  public assignPhoneToPlayer(player: hz.Player): boolean {
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

    // Find an available phone
    const availablePhone = this.phoneAssignments.find(
      assignment => !assignment.isInUse && assignment.assignedPlayer === null
    );

    if (availablePhone) {
      
      // Assign the phone to the player
      availablePhone.assignedPlayer = player;
      availablePhone.isInUse = true;

      // Set ownership and make visible to the player
      this.ensurePhoneOwnership(availablePhone, player);
      
      return true;
    } else {
      return false;
    }
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
   * Releases a player's phone assignment
   */
  public releasePlayerPhone(player: hz.Player): void {
    const playerAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (playerAssignment) {
      
      try {
        // Remove ownership - commenting out as it might cause issues, just hide instead
        // playerAssignment.phoneEntity.owner.set(null);
        
        // Hide the phone entity
        playerAssignment.phoneEntity.visible.set(false);

        // Mark as available
        playerAssignment.assignedPlayer = null;
        playerAssignment.isInUse = false;
        
        
      } catch (error) {
        // Still mark as available even if there was an error
        playerAssignment.assignedPlayer = null;
        playerAssignment.isInUse = false;
      }
    } else {
    }
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
  public refreshAllAssignments(): void {
    
    const currentPlayers = this.world.getPlayers();
    
    // First, release all assignments
    this.phoneAssignments.forEach(assignment => {
      if (assignment.assignedPlayer) {
        // assignment.phoneEntity.owner.set(null); // Commented out to avoid type issues
        assignment.phoneEntity.visible.set(false);
        assignment.assignedPlayer = null;
        assignment.isInUse = false;
      }
    });

    // Then reassign to current players
    currentPlayers.forEach(player => {
      this.assignPhoneToPlayer(player);
    });
    
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
