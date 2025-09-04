import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');
const triviaGameRegisteredEvent = new hz.NetworkEvent<{ isRunning: boolean, hasQuestions: boolean }>('triviaGameRegistered');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');

// Request-response events for state synchronization
const triviaStateRequestEvent = new hz.NetworkEvent<{ requesterId: string }>('triviaStateRequest');
const triviaStateResponseEvent = new hz.NetworkEvent<{
  requesterId: string,
  gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended',
  currentQuestion?: any,
  questionIndex?: number,
  timeLimit?: number,
  showLeaderboard?: boolean,
  leaderboardData?: Array<{name: string, score: number, playerId: string}>
}>('triviaStateResponse');

// Network event for keyboard input from separate KeyboardInputHandler (fallback)
const mePhoneKeyboardTriggerEvent = new hz.NetworkEvent<{ playerId: string }>('mePhoneKeyboardTrigger');

// Built-in trivia questions
const triviaQuestions = [
  {
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Mars", "Venus", "Jupiter", "Saturn"],
    correctIndex: 0
  },
  {
    question: "What is 7 × 8?",
    answers: ["54", "56", "64", "48"],
    correctIndex: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correctIndex: 2
  },
  {
    question: "What is the largest ocean on Earth?",
    answers: ["Atlantic", "Pacific", "Indian", "Arctic"],
    correctIndex: 1
  },
  {
    question: "What year did World War II end?",
    answers: ["1944", "1945", "1946", "1947"],
    correctIndex: 1
  },
  {
    question: "What is the chemical symbol for gold?",
    answers: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2
  },
  {
    question: "Which country is known as the Land of the Rising Sun?",
    answers: ["China", "Japan", "Thailand", "South Korea"],
    correctIndex: 1
  }
];

class TriviaPhone extends ui.UIComponent<typeof TriviaPhone> {
  static propsDefinition = {};

  // Player ownership tracking
  private assignedPlayer: hz.Player | null = null;
  private isInitialized = false;

  // Position tracking for teleporting to the player
  private originalPosition: hz.Vec3 | null = null;
  private followOffset = new hz.Vec3(0, 0.3, 1.0); // Position relative to player (in front and slightly above)

  // Camera state tracking for restoration when leaving UI interaction
  private cameraPositionAtHKeyPress: hz.Vec3 | null = null;
  private cameraRotationAtHKeyPress: hz.Quaternion | null = null;
  private isPlayerFocusedOnUI: boolean = false;

  // Keyboard input connection
  private inputConnection: hz.PlayerInput | null = null;
  private eKeyInputConnection: hz.PlayerInput | null = null;

  // Game state
  private currentQuestionIndex = 0;
  private score = 0;
  private selectedAnswer: number | null = null;
  private showResult = false;
  private gameStarted = false;

  // UI bindings
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private gameStartedBinding = new ui.Binding(false);

  constructor() {
    super();
  }

  async start() {
    this.setupNetworkEvents();
    this.setupKeyboardInput();

    // Store the original position when the component starts
    this.originalPosition = this.entity.position.get().clone();
  }

  private teleportToPlayer(player: hz.Player): void {
    try {
      // Check if LocalCamera is available (accessed via camera module)
      if (!camera.default) {
        this.teleportToPlayerFallback(player);
        return;
      }

      // Get the camera's current position, rotation, and forward direction
      const cameraPosition = camera.default.position.get();
      const cameraRotation = camera.default.rotation.get();
      const cameraForward = camera.default.forward.get();

      // Position the TriviaPhone in front of the camera with forward offset
      // This ensures the TriviaPhone appears in front of where the user is looking
      const forwardOffset = 2.5; // Move 2.5 units forward from camera position (increased from 1.5)
      const desiredPosition = cameraPosition.add(cameraForward.mul(forwardOffset));

      // Update the TriviaPhone's position to match the camera's position with forward offset
      this.entity.position.set(desiredPosition);

      // Make the TriviaPhone face the opposite direction of the camera (towards the user's viewport)
      const faceOppositeRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = cameraRotation.mul(faceOppositeRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
      // Fallback to player position if camera access fails
      this.teleportToPlayerFallback(player);
    }
  }

  private teleportToPlayerFallback(player: hz.Player): void {
    try {
      // Get the player's current position
      const playerPosition = player.position.get();

      // Calculate the desired position for the TriviaPhone (player position + offset)
      // Offset: (0, 0.3, 1.0) = slightly above and 1 unit in front of player
      const desiredPosition = playerPosition.add(this.followOffset);

      // Update the TriviaPhone's position to the player's location
      this.entity.position.set(desiredPosition);

      // Make the TriviaPhone face the player (rotate 180 degrees from player's direction)
      const playerRotation = player.rotation.get();
      const facePlayerRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = playerRotation.mul(facePlayerRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
    }
  }

  update(dt: number) {
    // Alternative polling approach: Check if UI is still visible/active
    if (this.assignedPlayer) {
      try {
        // Check if the TriviaPhone entity is still visible (as an indicator of UI focus)
        const isVisible = this.entity.visible.get();

        // If the TriviaPhone was visible but is no longer visible, trigger restoration
        if (this.isPlayerFocusedOnUI && !isVisible) {

          // Restore the camera position and rotation to what it was when the user started the interaction
          try {
            if (camera.default && this.cameraPositionAtHKeyPress && this.cameraRotationAtHKeyPress) {
              // Restore camera position and rotation with a smooth transition
              camera.default.setCameraModeFixed({
                position: this.cameraPositionAtHKeyPress,
                rotation: this.cameraRotationAtHKeyPress,
                duration: 0.5 // 0.5 second transition for smooth restoration
              });

              // Clear the stored camera state
              this.cameraPositionAtHKeyPress = null;
              this.cameraRotationAtHKeyPress = null;
            }
          } catch (error) {
          }

          // Mark that the player is no longer focused on the UI
          this.isPlayerFocusedOnUI = false;
        }

      } catch (error) {
      }
    }
  }

  stop() {
    if (this.inputConnection) {
      this.inputConnection.disconnect();
      this.inputConnection = null;
    }
    if (this.eKeyInputConnection) {
      this.eKeyInputConnection.disconnect();
      this.eKeyInputConnection = null;
    }
  }

  private setupNetworkEvents(): void {
    // Listen for trivia question show events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, (eventData) => {
      this.syncWithExternalTrivia(eventData);
    });

    // Listen for trivia results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, (eventData) => {
      this.onTriviaResults(eventData);
    });

    // Listen for trivia game start events
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, (eventData) => {
      this.startGame();
    });

    // Listen for trivia game registration events
    this.connectNetworkBroadcastEvent(triviaGameRegisteredEvent, (eventData) => {
      // Registration event received
    });

    // Listen for trivia state responses
    this.connectNetworkBroadcastEvent(triviaStateResponseEvent, (eventData) => {
      this.onTriviaStateResponse(eventData);
    });
  }

  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available (should be since this is a CustomUI running locally)
      if (typeof hz.PlayerControls === 'undefined') {
        this.fallbackToSeparateComponent();
        return;
      }

      // Get the local player (owner of the TriviaPhone)
      const localPlayer = this.world.getLocalPlayer();
      if (!localPlayer) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary);
      } catch (contextError) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Check if LeftTertiary action is supported (maps to H key on desktop)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        this.inputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftTertiary,
          hz.ButtonIcon.Menu,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Center }
        );

        this.inputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Handle keyboard trigger directly
            this.handleKeyboardTrigger(localPlayer);
          }
        });

        // Set up E key input for hiding TriviaPhone when focused
        if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightGrip)) {
          this.eKeyInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.RightGrip,
            hz.ButtonIcon.None,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.eKeyInputConnection.registerCallback((action, pressed) => {
            if (pressed) {
              // Handle E key trigger - hide TriviaPhone if player is focused on UI
              this.handleEKeyTrigger(localPlayer);
            }
          });

        } else {
        }
      } else {
        this.fallbackToSeparateComponent();
      }
    } catch (error) {
      this.fallbackToSeparateComponent();
    }
  }

  private fallbackToSeparateComponent(): void {
  }

  onFocus(player: hz.Player): void {
    // Mark that the player is now focused on the UI
    this.isPlayerFocusedOnUI = true;

    // Show the TriviaPhone when focused - make it visible to all players
    this.entity.visible.set(true);
  }

  onUnfocus(player: hz.Player): void {
    // Mark that the player is no longer focused on the UI
    this.isPlayerFocusedOnUI = false;

    // Hide the TriviaPhone when unfocused - make it invisible to all players
    this.hideTriviaPhone();
  }

  private hideTriviaPhone(): void {
    this.entity.visible.set(false);
  }

  private showTriviaPhone(): void {
    this.entity.visible.set(true);
  }

  private handleKeyboardTrigger(player: hz.Player): void {
    // Check if the TriviaPhone is currently visible and assigned to this player
    // Also check if it's positioned normally (not hidden by E key)
    const isVisible = this.entity.visible.get();
    const isAssignedToPlayer = this.assignedPlayer?.id === player.id;
    const currentPosition = this.entity.position.get();
    const isPositionedNormally = currentPosition.y > -500; // Not hidden far below

    if (isVisible && isAssignedToPlayer && isPositionedNormally) {
      return; // Don't execute H key functionality if player is already using the phone
    }

    // Capture camera position when H key is pressed
    try {
      if (camera.default) {
        this.cameraPositionAtHKeyPress = camera.default.position.get().clone();
        this.cameraRotationAtHKeyPress = camera.default.rotation.get().clone();
      }
    } catch (error) {
    }

    // If phone is not assigned to anyone, assign it to this player and open UI
    if (!this.assignedPlayer) {
      this.initializeForPlayer(player);
      this.teleportToPlayer(player);
      // Open and focus the TriviaPhone UI on the player's device with delay
      this.openAndFocusUIForPlayer(player);
      return;
    }

    // If phone is assigned to this player, teleport and focus the UI
    if (this.assignedPlayer.id === player.id) {
      this.teleportToPlayer(player);
      this.openAndFocusUIForPlayer(player);
    } else {
      // If phone is assigned to someone else, reassign it to this player and teleport/focus UI
      // Assign to new player and teleport
      this.assignedPlayer = player;
      this.teleportToPlayer(player);
      this.openAndFocusUIForPlayer(player);
    }
  }

  private handleEKeyTrigger(player: hz.Player): void {
    // Always set the TriviaPhone's y position to -1000 when E is pressed
    const currentPosition = this.entity.position.get();
    this.entity.position.set(new hz.Vec3(currentPosition.x, -1000, currentPosition.z));

    // Reset focus state since player is no longer actively using the phone
    this.isPlayerFocusedOnUI = false;
  }

  private openUIForPlayer(player: hz.Player): void {
    try {
      // The UI should automatically be visible to the player if they're interacting with the CustomUI gizmo
      // This ensures the phone is ready when they look at it

    } catch (error) {
    }
  }

  private openAndFocusUIForPlayer(player: hz.Player): void {
    try {
      // First prepare the UI
      this.openUIForPlayer(player);

      // Set focus state immediately to prevent H key from working during the transition
      this.isPlayerFocusedOnUI = true;

      // Wait 25ms for position change to take effect, then focus the UI (reduced from 100ms)
      this.async.setTimeout(() => {
        try {
          player.focusUI(this.entity, { duration: 0.1 });
        } catch (focusError) {
          // If focus fails, reset the focus state
          this.isPlayerFocusedOnUI = false;
        }
      }, 25);

    } catch (error) {
      // If something goes wrong, reset the focus state
      this.isPlayerFocusedOnUI = false;
    }
  }

  initializeUI() {
    return this.render();
  }

  onPlayerAssigned(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;

    // Teleport to the player
    this.teleportToPlayer(player);
  }

  onPlayerUnassigned(player: hz.Player) {
    this.assignedPlayer = null;
    this.isInitialized = false;

    // Clear stored camera state
    this.cameraPositionAtHKeyPress = null;
    this.cameraRotationAtHKeyPress = null;

    // Hide the TriviaPhone when unassigned
    this.hideTriviaPhone();

    // Return to original position
    if (this.originalPosition) {
      this.entity.position.set(this.originalPosition.clone());
    }
  }

  public initializeForPlayer(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;
  }

  public releaseTriviaPhone(): void {
    if (this.assignedPlayer) {
      this.onPlayerUnassigned(this.assignedPlayer);
    }
  }

  public unfocusAndHide(): void {
    if (this.assignedPlayer) {
      const playerId = this.assignedPlayer.id;

      // Explicitly hide the TriviaPhone after a short delay to ensure unfocus completes
      this.async.setTimeout(() => {
        this.hideTriviaPhone();
      }, 50);
    }
  }

  public checkAndHideIfUnfocused(): void {
    if (this.assignedPlayer) {
      // For now, just hide it since we can't easily check focus state
      // This method can be called externally when unfocus is suspected
      this.hideTriviaPhone();
    }
  }

  public isFollowing(): boolean {
    return this.assignedPlayer !== null;
  }

  public getAssignedPlayer(): hz.Player | null {
    return this.assignedPlayer;
  }

  public forceHide(): void {
    this.hideTriviaPhone();
  }

  public forceShow(): void {
    this.showTriviaPhone();
  }

  public handleExternalUnfocus(): void {
    if (this.assignedPlayer) {
      // Hide the TriviaPhone immediately when external unfocus is detected
      this.hideTriviaPhone();
    }
  }

  public getUnfocusCallback(): () => void {
    return () => {
      this.handleExternalUnfocus();
    };
  }

  private canPlayerInteract(player: hz.Player): boolean {
    // If no one has claimed this phone yet, anyone can use it
    if (!this.assignedPlayer) {
      return true;
    }

    // Otherwise, only the assigned player can use it
    return this.assignedPlayer === player;
  }

  private isHost(): boolean {
    // For now, the first player to claim the phone becomes the host
    // In a more complex implementation, this could be determined by network events
    return this.assignedPlayer !== null;
  }

  private handleStartGame(): void {
    if (!this.isHost()) return;

    // Start the game locally
    this.startGame();

    // Send network event to start the game for all players
    this.sendNetworkBroadcastEvent(triviaGameStartEvent, {
      hostId: this.assignedPlayer?.id.toString() || 'host',
      config: {
        timeLimit: 30,
        category: 'general',
        difficulty: 'medium',
        numQuestions: triviaQuestions.length
      }
    });
  }

  // Trivia game methods
  private startGame(): void {
    this.gameStarted = true;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;

    this.gameStartedBinding.set(true);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
  }

  private syncWithExternalTrivia(questionData: { question: any, questionIndex: number, timeLimit: number }): void {
    this.currentQuestionIndex = questionData.questionIndex;
    this.selectedAnswer = null;
    this.showResult = false;

    this.currentQuestionIndexBinding.set(questionData.questionIndex);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
  }

  private onTriviaResults(eventData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    this.showResult = true;
    this.showResultBinding.set(true);

    // Check if player's answer was correct
    if (this.selectedAnswer === eventData.correctAnswerIndex) {
      this.score++;
      this.scoreBinding.set(this.score);
    }
  }

  private onTriviaStateResponse(event: {
    requesterId: string,
    gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended',
    currentQuestion?: any,
    questionIndex?: number,
    timeLimit?: number,
    showLeaderboard?: boolean,
    leaderboardData?: Array<{name: string, score: number, playerId: string}>
  }): void {
    switch (event.gameState) {
      case 'waiting':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
        break;
      case 'playing':
        this.gameStarted = true;
        this.gameStartedBinding.set(true);
        if (event.currentQuestion) {
          this.syncWithExternalTrivia({
            question: event.currentQuestion,
            questionIndex: event.questionIndex || 0,
            timeLimit: event.timeLimit || 30
          });
        }
        break;
      case 'results':
        this.showResult = true;
        this.showResultBinding.set(true);
        break;
      case 'ended':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
        break;
    }
  }

  private handleAnswerSelect(answerIndex: number): void {
    if (this.showResult) return;

    this.selectedAnswer = answerIndex;
    this.selectedAnswerBinding.set(answerIndex);

    // Send network event
    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: this.assignedPlayer?.id.toString() || 'local',
      answerIndex: answerIndex,
      responseTime: 0
    });
  }

  private nextQuestion(): void {
    if (this.currentQuestionIndex < triviaQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer = null;
      this.showResult = false;

      this.currentQuestionIndexBinding.set(this.currentQuestionIndex);
      this.selectedAnswerBinding.set(null);
      this.showResultBinding.set(false);

      // Send next question event
      this.sendNetworkBroadcastEvent(triviaNextQuestionEvent, {
        playerId: this.assignedPlayer?.id.toString() || 'host'
      });
    }
  }

  private resetGame(): void {
    this.gameStarted = false;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;

    this.gameStartedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
  }

  render(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
      },
      children: [
        // Phone container
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 20,
            padding: 6,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Trivia game content
                this.renderTriviaGame()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderTriviaGame(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.selectedAnswerBinding
        ], (showResult, selectedAnswer) => {
          if (showResult && selectedAnswer !== null) {
            const currentQuestion = triviaQuestions[this.currentQuestionIndex];
            const isCorrect = selectedAnswer === currentQuestion.correctIndex;
            return isCorrect ? '#22C55E' : '#EF4444';
          }
          return '#6366F1';
        }),
        flexDirection: 'column'
      },
      children: [
        // Main content area
        ui.View({
          style: {
            flex: 1,
            padding: 16
          },
          children: [
            // Waiting for game screen
            ui.UINode.if(
              ui.Binding.derive([this.gameStartedBinding], (started) => !started),
              ui.View({
                style: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'
                },
                children: [
                  ui.Text({
                    text: '🎮 Trivia Game',
                    style: {
                      fontSize: 24,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      marginBottom: 16
                    }
                  }),
                  // Show Start Game button only for host
                  ui.UINode.if(
                    ui.Binding.derive([], () => this.isHost()),
                    ui.Pressable({
                      style: {
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        marginBottom: 12
                      },
                      onPress: () => this.handleStartGame(),
                      children: [
                        ui.Text({
                          text: '🎯 Start Game',
                          style: {
                            fontSize: 18,
                            fontWeight: '600',
                            color: '#6366F1'
                          }
                        })
                      ]
                    })
                  ),
                  // Show waiting message for non-host players
                  ui.UINode.if(
                    ui.Binding.derive([], () => !this.isHost()),
                    ui.Text({
                      text: 'Waiting for host to start...',
                      style: {
                        fontSize: 16,
                        color: '#FFFFFF',
                        textAlign: 'center',
                        opacity: 0.8
                      }
                    })
                  )
                ]
              })
            ),

            // Game screen
            ui.UINode.if(
              ui.Binding.derive([this.gameStartedBinding], (started) => started),
              ui.View({
                style: {
                  flex: 1,
                  flexDirection: 'column'
                },
                children: [
                  // Question
                  ui.View({
                    style: {
                      marginBottom: 20
                    },
                    children: [
                      ui.Text({
                        text: ui.Binding.derive([this.currentQuestionIndexBinding], (index) =>
                          triviaQuestions[index]?.question || 'Loading...'
                        ),
                        style: {
                          fontSize: 18,
                          fontWeight: '600',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          lineHeight: 1.4
                        }
                      })
                    ]
                  }),

                  // Answer buttons
                  ui.View({
                    style: {
                      flex: 1,
                      flexDirection: 'column',
                      justifyContent: 'space-around'
                    },
                    children: [
                      // Top row
                      ui.View({
                        style: {
                          flexDirection: 'row',
                          marginBottom: 12
                        },
                        children: [
                          this.createAnswerButton(0),
                          this.createAnswerButton(1)
                        ]
                      }),
                      // Bottom row
                      ui.View({
                        style: {
                          flexDirection: 'row'
                        },
                        children: [
                          this.createAnswerButton(2),
                          this.createAnswerButton(3)
                        ]
                      })
                    ]
                  }),

                  // Result screen
                  ui.UINode.if(
                    ui.Binding.derive([this.showResultBinding], (showResult) => showResult),
                    ui.View({
                      style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                      },
                      children: [
                        ui.View({
                          style: {
                            alignItems: 'center',
                            padding: 20
                          },
                          children: [
                            ui.Text({
                              text: ui.Binding.derive([
                                this.selectedAnswerBinding,
                                this.currentQuestionIndexBinding
                              ], (selectedAnswer, questionIndex) => {
                                if (selectedAnswer === null) return '⏰ No Answer';
                                const currentQuestion = triviaQuestions[questionIndex];
                                const isCorrect = selectedAnswer === currentQuestion.correctIndex;
                                return isCorrect ? '✅ Correct!' : '❌ Wrong!';
                              }),
                              style: {
                                fontSize: 24,
                                fontWeight: '700',
                                color: '#FFFFFF',
                                textAlign: 'center',
                                marginBottom: 12
                              }
                            }),
                            ui.Text({
                              text: ui.Binding.derive([
                                this.selectedAnswerBinding,
                                this.currentQuestionIndexBinding
                              ], (selectedAnswer, questionIndex) => {
                                if (selectedAnswer !== null) {
                                  const currentQuestion = triviaQuestions[questionIndex];
                                  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
                                  if (!isCorrect) {
                                    return `Correct: ${currentQuestion.answers[currentQuestion.correctIndex]}`;
                                  }
                                }
                                return '';
                              }),
                              style: {
                                fontSize: 14,
                                color: '#FFFFFF',
                                textAlign: 'center',
                                opacity: 0.9,
                                marginBottom: 20
                              }
                            }),
                            ui.Pressable({
                              style: {
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                paddingHorizontal: 20,
                                paddingVertical: 10
                              },
                              onPress: () => this.nextQuestion(),
                              children: [
                                ui.Text({
                                  text: 'Next Question',
                                  style: {
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#6366F1'
                                  }
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  )
                ]
              })
            )
          ]
        }),

        // Bottom status bar
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.currentQuestionIndexBinding], (index) =>
                `Question ${index + 1} of ${triviaQuestions.length}`
              ),
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.scoreBinding], (score) => `Score: ${score}`),
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#6B7280'
              }
            })
          ]
        })
      ]
    });
  }

  private createAnswerButton(answerIndex: number): ui.UINode {
    const colors = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E'];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.selectedAnswerBinding,
          this.currentQuestionIndexBinding
        ], (showResult, selectedAnswer, questionIndex) => {
          if (showResult) {
            const currentQuestion = triviaQuestions[questionIndex];
            const isCorrect = answerIndex === currentQuestion.correctIndex;
            const isSelected = answerIndex === selectedAnswer;

            if (isCorrect) return '#22C55E'; // Green for correct
            if (isSelected && !isCorrect) return '#EF4444'; // Red for wrong selection
            return '#9CA3AF'; // Gray for other answers
          }
          return colors[answerIndex];
        }),
        borderRadius: 12,
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 60,
        padding: 8
      },
      onPress: () => this.handleAnswerSelect(answerIndex),
      children: [
        ui.Text({
          text: ui.Binding.derive([this.currentQuestionIndexBinding], (index) =>
            triviaQuestions[index]?.answers[answerIndex] || ''
          ),
          style: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
            textAlign: 'center'
          }
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TriviaPhone);
