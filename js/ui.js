// UI renderer — draws all game screens

import { CHARACTERS, getAllCharacterIds } from './characters.js';

export class UI {
  constructor(container) {
    this.container = container;
    this.selectedAbility = null;
  }

  render(game) {
    switch (game.state) {
      case 'team_select':
        this.renderTeamSelect(game);
        break;
      case 'level_select':
        this.renderLevelSelect(game);
        break;
      case 'battle':
        this.renderBattle(game);
        break;
      case 'wave_transition':
        this.renderWaveTransition(game);
        break;
      case 'victory':
        this.renderVictory(game);
        break;
      case 'defeat':
        this.renderDefeat(game);
        break;
    }
  }

  // ====== TEAM SELECT SCREEN ======
  renderTeamSelect(game) {
    const charIds = getAllCharacterIds();
    // Filter out characters that are already in team slots
    const selectedIds = game.teamSlots.filter((s) => s !== null);
    const availableIds = charIds.filter((id) => !selectedIds.includes(id));

    let html = `
      <div class="screen team-select-screen">
        <h1>⚔️ Збери команду</h1>
        <p class="hint">Обери до 5 героїв. Слот 1 = Лідер (активує пасивний бафф)</p>

        <div class="team-slots">
          ${game.teamSlots
            .map((charId, i) => {
              const char = charId ? CHARACTERS[charId] : null;
              return `
              <div class="team-slot ${i === 0 ? 'leader-slot' : ''} ${charId ? 'filled' : ''}" data-slot="${i}">
                <div class="slot-label">${i === 0 ? '👑 Лідер' : `Слот ${i + 1}`}</div>
                ${
                  char
                    ? `
                  <div class="slot-char">
                    <div class="slot-icon">${this.getClassIcon(char.className)}</div>
                    <div class="slot-name">${char.name}</div>
                    <div class="slot-class">${char.className}</div>
                    <button class="btn-remove" data-slot="${i}">✕</button>
                  </div>
                `
                    : `<div class="slot-empty">Порожньо</div>`
                }
              </div>
            `;
            })
            .join('')}
        </div>

        <h2>Доступні герої</h2>
        <div class="char-list">
          ${availableIds.length === 0
            ? '<p class="hint">Всіх героїв обрано!</p>'
            : availableIds
                .map((id) => {
                  const char = CHARACTERS[id];
                  return `
              <div class="char-card" data-char="${id}">
                <div class="char-icon">${this.getClassIcon(char.className)}</div>
                <div class="char-info">
                  <div class="char-name">${char.name} <span class="char-title">${char.title}</span></div>
                  <div class="char-class">${char.className} ${char.tags.includes('Лідер') ? '👑' : ''}</div>
                  <div class="char-stats">
                    <span class="stat-hp">❤️ ${char.hp}</span>
                    <span class="stat-atk">⚔️ ${char.atk}</span>
                    <span class="stat-def">🛡️ ${char.def}</span>
                    <span class="stat-spd">💨 ${char.speed}</span>
                  </div>
                  <div class="char-tags">${char.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
                  <div class="char-abilities">
                    ${char.abilities.map((a) => `<span class="ability-badge" title="${a.description}">${a.name}${a.cooldown > 0 ? ` (CD:${a.cooldown})` : ''}</span>`).join('')}
                  </div>
                  ${char.leaderSkill ? `<div class="leader-skill">👑 ${char.leaderSkill.name}: ${char.leaderSkill.description}</div>` : ''}
                </div>
                <button class="btn-add" data-char="${id}">+</button>
              </div>
            `;
                })
                .join('')}
        </div>

        <button class="btn-primary btn-start ${game.canStartBattle() ? '' : 'disabled'}" id="btn-to-levels">
          Обрати рівень →
        </button>
      </div>
    `;

    this.container.innerHTML = html;

    // Event listeners
    this.container.querySelectorAll('.btn-add').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const charId = btn.dataset.char;
        const emptyIndex = game.teamSlots.indexOf(null);
        if (emptyIndex !== -1) {
          game.setTeamSlot(emptyIndex, charId);
          this.render(game);
        }
      });
    });

    this.container.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot = parseInt(btn.dataset.slot);
        game.clearTeamSlot(slot);
        this.render(game);
      });
    });

    const startBtn = document.getElementById('btn-to-levels');
    if (startBtn && game.canStartBattle()) {
      startBtn.addEventListener('click', () => {
        game.goToLevelSelect();
      });
    }
  }

  // ====== LEVEL SELECT SCREEN ======
  renderLevelSelect(game) {
    const levels = game.getLevels();

    let html = `
      <div class="screen level-select-screen">
        <h1>🗺️ Кампанія</h1>
        <p class="hint">Обери рівень для бою</p>

        <div class="level-list">
          ${levels
            .map(
              (level, i) => `
            <div class="level-card ${level.unlocked ? '' : 'locked'}" data-level="${i}">
              <div class="level-num">${level.id}</div>
              <div class="level-info">
                <div class="level-name">${level.unlocked ? level.name : '???'}</div>
                <div class="level-desc">${level.unlocked ? level.description : 'Пройди попередній рівень'}</div>
                <div class="level-waves">${level.waves.length} хвилі</div>
              </div>
              ${level.unlocked ? `<button class="btn-play" data-level="${i}">⚔️ Бій!</button>` : '<span class="lock-icon">🔒</span>'}
            </div>
          `
            )
            .join('')}
        </div>

        <button class="btn-secondary" id="btn-back-team">← Назад до команди</button>
      </div>
    `;

    this.container.innerHTML = html;

    this.container.querySelectorAll('.btn-play').forEach((btn) => {
      btn.addEventListener('click', () => {
        const levelIndex = parseInt(btn.dataset.level);
        if (game.selectLevel(levelIndex)) {
          game.startBattle();
        }
      });
    });

    document.getElementById('btn-back-team')?.addEventListener('click', () => {
      game.goToTeamSelect();
    });
  }

  // ====== BATTLE SCREEN ======
  renderBattle(game) {
    const currentHero = game.getCurrentHero();
    this.selectedAbility = null;

    // Collect all units for turn order display
    const allUnits = [];
    for (const h of game.team) {
      if (h.alive) allUnits.push({ unit: h, type: 'hero' });
    }
    for (const e of game.enemies) {
      if (e.alive) allUnits.push({ unit: e, type: 'enemy' });
    }

    let html = `
      <div class="screen battle-screen">
        <div class="battle-header">
          <div class="level-title">${game.currentLevel.name}</div>
          <div class="wave-info">Хвиля ${game.currentWave + 1}/${game.currentLevel.waves.length}</div>
        </div>

        <div class="battlefield">
          <div class="heroes-side">
            <h3>Команда</h3>
            <div class="unit-list">
              ${game.team
                .map(
                  (hero, i) => `
                <div class="unit-card hero-card ${!hero.alive ? 'dead' : ''} ${currentHero === hero ? 'active-hero' : ''}" data-hero="${i}">
                  <div class="unit-name-row">
                    <span class="unit-icon">${this.getClassIcon(hero.className)}</span>
                    <span class="unit-name">${hero.name}</span>
                    <span class="unit-class">${hero.className}</span>
                    ${hero.isLeader && hero.hasTag('Лідер') ? '<span class="leader-badge">👑 Лідер</span>' : ''}
                  </div>
                  <div class="hp-bar-container">
                    <div class="hp-bar hp-bar-hero" style="width: ${hero.getHpPercent()}%"></div>
                    <div class="hp-text">${hero.hp}/${hero.maxHp}</div>
                  </div>
                  <div class="gauge-bar-container">
                    <div class="gauge-bar ${hero.turnGauge >= 100 ? 'gauge-full' : ''}" style="width: ${Math.min(100, Math.round(hero.turnGauge))}%"></div>
                    <div class="gauge-text">Хід: ${Math.min(100, Math.round(hero.turnGauge))}%</div>
                  </div>
                  <div class="unit-stats">⚔️${hero.getAtk()} 🛡️${hero.getDef()} 💨${hero.getSpeed()}</div>
                  ${this.renderEffects(hero.effects)}
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="enemies-side">
            <h3>Вороги</h3>
            <div class="unit-list">
              ${game.enemies
                .map(
                  (enemy, i) => `
                <div class="unit-card enemy-card ${!enemy.alive ? 'dead' : ''} ${enemy.tier !== 'normal' ? 'tier-' + enemy.tier : ''} ${game.activeUnit === enemy ? 'active-enemy' : ''}" data-enemy="${i}">
                  <div class="unit-tier">${enemy.tier === 'elite' ? '⭐ Еліта' : enemy.tier === 'boss' ? '💀 БОС' : ''}</div>
                  <div class="unit-name">${enemy.name}</div>
                  <div class="hp-bar-container">
                    <div class="hp-bar" style="width: ${enemy.getHpPercent()}%"></div>
                    <div class="hp-text">${enemy.hp}/${enemy.maxHp}</div>
                  </div>
                  <div class="gauge-bar-container">
                    <div class="gauge-bar gauge-enemy ${enemy.turnGauge >= 100 ? 'gauge-full' : ''}" style="width: ${Math.min(100, Math.round(enemy.turnGauge))}%"></div>
                    <div class="gauge-text">Хід: ${Math.min(100, Math.round(enemy.turnGauge))}%</div>
                  </div>
                  <div class="unit-stats">⚔️${enemy.getAtk()} 🛡️${enemy.getDef()} 💨${enemy.getSpeed()}</div>
                  ${this.renderEffects(enemy.effects)}
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        ${currentHero ? this.renderAbilityPanel(game, currentHero) : `<div class="ability-panel"><div class="current-hero-label">Хід ворога...</div></div>`}

        <div class="battle-log" id="battle-log">
          ${game.battleLog
            .map((entry) => `<div class="log-${entry.type}">${entry.text}</div>`)
            .join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.scrollLog();
    if (currentHero) this.attachBattleListeners(game, currentHero);
  }

  renderAbilityPanel(game, hero) {
    const abilities = hero.abilities;

    return `
      <div class="ability-panel">
        <div class="current-hero-label">Хід: <strong>${hero.name}</strong>${hero.isLeader && hero.hasTag('Лідер') ? ' 👑' : ''}</div>
        <div class="ability-list">
          ${abilities
            .map(
              (ability) => `
            <button class="btn-ability ${ability.currentCooldown > 0 ? 'on-cooldown' : ''}"
                    data-ability="${ability.id}"
                    title="${ability.description}"
                    ${ability.currentCooldown > 0 ? 'disabled' : ''}>
              <span class="ability-name">${ability.name}</span>
              ${ability.currentCooldown > 0 ? `<span class="cd-badge">CD: ${ability.currentCooldown}</span>` : ''}
              ${ability.cooldown > 0 && ability.currentCooldown === 0 ? `<span class="cd-max">(CD:${ability.cooldown})</span>` : ''}
            </button>
          `
            )
            .join('')}
        </div>
        <div class="target-hint" id="target-hint"></div>
      </div>
    `;
  }

  renderEffects(effects) {
    const visible = effects.filter((e) => e.duration < 999);
    if (visible.length === 0) return '';

    return `
      <div class="effects-list">
        ${visible
          .map(
            (e) =>
              `<span class="effect-badge ${e.type}">${e.type === 'buff' ? '↑' : '↓'} ${e.name} (${e.duration})</span>`
          )
          .join('')}
      </div>
    `;
  }

  attachBattleListeners(game, currentHero) {
    if (!currentHero) return;

    const abilityBtns = this.container.querySelectorAll('.btn-ability:not([disabled])');
    const enemyCards = this.container.querySelectorAll('.enemy-card:not(.dead)');
    const heroCards = this.container.querySelectorAll('.hero-card:not(.dead)');
    const hint = document.getElementById('target-hint');

    abilityBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        abilityBtns.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');

        const abilityId = btn.dataset.ability;
        const ability = currentHero.abilities.find((a) => a.id === abilityId);
        this.selectedAbility = ability;

        if (hint) {
          if (ability.target === 'enemy_single') {
            hint.textContent = '👆 Обери ворога для атаки';
            this.highlightTargets(enemyCards, 'targetable');
            this.unhighlightTargets(heroCards, 'targetable');
          } else if (ability.target === 'enemy_all') {
            hint.textContent = '💥 Атака по всіх ворогах (натисни на будь-якого)';
            this.highlightTargets(enemyCards, 'targetable');
            this.unhighlightTargets(heroCards, 'targetable');
          } else if (ability.target === 'ally_single' || ability.target === 'ally_all') {
            hint.textContent = '👆 Обери союзника';
            this.highlightTargets(heroCards, 'targetable');
            this.unhighlightTargets(enemyCards, 'targetable');
          } else if (ability.target === 'ally_dead') {
            hint.textContent = '👆 Обери полеглого союзника для воскресіння';
            const deadCards = this.container.querySelectorAll('.hero-card.dead');
            this.highlightTargets(deadCards, 'targetable');
          } else if (ability.target === 'self') {
            hint.textContent = '';
            game.executeAbility(abilityId, 0);
            return;
          }
        }
      });
    });

    enemyCards.forEach((card) => {
      card.addEventListener('click', () => {
        if (!this.selectedAbility) return;
        if (this.selectedAbility.target !== 'enemy_single' && this.selectedAbility.target !== 'enemy_all') return;
        const enemyIndex = parseInt(card.dataset.enemy);
        game.executeAbility(this.selectedAbility.id, enemyIndex);
      });
    });

    heroCards.forEach((card) => {
      card.addEventListener('click', () => {
        if (!this.selectedAbility) return;
        const target = this.selectedAbility.target;
        if (target !== 'ally_single' && target !== 'ally_all') return;
        const heroIndex = parseInt(card.dataset.hero);
        game.executeAbility(this.selectedAbility.id, heroIndex);
      });
    });

    const deadCards = this.container.querySelectorAll('.hero-card.dead');
    deadCards.forEach((card) => {
      card.addEventListener('click', () => {
        if (!this.selectedAbility) return;
        if (this.selectedAbility.target !== 'ally_dead') return;
        const heroIndex = parseInt(card.dataset.hero);
        const deadAllies = game.team.filter((h) => !h.alive);
        const deadIndex = deadAllies.indexOf(game.team[heroIndex]);
        if (deadIndex !== -1) {
          game.executeAbility(this.selectedAbility.id, deadIndex);
        }
      });
    });
  }

  highlightTargets(cards, className) {
    cards.forEach((c) => c.classList.add(className));
  }

  unhighlightTargets(cards, className) {
    cards.forEach((c) => c.classList.remove(className));
  }

  scrollLog() {
    const log = document.getElementById('battle-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  // ====== WAVE TRANSITION ======
  renderWaveTransition(game) {
    const nextWave = game.currentWave + 2;
    const totalWaves = game.currentLevel.waves.length;

    let html = `
      <div class="screen transition-screen">
        <h1>✓ Хвиля ${game.currentWave + 1} пройдена!</h1>
        <p>HP та cooldown збережено. Баффи та дебаффи скинуто.</p>

        <div class="team-status">
          ${game.team
            .map(
              (hero) => `
            <div class="transition-hero ${!hero.alive ? 'dead' : ''}">
              <div>${this.getClassIcon(hero.className)} ${hero.name}</div>
              <div class="hp-bar-container">
                <div class="hp-bar hp-bar-hero" style="width: ${hero.getHpPercent()}%"></div>
                <div class="hp-text">${hero.hp}/${hero.maxHp}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <button class="btn-primary" id="btn-next-wave">
          Хвиля ${nextWave}/${totalWaves} →
        </button>

        <div class="battle-log" id="battle-log">
          ${game.battleLog
            .map((entry) => `<div class="log-${entry.type}">${entry.text}</div>`)
            .join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.scrollLog();

    document.getElementById('btn-next-wave')?.addEventListener('click', () => {
      game.nextWave();
    });
  }

  // ====== VICTORY ======
  renderVictory(game) {
    let html = `
      <div class="screen victory-screen">
        <h1>🏆 ПЕРЕМОГА!</h1>
        <p class="victory-text">Рівень "${game.currentLevel.name}" пройдено!</p>

        <div class="team-status">
          ${game.team
            .map(
              (hero) => `
            <div class="transition-hero ${!hero.alive ? 'dead' : ''}">
              <div>${this.getClassIcon(hero.className)} ${hero.name}</div>
              <div class="hp-bar-container">
                <div class="hp-bar hp-bar-hero" style="width: ${hero.getHpPercent()}%"></div>
                <div class="hp-text">${hero.hp}/${hero.maxHp}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="victory-actions">
          <button class="btn-primary" id="btn-to-menu">← До вибору команди</button>
        </div>

        <div class="battle-log" id="battle-log">
          ${game.battleLog
            .map((entry) => `<div class="log-${entry.type}">${entry.text}</div>`)
            .join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.scrollLog();

    document.getElementById('btn-to-menu')?.addEventListener('click', () => {
      game.goToTeamSelect();
    });
  }

  // ====== DEFEAT ======
  renderDefeat(game) {
    let html = `
      <div class="screen defeat-screen">
        <h1>💀 ПОРАЗКА</h1>
        <p class="defeat-text">Твою команду було знищено...</p>

        <div class="defeat-actions">
          <button class="btn-primary" id="btn-retry">🔄 Спробувати знову</button>
          <button class="btn-secondary" id="btn-to-menu-d">← До вибору команди</button>
        </div>

        <div class="battle-log" id="battle-log">
          ${game.battleLog
            .map((entry) => `<div class="log-${entry.type}">${entry.text}</div>`)
            .join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.scrollLog();

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      game.battleLog = [];
      game.startBattle();
    });

    document.getElementById('btn-to-menu-d')?.addEventListener('click', () => {
      game.goToTeamSelect();
    });
  }

  // ====== HELPERS ======
  getClassIcon(className) {
    const icons = {
      Нападник: '⚔️',
      Лікар: '💚',
      Танк: '🛡️',
      Підтримка: '✨',
    };
    return icons[className] || '❓';
  }
}
