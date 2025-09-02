import * as hz from 'horizon/core';

// Interface for tracking phone assignments
interface PhoneAssignment {
  phoneEntity: hz.Entity;
  assignedPlayer: hz.Player | null;
  isInUse: boolean;
}

class PhoneManager extends hz.Component<{}> {
  static propsDefinition = {};

  private phoneAssignments: PhoneAssignment[] = [];
  private maxPhones = 20; // Maximum number of phone entities we expect

  start() {
    // Implementation required by Component
  }

  preStart() {
    // Find all MePhone CustomUI entities in the world
    this.discoverPhoneEntities();
    
    // Connect to player events
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => this.onPlayerEnter(player)
    );
    
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player: hz.Player) => this.onPlayerExit(player)
    );

    // Assign phones to existing players
    this.world.getPlayers().forEach(player => {
      this.assignPhoneToPlayer(player);
    });
  }

  private discoverPhoneEntities() {
    console.log('[PhoneManager] Discovering MePhone entities...');
    
    // Find all entities in the world with the "MePhone" tag
    const allEntitiesInWorld = this.world.getEntitiesWithTags(['MePhone']);
    
    for (const entity of allEntitiesInWorld) {
      this.phoneAssignments.push({
        phoneEntity: entity,
        assignedPlayer: null,
        isInUse: false
      });
      
      // Initially set the phone to be invisible
      entity.visible.set(false);
      
      console.log(`[PhoneManager] Found phone entity: ${entity.name.get()} with MePhone tag`);
    }
    
    console.log(`[PhoneManager] Discovered ${this.phoneAssignments.length} phone entities with MePhone tag`);
  }

  // Method to manually add phone entities
  public addPhoneEntity(phoneEntity: hz.Entity) {
    this.phoneAssignments.push({
      phoneEntity: phoneEntity,
      assignedPlayer: null,
      isInUse: false
    });
    
    // Initially set the phone to be invisible
    phoneEntity.visible.set(false);
    
    console.log(`[PhoneManager] Added phone entity: ${phoneEntity.name.get()}`);
  }

  private onPlayerEnter(player: hz.Player) {
    console.log(`[PhoneManager] Player ${player.name.get()} (ID: ${player.index.get()}) entered world`);
    this.assignPhoneToPlayer(player);
  }

  private onPlayerExit(player: hz.Player) {
    console.log(`[PhoneManager] Player ${player.name.get()} (ID: ${player.index.get()}) exited world`);
    this.releasePlayerPhone(player);
  }

  private assignPhoneToPlayer(player: hz.Player) {
    // Check if player already has a phone assigned
    const existingAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );
    
    if (existingAssignment) {
      console.log(`[PhoneManager] Player ${player.name.get()} already has a phone assigned`);
      return;
    }

    // Find an available phone
    const availablePhone = this.phoneAssignments.find(
      assignment => !assignment.isInUse && assignment.assignedPlayer === null
    );

    if (availablePhone) {
      // Assign the phone to the player
      availablePhone.assignedPlayer = player;
      availablePhone.isInUse = true;
      
      // Make the phone visible only to this player
      availablePhone.phoneEntity.visible.set(false); // Hide from everyone first
      // Note: Player-specific visibility may need to be handled differently in Horizon
      // You may need to use a different approach for per-player visibility
      availablePhone.phoneEntity.visible.set(true);
      
      // Set ownership of the phone entity to this player
      availablePhone.phoneEntity.owner.set(player);
      
      console.log(`[PhoneManager] Assigned phone ${availablePhone.phoneEntity.name.get()} to player ${player.name.get()}`);
      
      // Note: Due to component access limitations, the MePhone component will auto-assign
      // itself when the player first interacts with it. The PhoneManager just manages
      // entity ownership and visibility.
      
      console.log(`[PhoneManager] Phone assigned to player ${player.name.get()} - MePhone will auto-initialize on first interaction`);
      
      console.log(`[PhoneManager] Phone assigned to player ${player.name.get()}`);
    } else {
      console.warn(`[PhoneManager] No available phones for player ${player.name.get()}`);
      
      // Optionally create a new phone entity dynamically if none available
      // This would require instantiating a new CustomUI entity
      this.createNewPhoneForPlayer(player);
    }
  }

  private releasePlayerPhone(player: hz.Player) {
    const playerAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (playerAssignment) {
      console.log(`[PhoneManager] Releasing phone ${playerAssignment.phoneEntity.name.get()} from player ${player.name.get()}`);
      
      // Hide the phone entity
      playerAssignment.phoneEntity.visible.set(false);
      
      // Note: Cannot set owner to null, so we'll leave it as is or set to another player
      // playerAssignment.phoneEntity.owner.set(null); // This causes error
      
      // Mark as available
      playerAssignment.assignedPlayer = null;
      playerAssignment.isInUse = false;
      
      console.log(`[PhoneManager] Phone ${playerAssignment.phoneEntity.name.get()} is now available`);
    } else {
      console.warn(`[PhoneManager] No phone assignment found for player ${player.name.get()}`);
    }
  }

  private createNewPhoneForPlayer(player: hz.Player) {
    // This is a placeholder for dynamic phone creation
    // In Horizon Worlds, you would typically pre-place enough phone entities
    // rather than creating them dynamically
    console.warn(`[PhoneManager] Dynamic phone creation not implemented. Consider adding more phone entities to the world.`);
  }

  // Public method to get phone assignment for a player (for debugging)
  public getPlayerPhone(player: hz.Player): hz.Entity | null {
    const assignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );
    return assignment ? assignment.phoneEntity : null;
  }

  // Public method to get all assignments (for debugging)
  public getAssignments(): PhoneAssignment[] {
    return [...this.phoneAssignments];
  }

  // Method to handle phone availability changes
  public notifyPhoneAvailable(phoneEntity: hz.Entity) {
    const assignment = this.phoneAssignments.find(
      assignment => assignment.phoneEntity === phoneEntity
    );
    
    if (assignment && assignment.isInUse) {
      assignment.isInUse = false;
      console.log(`[PhoneManager] Phone ${phoneEntity.name.get()} marked as available`);
      
      // Try to assign to any waiting players if needed
      this.tryAssignWaitingPlayers();
    }
  }

  private tryAssignWaitingPlayers() {
    // Find players without phones and try to assign them
    const playersWithoutPhones = this.world.getPlayers().filter(player => {
      return !this.phoneAssignments.some(
        assignment => assignment.assignedPlayer === player
      );
    });

    for (const player of playersWithoutPhones) {
      this.assignPhoneToPlayer(player);
    }
  }
}

hz.Component.register(PhoneManager);
