# MePhone Player-Specific System Setup Guide

This guide explains how to set up the MePhone system to work on a per-player basis using the PhoneManager.

## Overview

The system has been converted from a single global MePhone to a per-player system where:
- **PhoneManager.ts**: Manages assignment of MePhone entities to players
- **MePhone.ts**: Runs locally for each player with player-specific UI state

## Setup Instructions

### 1. Create the PhoneManager Entity

1. In your Horizon Worlds editor, create a new **Empty Object**
2. Name it "PhoneManager" 
3. Add the **PhoneManager.ts** script to this entity
4. Place this entity somewhere in your world (position doesn't matter)
5. The PhoneManager will automatically run when the world starts

### 2. Create Multiple MePhone Entities

1. Create **multiple CustomUI entities** (recommended: 20+ for large worlds)
2. Add the **"MePhone" tag** to each CustomUI entity (in Properties panel)
3. Name them whatever you want (e.g., "Player Phone 1", "Mobile Device A", etc.)
4. Add the **MePhone.ts** script to each CustomUI entity
5. Set each MePhone entity to be **initially invisible** (`visible = false`)
6. Position these entities where you want the phones to appear

### 3. Automatic Discovery via Tags

The PhoneManager will **automatically discover** all entities with the "MePhone" tag - no manual registration needed!

When the world starts:
- PhoneManager searches for all entities with "MePhone" tag
- Registers them automatically for player assignment
- No additional setup code required

### 4. How It Works

When a player joins the world:
1. **PhoneManager** detects the new player via `OnPlayerEnterWorld`
2. Finds an available MePhone entity that isn't currently assigned
3. Sets the phone entity's `owner` to the player
4. Makes the phone visible only to that player
5. Calls `initializeForPlayer()` on the MePhone script to set up player-specific state

When a player leaves:
1. **PhoneManager** detects via `OnPlayerExitWorld`
2. Releases the player's phone, making it available for new players
3. Resets the phone's state

### 5. Player-Specific Features

Each player now gets their own:
- ✅ Calculator with independent state
- ✅ Contacts list (shows other players in the world)
- ✅ Personal settings and preferences
- ✅ Independent app navigation
- ✅ Separate MePay balances and transactions
- ✅ Individual message conversations

### 6. Key Benefits

- **Per-Player State**: Each player's actions only affect their own phone
- **Scalable**: Supports multiple players simultaneously
- **Resource Efficient**: Reuses phone entities as players come and go
- **No Interference**: Players can't see or affect each other's phone UI

### 7. Debugging

The PhoneManager includes extensive console logging:
- `[PhoneManager]` prefixed messages for assignment/release events
- `[MePhone]` prefixed messages for individual phone initialization
- `[Contacts]` prefixed messages for player detection and contact updates

### 8. Customization

To add more phone entities:
1. Create new CustomUI entities with MePhone script
2. Add the **"MePhone" tag** to each entity
3. The PhoneManager will automatically discover and use them for new players

### 9. Limitations & Notes

- **Tag Requirement**: All phone entities must have the "MePhone" tag to be discovered
- **Entity Limit**: Limited by how many CustomUI entities you place in the world
- **Player Capacity**: One phone per player, so plan for your expected player count
- **Ownership**: Uses Horizon's entity ownership system for access control

## Troubleshooting

**Problem**: Players aren't getting phones assigned
- Check that phone entities have the "MePhone" tag in Properties panel
- Verify PhoneManager is running and detecting player events
- Check console logs for assignment and discovery messages

**Problem**: PhoneManager not finding any phones
- Ensure CustomUI entities have the exact tag "MePhone" (case sensitive)
- Check that MePhone.ts script is attached to each CustomUI entity
- Look for "[PhoneManager] Discovered X phone entities" in console logs

**Problem**: Multiple players seeing the same phone
- Ensure each phone entity is set to `visible = false` initially
- Verify ownership is being set correctly
- Check that only one PhoneManager exists in the world

**Problem**: Phone state not persisting between sessions
- This is expected behavior - each session starts fresh
- Consider adding persistence if needed for your use case
