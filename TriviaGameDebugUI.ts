import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';
import { View, Text, Pressable, Binding, UINode, Image, ImageSource, UIComponent } from 'horizon/ui';

// CRITICAL NOTE: DO NOT REMOVE THE 16:9 ASPECT RATIO FROM ANY SCREEN CONTAINER
// The 16:9 aspect ratio (aspectRatio: 16/9) is essential for maintaining consistent display
// across all devices and screens in the application. NEVER remove this property.
// NOTE: All screens must maintain the 16:9 aspect ratio for proper layout consistency
// NOTE: The aspectRatio: 16/9 property should NEVER be removed from any container

// Interface for tracking phone assignments
interface PhoneAssignment {
  phoneEntity: hz.Entity;
  assignedPlayer: hz.Player | null;
  isInUse: boolean;
}

// Interface for trivia question data from JSON asset
interface TriviaQuestion {
  id: number;
  question: string;
  category?: string;
  difficulty?: string;
  image?: string | null; // Path to image file or null
  answers: {
    text: string;
    correct: boolean;
  }[];
}

// Interface for custom quiz questions with images
interface CustomQuizQuestion {
  id: string;
  image_id?: string; // New format uses image_id instead of image
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

/**
 * Trivia Game Debug UI Component - Static Version
 * 
 * This component provides static debug screens for testing UI layouts
 * without the full game functionality.
 */
export class TriviaGameDebugUI extends ui.UIComponent {
  
  static propsDefinition = {
    // Display settings
    fontSize: { type: hz.PropTypes.Number, default: 24 },
    headerColor: { type: hz.PropTypes.String, default: "#6366F1" },
    backgroundColor: { type: hz.PropTypes.String, default: "#F3F4F6" },
    // JSON asset connections
    italianBrainrotQuiz: { type: hz.PropTypes.Asset, default: null },
    generalQuestions: { type: hz.PropTypes.Asset, default: null }
  } as const;

  // Bindings for dynamic UI updates
  private questionNumberBinding = new Binding("Q1");
  private timerBinding = new Binding("30");
  private answerCountBinding = new Binding("0");
  private answerCountTracking = new Binding(4); // Track number of answers for layout
  private questionBinding = new Binding("Waiting for question...");
  private questionImageBinding = new Binding<string | null>(null); // Stable binding for question image
  private answerTexts = [
    new Binding(""),
    new Binding(""),
    new Binding(""),
    new Binding("")
  ];
  
  private showResultsBinding = new Binding(false);
  private showWaitingBinding = new Binding(false);
  private showLeaderboardBinding = new Binding(false);
  private showErrorBinding = new Binding(false);
  private errorMessageBinding = new Binding("No questions available for the selected category.");
  private correctAnswerBinding = new Binding(-1);
  private answerCountsBinding = new Binding([0, 0, 0, 0]);
  
  // Leaderboard data
  private leaderboardDataBinding = new Binding<Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}>>([]);
  
  // Debug leaderboard flag - when true, show fake static data
  private showDebugLeaderboard = new Binding(false);
  
  // Cache for real player avatars
  private realPlayerAvatars = new Map<string, ImageSource | null>();
  
  // Players list binding for reactive UI updates
  private playersListBinding = new Binding<Array<{id: string, name: string}>>([]);
  
  // Simple binding to trigger UI updates when players change
  private playersUpdateTrigger = new Binding<number>(0);
  
  // Counter to track UI update triggers
  private updateTriggerCounter: number = 0;
  
  // Category and difficulty selection bindings
  private selectedCategoryBinding = new Binding("General");
  private selectedDifficultyBinding = new Binding("easy");

  // Game configuration state
  private showConfigBinding = new Binding(true); // Show config screen initially
  private gameConfigBinding = new Binding({
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 5,
    category: "Italian Brainrot Quiz",
    difficulty: "easy"
  });
  
  // Layout mode binding - determines if question should be centered (true) or at top (false)
  private centerQuestionBinding = new Binding(false);
  
  // Answer button color bindings for results state
  private answerButtonColors = [
    new Binding('#DC2626'), // Default red
    new Binding('#2563EB'), // Default blue  
    new Binding('#EAB308'), // Default yellow
    new Binding('#16A34A')  // Default green
  ];
  
  // Debug outline toggle binding
  private showOutlinesBinding = new Binding(false);
  private showOutlines: boolean = false;

  // Theme mode binding (light/dark)
  private isDarkModeBinding = new Binding(false);
  private isDarkMode: boolean = false;

  // Specific bindings to track which question screen is active
  private show4AQuestionScreenBinding = new Binding(false);
  private show2AQuestionScreenBinding = new Binding(false);
  
  // Game data - separate arrays for different question types
  private generalQuestions: TriviaQuestion[] = [];
  private italianBrainrotQuestions: TriviaQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private currentQuestion: TriviaQuestion | null = null;
  
  // Pre-shuffled question indices to ensure no duplicates
  private generalQuestionsShuffledIndices: number[] = [];
  private italianBrainrotQuestionsShuffledIndices: number[] = [];
  private generalQuestionsCurrentIndex: number = 0;
  private italianBrainrotQuestionsCurrentIndex: number = 0;
  
  // Answer selection and feedback state
  private currentQuestionAnswers: { text: string; correct: boolean }[] = [];
  private selectedAnswerIndex: number = -1;
  private answerRevealed: boolean = false;
  private answerRevealedBinding = new Binding(false); // Binding for UI reactivity
  private answerStateTrigger = new Binding<number>(0);
  private answerStateCounter: number = 0;

  // Player headshot cache - maps player ID to ImageSource
  private playerHeadshots = new Map<string, ImageSource | null>();

  // Current players list for UI (not a binding to avoid circular reference issues)
  private currentPlayers: Array<{id: string, name: string}> = [];

  async start() {
    // Initialize basic setup for debug functionality
    this.setupDebugFunctionality();
    
    // Load questions from JSON assets
    await this.loadQuestionsFromAssets();
    
    // Load headshots for all current players
    const initialPlayers = this.world.getPlayers();
    for (const player of initialPlayers) {
      await this.loadPlayerHeadshot(player, 'INIT');
    }
    
    // Initialize players list
    this.currentPlayers = initialPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));
  }

  private getTextureIdForImage(imagePath: string): string | null {
    if (!imagePath) return null;

    // If it's already a numeric texture ID, use it directly
    if (/^\d+$/.test(imagePath)) {
      return imagePath;
    }

    // If it's a hexadecimal texture ID (contains letters), convert to decimal
    if (/^[0-9A-Fa-f]+$/.test(imagePath) && /[A-Fa-f]/.test(imagePath)) {
      try {
        const decimalId = parseInt(imagePath, 16).toString();
        return decimalId;
      } catch (error) {
        return null;
      }
    }

    // For any other format, return as-is
    return imagePath;
  }

  private shuffleQuestionAnswers(question: TriviaQuestion): TriviaQuestion {
    // Create a copy of the question
    const shuffledQuestion: TriviaQuestion = {
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      image: question.image, // Include the image property
      answers: [...question.answers]
    };

    const answers = shuffledQuestion.answers;

    // Check if this is a true/false question
    const isTrueFalseQuestion = answers.length === 2 && 
      answers.some(a => a.text.toLowerCase().includes('true')) && 
      answers.some(a => a.text.toLowerCase().includes('false'));

    if (isTrueFalseQuestion) {
      // For true/false questions, ensure "True" is always first and "False" is always second
      const trueAnswer = answers.find(a => a.text.toLowerCase().includes('true'));
      const falseAnswer = answers.find(a => a.text.toLowerCase().includes('false'));
      
      if (trueAnswer && falseAnswer) {
        shuffledQuestion.answers = [trueAnswer, falseAnswer];
      }
    } else {
      // For non-true/false questions, use the existing shuffling logic
      // First pass: Fisher-Yates shuffle
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      // Second pass: Additional randomization with different approach
      if (answers.length >= 3) {
        // Randomly swap pairs
        for (let i = 0; i < Math.min(3, answers.length - 1); i++) {
          const idx1 = Math.floor(Math.random() * answers.length);
          let idx2 = Math.floor(Math.random() * answers.length);
          while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * answers.length);
          }
          [answers[idx1], answers[idx2]] = [answers[idx2], answers[idx1]];
        }
      }

      // Third pass: Ensure correct answer isn't always in the same position
      // (This helps prevent players from memorizing positions)
      const correctIndex = answers.findIndex(a => a.correct);
      if (correctIndex !== -1 && Math.random() > 0.5) {
        // 50% chance to move correct answer to a different position
        const newPosition = Math.floor(Math.random() * answers.length);
        if (newPosition !== correctIndex) {
          [answers[correctIndex], answers[newPosition]] = [answers[newPosition], answers[correctIndex]];
        }
      }
    }

    return shuffledQuestion;
  }

  private async generateRealLeaderboard(): Promise<Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}>> {
    // Get actual players in the world
    const currentPlayers = this.world.getPlayers();
    
    if (currentPlayers.length === 0) {
      // Return fake data if no players are present
      return [
        { name: "Debug Player", score: 10, playerId: "12345", headshotImageSource: undefined },
        { name: "Debug Player", score: 8, playerId: "12345", headshotImageSource: undefined },
        { name: "Debug Player", score: 6, playerId: "12345", headshotImageSource: undefined },
        { name: "Debug Player", score: 4, playerId: "12345", headshotImageSource: undefined },
        { name: "Debug Player", score: 2, playerId: "12345", headshotImageSource: undefined }
      ];
    }
    
    // Find the player with the lowest player ID
    let lowestIdPlayer = currentPlayers[0];
    let lowestId = BigInt(currentPlayers[0].id.toString());
    
    for (const player of currentPlayers) {
      const playerId = BigInt(player.id.toString());
      if (playerId < lowestId) {
        lowestId = playerId;
        lowestIdPlayer = player;
      }
    }
    
    // Get player headshot using Social API
    let headshotImageSource: ImageSource | undefined;
    try {
      headshotImageSource = await Social.getAvatarImageSource(lowestIdPlayer, {
        type: AvatarImageType.HEADSHOT,
        highRes: true
      });
    } catch (error) {
    }
    
    // Create 5 entries for the player with the lowest ID
    const leaderboard: Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}> = [];
    
    for (let i = 0; i < 5; i++) {
      leaderboard.push({
        name: lowestIdPlayer.name.get(),
        score: Math.floor(Math.random() * 10), // Random score for demo
        playerId: lowestIdPlayer.id.toString(),
        headshotImageSource: headshotImageSource
      });
    }

    // Sort by score descending
    return leaderboard.sort((a, b) => b.score - a.score);
  }

  initializeUI() {
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // Fully transparent background
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        // Error Screen (standalone screen)
        // NOTE: DO NOT REMOVE THE 16:9 ASPECT RATIO - This maintains consistency with all other screens
        // NOTE: The 16:9 aspect ratio is critical for proper display across all devices
        // NOTE: NEVER remove aspectRatio: 16/9 from this container under any circumstances
        UINode.if(
          this.showErrorBinding,
          View({
            style: {
              width: '100vw', // Use full viewport width
              aspectRatio: 16/9, // Maintain 16:9 aspect ratio - DO NOT REMOVE THIS LINE
              backgroundColor: 'transparent',
              position: 'relative',
              overflow: 'hidden',
              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
              borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for error screen
            },
            children: [
              // Background image
              // NOTE: This image now fills the entire 16:9 viewport
              // NOTE: The 16:9 aspect ratio of the container is preserved above
              // NOTE: DO NOT change the container's aspectRatio: 16/9 setting
              Image({
                source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('765365063138745'))),
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  resizeMode: 'cover' // Fill the entire viewport while maintaining aspect ratio
                }
              })
            ]
          })
        ),

        // Main game container with 16:9 aspect ratio (only show when not on error screen)
        // NOTE: DO NOT REMOVE THE 16:9 ASPECT RATIO - This maintains consistency with all other screens
        // NOTE: The 16:9 aspect ratio is critical for proper display across all devices
        // NOTE: NEVER remove aspectRatio: 16/9 from this container under any circumstances
        UINode.if(
          this.showErrorBinding.derive(showError => !showError),
          View({
            style: {
              width: '100vw', // Use full viewport width
              aspectRatio: 16/9, // Maintain 16:9 aspect ratio - DO NOT REMOVE THIS LINE
              backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#1F2937' : '#F3F4F6'),
              position: 'relative',
              overflow: 'hidden',
              shadowColor: 'black',
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: [0, 6],
              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
              borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for main container
            },
          children: [
            // Background image for all screens
            Image({
              source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2770757216446813'))),
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
                zIndex: -1
              }
            }),
            // Configuration Screen (shows initially)
            UINode.if(
              this.showConfigBinding,
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for configuration screen background
                },
                children: [
                  // Background image container for proper centering
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    children: Image({
                      source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1301516008296278'))),
                      style: {
                        width: '100%',
                        height: '100%',
                        resizeMode: 'contain'
                      }
                    })
                  }),
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0, // Fill width from left edge
                      right: 0, // Fill width to right edge
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 8, // 8px padding for height that hugs the text
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for header
                    },
                    children: Text({
                      text: 'General Trivia',
                      style: {
                        fontSize: 20, // Scaled down from 24
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Waiting for host message
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 0, // Moved to bottom of screen
                      left: '3%', // 24px out of 800px total width
                      right: '3%', // 24px out of 800px total width
                      height: 65,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for waiting message
                    },
                    children: Text({
                      text: 'Waiting for host...',
                      style: {
                        fontSize: 20, // Scaled down from 28
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Players avatars grid
                  View({
                    style: {
                      position: 'absolute',
                      top: 40, // Moved up 8 pixels from 48
                      left: '10%', // Reduced margin to make container wider
                      right: '10%', // Reduced margin to make container wider
                      bottom: '20%', // Leave more space for the waiting message
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      paddingHorizontal: 10,
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for players grid
                    },
                    children: this.createPlayerAvatarsGrid()
                  }),

                  // Left side icons (Lock, Sentiment Neutral, Timer)
                  View({
                    style: {
                      position: 'absolute',
                      left: 0, // Start at left edge
                      top: 0, // Fill from top of viewport
                      bottom: 0, // Fill to bottom of viewport
                      width: 80, // Slightly wider for better spacing
                      flexDirection: 'column',
                      justifyContent: 'space-between', // Distribute icons evenly across full height
                      alignItems: 'center',
                      paddingVertical: 72, // Increased from 16 to 50 for more top/bottom margins
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for left icons
                    },
                    children: [
                      // Lock icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for lock icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('667887239673613'))),
                          style: {
                            width: 36, // Scaled up from 32
                            height: 36 // Scaled up from 32
                          }
                        })
                      }),
                      // Sentiment Neutral icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for sentiment icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1138269638213533'))),
                          style: {
                            width: 36, // Scaled up from 32
                            height: 36 // Scaled up from 32
                          }
                        })
                      }),
                      // Timer icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for timer icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2035737657163790'))),
                          style: {
                            width: 36, // Scaled up from 32
                            height: 36 // Scaled up from 32
                          }
                        })
                      })
                    ]
                  }),

                  // Right side icons (Autoplay, All Inclusive, Bolt)
                  View({
                    style: {
                      position: 'absolute',
                      right: 0, // Start at right edge
                      top: 0, // Fill from top of viewport
                      bottom: 0, // Fill to bottom of viewport
                      width: 80, // Slightly wider for better spacing
                      flexDirection: 'column',
                      justifyContent: 'space-between', // Distribute icons evenly across full height
                      alignItems: 'center',
                      paddingVertical: 72, // Increased from 16 to 72 to match left side
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for right icons
                    },
                    children: [
                      // Autoplay icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for autoplay icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789207380187265'))),
                          style: {
                            width: 48, // Scaled up from 32 to match left side
                            height: 48 // Scaled up from 32 to match left side
                          }
                        })
                      }),
                      // All Inclusive icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for all inclusive icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))),
                          style: {
                            width: 48, // Scaled up from 32 to match left side
                            height: 48 // Scaled up from 32 to match left side
                          }
                        })
                      }),
                      // Bolt icon
                      View({
                        style: {
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for bolt icon container
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))),
                          style: {
                            width: 48, // Scaled up from 32 to match left side
                            height: 48 // Scaled up from 32 to match left side
                          }
                        })
                      })
                    ]
                  }),


                ]
              })
            ),

            // Game UI (shows when game is running, but not on config, results, or error screen)
            UINode.if(
              Binding.derive([this.showConfigBinding, this.showResultsBinding, this.showErrorBinding], (showConfig, showResults, showError) => 
                !showConfig && !showResults && !showError
              ),
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for game UI container
                },
                children: [
                  // Question text - conditional positioning based on image presence
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    // No image - center the question (2-answer questions)
                    UINode.if(
                      this.answerCountTracking.derive(count => count === 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '5%',
                          paddingBottom: '25%', // Leave space for answer buttons
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for question container (no image, 2 answers)
                        },
                        children: [
                          // Timer container - flex to fill left space
                          View({
                            style: {
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for timer flex container
                            },
                                children: [
                                  // Timer on the left
                                  View({
                                    style: {
                                      width: 45, // Increased from 35 to 45
                                      height: 45, // Increased from 35 to 45
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 22.5, // Increased from 17.5 to 22.5
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 16, // Increased from 12 to 16
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    })
                                  })
                                ]
                              }),

                              // Question text in the middle
                              View({
                                style: {
                                  backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#374151' : 'white'),
                                  borderRadius: 6,
                                  shadowColor: 'black',
                                  shadowOpacity: 0.15,
                                  shadowRadius: 6,
                                  shadowOffset: [0, 2],
                                  paddingHorizontal: 16,
                                  paddingVertical: 16,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for question text box (no image, 2 answers)
                                },
                                children: [
                                  // Question text
                                  Text({
                                    text: this.questionBinding,
                                    numberOfLines: 5,
                                    style: {
                                      fontSize: 16,
                                      fontWeight: '500',
                                      color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black'),
                                      textAlign: 'center',
                                      lineHeight: 18
                                    }
                                  })
                                ]
                              }),

                              // Answer count container - flex to fill right space
                              View({
                                style: {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for answer count flex container
                                },
                                children: [
                                  // Answer count on the right
                                  View({
                                    style: {
                                      alignItems: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for answer count indicator
                                    },
                                    children: [
                                      Text({
                                        text: this.answerCountBinding,
                                        style: {
                                          fontSize: 16,
                                          fontWeight: 'bold',
                                          color: 'white'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 10,
                                          color: 'white'
                                        }
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                    )
                  ),

                  // No image - center the question (3+ answer questions)
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    UINode.if(
                      this.answerCountTracking.derive(count => count !== 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '5%',
                          paddingBottom: '25%', // Leave space for answer buttons
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for question container (no image, 3+ answers)
                        },
                        children: [
                          // Timer container - flex to fill left space
                          View({
                            style: {
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for timer flex container
                                },
                                children: [
                                  // Timer on the left
                                  View({
                                    style: {
                                      width: 45, // Increased from 35 to 45
                                      height: 45, // Increased from 35 to 45
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 22.5, // Increased from 17.5 to 22.5
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 16, // Increased from 12 to 16
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    })
                                  })
                                ]
                              }),

                              // Question text in the middle
                              View({
                                style: {
                                  backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#374151' : 'white'),
                                  borderRadius: 6,
                                  shadowColor: 'black',
                                  shadowOpacity: 0.15,
                                  shadowRadius: 6,
                                  shadowOffset: [0, 2],
                                  paddingTop: 12,
                                  paddingBottom: 12,
                                  paddingLeft: 12,
                                  paddingRight: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  alignSelf: 'center',
                                  maxWidth: '60%',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for question text box (no image, 3+ answers)
                                },
                                children: [
                                  // Question text
                                  Text({
                                    text: this.questionBinding,
                                    numberOfLines: 5,
                                    style: {
                                      fontSize: 16,
                                      fontWeight: '500',
                                      color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black'),
                                      textAlign: 'center',
                                      lineHeight: 18
                                    }
                                  })
                                ]
                              }),

                              // Answer count container - flex to fill right space
                              View({
                                style: {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for answer count flex container
                                },
                                children: [
                                  // Answer count on the right
                                  View({
                                    style: {
                                      alignItems: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for answer count indicator
                                    },
                                    children: [
                                      Text({
                                        text: this.answerCountBinding,
                                        style: {
                                          fontSize: 20, // Increased from 16 to 20
                                          fontWeight: 'bold',
                                          color: 'white'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 12, // Increased from 10 to 12
                                          color: 'white'
                                        }
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                    )
                  ),

                  // Question text with image - positioned at top
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null && imageId !== ""),
                    View({
                      style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0, // Fill available space, answer section will overlay at bottom
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        paddingTop: '1%',
                        paddingBottom: this.answerCountTracking.derive(count => count === 2 ? 52 : 100) as any, // Reduce height for 2-answer questions (100 - 48px for unused button + gap)
                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                        borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for question container (with image)
                      },
                      children: [
                        // Question text only - centered at top (no timer/answer count here for image questions)
                        View({
                          style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 58, // Increased height to accommodate padding (50 + 8)
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center', // Center the question text
                            width: '100%',
                            flexShrink: 0, // Prevent shrinking
                            paddingTop: 4, // Added top padding for better balance
                            paddingBottom: 4, // Reduced bottom padding from 8 to 4
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for header layout container
                          },
                          children: [
                            // Question text in the middle (centered)
                            View({
                              style: {
                                backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#374151' : 'white'),
                                borderRadius: 6,
                                shadowColor: 'black',
                                shadowOpacity: 0.15,
                                shadowRadius: 6,
                                shadowOffset: [0, 2],
                                paddingTop: 12,
                                paddingBottom: 12,
                                paddingLeft: 12,
                                paddingRight: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                maxWidth: '90%', // Increased since we removed timer and answer count from question text box
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for question text box (with image)
                              },
                              children: [
                                // Question text
                                Text({
                                  text: this.questionBinding,
                                  numberOfLines: 2,
                                  style: {
                                    fontSize: 14,
                                    fontWeight: '500',
                                    color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black'),
                                    textAlign: 'center',
                                    lineHeight: 18
                                  }
                                })
                              ]
                            })
                          ]
                        }),

                        // Question image container with timer on left, image in middle, answer count on right
                        View({
                          style: {
                            position: 'absolute',
                            top: 58, // Start exactly at the bottom of the blue header container (58px height)
                            left: 0,
                            right: 0,
                            bottom: this.answerCountTracking.derive(count => count === 2 ? 62 : 110) as any, // Stop above the green answer container (110px height, reduced by 48px for 2-answer questions)
                            flexDirection: 'row', // Horizontal layout: timer | image | answer count
                            alignItems: 'center',
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for question image container
                          },
                          children: [
                            // Timer container on the left
                            View({
                              style: {
                                flex: 1, // Equal space with answer count container
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for timer container
                              },
                              children: [
                                View({
                                  style: {
                                    width: 45, // Increased from 35 to 45
                                    height: 45, // Increased from 35 to 45
                                    backgroundColor: '#FF6B35',
                                    borderRadius: 22.5, // Increased from 17.5 to 22.5
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for timer circle
                                  },
                                  children: Text({
                                    text: this.timerBinding,
                                    style: {
                                      fontSize: 16, // Increased from 12 to 16
                                      fontWeight: 'bold',
                                      color: 'white'
                                    }
                                  })
                                })
                              ]
                            }),

                            // Image container in the middle
                            View({
                              style: {
                                width: 'auto', // Let container size itself to hug the image
                                maxWidth: '60%', // Prevent it from getting too wide
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#FFFF00' : 'transparent') // Yellow border for image container
                              },
                              children: [
                                Image({
                                  source: this.questionImageBinding.derive(imageId => {
                                    if (!imageId) return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                    const textureId = this.getTextureIdForImage(imageId);
                                    if (textureId) {
                                      try {
                                        const bigIntId = BigInt(textureId);
                                        return ImageSource.fromTextureAsset(new hz.TextureAsset(bigIntId));
                                      } catch (error) {
                                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                      }
                                    }
                                    return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                  }),
                                  style: {
                                    width: '100%', // Fill the full width of the container
                                    height: '100%', // Fill the full height of the container
                                    aspectRatio: 1.5, // Maintain 3:2 aspect ratio
                                    borderRadius: 8,
                                    alignSelf: 'center'
                                  }
                                })
                              ]
                            }),

                            // Answer count container on the right
                            View({
                              style: {
                                flex: 1, // Equal space with timer container
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for answer count container
                              },
                              children: [
                                View({
                                  style: {
                                    alignItems: 'center',
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer count indicator
                                  },
                                  children: [
                                    Text({
                                      text: this.answerCountBinding,
                                      style: {
                                        fontSize: 20, // Increased from 16 to 20
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    }),
                                    Text({
                                      text: 'Answers',
                                      style: {
                                        fontSize: 12, // Increased from 10 to 12
                                        color: 'white'
                                      }
                                    })
                                  ]
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  ),

                  // Answer options grid - anchored to bottom of game screen
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 0, // Flush with bottom of red container
                      left: 0,
                      right: 0,
                      height: 110, // Fixed height for consistent 4-option layout
                      paddingHorizontal: 8, // Reduced from 16px to 8px for more button space
                      paddingTop: 5,
                      paddingBottom: 8, // Reduced from 16px to 8px for more button space
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for answer options grid
                    },
                    children: [
                      // Dynamic layout based on number of answers
                      UINode.if(
                        this.answerCountTracking.derive(count => count > 0),
                        View({
                          style: {
                            width: '100%',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                            // Removed blue border for answer grid container
                          },
                          children: [
                            // Always show 4 slots - for 2-answer questions, use bottom 2 slots
                            // Answer 0 (Red/Triangle) - Option 1 - show answer 0 only if there are 3+ answers
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginRight: 6,
                                marginBottom: 6,
                                borderWidth: 0, // Hide outline for top options in 2-answer layout
                                borderColor: 'transparent' // Hide outline for top options in 2-answer layout
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count > 2 && this.currentQuestionAnswers.length > 0),
                                this.createAnswerButton(0, '#DC2626', '1290982519195562'),
                                this.createBlankButton()
                              )
                            }),

                            // Answer 1 (Blue/Star) - Option 2 - show answer 1 only if there are 4+ answers
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginBottom: 6,
                                borderWidth: 0, // Hide outline for top options in 2-answer layout
                                borderColor: 'transparent' // Hide outline for top options in 2-answer layout
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count > 3 && this.currentQuestionAnswers.length > 1),
                                this.createAnswerButton(1, '#2563EB', '764343253011569'),
                                this.createBlankButton()
                              )
                            }),

                            // Answer 2 (Yellow/Circle) - Option 3 - show answer 0 for 2-answer questions, answer 2 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginRight: 6,
                                marginBottom: 6,
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 2 container
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 0 in position 3
                                UINode.if(
                                  this.answerTexts[0].derive(text => text !== ''),
                                  this.createAnswerButton(0, '#DC2626', '1290982519195562'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 2 in position 3
                                UINode.if(
                                  this.answerTexts[2].derive(text => text !== ''),
                                  this.createAnswerButton(2, '#EAB308', '797899126007085'),
                                  this.createBlankButton()
                                )
                              )
                            }),

                            // Answer 3 (Green/Square) - Option 4 - show answer 1 for 2-answer questions, answer 3 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginBottom: 6,
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 3 container
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 1 in position 4
                                UINode.if(
                                  this.answerTexts[1].derive(text => text !== ''),
                                  this.createAnswerButton(1, '#2563EB', '764343253011569'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 3 in position 4
                                UINode.if(
                                  this.answerTexts[3].derive(text => text !== ''),
                                  this.createAnswerButton(3, '#16A34A', '1286736292915198'),
                                  this.createBlankButton()
                                )
                              )
                            })
                          ]
                        })
                      )
                    ]
                  }),

                  // Waiting for Other Players overlay
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: this.showWaitingBinding.derive(show => show ? 'flex' : 'none'),
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for waiting overlay
                    },
                    children: View({
                      style: {
                        backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#374151' : 'white'),
                        borderRadius: 12,
                        padding: 20,
                        alignItems: 'center',
                        maxWidth: '60%',
                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                        borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for waiting content box
                      },
                      children: [
                        Text({
                          text: 'Waiting for Other Players...',
                          style: {
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : '#1F2937'),
                            marginBottom: 8,
                            textAlign: 'center'
                          }
                        }),
                        Text({
                          text: 'Please wait while other players submit their answers',
                          style: {
                            fontSize: 12,
                            color: this.isDarkModeBinding.derive(isDark => isDark ? '#D1D5DB' : '#6B7280'),
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  }),

                  // Leaderboard overlay
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#1F2937' : '#F3F4F6'),
                      display: this.showLeaderboardBinding.derive(show => show ? 'flex' : 'none'),
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for leaderboard overlay
                    },
                    children: [
                      // Background image for leaderboard
                      Image({
                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2770757216446813'))),
                        style: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          zIndex: -1
                        }
                      }),
                      // Main content container
                      View({
                        style: {
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 32,
                          paddingVertical: 0,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0
                        },
                        children: [
                          // Header - "Game Over!"
                          View({
                            style: {
                              backgroundColor: 'white',
                              borderRadius: 8,
                              paddingHorizontal: 9, // Scaled from 11
                              paddingVertical: 9, // Scaled from 11
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12, // Scaled from 15
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for header
                            },
                            children: Text({
                              text: 'Game Over!',
                              style: {
                                fontSize: 21, // Scaled from 26
                                fontWeight: 'bold',
                                color: 'black',
                                textAlign: 'center'
                              }
                            })
                          }),

                          // Leaderboard entries container
                          View({
                            style: {
                              flexDirection: 'column',
                              alignItems: 'stretch',
                              width: '100%',
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for entries container
                            },
                            children: [
                              // Player 1 entry
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 0),
                                View({
                                  style: {
                                    backgroundColor: 'white',
                                    height: 56, // Increased from 48
                                    borderRadius: 10,
                                    paddingHorizontal: 13, // Scaled from 16
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7, // Scaled from 9
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for player 1 entry
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38, // Scaled from 48
                                            height: 25, // Scaled from 31
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10 // Scaled from 12
                                          },
                                          children: Text({
                                            text: '1',
                                            style: {
                                              fontSize: 22, // Decreased from 25
                                              fontWeight: 'bold',
                                              color: 'black'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42, // Increased from 34
                                            height: 42, // Increased from 34
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10, // Scaled from 12
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && players[0].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42, // Increased from 34
                                                  height: 42, // Increased from 34
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && !players[0].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 ? players[0].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13, // Scaled from 16
                                                  fontWeight: 'bold',
                                                  color: 'black'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start', // Changed from center to flex-start for left alignment
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 0 ? players[0].name : ''
                                            ),
                                            style: {
                                              fontSize: 17, // Scaled from 21
                                              fontWeight: 'bold',
                                              color: 'black',
                                              textAlign: 'left' // Changed from center to left
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 ? players[0].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17, // Scaled from 21
                                        fontWeight: 'bold',
                                        color: 'black',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Player 2 entry
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 1),
                                View({
                                  style: {
                                    backgroundColor: 'white',
                                    height: 56, // Increased from 48
                                    borderRadius: 10,
                                    paddingHorizontal: 13, // Scaled from 16
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7, // Scaled from 9
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for player 2 entry
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38, // Scaled from 48
                                            height: 25, // Scaled from 31
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10 // Scaled from 12
                                          },
                                          children: Text({
                                            text: '2',
                                            style: {
                                              fontSize: 22, // Decreased from 25
                                              fontWeight: 'bold',
                                              color: 'black'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42, // Increased from 34
                                            height: 42, // Increased from 34
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10, // Scaled from 12
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && players[1].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42, // Increased from 34
                                                  height: 42, // Increased from 34
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && !players[1].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 ? players[1].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13, // Scaled from 16
                                                  fontWeight: 'bold',
                                                  color: 'black'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start', // Changed from center to flex-start for left alignment
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 1 ? players[1].name : ''
                                            ),
                                            style: {
                                              fontSize: 17, // Scaled from 21
                                              fontWeight: 'bold',
                                              color: 'black',
                                              textAlign: 'left' // Changed from center to left
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 ? players[1].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17, // Scaled from 21
                                        fontWeight: 'bold',
                                        color: 'black',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Player 3 entry
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 2),
                                View({
                                  style: {
                                    backgroundColor: 'white',
                                    height: 56, // Increased from 48
                                    borderRadius: 10,
                                    paddingHorizontal: 13, // Scaled from 16
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for player 3 entry
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38, // Scaled from 48
                                            height: 25, // Scaled from 31
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10 // Scaled from 12
                                          },
                                          children: Text({
                                            text: '3',
                                            style: {
                                              fontSize: 22, // Decreased from 25
                                              fontWeight: 'bold',
                                              color: 'black'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42, // Increased from 34
                                            height: 42, // Increased from 34
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10, // Scaled from 12
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && players[2].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42, // Increased from 34
                                                  height: 42, // Increased from 34
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && !players[2].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 ? players[2].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13, // Scaled from 16
                                                  fontWeight: 'bold',
                                                  color: 'black'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start', // Changed from center to flex-start for left alignment
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 2 ? players[2].name : ''
                                            ),
                                            style: {
                                              fontSize: 17, // Scaled from 21
                                              fontWeight: 'bold',
                                              color: 'black',
                                              textAlign: 'left' // Changed from center to left
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 ? players[2].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17, // Scaled from 21
                                        fontWeight: 'bold',
                                        color: 'black',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              )
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Error Screen overlay - MOVED TO SEPARATE SCREEN
                  // This overlay has been removed and replaced with a standalone error screen below
                ]
              })
            ),

            // Results Screen (separate page)
            // NOTE: DO NOT REMOVE THE 16:9 ASPECT RATIO - This maintains consistency with all other screens
            // NOTE: The 16:9 aspect ratio is critical for proper display across all devices
            UINode.if(
              this.showResultsBinding,
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#1F2937' : 'white'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for results screen background
                },
                children: [
                  // Background image for results screen
                  Image({
                    source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2770757216446813'))),
                    style: {
                      position: 'absolute',
                      top: -16,
                      left: -16,
                      right: -16,
                      bottom: -16,
                      width: 'calc(100% + 32px)',
                      height: 'calc(100% + 32px)',
                      resizeMode: 'cover',
                      zIndex: -1
                    }
                  }),
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: '8%',
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for header container
                    },
                    children: Text({
                      text: 'Game Complete!',
                      style: {
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : '#1F2937'),
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Podium Section
                  View({
                    style: {
                      position: 'absolute',
                      top: '25%',
                      left: 0,
                      right: 0,
                      bottom: '25%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for podium section
                    },
                    children: View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        justifyContent: 'center'
                      },
                      children: [
                        // 2nd Place
                        View({
                          style: {
                            alignItems: 'center',
                            marginHorizontal: 16,
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#FFFF00' : 'transparent') // Yellow border for 2nd place
                          },
                          children: [
                            // Avatar (simulated with player 2)
                            UINode.if(
                              this.leaderboardDataBinding.derive(players =>
                                players.length > 1 && players[1].headshotImageSource
                              ),
                              Image({
                                source: this.leaderboardDataBinding.derive(players =>
                                  players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                ),
                                style: {
                                  width: 48,
                                  height: 48,
                                  borderRadius: 12,
                                  marginBottom: 8
                                }
                              })
                            ),
                            // Name
                            Text({
                              text: this.leaderboardDataBinding.derive(players =>
                                players.length > 1 ? players[1].name : 'Player 2'
                              ),
                              style: {
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : '#1F2937'),
                                textAlign: 'center',
                                marginBottom: 8
                              }
                            }),
                            // Platform
                            View({
                              style: {
                                width: 60,
                                height: 48,
                                backgroundColor: '#9CA3AF',
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              children: [
                                Text({
                                  text: '2nd',
                                  style: {
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#374151',
                                    marginBottom: 2
                                  }
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 1 ? players[1].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 10,
                                    fontWeight: '600',
                                    color: '#4B5563'
                                  }
                                })
                              ]
                            })
                          ]
                        }),

                        // 1st Place
                        View({
                          style: {
                            alignItems: 'center',
                            marginHorizontal: 16,
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#FFFF00' : 'transparent') // Yellow border for 1st place
                          },
                          children: [
                            // Avatar (simulated with player 1)
                            UINode.if(
                              this.leaderboardDataBinding.derive(players =>
                                players.length > 0 && players[0].headshotImageSource
                              ),
                              Image({
                                source: this.leaderboardDataBinding.derive(players =>
                                  players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                ),
                                style: {
                                  width: 60,
                                  height: 60,
                                  borderRadius: 12,
                                  marginBottom: 8
                                }
                              })
                            ),
                            // Name
                            Text({
                              text: this.leaderboardDataBinding.derive(players =>
                                players.length > 0 ? players[0].name : 'Winner'
                              ),
                              style: {
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : '#1F2937'),
                                textAlign: 'center',
                                marginBottom: 8
                              }
                            }),
                            // Platform
                            View({
                              style: {
                                width: 72,
                                height: 60,
                                backgroundColor: '#FBBF24',
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              children: [
                                Text({
                                  text: '1st',
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#92400E',
                                    marginBottom: 2
                                  }
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 0 ? players[0].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#B45309'
                                  }
                                })
                              ]
                            })
                          ]
                        }),

                        // 3rd Place
                        View({
                          style: {
                            alignItems: 'center',
                            marginHorizontal: 16,
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#FFFF00' : 'transparent') // Yellow border for 3rd place
                          },
                          children: [
                            // Avatar (simulated with player 3)
                            UINode.if(
                              this.leaderboardDataBinding.derive(players =>
                                players.length > 2 && players[2].headshotImageSource
                              ),
                              Image({
                                source: this.leaderboardDataBinding.derive(players =>
                                  players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                ),
                                style: {
                                  width: 42,
                                  height: 42,
                                  borderRadius: 12,
                                  marginBottom: 8
                                }
                              })
                            ),
                            // Name
                            Text({
                              text: this.leaderboardDataBinding.derive(players =>
                                players.length > 2 ? players[2].name : 'Player 3'
                              ),
                              style: {
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : '#1F2937'),
                                textAlign: 'center',
                                marginBottom: 8
                              }
                            }),
                            // Platform
                            View({
                              style: {
                                width: 48,
                                height: 36,
                                backgroundColor: '#FB923C',
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              children: [
                                Text({
                                  text: '3rd',
                                  style: {
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: '#9A3412',
                                    marginBottom: 2
                                  }
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 2 ? players[2].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 10,
                                    fontWeight: '600',
                                    color: '#C2410C'
                                  }
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  })
                ]
              })
            )
          ]
        })),

        // Debug Panel (below the main game UI)
        View({
          style: {
            width: '100vw',
            backgroundColor: '#2D3748',
            borderRadius: 12,
            padding: 12,
            marginTop: 10,
            flexDirection: 'column'
          },
          children: [
            Text({
              text: '🔧 TriviaGame Debug Panel',
              style: {
                fontSize: 14,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 12
              }
            }),
            View({
              style: {
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Top Row - 5 buttons
                // Config Screen
                Pressable({
                  style: {
                    backgroundColor: this.showConfigBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowConfigScreen(),
                  children: [
                    Text({
                      text: 'pre-game',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Question Screen
                Pressable({
                  style: {
                    backgroundColor: this.show4AQuestionScreenBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowQuestionScreen(),
                  children: [
                    Text({
                      text: '4A',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Question with Image Screen
                Pressable({
                  style: {
                    backgroundColor: this.show2AQuestionScreenBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowQuestionWithImageScreen(),
                  children: [
                    Text({
                      text: '2A',
                      style: {
                        fontSize: 8,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Leaderboard Screen
                Pressable({
                  style: {
                    backgroundColor: this.showLeaderboardBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: async () => await this.debugShowLeaderboardScreen(),
                  children: [
                    Text({
                      text: 'Leaderboard',
                      style: {
                        fontSize: 8,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Results Screen
                Pressable({
                  style: {
                    backgroundColor: this.showResultsBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: async () => await this.debugShowResultsScreen(),
                  children: [
                    Text({
                      text: 'Results',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Bottom Row - 3 buttons
                // Error Screen
                Pressable({
                  style: {
                    backgroundColor: this.showErrorBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '30%',
                    marginRight: '3%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowErrorScreen(),
                  children: [
                    Text({
                      text: 'Error',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Toggle Theme
                Pressable({
                  style: {
                    backgroundColor: this.isDarkModeBinding.derive(isDark => isDark ? '#7C3AED' : '#16A34A'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '30%',
                    marginRight: '3%',
                    alignItems: 'center'
                  },
                  onPress: () => this.toggleTheme(),
                  children: [
                    Text({
                      text: this.isDarkModeBinding.derive(isDark => isDark ? 'Light' : 'Dark'),
                      style: {
                        fontSize: 8,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Toggle Outlines
                Pressable({
                  style: {
                    backgroundColor: this.showOutlinesBinding.derive(show => show ? '#16A34A' : '#DC2626'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '30%',
                    alignItems: 'center'
                  },
                  onPress: () => this.toggleOutlines(),
                  children: [
                    Text({
                      text: this.showOutlinesBinding.derive(show => show ? 'Outlines' : 'Outlines'),
                      style: {
                        fontSize: 8,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private async loadQuestionsFromAssets(): Promise<void> {
    try {
      // Load Italian Brainrot Quiz questions
      if (this.props.italianBrainrotQuiz && this.props.italianBrainrotQuiz !== null) {
        const asset = this.props.italianBrainrotQuiz as hz.Asset;
        const assetData = await asset.fetchAsData();
        const jsonData = assetData.asJSON();

        if (jsonData && Array.isArray(jsonData)) {
          // Convert CustomQuizQuestion format to TriviaQuestion format
          this.italianBrainrotQuestions = this.loadCustomQuiz(jsonData);

          // Pre-load all images for Italian Brainrot questions
          await this.preloadItalianBrainrotImages();
        }
      }

      // Load General Questions
      if (this.props.generalQuestions && this.props.generalQuestions !== null) {
        const asset = this.props.generalQuestions as hz.Asset;
        const assetData = await asset.fetchAsData();
        const jsonData = assetData.asJSON();
        
        if (jsonData) {
          // Parse the Open Trivia Database format (nested structure)
          this.generalQuestions = this.parseOpenTriviaFormat(jsonData);
          
          // Log first few questions for debugging
          if (this.generalQuestions.length > 0) {
            
          }
        } else {
          
        }
      }

      // Pre-shuffle question orders to ensure no duplicates
      this.preShuffleQuestionOrders();

      // Log summary
      if (this.italianBrainrotQuestions.length === 0 && this.generalQuestions.length === 0) {
        
      }

    } catch (error) {
      
    }
  }

  // Pre-load all Italian Brainrot Quiz images onto all players' devices
  private async preloadItalianBrainrotImages(): Promise<void> {
    if (this.italianBrainrotQuestions.length === 0) {
      
      return;
    }

    const imagesToPreload: string[] = [];
    let preloadedCount = 0;

    // Collect all unique image IDs that need to be pre-loaded
    for (const question of this.italianBrainrotQuestions) {
      if (question.image && !imagesToPreload.includes(question.image)) {
        imagesToPreload.push(question.image);
      }
    }

    if (imagesToPreload.length === 0) {
      
      return;
    }

    // Pre-load each image
    for (const imageId of imagesToPreload) {
      try {
        const textureId = this.getTextureIdForImage(imageId);
        if (textureId) {
          // Create the texture asset to trigger pre-loading
          const textureAsset = new hz.TextureAsset(BigInt(textureId));

          // Create an ImageSource to ensure the texture is loaded into memory
          const imageSource = ImageSource.fromTextureAsset(textureAsset);

          // Force the image to load by creating a temporary Image component
          // This ensures the texture is cached on the device
          const tempImage = Image({
            source: imageSource,
            style: { width: 1, height: 1, opacity: 0 }
          });

          preloadedCount++;
          
        } else {
          
        }
      } catch (error) {
        
      }
    }

    
  }

  // Pre-shuffle question orders to ensure no duplicates during gameplay
  private preShuffleQuestionOrders(): void {
    // Shuffle General Questions
    if (this.generalQuestions.length > 0) {
      this.generalQuestionsShuffledIndices = this.createShuffledIndices(this.generalQuestions.length);
      this.generalQuestionsCurrentIndex = 0;
      
    }

    // Shuffle Italian Brainrot Questions
    if (this.italianBrainrotQuestions.length > 0) {
      this.italianBrainrotQuestionsShuffledIndices = this.createShuffledIndices(this.italianBrainrotQuestions.length);
      this.italianBrainrotQuestionsCurrentIndex = 0;
      
    }
  }

  // Create a shuffled array of indices (0 to length-1) with no duplicates
  private createShuffledIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);

    // Fisher-Yates shuffle algorithm
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices;
  }

  // Get next question from pre-shuffled General questions
  private getNextGeneralQuestion(): TriviaQuestion | null {
    if (this.generalQuestions.length === 0) return null;

    // If we've gone through all questions, reset to beginning
    if (this.generalQuestionsCurrentIndex >= this.generalQuestionsShuffledIndices.length) {
      this.generalQuestionsCurrentIndex = 0;
      
    }

    const questionIndex = this.generalQuestionsShuffledIndices[this.generalQuestionsCurrentIndex];
    const question = this.generalQuestions[questionIndex];
    this.generalQuestionsCurrentIndex++;

    return question;
  }

  // Get next question from pre-shuffled Italian Brainrot questions
  private getNextItalianBrainrotQuestion(): TriviaQuestion | null {
    if (this.italianBrainrotQuestions.length === 0) return null;

    // If we've gone through all questions, reset to beginning
    if (this.italianBrainrotQuestionsCurrentIndex >= this.italianBrainrotQuestionsShuffledIndices.length) {
      this.italianBrainrotQuestionsCurrentIndex = 0;
    }

    const questionIndex = this.italianBrainrotQuestionsShuffledIndices[this.italianBrainrotQuestionsCurrentIndex];
    const question = this.italianBrainrotQuestions[questionIndex];
    this.italianBrainrotQuestionsCurrentIndex++;

    return question;
  }

  // Reset and re-shuffle question orders
  private resetQuestionOrders(): void {
    
    this.preShuffleQuestionOrders();
  }

  // Toggle outline borders on/off
  private toggleOutlines(): void {
    this.showOutlines = !this.showOutlines;
    this.showOutlinesBinding.set(this.showOutlines);
    
  }

  // Toggle between light and dark mode
  private toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.isDarkModeBinding.set(this.isDarkMode);
    
  }

  // Convert CustomQuizQuestion[] to TriviaQuestion[]
  private loadCustomQuiz(questions: CustomQuizQuestion[]): TriviaQuestion[] {
    return questions.map((item, index) => ({
      id: index + 1,
      question: item.question,
      category: "Italian Brainrot Quiz",
      difficulty: "medium",
      image: item.image_id || null, // Use image_id directly as texture ID
      answers: [
        { text: item.correct_answer, correct: true },
        ...item.incorrect_answers.map(answer => ({ text: answer, correct: false }))
      ]
    }));
  }

  // Convert Open Trivia Database format to TriviaQuestion[]
  private parseOpenTriviaFormat(jsonData: any): TriviaQuestion[] {
    const questions: TriviaQuestion[] = [];

    // Handle the nested structure with difficulty levels
    if (jsonData && jsonData.questions) {
      // Extract questions from all difficulty levels
      const difficulties = ['easy', 'medium', 'hard'];
      let questionId = 1;

      for (const difficulty of difficulties) {
        if (jsonData.questions[difficulty] && Array.isArray(jsonData.questions[difficulty])) {
          for (const item of jsonData.questions[difficulty]) {
            if (item.question) { // Only add if question exists
              questions.push({
                id: questionId++,
                question: item.question,
                category: item.category || "General",
                difficulty: difficulty,
                image: null, // Open Trivia Database doesn't have images
                answers: this.parseOpenTriviaAnswers(item)
              });
            }
          }
        }
      }
    } else if (Array.isArray(jsonData)) {
      // Fallback for direct array format
      jsonData.forEach((item, index) => {
        questions.push({
          id: index + 1,
          question: item.question || "No question provided",
          category: item.category || "General",
          difficulty: item.difficulty || "medium",
          image: null,
          answers: this.parseOpenTriviaAnswers(item)
        });
      });
    }

    return questions;
  }

  // Parse answers from Open Trivia Database format
  private parseOpenTriviaAnswers(question: any): { text: string; correct: boolean }[] {
    const answers = [];
    
    // Add correct answer
    if (question.correct_answer) {
      answers.push({ text: question.correct_answer, correct: true });
    }
    
    // Add incorrect answers
    if (question.incorrect_answers && Array.isArray(question.incorrect_answers)) {
      question.incorrect_answers.forEach((answer: string) => {
        answers.push({ text: answer, correct: false });
      });
    }
    
    return answers;
  }

  private async loadPlayerHeadshot(player: hz.Player, stage: 'INIT' | 'RUNTIME' = 'RUNTIME'): Promise<void> {
    const playerId = player.id.toString();
    
    try {
      const headshotImageSource = await Social.getAvatarImageSource(player, {
        type: AvatarImageType.HEADSHOT,
        highRes: true
      });

      // Cache the headshot for this player
      this.playerHeadshots.set(playerId, headshotImageSource);
      
      // Trigger UI update to show the new headshot
      this.updateTriggerCounter++;
      this.playersUpdateTrigger.set(this.updateTriggerCounter);
      
    } catch (error) {
      // Could not get headshot for player, cache as null
      this.playerHeadshots.set(playerId, null);
    }
  }

  private createStaticPlayersComponents(): UINode[] {
    // Create static slots for up to 8 players that will reactively show/hide based on current players
    const maxSlots = 8;
    const components: UINode[] = [];
    
    for (let i = 0; i < maxSlots; i++) {
      components.push(
        UINode.if(
          this.playersUpdateTrigger.derive(() => {
            const currentPlayers = this.world.getPlayers();
            const hasPlayerAtIndex = i < currentPlayers.length;
            return hasPlayerAtIndex;
          }),
          View({
            style: {
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 8,
              marginRight: 12,
              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for individual player container
            },
            children: [
              // Player avatar - reactive based on current player at this index
              View({
                style: {
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  overflow: 'hidden',
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for player avatar container
                },
                children: [
                  // Show headshot if available
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      if (i < currentPlayers.length) {
                        const player = currentPlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return hasHeadshot;
                      }
                      return false;
                    }),
                    Image({
                      source: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (i < currentPlayers.length) {
                          const player = currentPlayers[i];
                          const playerId = player.id.toString();
                          const headshot = this.playerHeadshots.get(playerId);
                          return headshot || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                        }
                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                      }),
                      style: {
                        width: 48,
                        height: 48,
                        borderRadius: 8
                      }
                    })
                  ),
                  // Show initial letter as fallback
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      if (i < currentPlayers.length) {
                        const player = currentPlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return !hasHeadshot; // Show letter when no headshot
                      }
                      return false;
                    }),
                    Text({
                      text: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (i < currentPlayers.length) {
                          const player = currentPlayers[i];
                          return player.name.get().charAt(0).toUpperCase();
                        }
                        return "";
                      }),
                      style: {
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black')
                      }
                    })
                  )
                ]
              }),
              // Player name
              Text({
                text: this.playersUpdateTrigger.derive(() => {
                  const currentPlayers = this.world.getPlayers();
                  if (i < currentPlayers.length) {
                    const player = currentPlayers[i];
                    return player.name.get();
                  }
                  return "";
                }),
                style: {
                  fontSize: 10,
                  color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black'),
                  textAlign: 'center',
                  maxWidth: 60,
                  overflow: 'hidden'
                }
              })
            ]
          })
        )
      );
    }
    
    // Add empty state when no players
    components.push(
      UINode.if(
        this.playersUpdateTrigger.derive(() => {
          const currentPlayers = this.world.getPlayers();
          const isEmpty = currentPlayers.length === 0;
          return isEmpty;
        }),
        View({
          style: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            width: '100%',
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for empty state container
          },
          children: Text({
            text: 'No players yet...',
            style: {
              fontSize: 14,
              color: this.isDarkModeBinding.derive(isDark => isDark ? 'white' : 'black'),
              textAlign: 'center'
            }
          })
        })
      )
    );
    
    return components;
  }

  private createPlayerAvatarsGrid(): UINode[] {
    const components: UINode[] = [];

    // Create 15 player avatar placeholders with names (5x3 grid)
    for (let i = 0; i < 15; i++) {
      components.push(
        View({
          style: {
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 3, // Reduced from 6 to 3 for tighter vertical spacing
            marginRight: 12, // Increased from 8 to 12 for better wrapping
            marginLeft: 12, // Added left margin for better wrapping
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for avatar container
          },
          children: [
            // Avatar container (square 1:1 aspect ratio)
            View({
              style: {
                width: 50, // Square frame
                height: 50, // Square frame
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for avatar frame
              },
              children: [
                // Show player avatar with different expressions (alternate between cover and contain)
                UINode.if(
                  this.playersUpdateTrigger.derive(() => {
                    const currentPlayers = this.world.getPlayers();
                    return currentPlayers.length > 0;
                  }),
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      if (currentPlayers.length > 0) {
                        // Find player with lowest ID
                        let lowestIdPlayer = currentPlayers[0];
                        let lowestId = BigInt(currentPlayers[0].id.toString());

                        for (const player of currentPlayers) {
                          const playerId = BigInt(player.id.toString());
                          if (playerId < lowestId) {
                            lowestId = playerId;
                            lowestIdPlayer = player;
                          }
                        }

                        const playerId = lowestIdPlayer.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return hasHeadshot;
                      }
                      return false;
                    }),
                    Image({
                      source: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (currentPlayers.length > 0) {
                          // Find player with lowest ID
                          let lowestIdPlayer = currentPlayers[0];
                          let lowestId = BigInt(currentPlayers[0].id.toString());

                          for (const player of currentPlayers) {
                            const playerId = BigInt(player.id.toString());
                            if (playerId < lowestId) {
                              lowestId = playerId;
                              lowestIdPlayer = player;
                            }
                          }

                          const playerId = lowestIdPlayer.id.toString();
                          const headshot = this.playerHeadshots.get(playerId);
                          return headshot || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                        }
                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                      }),
                      style: {
                        width: 50, // Square image
                        height: 50, // Square image
                        resizeMode: i % 2 === 0 ? 'cover' : 'contain' // Alternate between cover and contain for different expressions
                      }
                    }),
                    Text({
                      text: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (currentPlayers.length > 0) {
                          // Find player with lowest ID
                          let lowestIdPlayer = currentPlayers[0];
                          let lowestId = BigInt(currentPlayers[0].id.toString());

                          for (const player of currentPlayers) {
                            const playerId = BigInt(player.id.toString());
                            if (playerId < lowestId) {
                              lowestId = playerId;
                              lowestIdPlayer = player;
                            }
                          }

                          return lowestIdPlayer.name.get().charAt(0).toUpperCase();
                        }
                        return "";
                      }),
                      style: {
                        fontSize: 20, // Larger for better visibility in square frame
                        fontWeight: 'bold',
                        color: '#6B7280'
                      }
                    })
                  ),
                  // Empty placeholder for unused slots
                  View({
                    style: {
                      width: 50,
                      height: 50
                    }
                  })
                )
              ]
            }),
            // Player name below avatar
            Text({
              text: this.playersUpdateTrigger.derive(() => {
                const currentPlayers = this.world.getPlayers();
                if (currentPlayers.length > 0) {
                  // Find player with lowest ID
                  let lowestIdPlayer = currentPlayers[0];
                  let lowestId = BigInt(currentPlayers[0].id.toString());

                  for (const player of currentPlayers) {
                    const playerId = BigInt(player.id.toString());
                    if (playerId < lowestId) {
                      lowestId = playerId;
                      lowestIdPlayer = player;
                    }
                  }

                  return lowestIdPlayer.name.get();
                }
                return "";
              }),
              style: {
                fontSize: 10, // Small text for name
                fontWeight: '500',
                color: 'white',
                textAlign: 'center',
                marginTop: 2, // Reduced from 4 to 2 (50% reduction)
                maxWidth: 60,
                overflow: 'hidden'
              }
            })
          ]
        })
      );
    }

    return components;
  }

  private createAnswerButton(index: number, color: string, iconTextureId: string): UINode {
    const textureAsset = new hz.TextureAsset(BigInt(iconTextureId));

    // Map answer index to display number based on layout
    // For 2-answer questions: answer 0 -> "1", answer 1 -> "2" 
    // For 4-answer questions: answer 0 -> "1", answer 1 -> "2", answer 2 -> "3", answer 3 -> "4"
    const getDisplayNumber = (): string => {
      return (index + 1).toString();
    };

    // Determine icon size based on texture ID
    // Star (blue) stays at 18px, others get bigger at 20px
    const iconSize = iconTextureId === '764343253011569' ? 18 : 20; // Star = 18px, Triangle/Circle/Square = 20px

    return Pressable({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: this.answerButtonColors[index],
        borderRadius: 4,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      onPress: () => this.handleAnswerSelection(index),
      children: [
        // Icon
        Image({
          source: ImageSource.fromTextureAsset(textureAsset),
          style: {
            width: iconSize,
            height: iconSize,
            aspectRatio: 1,
            marginRight: 6
          }
        }),

        // Answer text
        Text({
          text: this.answerTexts[index],
          numberOfLines: 5,
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: 'white',
            flex: 1,
            textAlign: 'left',
            lineHeight: 12 // Reduced line spacing to prevent text cutoff
          }
        }),

        // Number indicator (only visible when answer is revealed)
        UINode.if(
          this.answerRevealedBinding,
          View({
            style: {
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
              paddingRight: 8 // Added right padding
            },
            children: Text({
              text: getDisplayNumber(),
              style: {
                fontSize: 10,
                fontWeight: 'bold',
                color: 'white' // Changed to white text
              }
            })
          })
        )
      ]
    });
  }

  private createBlankButton(): UINode {
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // Transparent background
        borderRadius: 4,
        borderWidth: 0,
        borderColor: 'transparent', // No border outline
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        Text({
          text: '', // Empty text
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: 'transparent'
          }
        })
      ]
    });
  }

  // Reset answer selection state for new question
  private resetAnswerState(): void {
    this.selectedAnswerIndex = -1;
    this.answerRevealed = false;
    this.answerRevealedBinding.set(false); // Update the binding
    this.currentQuestionAnswers = [];
    
    // Reset button colors to defaults
    const defaultColors = ['#DC2626', '#2563EB', '#EAB308', '#16A34A'];
    for (let i = 0; i < 4; i++) {
      this.answerButtonColors[i].set(defaultColors[i]);
    }
  }

  // Handle answer selection and reveal correct answer
  private handleAnswerSelection(selectedIndex: number): void {
    if (this.answerRevealed) return; // Don't allow selection if already revealed

    this.selectedAnswerIndex = selectedIndex;
    this.answerRevealed = true;
    this.answerRevealedBinding.set(true); // Update the binding

    const selectedAnswer = this.currentQuestionAnswers[selectedIndex];
    const isCorrect = selectedAnswer?.correct || false;

    

    // Find and log the correct answer
    const correctAnswer = this.currentQuestionAnswers.find(answer => answer.correct);
    if (correctAnswer) {
      
    }

    // Update button colors to show correct/incorrect answers
    for (let i = 0; i < this.currentQuestionAnswers.length; i++) {
      const answer = this.currentQuestionAnswers[i];
      if (answer?.correct) {
        this.answerButtonColors[i].set('#16A34A'); // Green for correct
      } else {
        this.answerButtonColors[i].set('#DC2626'); // Red for all incorrect answers
      }
    }
  }

  private setupDebugFunctionality(): void {
    // Setup debug functionality for testing different screens
    
  }

  private debugShowConfigScreen(): void {
    
    this.showConfigBinding.set(true);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
    this.showResultsBinding.set(false);
  }

  private async debugShowQuestionScreen(): Promise<void> {
    

    // Hide other screens
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
    this.showResultsBinding.set(false);

    // Set 4A screen as active and 2A screen as inactive
    this.show4AQuestionScreenBinding.set(true);
    this.show2AQuestionScreenBinding.set(false);

    // Get next question from pre-shuffled General questions
    // This goes sequentially through the pre-shuffled array (no duplicates)
    const question = this.getNextGeneralQuestion();
    if (question) {
      // Use the question as-is without shuffling answers (maintain original order)
      // The questions array is already pre-shuffled during initialization

      // Reset answer state for new question
      this.resetAnswerState();

      // Store the original answers for answer checking
      this.currentQuestionAnswers = question.answers;

      // Update UI bindings
      this.questionBinding.set(question.question);
      this.questionImageBinding.set(null); // No image for regular question screen
      this.answerCountTracking.set(question.answers.length);

      // Update answer texts
      for (let i = 0; i < 4; i++) {
        if (i < question.answers.length) {
          this.answerTexts[i].set(question.answers[i].text);
        } else {
          this.answerTexts[i].set("");
        }
      }

      // Update answer count display
      this.answerCountBinding.set(question.answers.length.toString());

      
    } else {
      
      this.questionBinding.set("No general questions available. Please set the generalQuestions asset.");
      this.questionImageBinding.set(null);
      this.answerCountTracking.set(0);
      for (let i = 0; i < 4; i++) {
        this.answerTexts[i].set("");
      }
      this.answerCountBinding.set("0");
    }
  }

  private async debugShowQuestionWithImageScreen(): Promise<void> {
    

    // Hide other screens
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
    this.showResultsBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(true);

    // Get next question from pre-shuffled Italian Brainrot questions
    // This goes sequentially through the pre-shuffled array (no duplicates)
    const question = this.getNextItalianBrainrotQuestion();
    if (question) {
      // Use the question as-is without shuffling answers (maintain original order)
      // The questions array is already pre-shuffled during initialization

      // Reset answer state for new question
      this.resetAnswerState();

      // Store the original answers for answer checking
      this.currentQuestionAnswers = question.answers;

      // Update UI bindings
      this.questionBinding.set(question.question);
      this.questionImageBinding.set(question.image || null); // Set image if available
      this.answerCountTracking.set(question.answers.length);

      // Update answer texts
      for (let i = 0; i < 4; i++) {
        if (i < question.answers.length) {
          this.answerTexts[i].set(question.answers[i].text);
        } else {
          this.answerTexts[i].set("");
        }
      }

      // Update answer count display
      this.answerCountBinding.set(question.answers.length.toString());

      
      
    } else {
      
      this.questionBinding.set("No Italian Brainrot questions available. Please set the italianBrainrotQuiz asset.");
      this.questionImageBinding.set(null);
      this.answerCountTracking.set(0);
      for (let i = 0; i < 4; i++) {
        this.answerTexts[i].set("");
      }
      this.answerCountBinding.set("0");
    }
  }

  private async debugShowResultsScreen(): Promise<void> {
    
    // Generate and set leaderboard data for the podium
    const leaderboardData = await this.generateRealLeaderboard();
    this.leaderboardDataBinding.set(leaderboardData);
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
    this.showResultsBinding.set(true);
  }

  private async debugShowLeaderboardScreen(): Promise<void> {
    
    // Generate and set leaderboard data
    const leaderboardData = await this.generateRealLeaderboard();
    this.leaderboardDataBinding.set(leaderboardData);
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(true);
    this.showErrorBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
    this.showResultsBinding.set(false);
  }

  private async loadRealPlayerAvatarsForDebug(): Promise<void> {
    const currentPlayers = this.world.getPlayers();
    
    if (currentPlayers.length > 0) {
      // Get the first player's avatar for all debug entries
      const firstPlayer = currentPlayers[0];
      try {
        const headshotImageSource = await Social.getAvatarImageSource(firstPlayer, {
          type: AvatarImageType.HEADSHOT,
          highRes: true
        });
        this.realPlayerAvatars.set('debug', headshotImageSource);
        
      } catch (error) {
        
        this.realPlayerAvatars.set('debug', null);
      }
    } else {
      this.realPlayerAvatars.set('debug', null);
    }
  }

  private debugShowErrorScreen(): void {
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(true);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
    this.showResultsBinding.set(false);
  }

  private hideErrorScreen(): void {
    
    this.showErrorBinding.set(false);
    this.debugShowConfigScreen();
  }
}

// Register the component with Horizon Worlds
UIComponent.register(TriviaGameDebugUI);
