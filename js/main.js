// Main entry point — initialize game

import { Game } from './game.js';
import { UI } from './ui.js';

// Create UI and Game
const container = document.getElementById('app');
const ui = new UI(container);
const game = new Game(ui);

// Initial render
ui.render(game);
