import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const trivia2AnswerQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('trivia2AnswerQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');
const triviaGameResetEvent = new hz.NetworkEvent<{ hostId: string }>('triviaGameReset');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');

const answerShapes = [
  { iconId: '1290982519195562', color: '#DC2626', shape: 'Triangle' },
  { iconId: '1286736292915198', color: '#2563EB', shape: 'Square' },
  { iconId: '1290982519195562', color: '#EAB308', shape: 'Triangle' },
  { iconId: '797899126007085', color: '#22C55E', shape: 'Diamond', rotation: 45 }
];

export class TwoOptionsUI extends ui.UIComponent<typeof TwoOptionsUI> {
  static propsDefinition = {};

  // Game state
  private currentQuestionIndex = 0;
  private score = 0;
  private selectedAnswer: number | null = null;
  private showResult = false;
  private gameStarted = false;
  private answerSubmitted = false;

  // Current question data from TriviaGame
  private currentQuestion: any = null;

  // Game settings state
  private gameSettings = {
    numberOfQuestions: 5,
    category: 'Italian Brainrot Quiz',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 30,
    autoAdvance: false,
    muteDuringQuestions: false,
    isLocked: false
  };

  // UI bindings
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private gameStartedBinding = new ui.Binding(false);
  private gameEndedBinding = new ui.Binding(false);
  private isCorrectAnswerBinding = new ui.Binding(false);
  private correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  private showLeaderboardBinding = new ui.Binding(false);
  private answerSubmittedBinding = new ui.Binding(false);
  private currentQuestionBinding = new ui.Binding<any>(null);
  private gameSettingsBinding = new ui.Binding(this.gameSettings);
  private isHostBinding = new ui.Binding(false);

  // State
  private stableQuestionIndex: number = 0;

  constructor() {
    super();
  }

  async start() {
    this.setupNetworkEvents();
  }

  initializeUI() {
    return this.render();
  }

  private setupNetworkEvents(): void {
    // Listen for 2-answer question show events
    this.connectNetworkBroadcastEvent(trivia2AnswerQuestionShowEvent, (eventData) => {
      this.syncWith2AnswerTrivia(eventData);
    });

    // Listen for trivia results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, (eventData) => {
      this.onTriviaResults(eventData);
    });

    // Listen for trivia game start events
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, (eventData) => {
      this.startGame();
    });

    // Listen for trivia game reset events
    this.connectNetworkBroadcastEvent(triviaGameResetEvent, (eventData) => {
      this.onTriviaGameReset(eventData);
    });
  }

  private syncWith2AnswerTrivia(questionData: { question: any, questionIndex: number, timeLimit: number }): void {
    this.currentQuestionIndex = questionData.questionIndex;
    this.currentQuestion = questionData.question;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.gameStarted = true;
    this.gameStartedBinding.set(true);

    this.currentQuestionIndexBinding.set(questionData.questionIndex);
    this.currentQuestionBinding.set(questionData.question);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.isCorrectAnswerBinding.set(false);
    this.correctAnswerIndexBinding.set(null);
    this.answerSubmittedBinding.set(false);

    console.log('📱 TwoOptionsUI opened 2-answer question page triggered by trivia2AnswerQuestionShowEvent');
  }

  private onTriviaResults(eventData: {
    question: any,
    correctAnswerIndex: number,
    answerCounts: number[],
    scores: { [key: string]: number },
    showLeaderboard?: boolean,
    leaderboardData?: Array<{name: string, score: number, playerId: string}>
  }): void {
    this.showResult = true;
    this.showResultBinding.set(true);

    this.currentQuestion = eventData.question;
    this.currentQuestionBinding.set(eventData.question);

    this.correctAnswerIndexBinding.set(eventData.correctAnswerIndex);

    const isCorrect = this.selectedAnswer === eventData.correctAnswerIndex;
    this.isCorrectAnswerBinding.set(isCorrect);

    if (isCorrect) {
      this.score += 1;
      this.scoreBinding.set(this.score);
    }

    this.showLeaderboardBinding.set(eventData.showLeaderboard || false);
  }

  private onTriviaGameReset(eventData: { hostId: string }): void {
    this.gameStarted = false;
    this.gameEndedBinding.set(false);
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.currentQuestionBinding.set(null);
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.gameStartedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);
  }

  private startGame(): void {
    this.gameStarted = true;
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.gameStartedBinding.set(true);
    this.gameEndedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.isCorrectAnswerBinding.set(false);
    this.correctAnswerIndexBinding.set(null);
    this.answerSubmittedBinding.set(false);
  }

  private handleAnswerSelect(answerIndex: number): void {
    if (this.showResult) return;

    this.selectedAnswer = answerIndex;
    this.selectedAnswerBinding.set(answerIndex);
    this.answerSubmitted = true;
    this.answerSubmittedBinding.set(true);

    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: this.world.getLocalPlayer()?.id.toString() || 'local',
      answerIndex: answerIndex,
      responseTime: 0
    });
  }

  private nextQuestion(): void {
    this.currentQuestionIndex++;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.currentQuestionIndexBinding.set(this.currentQuestionIndex);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);

    this.sendNetworkBroadcastEvent(triviaNextQuestionEvent, {
      playerId: this.world.getLocalPlayer()?.id.toString() || 'host'
    });
  }

  private endGame(): void {
    this.sendNetworkBroadcastEvent(triviaGameResetEvent, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
    });
  }

  private navigateToGameSettings(): void {
    // This would need to be implemented if we want settings navigation
  }

  private handleStartGame(): void {
    // This would need to be implemented if we want game start functionality
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
                ui.View({
                  style: {
                    width: '100%',
                    height: '100%',
                    backgroundColor: ui.Binding.derive([
                      this.showResultBinding,
                      this.isCorrectAnswerBinding
                    ], (showResult, isCorrect) => {
                      if (showResult) {
                        return isCorrect ? '#22C55E' : '#EF4444';
                      }
                      return '#6366F1';
                    }),
                    flexDirection: 'column'
                  },
                  children: [
                    // Feedback screen - positioned absolutely when visible
                    ui.View({
                      style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 12,
                        opacity: ui.Binding.derive([this.showResultBinding], (showResult) => showResult ? 1 : 0)
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.isCorrectAnswerBinding], (isCorrect) => {
                            return isCorrect ? '✅' : '❌';
                          }),
                          style: {
                            fontSize: 80,
                            textAlign: 'center',
                            marginBottom: 16
                          }
                        }),
                        ui.Text({
                          text: ui.Binding.derive([this.isCorrectAnswerBinding], (isCorrect) => {
                            return isCorrect ? 'Correct!' : 'Wrong!';
                          }),
                          style: {
                            fontSize: 32,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            textAlign: 'center',
                            marginBottom: 12
                          }
                        }),
                        ui.Text({
                          text: ui.Binding.derive([this.currentQuestionBinding], (question) => {
                            return question ? question.question : '';
                          }),
                          numberOfLines: 2,
                          style: {
                            fontSize: 18,
                            color: '#FFFFFF',
                            textAlign: 'center',
                            marginBottom: 12,
                            opacity: 0.9,
                            lineHeight: 24
                          }
                        }),
                        ui.Pressable({
                          style: {
                            backgroundColor: '#FFFFFF',
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            marginTop: 16,
                            alignSelf: 'center',
                            opacity: ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding, this.isHostBinding],
                              (showLeaderboard, gameStarted, gameEnded, currentIndex, settings, isHost) =>
                                showLeaderboard && gameStarted && !gameEnded && isHost && (currentIndex + 1) < settings.numberOfQuestions ? 1 : 0
                            )
                          },
                          onPress: () => this.nextQuestion(),
                          children: [
                            ui.Text({
                              text: '➡️ Next Question',
                              style: {
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#6366F1',
                                textAlign: 'center'
                              }
                            })
                          ]
                        }),
                        ui.Pressable({
                          style: {
                            backgroundColor: '#FF6B35',
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            marginTop: 16,
                            alignSelf: 'center',
                            opacity: ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding, this.isHostBinding],
                              (showLeaderboard, gameStarted, gameEnded, currentIndex, settings, isHost) =>
                                showLeaderboard && gameStarted && !gameEnded && isHost && (currentIndex + 1) >= settings.numberOfQuestions ? 1 : 0
                            )
                          },
                          onPress: () => this.endGame(),
                          children: [
                            ui.Text({
                              text: '🔚 End Game',
                              style: {
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#FFFFFF',
                                textAlign: 'center'
                              }
                            })
                          ]
                        })
                      ]
                    }),

                    // Game content - only show answer buttons, no text
                    ui.View({
                      style: {
                        flex: 1,
                        flexDirection: 'column',
                        padding: 6,
                        paddingBottom: 8,
                        opacity: ui.Binding.derive([this.showResultBinding], (showResult) => showResult ? 0 : 1)
                      },
                      children: [
                        ui.View({
                          style: {
                            flex: 1,
                            marginBottom: 6
                          },
                          children: [this.createAnswerButton(0)]
                        }),
                        ui.View({
                          style: {
                            flex: 1,
                            marginTop: 6
                          },
                          children: [this.createAnswerButton(1)]
                        })
                      ]
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

  private createAnswerButton(answerIndex: number): ui.UINode {
    const shape = answerShapes[answerIndex];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.selectedAnswerBinding,
          this.currentQuestionBinding
        ], (showResult, selectedAnswer, question) => {
          if (showResult && question) {
            const correctIndex = question.answers.findIndex((answer: any) => answer.correct);

            const isCorrect = answerIndex === correctIndex;
            const isSelected = answerIndex === selectedAnswer;

            if (isCorrect) return '#22C55E';
            if (isSelected && !isCorrect) return '#EF4444';
            return '#9CA3AF';
          }
          return shape.color;
        }),
        borderRadius: 12,
        margin: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 140,
        padding: 6,
        opacity: ui.Binding.derive([this.currentQuestionBinding], (question) => {
          if (!question || !question.answers) {
            return answerIndex < 4 ? 1 : 0;
          }

          const answerCount = question.answers.length;
          return answerIndex < answerCount ? 1 : 0;
        })
      },
      onPress: () => this.handleAnswerSelect(answerIndex),
      children: [
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(shape.iconId))),
          style: {
            width: 50,
            height: 50,
            tintColor: '#FFFFFF',
            ...(shape.rotation ? { transform: [{ rotate: `${shape.rotation}deg` }] } : {})
          }
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TwoOptionsUI);