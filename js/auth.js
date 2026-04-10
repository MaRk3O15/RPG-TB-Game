// Auth screen — login and register UI
import { login, register } from './api.js';

// Shows login/register screen, returns Promise that resolves when logged in
export function showAuthScreen(container) {
  return new Promise((resolve) => {
    renderAuth(container, resolve);
  });
}

function renderAuth(container, onSuccess) {
  let mode = 'login'; // 'login' or 'register'

  function render() {
    const isLogin = mode === 'login';
    container.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-title">⚔️ RPG Turn-Based Game</div>
          <div class="auth-subtitle">Зомбі-Апокаліпсис</div>

          <div class="auth-tabs">
            <button class="auth-tab ${isLogin ? 'active' : ''}" data-mode="login">Вхід</button>
            <button class="auth-tab ${!isLogin ? 'active' : ''}" data-mode="register">Реєстрація</button>
          </div>

          <div class="auth-form">
            <input
              class="auth-input"
              id="auth-name"
              type="text"
              placeholder="Ім'я гравця"
              maxlength="20"
            />
            <input
              class="auth-input"
              id="auth-password"
              type="password"
              placeholder="Пароль"
            />
            <div class="auth-error" id="auth-error"></div>
            <button class="auth-btn" id="auth-submit">
              ${isLogin ? 'Увійти' : 'Створити акаунт'}
            </button>
          </div>

          <div class="auth-hint">
            ${isLogin
              ? 'Немає акаунту? Переключись на Реєстрацію'
              : 'Вже є акаунт? Переключись на Вхід'}
          </div>
        </div>
      </div>
    `;

    // Tab switching
    container.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        mode = tab.dataset.mode;
        render();
      });
    });

    // Submit on Enter key
    container.querySelectorAll('.auth-input').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });
    });

    container.querySelector('#auth-submit').addEventListener('click', handleSubmit);

    // Focus name input
    container.querySelector('#auth-name').focus();
  }

  async function handleSubmit() {
    const name = container.querySelector('#auth-name').value.trim();
    const password = container.querySelector('#auth-password').value;
    const errorEl = container.querySelector('#auth-error');
    const btn = container.querySelector('#auth-submit');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Завантаження...';

    try {
      const result = mode === 'login'
        ? await login(name, password)
        : await register(name, password);

      if (result.error) {
        errorEl.textContent = result.error;
        btn.disabled = false;
        btn.textContent = mode === 'login' ? 'Увійти' : 'Створити акаунт';
      } else {
        onSuccess(result.name);
      }
    } catch {
      errorEl.textContent = 'Помилка з\'єднання з сервером';
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Увійти' : 'Створити акаунт';
    }
  }

  render();
}
