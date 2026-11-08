# Alchemist's Cauldron: Journal Edition

Alchemist's Cauldron is a browser-based potion-brewing game developed for the
[RS School JavaScript/Front-end Short Track](https://rs.school/docs/short-track/course-overview).

The player combines ingredients to bring Temperature, Density and Magic Power into a recipe's
target ranges before time, lives or ingredient stock runs out.

## Task

- [Official task requirements](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/game-alchemists-cauldron/README.md)
- [Creative extension requirements](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/creative-extension/mini-games.md)
- Target score: **393 points**
- Supported browser: latest Google Chrome
- Supported viewport width: **375px–1920px**

## Deployment

[Open the deployed application](https://tobi189.github.io/alchemists-cauldron-journal/)

## Creative extension: Alchemist's Journal

The Journal turns individual game rounds into persistent player progression. It records completed
and abandoned experiments in `localStorage`, then presents the accumulated data through four
sections available from the main menu:

- **Overview** — editable alchemist name and career statistics;
- **Discoveries** — ingredients used, recipes completed and reactions triggered;
- **Achievements** — ten unlockable milestones evaluated from recorded progress;
- **History** — chronological session results with difficulty, outcome, score and brew statistics.

Journal data is validated before it is loaded. The active journal session is also included in saved
games, so continuing a paused game does not lose its discoveries or statistics. Older version 2
game saves remain compatible and receive a new journal session automatically.

## Current implementation

The project implements the complete technical foundation and all three gameplay levels for a total
proposed score of **393 points**.

Implemented:

- [x] Vite development and production build
- [x] Strict TypeScript configuration
- [x] ESLint and Prettier
- [x] Husky commit-message and pre-push hooks
- [x] Organized source-code structure
- [x] Pull request template
- [x] Complete Level 1 Medium-difficulty game
- [x] Ingredient stock, recipes, brewing, scoring, timer, lives and pause flow
- [x] Top-10 leaderboard with safe localStorage handling
- [x] Help and Settings dialogs
- [x] Easy, Medium and Hard difficulty selection
- [x] Difficulty-specific shelves, recipes, limits, scoring and bonuses
- [x] Separate Top-10 leaderboard for each difficulty
- [x] Validated auto-save and Continue Game
- [x] Drag-and-drop ingredient controls with click and keyboard alternatives
- [x] Hard-mode ingredient tooltips with edge-aware positioning
- [x] Complete difficulty-aware chemical reaction system
- [x] Pour Out action with its 10-second cost
- [x] Active-game keyboard shortcuts
- [x] CSS success, explosion, shake, floating-ingredient and parameter animations
- [x] GitHub Pages deployment

## Game overview

A player can read the rules from Help, choose Easy, Medium or Hard in Settings, and then start a
game. Each difficulty controls the shelf size, cauldron capacity, timer, tolerance, lives, scoring,
time bonus and recipe pool.

A game begins with a randomly selected recipe and a shelf of ingredients. Every ingredient changes
three cauldron parameters:

- Temperature
- Density
- Magic Power

Each ingredient has limited randomly generated stock. The player adds ingredients to the cauldron
and attempts to move all three parameter values into the active recipe's target ranges.

A successful brew awards points and a time bonus. A failed brew removes one life. The game ends
when time expires, all lives are lost, or no ingredients remain.

Unfinished games are saved automatically. A valid save can be restored with **Continue Game** and
opens in the paused state. Finished, abandoned and malformed saves are not offered for continuation.

## Project levels

| Level        | Functionality                                                       | Total score | Status   |
| ------------ | ------------------------------------------------------------------- | ----------: | -------- |
| Precondition | Repository, tooling and project structure                           |          58 | Complete |
| Level 1      | Basic Medium-difficulty game                                        |         228 | Complete |
| Level 2      | Difficulty selection, auto-save and Continue Game                   |         278 | Complete |
| Level 3      | Drag and drop, reactions, tooltips, Pour Out, shortcuts and effects |         393 | Complete |

## Technology

- TypeScript
- Vite
- SCSS
- HTML
- CSS
- ESLint
- Prettier
- Husky

The game uses no front-end framework, CSS framework or game engine.

## Project structure

```text
.github/
  pull_request_template.md
.husky/
  commit-msg
  pre-push
scripts/
  validate-commit-message.mjs
src/
  assets/
  data/
  logic/
  state/
  storage/
  styles/
    abstracts/
    base/
    components/
    layout/
    main.scss
  types/
  ui/
  main.ts
index.html
```

The main responsibilities are separated as follows:

- `data` contains fixed game catalogues and configuration.
- `logic` contains game rules and calculations without DOM rendering.
- `state` contains the current game state and state transitions.
- `storage` contains safe persistence and leaderboard helpers.
- `ui` contains DOM rendering and browser event handling.
- `styles` contains the responsive layout and visual effects.
- `assets` contains individual visual assets used by the game.

## Running locally

Requirements:

- Node.js
- npm

Clone the repository and install dependencies:

```bash
git clone git@github.com:Tobi189/alchemists-cauldron-journal.git
cd alchemists-cauldron-journal
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Quality checks

Run all configured checks:

```bash
npm run check
```

Individual commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Apply automatic formatting:

```bash
npm run format
```

The pre-push hook runs ESLint and the Prettier check. The commit-message hook validates commit
messages against the configured RS School-style convention.

## Development workflow

Development uses cumulative story branches:

- `story-1` is based on `main`.
- `story-2` is based on `story-1`.
- `story-3` is based on `story-2`.
- Small task branches are merged into the current story branch.
- Final story pull requests target the preceding story branch and remain unmerged for Cross-Check.

## Author

[Tobi189](https://github.com/Tobi189)
