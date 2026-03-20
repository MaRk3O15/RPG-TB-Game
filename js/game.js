// Game engine — manages game state, turns, waves, and battle flow

import { Hero } from './hero.js';
import { Enemy } from './enemy.js';
import { CHARACTERS } from './characters.js';
import { getEnemyData } from './enemies.js';
import { CAMPAIGN } from './campaign.js';
import { calculateDamage, applyAbilityEffects, applySelfEffects } from './combat.js';

export class Game {
  constructor(ui) {
    this.ui = ui;

    // Game state
    this.state = 'team_select'; // team_select, level_select, battle, wave_transition, victory, defeat
    this.team = [];
    this.teamSlots = [null, null, null, null, null];
    this.enemies = [];
    this.currentLevel = null;
    this.currentWave = 0;
    this.currentHeroIndex = 0;
    this.battleLog = [];
    this.leaderSkill = null;

    // Load progress
    this.progress = JSON.parse(localStorage.getItem('rpg_progress') || '{}');
    if (this.progress.levelsCompleted) {
      for (let i = 0; i <= this.progress.levelsCompleted && i < CAMPAIGN.length; i++) {
        CAMPAIGN[i].unlocked = true;
      }
    }
  }

  // --- Team Selection ---

  setTeamSlot(slotIndex, characterId) {
    this.teamSlots[slotIndex] = characterId;
  }

  clearTeamSlot(slotIndex) {
    this.teamSlots[slotIndex] = null;
  }

  canStartBattle() {
    const filledSlots = this.teamSlots.filter((s) => s !== null);
    return filledSlots.length >= 1;
  }

  // --- Level Selection ---

  getLevels() {
    return CAMPAIGN;
  }

  selectLevel(levelIndex) {
    const level = CAMPAIGN[levelIndex];
    if (!level || !level.unlocked) return false;
    this.currentLevel = level;
    return true;
  }

  // --- Battle Start ---

  startBattle() {
    // Create hero instances from selected slots
    this.team = [];
    for (const charId of this.teamSlots) {
      if (charId) {
        this.team.push(new Hero(CHARACTERS[charId]));
      }
    }

    // Apply leader skill if slot 1 has a Leader
    const leader = this.team[0];
    if (leader && leader.leaderSkill && leader.hasTag('Лідер')) {
      this.leaderSkill = leader.leaderSkill;
      const passiveEffects = this.leaderSkill.apply(this.team);
      for (const { hero, effects } of passiveEffects) {
        for (const effect of effects) {
          hero.addEffect(effect);
        }
      }
      this.addLog(`Лідер ${leader.name}: "${this.leaderSkill.name}" активовано!`, 'leader');
    }

    // Start wave 1
    this.currentWave = 0;
    this.startWave();
  }

  // --- Wave Management ---

  startWave() {
    const waveData = this.currentLevel.waves[this.currentWave];

    // Create enemies
    this.enemies = waveData.enemies.map((e) => {
      return new Enemy(getEnemyData(e.id), e.tier || 'normal');
    });

    this.currentHeroIndex = 0;
    this.state = 'battle';

    const waveNum = this.currentWave + 1;
    const totalWaves = this.currentLevel.waves.length;
    this.addLog(`--- Хвиля ${waveNum}/${totalWaves} ---`, 'wave');

    // Leader onTurnStart (like Elsa's passive heal)
    this.processLeaderTurnStart();

    this.ui.render(this);
  }

  nextWave() {
    this.currentWave++;

    if (this.currentWave >= this.currentLevel.waves.length) {
      // All waves cleared!
      this.victory();
      return;
    }

    // Between waves: clear all effects except leader passives, keep HP and cooldowns
    for (const hero of this.team) {
      // Keep only effects with duration 999 (leader passives)
      hero.effects = hero.effects.filter((e) => e.duration >= 999);
    }

    this.addLog('Баффи та дебаффи скинуто. HP та cooldown збережено.', 'info');
    this.startWave();
  }

  // --- Turn System ---

  getCurrentHero() {
    // Find next alive hero
    while (this.currentHeroIndex < this.team.length) {
      if (this.team[this.currentHeroIndex].alive) {
        return this.team[this.currentHeroIndex];
      }
      this.currentHeroIndex++;
    }
    return null;
  }

  // Player selects an ability for current hero
  executeAbility(abilityId, targetIndex) {
    const hero = this.getCurrentHero();
    if (!hero) return;

    const ability = hero.useAbility(abilityId);
    if (!ability) return;

    const results = [];

    // --- Process ability by type ---
    if (ability.type === 'attack') {
      if (ability.target === 'enemy_single') {
        const target = this.enemies[targetIndex];
        if (!target || !target.alive) return;

        const dmg = calculateDamage(hero, target, ability.damageMultiplier);
        const actual = target.takeDamage(dmg);
        this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: ${actual} шкоди`, 'attack');

        if (!target.alive) {
          this.addLog(`${target.name} знищено!`, 'kill');
        }

        // Apply effects
        const effects = applyAbilityEffects(ability, target, hero);
        for (const e of effects) {
          this.addLog(`  ↳ ${target.name} отримує "${e.name}" (${e.duration} ходів)`, 'debuff');
        }
      } else if (ability.target === 'enemy_all') {
        this.addLog(`${hero.name} → "${ability.name}" → ВСІ вороги!`, 'attack');
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dmg = calculateDamage(hero, enemy, ability.damageMultiplier);
          const actual = enemy.takeDamage(dmg);
          this.addLog(`  → ${enemy.name}: ${actual} шкоди${!enemy.alive ? ' 💀' : ''}`, 'attack');

          const effects = applyAbilityEffects(ability, enemy, hero);
          for (const e of effects) {
            this.addLog(`  ↳ ${enemy.name}: "${e.name}" (${e.duration} ходів)`, 'debuff');
          }
        }
      }
    } else if (ability.type === 'attack_heal') {
      // Attack + heal lowest HP ally (Elsa's sacred touch)
      const target = this.enemies[targetIndex];
      if (!target || !target.alive) return;

      const dmg = calculateDamage(hero, target, ability.damageMultiplier);
      const actual = target.takeDamage(dmg);
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: ${actual} шкоди`, 'attack');

      if (!target.alive) {
        this.addLog(`${target.name} знищено!`, 'kill');
      }

      // Heal lowest HP ally
      const aliveAllies = this.team.filter((h) => h.alive && h.hp < h.maxHp);
      if (aliveAllies.length > 0) {
        aliveAllies.sort((a, b) => a.getHpPercent() - b.getHpPercent());
        const healed = aliveAllies[0].heal(ability.healAmount);
        if (healed > 0) {
          this.addLog(`  ↳ ${aliveAllies[0].name} отримує +${healed} HP`, 'heal');
        }
      }
    } else if (ability.type === 'heal') {
      if (ability.target === 'ally_all') {
        this.addLog(`${hero.name} → "${ability.name}" → ВСІ союзники`, 'heal');
        for (const ally of this.team) {
          if (!ally.alive) continue;
          const healed = ally.heal(ability.healAmount);
          if (healed > 0) {
            this.addLog(`  → ${ally.name}: +${healed} HP`, 'heal');
          }
        }
      } else if (ability.target === 'ally_single') {
        const target = this.team[targetIndex];
        if (!target || !target.alive) return;
        const healed = target.heal(ability.healAmount);
        this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: +${healed} HP`, 'heal');
      }
    } else if (ability.type === 'revive') {
      const deadAllies = this.team.filter((h) => !h.alive);
      const target = deadAllies[targetIndex];
      if (!target) return;
      const hp = target.revive(ability.revivePercent);
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name} воскрешено з ${hp} HP!`, 'revive');
    } else if (ability.type === 'buff') {
      const target = this.team[targetIndex];
      if (!target || !target.alive) return;
      const effects = [];
      for (const effectData of ability.effects) {
        const effect = {
          name: effectData.name,
          type: effectData.type,
          stat: effectData.stat,
          value: effectData.value,
          duration: effectData.duration,
          source: hero.name,
        };
        target.addEffect(effect);
        effects.push(effect);
      }
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}`, 'buff');
      for (const e of effects) {
        this.addLog(`  ↳ "${e.name}" (${e.duration} ходів)`, 'buff');
      }
    } else if (ability.type === 'self_buff') {
      const effects = applySelfEffects(ability, hero);
      this.addLog(`${hero.name} → "${ability.name}"`, 'buff');
      for (const e of effects) {
        this.addLog(`  ↳ "${e.name}" (${e.duration} ходів)`, 'buff');
      }
    } else if (ability.type === 'cleanse') {
      const target = this.team[targetIndex];
      if (!target || !target.alive) return;
      target.removeEffectsByType('debuff');
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: дебаффи знято!`, 'cleanse');
    }

    // Move to next hero
    this.currentHeroIndex++;
    const nextHero = this.getCurrentHero();

    if (!nextHero) {
      // All heroes acted — enemy turn
      this.enemyTurn();
    } else {
      this.ui.render(this);
    }
  }

  // --- Enemy Turn ---

  enemyTurn() {
    this.addLog('--- Хід ворогів ---', 'enemy_turn');

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // Process DoT (damage over time)
      const dotDmg = enemy.processDoTEffects();
      if (dotDmg > 0) {
        this.addLog(`${enemy.name} отримує ${dotDmg} шкоди від ефектів`, 'dot');
        if (!enemy.alive) {
          this.addLog(`${enemy.name} знищено від ефектів!`, 'kill');
          continue;
        }
      }

      // Elite/Boss special abilities
      if (enemy.specialAbility) {
        const special = enemy.specialAbility;

        if (special.type === 'buff_allies' && special.currentCooldown === 0) {
          // Orc Chief: buff all allies
          this.addLog(`${enemy.name} → "${special.name}"!`, 'enemy_special');
          for (const ally of this.enemies) {
            if (!ally.alive || ally === enemy) continue;
            for (const effectData of special.effects) {
              ally.addEffect({ ...effectData, source: enemy.name });
            }
          }
          special.currentCooldown = special.cooldown;
          continue; // Used turn for special
        }

        if (special.type === 'revive_ally' && !special.used) {
          const deadAllies = this.enemies.filter((e) => !e.alive);
          if (deadAllies.length > 0) {
            const target = deadAllies[0];
            target.revive(0.5);
            special.used = true;
            this.addLog(`${enemy.name} → "${special.name}" → ${target.name} воскрешено!`, 'enemy_special');
            continue;
          }
        }

        if (special.type === 'attack_all' && special.currentCooldown === 0) {
          // Dragon: AoE attack
          this.addLog(`${enemy.name} → "${special.name}"!`, 'enemy_special');
          for (const hero of this.team) {
            if (!hero.alive) continue;
            const dmg = calculateDamage(enemy, hero, special.damageMultiplier);
            const actual = this.applyDamageToHero(hero, dmg);
            this.addLog(`  → ${hero.name}: ${actual} шкоди${!hero.alive ? ' 💀' : ''}`, 'enemy_attack');
          }
          special.currentCooldown = special.cooldown;

          if (this.isTeamDead()) {
            this.defeat();
            return;
          }
          continue;
        }

        // Tick special cooldown
        if (special.currentCooldown > 0) {
          special.currentCooldown--;
        }
      }

      // Normal attack
      const target = enemy.chooseTarget(this.team);
      if (!target) continue;

      const dmg = calculateDamage(enemy, target);
      const actual = this.applyDamageToHero(target, dmg);
      this.addLog(`${enemy.name} → ${target.name}: ${actual} шкоди${!target.alive ? ' 💀' : ''}`, 'enemy_attack');
    }

    // Check if team is dead
    if (this.isTeamDead()) {
      this.defeat();
      return;
    }

    // Check if all enemies are dead
    if (this.isEnemiesDead()) {
      this.waveComplete();
      return;
    }

    // End of round: tick effects and cooldowns
    this.endRound();
  }

  applyDamageToHero(hero, dmg) {
    const actual = hero.takeDamage(dmg);

    // Check Torin's leader skill: save from death
    if (!hero.alive && this.leaderSkill && this.leaderSkill.onDeathCheck) {
      const saved = this.leaderSkill.onDeathCheck(hero);
      if (saved) {
        this.addLog(`  ↳ "${this.leaderSkill.name}" рятує ${hero.name}! (1 HP)`, 'save');
      }
    }

    return actual;
  }

  endRound() {
    // Tick effects on heroes
    for (const hero of this.team) {
      if (!hero.alive) continue;
      hero.tickEffects();
      hero.tickCooldowns();
    }

    // Tick effects on enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.tickEffects();
    }

    // New turn: reset hero index
    this.currentHeroIndex = 0;

    // Leader onTurnStart
    this.processLeaderTurnStart();

    this.addLog('--- Новий хід ---', 'new_turn');
    this.ui.render(this);
  }

  processLeaderTurnStart() {
    if (this.leaderSkill && this.leaderSkill.onTurnStart) {
      const result = this.leaderSkill.onTurnStart(this.team);
      if (result) {
        this.addLog(`"${this.leaderSkill.name}": ${result.hero.name} +${result.healed} HP`, 'leader_passive');
      }
    }
  }

  // --- Wave / Battle end ---

  waveComplete() {
    const waveNum = this.currentWave + 1;
    const totalWaves = this.currentLevel.waves.length;

    if (waveNum >= totalWaves) {
      this.victory();
    } else {
      this.addLog(`✓ Хвиля ${waveNum} пройдена!`, 'wave_clear');
      this.state = 'wave_transition';
      this.ui.render(this);
    }
  }

  victory() {
    this.state = 'victory';
    this.addLog(`🏆 Рівень "${this.currentLevel.name}" пройдено!`, 'victory');

    // Unlock next level
    const nextIndex = this.currentLevel.id; // id is 1-based
    if (nextIndex < CAMPAIGN.length) {
      CAMPAIGN[nextIndex].unlocked = true;
    }

    // Save progress
    const completed = this.progress.levelsCompleted || 0;
    if (this.currentLevel.id > completed) {
      this.progress.levelsCompleted = this.currentLevel.id;
      localStorage.setItem('rpg_progress', JSON.stringify(this.progress));
    }

    this.ui.render(this);
  }

  defeat() {
    this.state = 'defeat';
    this.addLog('💀 Команда знищена...', 'defeat');
    this.ui.render(this);
  }

  // --- Helpers ---

  isTeamDead() {
    return this.team.every((h) => !h.alive);
  }

  isEnemiesDead() {
    return this.enemies.every((e) => !e.alive);
  }

  addLog(text, type = 'info') {
    this.battleLog.push({ text, type });
    // Keep last 50 entries
    if (this.battleLog.length > 50) {
      this.battleLog.shift();
    }
  }

  // Reset to team select
  goToTeamSelect() {
    this.state = 'team_select';
    this.team = [];
    this.enemies = [];
    this.battleLog = [];
    this.teamSlots = [null, null, null, null, null];
    this.leaderSkill = null;
    this.ui.render(this);
  }

  goToLevelSelect() {
    this.state = 'level_select';
    this.ui.render(this);
  }
}
