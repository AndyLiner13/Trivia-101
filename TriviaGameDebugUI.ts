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
  
  // Game data - separate arrays for different question types
  private generalQuestions: TriviaQuestion[] = [];
  private italianBrainrotQuestions: TriviaQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private currentQuestion: TriviaQuestion | null = null;
  
  // Results data for static display
  private lastCorrectAnswerIndex: number = -1;
  private lastAnswerCounts: number[] = [];

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
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      },
      children: [
        // Main game container with 16:9 aspect ratio
        View({
          style: {
            width: '100vw', // Use full viewport width
            aspectRatio: 16/9, // 16:9 aspect ratio
            backgroundColor: '#F3F4F6',
            position: 'relative',
            overflow: 'hidden',
            shadowColor: 'black',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: [0, 6]
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
                  padding: 16
                },
                children: [
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: '8%',
                      left: 0,
                      right: 0,
                      alignItems: 'center'
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
                      alignItems: 'center'
                    },
                    children: [
                      // Player count header
                      View({
                        style: {
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 12
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
                          justifyContent: 'center'
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
                      padding: 12
                    },
                    children: [
                      View({
                        style: {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        },
                        children: [
                          // Category
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
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
                              flex: 1
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
                              flex: 1
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
                                  alignItems: 'center'
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
                              flex: 1
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
                              flex: 1
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
                              flex: 1
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
                  bottom: 0
                },
                children: [
                  // Timer - positioned based on whether there's an image
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null && imageId !== ""),
                    // With image - align with center of image
                    View({
                      style: {
                        position: 'absolute',
                        left: '5%',
                        top: this.answerCountTracking.derive(count => count === 2 ? '21.5%' : '26.5%'), // Center of image area
                        width: 35,
                        height: 35,
                        backgroundColor: '#FF6B35',
                        borderRadius: 17.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: 'black',
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        shadowOffset: [0, 1]
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
                  ),

                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    // Without image - align with question textbox
                    View({
                      style: {
                        position: 'absolute',
                        left: '5%',
                        top: this.answerCountTracking.derive(count => count === 2 ? '42%' : '35%'), // Center of question area
                        width: 35,
                        height: 35,
                        backgroundColor: '#FF6B35',
                        borderRadius: 17.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: 'black',
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        shadowOffset: [0, 1]
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
                  ),

                  // Answer count - positioned based on whether there's an image
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null && imageId !== ""),
                    // With image - align with center of image
                    View({
                      style: {
                        position: 'absolute',
                        right: '5%',
                        top: this.answerCountTracking.derive(count => count === 2 ? '25%' : '30%'), // Slightly below center of image area
                        alignItems: 'center'
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
                  ),

                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    // Without image - align with question textbox
                    View({
                      style: {
                        position: 'absolute',
                        right: '5%',
                        top: this.answerCountTracking.derive(count => count === 2 ? '42%' : '35%'), // Center of question area
                        alignItems: 'center'
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
                  ),

                  // Question text - conditional positioning based on image presence
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    // No image - center the question (2-answer questions)
                    UINode.if(
                      this.answerCountTracking.derive(count => count === 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: '15%',
                          right: '15%',
                          top: '20%',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        children: View({
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
                            justifyContent: 'center'
                          },
                          children: [
                            // Question text
                            Text({
                              text: this.questionBinding,
                              numberOfLines: 3,
                              style: {
                                fontSize: 16,
                                fontWeight: '500',
                                color: 'black',
                                textAlign: 'center',
                                lineHeight: 24
                              }
                            })
                          ]
                        })
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
                          top: '16%',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        children: View({
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
                            maxWidth: '70%',
                            marginHorizontal: 16
                          },
                          children: [
                            // Question text
                            Text({
                              text: this.questionBinding,
                              numberOfLines: 3,
                              style: {
                                fontSize: 16,
                                fontWeight: '500',
                                color: 'black',
                                textAlign: 'center',
                                lineHeight: 16
                              }
                            })
                          ]
                        })
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
                        top: '2%',
                        height: '15%',
                        alignItems: 'center'
                      },
                      children: View({
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
                          marginHorizontal: 16
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
                      })
                    })
                  ),

                  // Question image - positioned below question when both exist
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null),
                    View({
                      style: {
                        position: 'absolute',
                        left: '15%',
                        right: '15%',
                        top: '18%', // Fixed position below the question
                        bottom: this.answerCountTracking.derive(count => count === 2 ? '25%' : '35%'), // Larger area for 2-answer questions
                        alignItems: 'center',
                        justifyContent: 'center'
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
                          width: 'auto',
                          height: this.answerCountTracking.derive(count => count === 2 ? '100%' : '80%'), // Bigger image for 2-answer questions
                          aspectRatio: 1.5, // 3:2 aspect ratio to maintain proportions
                          borderRadius: 8,
                          alignSelf: 'center'
                        }
                      })
                    })
                  ),

                  // Answer options grid - positioned at bottom
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 5,
                      left: 15,
                      right: 15,
                      height: 100
                    },
                    children: [
                      // Dynamic layout based on number of answers
                      UINode.if(
                        this.answerCountTracking.derive(count => count > 0),
                        View({
                          style: {
                            width: '100%',
                            height: '100%',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                          },
                          children: [
                            // For 2-answer questions: Show options 3 and 4, hide 1 and 2
                            UINode.if(
                              this.answerCountTracking.derive(count => count === 2),
                              View({
                                style: {
                                  width: '100%',
                                  height: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'center' // Changed from 'flex-end' to 'center' for consistent spacing
                                },
                                children: [
                                  // Empty spacers for top row (where options 1 and 2 would be)
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginRight: 6,
                                      marginBottom: 6,
                                      opacity: 0 // Invisible spacer
                                    }
                                  }),
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginBottom: 6,
                                      opacity: 0 // Invisible spacer
                                    }
                                  }),
                                  
                                  // Answer 2 (Yellow/Circle) - shows as Option 3 in bottom row
                                  UINode.if(
                                    this.answerTexts[2].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginRight: 6
                                      },
                                      children: this.createAnswerButton(2, '#EAB308', '797899126007085')
                                    })
                                  ),
                                  // Answer 3 (Green/Square) - shows as Option 4 in bottom row
                                  UINode.if(
                                    this.answerTexts[3].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42
                                      },
                                      children: this.createAnswerButton(3, '#16A34A', '1286736292915198')
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
                                  height: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'center'
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
                                        marginBottom: 6
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
                                        marginBottom: 6
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
                                        marginBottom: 6
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
                                        marginBottom: 6
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
                      display: this.showWaitingBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: View({
                      style: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 20,
                        alignItems: 'center',
                        maxWidth: '60%'
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
                      display: this.showLeaderboardBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: [
                      // Header
                      View({
                        style: {
                          position: 'absolute',
                          top: 12,
                          left: 0,
                          right: 0,
                          alignItems: 'center'
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
                            shadowOffset: [0, 2]
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
                          flexDirection: 'column'
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
                                shadowOffset: [0, 1]
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
                                shadowOffset: [0, 1]
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
                                shadowOffset: [0, 1]
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
                      display: this.showErrorBinding.derive(show => show ? 'flex' : 'none')
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
                        shadowOffset: [0, 4]
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
                            alignItems: 'center'
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
            height: '25vh', // Use remaining 25% of viewport height
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
                justifyContent: 'space-between'
              },
              children: [
                // Config Screen
                Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowConfigScreen(),
                  children: [
                    Text({
                      text: '⚙️ Config',
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
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowQuestionScreen(),
                  children: [
                    Text({
                      text: '❓ Question',
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
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowQuestionWithImageScreen(),
                  children: [
                    Text({
                      text: '🖼️ Q+Image',
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
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowResultsScreen(),
                  children: [
                    Text({
                      text: '📊 Results',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Leaderboard Screen
                Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowLeaderboardScreen(),
                  children: [
                    Text({
                      text: '🏆 Leaderboard',
                      style: {
                        fontSize: 9,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Error Screen
                Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    marginBottom: 6,
                    width: '23%',
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowErrorScreen(),
                  children: [
                    Text({
                      text: '⚠️ Error',
                      style: {
                        fontSize: 9,
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
          console.log("✅ Loaded", this.italianBrainrotQuestions.length, "Italian Brainrot questions");
        }
      }

      // Load General Questions
      if (this.props.generalQuestions && this.props.generalQuestions !== null) {
        const asset = this.props.generalQuestions as hz.Asset;
        const assetData = await asset.fetchAsData();
        const jsonData = assetData.asJSON();

        if (jsonData && Array.isArray(jsonData)) {
          // Convert Open Trivia Database format to TriviaQuestion format
          this.generalQuestions = this.parseOpenTriviaFormat(jsonData);
          console.log("✅ Loaded", this.generalQuestions.length, "General questions");
        }
      }

      // Log summary
      if (this.italianBrainrotQuestions.length === 0 && this.generalQuestions.length === 0) {
        console.log("⚠️ No questions loaded from JSON assets");
      }

    } catch (error) {
      console.log("❌ Error loading questions from assets:", error);
    }
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
              marginRight: 12
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
                  overflow: 'hidden'
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
            width: '100%'
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

    return View({
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

        // Answer text only (no results indicator)
        Text({
          text: this.answerTexts[index],
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

  private setupDebugFunctionality(): void {
    // Setup debug functionality for testing different screens
    console.log("🔧 Debug functionality initialized");
  }

  private debugShowConfigScreen(): void {
    console.log("⚙️ Showing config screen");
    this.showConfigBinding.set(true);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
  }

  private async debugShowQuestionScreen(): Promise<void> {
    console.log("❓ Showing question screen");

    // Hide other screens
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);

    // Get a random question from general questions only
    if (this.generalQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.generalQuestions.length);
      const question = this.shuffleQuestionAnswers(this.generalQuestions[randomIndex]);

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

      console.log("✅ General question loaded:", question.question);
    } else {
      console.log("❌ No general questions available");
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
    console.log("🖼️ Showing question with image screen");

    // Hide other screens
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);

    // Get a random question from Italian Brainrot questions only
    if (this.italianBrainrotQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.italianBrainrotQuestions.length);
      const question = this.shuffleQuestionAnswers(this.italianBrainrotQuestions[randomIndex]);

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

      console.log("✅ Italian Brainrot question loaded:", question.question);
      console.log("🖼️ Image:", question.image);
    } else {
      console.log("❌ No Italian Brainrot questions available");
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
    console.log("📊 Showing results screen");
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(true);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(false);
  }

  private debugShowLeaderboardScreen(): void {
    console.log("🏆 Showing leaderboard screen");
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(true);
    this.showErrorBinding.set(false);
  }

  private debugShowErrorScreen(): void {
    console.log("⚠️ Showing error screen");
    this.showConfigBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showErrorBinding.set(true);
  }

  private hideErrorScreen(): void {
    console.log("🔄 Hiding error screen");
    this.showErrorBinding.set(false);
    this.debugShowConfigScreen();
  }
}

// Register the component with Horizon Worlds
UIComponent.register(TriviaGameDebugUI);
