import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';

// Interface to track player avatar data
interface PlayerAvatarData {
  playerId: number; // Store player ID instead of player object to avoid circular references
  name: string;
  avatarImageSource: ui.ImageSource | null;
  isLoading: boolean;
}

/**
 * AvatarOverlay component displays all players in the world as a CustomUI overlay
 * Shows a grid of player avatars with their names in a compact, scrollable format
 */
class AvatarOverlay extends ui.UIComponent<typeof AvatarOverlay> {
  static propsDefinition = {};

  // Panel size for the overlay - make it compact but visible
  panelWidth = 250;
  panelHeight = 400;

  // Binding to track all players' avatar data
  private playersBinding = new ui.Binding<PlayerAvatarData[]>([]);
  
  // Track last update time to throttle updates
  private lastUpdate: number = 0;
  private updateThrottleMs: number = 2000; // Update every 2 seconds max
  private isComponentReady: boolean = false;

  // Cache of current players for lookup by ID
  private playersCache: Map<number, hz.Player> = new Map();

  /**
   * Check if the component is ready to update players
   */
  private isReady(): boolean {
    if (!this.isComponentReady) {
      console.log('[AvatarOverlay] Component not ready yet');
      return false;
    }
    
    if (!this.world) {
      console.error('[AvatarOverlay] World object not available');
      return false;
    }

    return true;
  }

  initializeUI(): ui.UINode {
    console.log('[AvatarOverlay] Initializing UI');
    
    // Set up world event listeners to update when players join/leave
    try {
      this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
        console.log(`[AvatarOverlay] Player entered world: ${player.name.get()}, updating player list`);
        this.updatePlayersList();
      });
      
      this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerExitWorld, (player: hz.Player) => {
        console.log(`[AvatarOverlay] Player exited world: ${player.name.get()}, updating player list`);
        this.updatePlayersList();
      });
      
      console.log('[AvatarOverlay] Event listeners set up successfully');
    } catch (error) {
      console.error('[AvatarOverlay] Error setting up event listeners:', error);
    }

    console.log('[AvatarOverlay] UI initialization complete, waiting for start() to trigger player list update');

    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'flex-start',
        alignItems: 'center'
      },
      children: [
        // Header
        ui.View({
          style: {
            width: '100%',
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 8
          },
          children: [
            ui.Text({
              text: 'Players in World',
              style: {
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center'
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.playersBinding], (players) => 
                `${players.length} player${players.length !== 1 ? 's' : ''} online`
              ),
              style: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 2
              }
            })
          ]
        }),

        // Players List - Scrollable
        ui.ScrollView({
          style: {
            flex: 1,
            width: '100%'
          },
          children: [
            ui.View({
              style: {
                width: '100%',
                paddingBottom: 8
              },
              children: [
                // Dynamic list of players
                ui.DynamicList<PlayerAvatarData>({
                  data: this.playersBinding,
                  renderItem: (playerData: PlayerAvatarData, index?: number) => this.renderPlayerItem(playerData, index || 0)
                })
              ]
            })
          ]
        }),

        // Refresh button
        ui.Pressable({
          style: {
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginTop: 8
          },
          onPress: () => {
            console.log('[AvatarOverlay] Manual refresh button pressed');
            this.lastUpdate = 0; // Reset throttle
            this.updatePlayersList();
          },
          children: [
            ui.Text({
              text: 'Refresh',
              style: {
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }

  /**
   * Renders an individual player item in the list
   */
  private renderPlayerItem(playerData: PlayerAvatarData, index: number): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%'
      },
      children: [
        // Avatar container
        ui.View({
          style: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            overflow: 'hidden'
          },
          children: [
            // Show avatar image if loaded, otherwise show placeholder
            ui.UINode.if(
              playerData.avatarImageSource !== null && !playerData.isLoading,
              ui.Image({
                source: playerData.avatarImageSource || new ui.ImageSource(),
                style: {
                  width: 40,
                  height: 40,
                  borderRadius: 20
                }
              })
            ),
            // Loading/placeholder text
            ui.UINode.if(
              playerData.avatarImageSource === null || playerData.isLoading,
              ui.Text({
                text: playerData.isLoading ? '...' : playerData.name.charAt(0).toUpperCase(),
                style: {
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center'
                }
              })
            )
          ]
        }),

        // Player info
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center'
          },
          children: [
            ui.Text({
              text: playerData.name,
              style: {
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '500',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: 'Online',
              style: {
                color: 'rgba(34, 197, 94, 1)', // green-500
                fontSize: 10,
                fontWeight: '400'
              }
            })
          ]
        }),

        // Status indicator
        ui.View({
          style: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#22C55E' // green-500
          }
        })
      ]
    });
  }

  /**
   * Updates the list of players and their avatar data
   */
  private updatePlayersList(): void {
    console.log('[AvatarOverlay] Starting updatePlayersList method');
    
    // Check if component is ready
    if (!this.isReady()) {
      console.log('[AvatarOverlay] Component not ready, skipping update');
      return;
    }
    
    // Throttle updates to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastUpdate < this.updateThrottleMs) {
      console.log(`[AvatarOverlay] Update throttled - last update was ${(now - this.lastUpdate) / 1000} seconds ago`);
      return;
    }
    this.lastUpdate = now;

    console.log('[AvatarOverlay] Updating players list');

    try {
      // Check if world object exists
      if (!this.world) {
        console.error('[AvatarOverlay] World object is null or undefined');
        this.playersBinding.set([]);
        return;
      }

      console.log('[AvatarOverlay] World object exists, getting players...');
      const players = this.world.getPlayers();
      
      if (!players) {
        console.error('[AvatarOverlay] getPlayers() returned null or undefined');
        this.playersBinding.set([]);
        return;
      }

      console.log(`[AvatarOverlay] Found ${players.length} players in world`);

      if (players.length === 0) {
        console.log('[AvatarOverlay] No players found, setting empty list');
        this.playersBinding.set([]);
        return;
      }

      // Create initial player data array with loading state
      console.log('[AvatarOverlay] Creating player data array...');
      const playersData: PlayerAvatarData[] = [];
      
      // Clear and update the players cache
      this.playersCache.clear();
      
      for (let i = 0; i < players.length; i++) {
        try {
          const player = players[i];
          if (!player) {
            console.warn(`[AvatarOverlay] Player at index ${i} is null or undefined`);
            continue;
          }

          let playerName = 'Unknown Player';
          try {
            playerName = player.name.get() || 'Unknown Player';
          } catch (nameError) {
            console.warn(`[AvatarOverlay] Error getting name for player at index ${i}:`, nameError);
          }

          const playerId = player.id;
          
          // Store player in cache for later lookup
          this.playersCache.set(playerId, player);

          playersData.push({
            playerId: playerId,
            name: playerName,
            avatarImageSource: null,
            isLoading: true
          });
          
          console.log(`[AvatarOverlay] Added player data for: ${playerName} (ID: ${playerId})`);
        } catch (playerError) {
          console.error(`[AvatarOverlay] Error processing player at index ${i}:`, playerError);
        }
      }

      if (playersData.length === 0) {
        console.log('[AvatarOverlay] No valid players found after processing, setting empty list');
        this.playersBinding.set([]);
        return;
      }

      // Set initial data (with loading state)
      console.log(`[AvatarOverlay] Setting binding with ${playersData.length} players...`);
      this.playersBinding.set(playersData);
      console.log(`[AvatarOverlay] Set initial player data for ${playersData.length} players`);

      // Load avatar images asynchronously for each player
      console.log('[AvatarOverlay] Starting avatar loading for all players...');
      playersData.forEach((playerData, index) => {
        this.loadPlayerAvatar(playerData, index, playersData);
      });

    } catch (error) {
      console.error('[AvatarOverlay] Error updating players list:', error);
      console.error('[AvatarOverlay] Error details:', {
        message: (error as any)?.message || 'No message',
        stack: (error as any)?.stack || 'No stack trace',
        name: (error as any)?.name || 'Unknown error type'
      });
      // Set empty list on error
      try {
        this.playersBinding.set([]);
      } catch (bindingError) {
        console.error('[AvatarOverlay] Error setting empty binding:', bindingError);
      }
    }
  }

  /**
   * Loads avatar for a specific player
   */
  private loadPlayerAvatar(playerData: PlayerAvatarData, index: number, playersData: PlayerAvatarData[]): void {
    try {
      console.log(`[AvatarOverlay] Loading avatar for player: ${playerData.name} (ID: ${playerData.playerId})`);
      
      // Look up the player object from cache
      const player = this.playersCache.get(playerData.playerId);
      if (!player) {
        console.warn(`[AvatarOverlay] Player object not found in cache for ID: ${playerData.playerId} (${playerData.name})`);
        this.setPlayerAvatarFailed(playerData, index, playersData);
        return;
      }

      // Add a timeout to prevent hanging
      const timeoutId = this.async.setTimeout(() => {
        console.warn(`[AvatarOverlay] Avatar loading timed out for player: ${playerData.name}`);
        this.setPlayerAvatarFailed(playerData, index, playersData);
      }, 10000); // 10 second timeout
      
      Social.getAvatarImageSource(player, {
        type: AvatarImageType.HEADSHOT,
        highRes: false // Use lower resolution for performance in overlay
      }).then((avatarImageSource) => {
        // Clear the timeout since we got a response
        this.async.clearTimeout(timeoutId);
        
        console.log(`[AvatarOverlay] Avatar loaded successfully for player: ${playerData.name}`);
        
        // Validate the image source
        if (!avatarImageSource) {
          console.warn(`[AvatarOverlay] Received null/invalid avatar image source for player: ${playerData.name}`);
          this.setPlayerAvatarFailed(playerData, index, playersData);
          return;
        }
        
        // Update the specific player's data
        try {
          playersData[index] = {
            ...playerData,
            avatarImageSource: avatarImageSource,
            isLoading: false
          };

          // Update the binding with new data
          this.playersBinding.set([...playersData]);
          console.log(`[AvatarOverlay] Successfully updated avatar for player: ${playerData.name}`);
        } catch (bindingError) {
          console.error(`[AvatarOverlay] Error updating binding for player ${playerData.name}:`, bindingError);
          this.setPlayerAvatarFailed(playerData, index, playersData);
        }
        
      }).catch((error) => {
        // Clear the timeout since we got a response (even if it's an error)
        this.async.clearTimeout(timeoutId);
        
        console.error(`[AvatarOverlay] Failed to load avatar for player ${playerData.name}:`, error);
        this.setPlayerAvatarFailed(playerData, index, playersData);
      });
      
    } catch (error) {
      console.error(`[AvatarOverlay] Error initiating avatar load for player ${playerData.name}:`, error);
      this.setPlayerAvatarFailed(playerData, index, playersData);
    }
  }

  /**
   * Helper method to set a player's avatar as failed/unavailable
   */
  private setPlayerAvatarFailed(playerData: PlayerAvatarData, index: number, playersData: PlayerAvatarData[]): void {
    try {
      // Update with failed state (no image)
      playersData[index] = {
        ...playerData,
        avatarImageSource: null,
        isLoading: false
      };
      
      // Update the binding
      this.playersBinding.set([...playersData]);
    } catch (error) {
      console.error(`[AvatarOverlay] Error setting failed state for player ${playerData.name}:`, error);
    }
  }

  start() {
    try {
      super.start();
      console.log('[AvatarOverlay] Component started');
      
      // Validate that we have access to the world
      if (!this.world) {
        console.error('[AvatarOverlay] World object not available in start()');
        return;
      }

      console.log('[AvatarOverlay] World object available, marking component as ready');
      this.isComponentReady = true;
      
      // Do an initial update after a short delay to ensure world is fully loaded
      this.async.setTimeout(() => {
        console.log('[AvatarOverlay] Executing delayed initial update');
        this.updatePlayersList();
      }, 1000);
      
    } catch (error) {
      console.error('[AvatarOverlay] Error in start() method:', error);
    }
  }
}

// Register the component for use in Horizon Worlds
console.log('[AvatarOverlay] Registering component...');
ui.UIComponent.register(AvatarOverlay);
console.log('[AvatarOverlay] Component registered successfully');
