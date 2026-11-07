import './styles/main.scss';
import { DEFAULT_DIFFICULTY } from './data/difficulty.ts';
import { INGREDIENTS } from './data/ingredients.ts';
import { addIngredient } from './logic/add-ingredient.ts';
import { brewPotion } from './logic/brew-check.ts';
import { finishGameIfNeeded } from './logic/game-over.ts';
import { addLeaderboardEntry, isTopTenScore } from './logic/leaderboard.ts';
import { pauseGame, resumeGame } from './logic/pause.ts';
import { pourOutCauldron } from './logic/pour-out.ts';
import { syncTimer } from './logic/timer.ts';
import { createMenuState, createNewGameState } from './state/game-state.ts';
import { didClearLeaderboard, didSaveLeaderboard, loadLeaderboard } from './storage/leaderboard.ts';
import { didClearSavedGame, didSaveGame, loadGame } from './storage/save.ts';
import type { BrewResult, Difficulty, GameState } from './types/game.ts';
import type { LeaderboardEntry } from './types/leaderboard.ts';
import { renderApp, updateTimerHud } from './ui/app.ts';
import { getGameShortcut } from './ui/keyboard-shortcuts.ts';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found');
}

const startApp = (container: HTMLElement): void => {
  let continuableGame: GameState | undefined = loadGame();
  let gameState: GameState = createMenuState(continuableGame?.difficulty);
  let leaderboards: Readonly<Record<Difficulty, readonly LeaderboardEntry[]>> = {
    easy: loadLeaderboard('easy'),
    medium: loadLeaderboard('medium'),
    hard: loadLeaderboard('hard'),
  };
  let leaderboardDifficulty: Difficulty = DEFAULT_DIFFICULTY;
  let leaderboardDialog: 'closed' | 'open' | 'confirm-clear' = 'closed';
  let menuDialog: 'closed' | 'help' | 'settings' = 'closed';
  let leaderboardNotice: string | undefined;
  let hasHandledCurrentResult = false;
  let brewVisualFeedback: BrewResult | undefined;

  const persistCurrentGame = (): void => {
    if (gameState.status === 'playing' || gameState.status === 'paused') {
      if (didSaveGame(gameState)) {
        continuableGame = {
          ...gameState,
          status: 'paused',
          timerEndsAt: undefined,
          lastBrewResult: undefined,
          previousCauldronIngredientIds: gameState.cauldronIngredientIds,
        };
      } else {
        didClearSavedGame();
        continuableGame = undefined;
      }

      return;
    }

    if (gameState.status !== 'game-over') {
      return;
    }

    didClearSavedGame();
    continuableGame = undefined;
  };

  const startNewGame = (): void => {
    gameState = createNewGameState(gameState.difficulty);
    leaderboardDialog = 'closed';
    menuDialog = 'closed';
    leaderboardNotice = undefined;
    hasHandledCurrentResult = false;
    brewVisualFeedback = undefined;
    persistCurrentGame();
    render();
  };

  const continueSavedGame = (): void => {
    if (!continuableGame) {
      return;
    }

    gameState = {
      ...continuableGame,
      status: 'paused',
      timerEndsAt: undefined,
    };
    leaderboardDialog = 'closed';
    menuDialog = 'closed';
    leaderboardNotice = undefined;
    hasHandledCurrentResult = false;
    brewVisualFeedback = undefined;
    persistCurrentGame();
    render();
  };

  const pauseCurrentGame = (): void => {
    const nextState = finishGameIfNeeded(pauseGame(gameState));

    if (nextState === gameState) {
      return;
    }

    gameState = nextState;
    persistCurrentGame();
    render();
  };

  const resumeCurrentGame = (): void => {
    const nextState = resumeGame(gameState);

    if (nextState === gameState) {
      return;
    }

    gameState = nextState;
    persistCurrentGame();
    render();
  };

  const addCurrentIngredient = (ingredientId: string): void => {
    const nextState = finishGameIfNeeded(addIngredient(gameState, ingredientId));

    if (nextState === gameState) {
      return;
    }

    gameState = nextState;
    persistCurrentGame();
    render();
  };

  const brewCurrentPotion = (): void => {
    const nextState = finishGameIfNeeded(brewPotion(gameState));

    if (nextState === gameState) {
      return;
    }

    gameState = nextState;
    brewVisualFeedback = nextState.lastBrewResult;
    persistCurrentGame();
    render();
  };

  const pourOutCurrentCauldron = (): void => {
    const nextState = finishGameIfNeeded(pourOutCauldron(gameState));

    if (nextState === gameState) {
      return;
    }

    gameState = nextState;
    persistCurrentGame();
    render();
  };

  const render = (): void => {
    const currentLeaderboard = leaderboards[gameState.difficulty];

    renderApp(container, gameState, {
      leaderboardEntries: leaderboards[leaderboardDifficulty],
      leaderboardDifficulty,
      leaderboardDialog,
      menuDialog,
      leaderboardNotice,
      brewVisualFeedback,
      shouldRequestPlayerName:
        gameState.status === 'game-over' &&
        !hasHandledCurrentResult &&
        isTopTenScore(gameState.score, currentLeaderboard),
      hasSavedGame: continuableGame !== undefined,
      onStartGame: startNewGame,
      onContinueGame: continueSavedGame,
      onPlayAgain: startNewGame,
      onOpenLeaderboard: () => {
        leaderboardDifficulty = gameState.difficulty;
        leaderboardDialog = 'open';
        menuDialog = 'closed';
        leaderboardNotice = undefined;
        render();
      },
      onSelectLeaderboardDifficulty: (difficulty) => {
        leaderboardDifficulty = difficulty;
        leaderboardNotice = undefined;
        render();
      },
      onCloseLeaderboard: () => {
        leaderboardDialog = 'closed';
        leaderboardNotice = undefined;
        render();
      },
      onRequestClearLeaderboard: () => {
        leaderboardDialog = 'confirm-clear';
        render();
      },
      onCancelClearLeaderboard: () => {
        leaderboardDialog = 'open';
        render();
      },
      onConfirmClearLeaderboard: () => {
        if (didClearLeaderboard(leaderboardDifficulty)) {
          leaderboards = { ...leaderboards, [leaderboardDifficulty]: [] };
          leaderboardNotice = `${leaderboardDifficulty} leaderboard cleared.`;
        } else {
          leaderboardNotice = 'The leaderboard could not be cleared in this browser.';
        }

        leaderboardDialog = 'open';
        render();
      },
      onSubmitPlayerName: (name) => {
        const difficulty = gameState.difficulty;
        const nextEntries = addLeaderboardEntry(
          leaderboards[difficulty],
          name,
          gameState.score,
          difficulty,
        );
        leaderboards = { ...leaderboards, [difficulty]: nextEntries };
        leaderboardDifficulty = difficulty;
        hasHandledCurrentResult = true;
        leaderboardNotice = didSaveLeaderboard(difficulty, nextEntries)
          ? 'Your result was added to the Top 10.'
          : 'Your result could not be saved in this browser.';
        leaderboardDialog = 'open';
        render();
      },
      onOpenHelp: () => {
        menuDialog = 'help';
        render();
      },
      onOpenSettings: () => {
        menuDialog = 'settings';
        render();
      },
      onCloseMenuDialog: () => {
        menuDialog = 'closed';
        render();
      },
      onSelectDifficulty: (difficulty) => {
        if (gameState.status !== 'menu') {
          return;
        }

        gameState = createMenuState(difficulty);
        leaderboardDifficulty = difficulty;
        render();
      },
      onPause: pauseCurrentGame,
      onResume: resumeCurrentGame,
      onExitToMenu: () => {
        gameState = createMenuState(gameState.difficulty);
        didClearSavedGame();
        continuableGame = undefined;
        leaderboardDialog = 'closed';
        menuDialog = 'closed';
        leaderboardNotice = undefined;
        hasHandledCurrentResult = false;
        render();
      },
      onAddIngredient: addCurrentIngredient,
      onBrew: brewCurrentPotion,
      onPourOut: pourOutCurrentCauldron,
    });

    brewVisualFeedback = undefined;

    if (gameState.previousCauldronIngredientIds !== gameState.cauldronIngredientIds) {
      gameState = {
        ...gameState,
        previousCauldronIngredientIds: gameState.cauldronIngredientIds,
      };
    }
  };

  render();

  document.addEventListener('keydown', (event) => {
    if (gameState.status !== 'playing') {
      return;
    }

    const shortcut = getGameShortcut(event);

    if (!shortcut) {
      return;
    }

    event.preventDefault();

    switch (shortcut.type) {
      case 'add-ingredient': {
        const ingredient = INGREDIENTS[shortcut.ingredientIndex];

        if (ingredient) {
          addCurrentIngredient(ingredient.id);
        }
        break;
      }
      case 'brew': {
        brewCurrentPotion();
        break;
      }
      case 'pour-out': {
        pourOutCurrentCauldron();
        break;
      }
      case 'pause': {
        pauseCurrentGame();
        break;
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseCurrentGame();
    }
  });

  globalThis.setInterval(() => {
    const nextState = finishGameIfNeeded(syncTimer(gameState));

    if (nextState === gameState) {
      return;
    }

    const shouldRenderEntireApp = nextState.status !== gameState.status;

    gameState = nextState;
    persistCurrentGame();

    if (shouldRenderEntireApp) {
      render();
    } else {
      updateTimerHud(container, gameState);
    }
  }, 250);

  globalThis.addEventListener('pagehide', () => {
    gameState = syncTimer(gameState);
    persistCurrentGame();
  });
};

startApp(app);
