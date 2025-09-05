/**
 * Native Leaderboard System for Trivia Game
 *
 * This script handles setting scores to the native Horizon Worlds leaderboard system.
 * The actual leaderboard display is handled by the native leaderboard gizmo.
 *
 * Usage:
 * 1. Attach this script to a Leaderboard gizmo in your world
 * 2. Set the leaderboard name to "Trivia" (or whatever name you configured)
 * 3. The script will automatically handle score updates from TriviaGame
 */

import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Binding, UINode, View, Text } from 'horizon/ui';

// Network event for leaderboard score updates
const leaderboardScoreUpdateEvent = new hz.NetworkEvent<{
  playerId: string;
  score: number;
  leaderboardName: string;
}>('leaderboardScoreUpdate');

export class NativeLeaderboard extends ui.UIComponent {

  static propsDefinition = {
    leaderboardName: { type: hz.PropTypes.String, default: "Trivia" }
  };

  async start() {
    // Validate leaderboard name
    const leaderboardName = this.props.leaderboardName as string;
    if (!leaderboardName || leaderboardName.trim() === '') {
      return;
    }

    // Listen for score updates from TriviaGame
    this.connectNetworkBroadcastEvent(leaderboardScoreUpdateEvent, this.onScoreUpdate.bind(this));
  }

  private onScoreUpdate(eventData: { playerId: string; score: number; leaderboardName: string }) {
    // Only handle updates for our leaderboard
    const leaderboardName = this.props.leaderboardName as string;

    if (eventData.leaderboardName === leaderboardName) {
      try {
        // Find the player
        const player = this.world.getPlayers().find(p => p.id.toString() === eventData.playerId);

        if (player) {
          // Set the score in the native leaderboard system
          this.world.leaderboards.setScoreForPlayer(
            leaderboardName,
            player,
            eventData.score,
            true // Override previous score
          );
        }
      } catch (error) {
      }
    }
  }

  // Public method to manually set a score
  public setPlayerScore(playerId: string, score: number) {
    const player = this.world.getPlayers().find(p => p.id.toString() === playerId);

    if (player) {
      try {
        const leaderboardName = this.props.leaderboardName as string;
        this.world.leaderboards.setScoreForPlayer(
          leaderboardName,
          player,
          score,
          true
        );
      } catch (error) {
      }
    }
  }

  initializeUI() {
    // Simple UI that just shows the leaderboard is active
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        View({
          style: {
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            shadowColor: 'black',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: [0, 4]
          },
          children: [
            Text({
              text: '🏆',
              style: {
                fontSize: 48,
                marginBottom: 16
              }
            }),
            Text({
              text: `${this.props.leaderboardName} Leaderboard`,
              style: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#1F2937',
                marginBottom: 8
              }
            }),
            Text({
              text: 'Scores are automatically updated from the trivia game.',
              style: {
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }
}

// Register the component
ui.UIComponent.register(NativeLeaderboard);
