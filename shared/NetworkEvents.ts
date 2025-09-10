import * as hz from 'horizon/core';

// Serializable question type for network events
export type SerializableQuestion = {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  image?: string;
  answers: Array<{ text: string; correct: boolean }>;
};

// Leaderboard data type
export type LeaderboardEntry = {
  name: string;
  score: number;
  playerId: string;
};

// Game state type
export type GameState = 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended';

// View mode type
export type ViewMode = 'pre-game' | 'game-settings';

// Game settings type
export type GameSettings = {
  numberOfQuestions: number;
  category: string;
  difficulty: string;
  timeLimit: number;
  timerType: string;
  difficultyType: string;
  isLocked: boolean;
  modifiers: {
    autoAdvance: boolean;
    powerUps: boolean;
    bonusRounds: boolean;
  };
};

// Centralized network events used by both TriviaPhone and TriviaGame
export const TriviaNetworkEvents = {
  // Question display events
  questionShow: new hz.NetworkEvent<{
    question: SerializableQuestion;
    questionIndex: number;
    timeLimit: number;
  }>('triviaQuestionShow'),

  // Results event
  results: new hz.NetworkEvent<{
    question: SerializableQuestion;
    correctAnswerIndex: number;
    answerCounts: number[];
    scores: { [key: string]: number };
    showLeaderboard?: boolean;
    leaderboardData?: LeaderboardEntry[];
  }>('triviaResults'),

  // Two options event
  twoOptions: new hz.NetworkEvent<{
    question: SerializableQuestion;
    questionIndex: number;
    timeLimit: number;
    totalQuestions: number;
  }>('triviaTwoOptions'),

  // Four options event
  fourOptions: new hz.NetworkEvent<{
    question: SerializableQuestion;
    questionIndex: number;
    timeLimit: number;
    totalQuestions: number;
  }>('triviaFourOptions'),

  // Answer submission
  answerSubmitted: new hz.NetworkEvent<{
    playerId: string;
    answerIndex: number;
    responseTime: number;
  }>('triviaAnswerSubmitted'),

  // Game management
  gameStart: new hz.NetworkEvent<{
    hostId: string;
    config: any;
  }>('triviaGameStart'),

  nextQuestion: new hz.NetworkEvent<{
    playerId: string;
  }>('triviaNextQuestion'),

  gameRegistered: new hz.NetworkEvent<{
    isRunning: boolean;
    hasQuestions: boolean;
  }>('triviaGameRegistered'),

  gameEnd: new hz.NetworkEvent<{
    hostId: string;
    finalLeaderboard?: LeaderboardEntry[];
  }>('triviaGameEnd'),

  gameReset: new hz.NetworkEvent<{
    hostId: string;
  }>('triviaGameReset'),

  // Points and scoring
  awardPoints: new hz.NetworkEvent<{
    playerId: string;
    points: number;
  }>('triviaAwardPoints'),

  leaderboardScoreUpdate: new hz.NetworkEvent<{
    playerId: string;
    score: number;
    leaderboardName: string;
  }>('leaderboardScoreUpdate'),

  // Player management
  playerUpdate: new hz.NetworkEvent<{
    playersInWorld: string[];
    playersAnswered: string[];
    answerCount: number;
  }>('triviaPlayerUpdate'),

  playerLogout: new hz.NetworkEvent<{
    playerId: string;
  }>('triviaPlayerLogout'),

  playerRejoin: new hz.NetworkEvent<{
    playerId: string;
  }>('triviaPlayerRejoin'),

  // Host management
  hostChanged: new hz.NetworkEvent<{
    newHostId: string;
    oldHostId?: string;
  }>('hostChanged'),

  hostViewMode: new hz.NetworkEvent<{
    hostId: string;
    viewMode: ViewMode;
  }>('hostViewMode'),

  // Settings
  settingsUpdate: new hz.NetworkEvent<{
    hostId: string;
    settings: GameSettings;
  }>('triviaSettingsUpdate'),

  // State synchronization
  stateRequest: new hz.NetworkEvent<{
    requesterId: string;
  }>('triviaStateRequest'),

  stateResponse: new hz.NetworkEvent<{
    requesterId: string;
    gameState: GameState;
    currentQuestion?: SerializableQuestion;
    questionIndex?: number;
    timeLimit?: number;
    showLeaderboard?: boolean;
    leaderboardData?: LeaderboardEntry[];
  }>('triviaStateResponse'),

  // Timer synchronization
  timerUpdate: new hz.NetworkEvent<{
    timeRemaining: number;
    questionIndex: number;
  }>('triviaTimerUpdate'),

  timerEnd: new hz.NetworkEvent<{
    questionIndex: number;
  }>('triviaTimerEnd'),

  // UI state
  uiState: new hz.NetworkEvent<{
    showConfig: boolean;
    showResults: boolean;
    showWaiting: boolean;
    showLeaderboard: boolean;
    showError: boolean;
    errorMessage?: string;
  }>('triviaUIState')
};
