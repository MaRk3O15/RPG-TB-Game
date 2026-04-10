// Main entry point — check auth, then initialize game
import { Game } from './game.js';
import { UI } from './ui.js';
import { showAuthScreen } from './auth.js';
import { isLoggedIn, verifyToken, getCurrentUser } from './api.js';

const container = document.getElementById('app');

async function init() {
  // Check if user has a valid session
  const loggedIn = isLoggedIn() && await verifyToken();

  if (!loggedIn) {
    // Show login/register screen
    await showAuthScreen(container);
  }

  // Start game
  const ui = new UI(container);
  const game = new Game(ui);
  ui.render(game);
}

init();
