import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';
import { View, Text, Pressable, Binding, UINode, Image, ImageSource, UIComponent } from 'horizon/ui';

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
  private showOutlinesBinding = new Binding(true);
  private showOutlines: boolean = true;

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
    const leaderboard: Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}> = [];
    
    // Create leaderboard entries for each real player
    for (const player of currentPlayers) {
      const playerId = player.id.toString();
      // Get player headshot using Social API
      let headshotImageSource: ImageSource | undefined;
      try {
        headshotImageSource = await Social.getAvatarImageSource(player, {
          type: AvatarImageType.HEADSHOT,
          highRes: true
        });
      } catch (error) {
        // Could not get headshot for player
      }
      
      leaderboard.push({
        name: player.name.get(),
        score: Math.floor(Math.random() * 10), // Random score for demo
        playerId: playerId,
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
        // Main game container with 16:9 aspect ratio
        View({
          style: {
            width: '100vw', // Use full viewport width
            aspectRatio: 16/9, // Maintain 16:9 aspect ratio
            backgroundColor: '#F3F4F6',
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
                  backgroundColor: 'linear-gradient(180deg, #7C3AED 0%, #3B82F6 100%)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for configuration screen background
                },
                children: [
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: '8%',
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for header
                    },
                    children: Text({
                      text: 'Players Ready',
                      style: {
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: 'black',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Players Section
                  View({
                    style: {
                      position: 'absolute',
                      top: '18%',
                      left: '8%',
                      right: '8%',
                      bottom: '35%',
                      alignItems: 'center',
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for players section
                    },
                    children: [
                      // Player count header
                      View({
                        style: {
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 12,
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for player count header
                        },
                        children: [
                          Text({
                            text: '👥',
                            style: {
                              fontSize: 16,
                              marginRight: 8
                            }
                          }),
                          Text({
                            text: 'Players',
                            style: {
                              fontSize: 16,
                              fontWeight: '600',
                              color: 'black'
                            }
                          })
                        ]
                      }),

                      // Players grid
                      View({
                        style: {
                          flex: 1,
                          width: '100%',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for players grid
                        },
                        children: this.createStaticPlayersComponents()
                      })
                    ]
                  }),

                  // Game Settings Panel - Bottom
                  View({
                    style: {
                      position: 'absolute',
                      bottom: '8%',
                      left: '8%',
                      right: '8%',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for game settings panel
                    },
                    children: [
                      View({
                        style: {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for settings row container
                        },
                        children: [
                          // Category
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for category section
                            },
                            children: [
                              Text({
                                text: 'Category:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => config.category),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Questions
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for questions section
                            },
                            children: [
                              Text({
                                text: 'Questions:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => `Q${config.numQuestions}`),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Time
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for time section
                            },
                            children: [
                              Text({
                                text: 'Time:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              View({
                                style: {
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for time content container
                                },
                                children: [
                                  Text({
                                    text: '⏱️',
                                    style: {
                                      fontSize: 12,
                                      marginRight: 4
                                    }
                                  }),
                                  Text({
                                    text: this.gameConfigBinding.derive(config => `${config.timeLimit}s`),
                                    style: {
                                      fontSize: 12,
                                      fontWeight: '600',
                                      color: '#1F2937'
                                    }
                                  })
                                ]
                              })
                            ]
                          }),

                          // Difficulty
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for difficulty section
                            },
                            children: [
                              Text({
                                text: 'Difficulty:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => {
                                  const diff = config.difficulty;
                                  return diff.charAt(0).toUpperCase() + diff.slice(1);
                                }),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Auto-Advance
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for auto-advance section
                            },
                            children: [
                              Text({
                                text: 'Auto:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => config.autoAdvance ? '▶️' : '⏸️'),
                                style: {
                                  fontSize: 14
                                }
                              })
                            ]
                          }),

                          // Mute
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1,
                              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                              borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for mute section
                            },
                            children: [
                              Text({
                                text: 'Audio:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: '🔊',
                                style: {
                                  fontSize: 14
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

            // Game UI (shows when game is running)
            UINode.if(
              this.showConfigBinding.derive(show => !show),
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
                                      width: 35,
                                      height: 35,
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 17.5,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 12,
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
                                  backgroundColor: 'white',
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
                                      color: 'black',
                                      textAlign: 'center',
                                      lineHeight: 24
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
                                          color: '#1F2937'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 10,
                                          color: '#6B7280'
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
                                      width: 35,
                                      height: 35,
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 17.5,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 12,
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
                                  backgroundColor: 'white',
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
                                      color: 'black',
                                      textAlign: 'center',
                                      lineHeight: 16
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
                                          color: '#1F2937'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 10,
                                          color: '#6B7280'
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
                        bottom: 0,
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        paddingTop: '2%',
                        paddingBottom: '25%', // Leave space for answer buttons
                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                        borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for question container (with image)
                      },
                      children: [
                        // Timer | Question | Answer Count layout
                        View({
                          style: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                          },
                          children: [
                            // Timer on the left
                            View({
                              style: {
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                              },
                              children: [
                                View({
                                  style: {
                                    width: 30,
                                    height: 30,
                                    backgroundColor: '#FF6B35',
                                    borderRadius: 15,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                    borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for timer
                                  },
                                  children: Text({
                                    text: this.timerBinding,
                                    style: {
                                      fontSize: 10,
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
                                backgroundColor: 'white',
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
                                maxWidth: '80%',
                                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for question text box (with image)
                              },
                              children: [
                                // Question text
                                Text({
                                  text: this.questionBinding,
                                  numberOfLines: 2,
                                  style: {
                                    fontSize: 14,
                                    fontWeight: '500',
                                    color: 'black',
                                    textAlign: 'center',
                                    lineHeight: 16
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
                                borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for answer count indicator
                              },
                              children: [
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
                                        fontSize: 14,
                                        fontWeight: 'bold',
                                        color: '#1F2937'
                                      }
                                    }),
                                    Text({
                                      text: 'Answers',
                                      style: {
                                        fontSize: 8,
                                        color: '#6B7280'
                                      }
                                    })
                                  ]
                                })
                              ]
                            })
                          ]
                        }),

                        // Question image - positioned in the flex flow
                        View({
                          style: {
                            flex: 1,
                            marginTop: 16,
                            marginBottom: 16,
                            marginHorizontal: '15%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for question image container
                          },
                          children: Image({
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
                              width: '100%',
                              height: '100%',
                              aspectRatio: 1.5, // 3:2 aspect ratio to maintain proportions
                              borderRadius: 8,
                              alignSelf: 'center'
                            }
                          })
                        })
                      ]
                    })
                  ),

                  // Answer options grid - positioned at bottom
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 5,
                      left: 0,
                      right: 0,
                      paddingHorizontal: 15,
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
                            alignItems: 'center',
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for dynamic layout container
                          },
                          children: [
                            // For 2-answer questions: Show options 3 and 4, hide 1 and 2
                            UINode.if(
                              this.answerCountTracking.derive(count => count === 2),
                              View({
                                style: {
                                  width: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'center', // Changed from 'flex-end' to 'center' for consistent spacing
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for 2-answer layout
                                },
                                children: [
                                  // Empty spacers for top row (where options 1 and 2 would be)
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginRight: 6,
                                      marginBottom: 6,
                                      opacity: 0, // Invisible spacer
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for spacer 1
                                    }
                                  }),
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginBottom: 6,
                                      opacity: 0, // Invisible spacer
                                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                      borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for spacer 2
                                    }
                                  }),
                                  
                                  // Answer 0 (Yellow/Circle) - shows as Option 1 in bottom row
                                  UINode.if(
                                    this.answerTexts[0].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginRight: 6,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 0 container (2-answer layout)
                                      },
                                      children: this.createAnswerButton(0, '#EAB308', '797899126007085')
                                    })
                                  ),
                                  // Answer 1 (Green/Square) - shows as Option 2 in bottom row
                                  UINode.if(
                                    this.answerTexts[1].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 1 container (2-answer layout)
                                      },
                                      children: this.createAnswerButton(1, '#16A34A', '1286736292915198')
                                    })
                                  )
                                ]
                              })
                            ),

                            // For 3+ answer questions: Show all options normally
                            UINode.if(
                              this.answerCountTracking.derive(count => count !== 2),
                              View({
                                style: {
                                  width: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                  borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent') // Purple border for 3+ answer layout
                                },
                                children: [
                                  // Answer 0 (Red/Triangle) - Option 1
                                  UINode.if(
                                    this.answerTexts[0].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: this.answerTexts[2].derive(text => text !== '') ? '48%' : '48%',
                                        height: 42,
                                        marginRight: this.answerTexts[1].derive(text => text !== '') ? 6 : 0,
                                        marginBottom: 6,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 0 container (3+ answer layout)
                                      },
                                      children: this.createAnswerButton(0, '#DC2626', '1290982519195562')
                                    })
                                  ),

                                  // Answer 1 (Blue/Star) - Option 2
                                  UINode.if(
                                    this.answerTexts[1].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: this.answerTexts[2].derive(text => text !== '') ? '48%' : '48%',
                                        height: 42,
                                        marginBottom: 6,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 1 container (3+ answer layout)
                                      },
                                      children: this.createAnswerButton(1, '#2563EB', '764343253011569')
                                    })
                                  ),

                                  // Answer 2 (Yellow/Circle) - Option 3
                                  UINode.if(
                                    this.answerTexts[2].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginRight: 6,
                                        marginBottom: 6,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 2 container (3+ answer layout)
                                      },
                                      children: this.createAnswerButton(2, '#EAB308', '797899126007085')
                                    })
                                  ),

                                  // Answer 3 (Green/Square) - Option 4
                                  UINode.if(
                                    this.answerTexts[3].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginBottom: 6,
                                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                                        borderColor: this.showOutlinesBinding.derive(show => show ? '#000000' : 'transparent') // Black border for answer 3 container (3+ answer layout)
                                      },
                                      children: this.createAnswerButton(3, '#16A34A', '1286736292915198')
                                    })
                                  )
                                ]
                              })
                            )
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
                        backgroundColor: 'white',
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
                            color: '#1F2937',
                            marginBottom: 8,
                            textAlign: 'center'
                          }
                        }),
                        Text({
                          text: 'Please wait while other players submit their answers',
                          style: {
                            fontSize: 12,
                            color: '#6B7280',
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
                      backgroundColor: '#F3F4F6',
                      display: this.showLeaderboardBinding.derive(show => show ? 'flex' : 'none'),
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for leaderboard overlay
                    },
                    children: [
                      // Header
                      View({
                        style: {
                          position: 'absolute',
                          top: 12,
                          left: 0,
                          right: 0,
                          alignItems: 'center',
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for leaderboard header container
                        },
                        children: View({
                          style: {
                            backgroundColor: 'white',
                            borderRadius: 8,
                            paddingHorizontal: 24,
                            paddingVertical: 8,
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            shadowOffset: [0, 2],
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for leaderboard header title box
                          },
                          children: Text({
                            text: 'Leaderboard',
                            style: {
                              fontSize: 18,
                              fontWeight: 'bold',
                              color: '#1F2937'
                            }
                          })
                        })
                      }),

                      // Leaderboard list
                      View({
                        style: {
                          position: 'absolute',
                          top: 60,
                          bottom: 15,
                          left: '10%',
                          right: '10%',
                          flexDirection: 'column',
                          borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                          borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for leaderboard list container
                        },
                        children: [
                          // Player entries with improved spacing
                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 0),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1],
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
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '1',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 && players[0].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 ? players[0].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 0 ? players[0].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          ),

                          // Additional player entries...
                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 1),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1],
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
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '2',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 && players[1].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 ? players[1].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 1 ? players[1].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          ),

                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 2),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1],
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
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '3',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 && players[2].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 ? players[2].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 2 ? players[2].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          )
                        ]
                      })
                    ]
                  }),

                  // Error Screen overlay
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: this.showErrorBinding.derive(show => show ? 'flex' : 'none'),
                      borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                      borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0000' : 'transparent') // Red border for error screen overlay
                    },
                    children: View({
                      style: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 24,
                        alignItems: 'center',
                        maxWidth: '70%',
                        shadowColor: 'black',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: [0, 4],
                        borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                        borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF00' : 'transparent') // Green border for error content box
                      },
                      children: [
                        // Error icon
                        Text({
                          text: '⚠️',
                          style: {
                            fontSize: 32,
                            marginBottom: 12
                          }
                        }),
                        // Error title
                        Text({
                          text: 'No Questions Available',
                          style: {
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#DC2626',
                            marginBottom: 8,
                            textAlign: 'center'
                          }
                        }),
                        // Error message
                        Text({
                          text: this.errorMessageBinding,
                          style: {
                            fontSize: 14,
                            color: '#6B7280',
                            textAlign: 'center',
                            lineHeight: 1.4,
                            marginBottom: 16
                          }
                        }),
                        // Back to config button
                        Pressable({
                          style: {
                            backgroundColor: '#3B82F6',
                            borderRadius: 6,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            alignItems: 'center',
                            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                            borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent') // Blue border for back to settings button
                          },
                          onPress: () => this.hideErrorScreen(),
                          children: [
                            Text({
                              text: 'Back to Settings',
                              style: {
                                fontSize: 14,
                                fontWeight: '600',
                                color: 'white'
                              }
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
        }),

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
                  onPress: () => this.debugShowLeaderboardScreen(),
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
                    backgroundColor: this.showWaitingBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 8,
                    width: '19%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowResultsScreen(),
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

                // Bottom Row - 2 buttons
                // Error Screen
                Pressable({
                  style: {
                    backgroundColor: this.showErrorBinding.derive(show => show ? '#2563EB' : '#4A5568'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '48%',
                    marginRight: '4%',
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

                // Toggle Outlines
                Pressable({
                  style: {
                    backgroundColor: this.showOutlinesBinding.derive(show => show ? '#16A34A' : '#DC2626'),
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '48%',
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
      console.log("🔄 Reset Italian Brainrot questions to beginning");
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
                        color: 'black'
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
                  color: 'black',
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
              color: 'black',
              textAlign: 'center'
            }
          })
        })
      )
    );
    
    return components;
  }

  private createAnswerButton(index: number, color: string, iconTextureId: string): UINode {
    const textureAsset = new hz.TextureAsset(BigInt(iconTextureId));

    return Pressable({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: this.answerButtonColors[index],
        borderRadius: 4,
        paddingHorizontal: 8,
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
            width: 12,
            height: 12,
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
            textAlign: 'left'
          }
        })
      ]
    });
  }

  // Reset answer selection state for new question
  private resetAnswerState(): void {
    this.selectedAnswerIndex = -1;
    this.answerRevealed = false;
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
  }

  private async debugShowQuestionScreen(): Promise<void> {
    

    // Hide other screens
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);

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

  private debugShowResultsScreen(): void {
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(true);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
  }

  private debugShowLeaderboardScreen(): void {
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(true);
    this.showErrorBinding.set(false);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
  }

  private debugShowErrorScreen(): void {
    
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(true);
    this.show4AQuestionScreenBinding.set(false);
    this.show2AQuestionScreenBinding.set(false);
  }

  private hideErrorScreen(): void {
    
    this.showErrorBinding.set(false);
    this.debugShowConfigScreen();
  }
}

// Register the component with Horizon Worlds
UIComponent.register(TriviaGameDebugUI);
