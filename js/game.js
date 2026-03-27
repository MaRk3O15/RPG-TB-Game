// Game engine — manages game state, turns, waves, and battle flow
// Turn system: each unit has a turn gauge that fills by their speed.
// When gauge reaches 100, that unit acts. Fastest units act first.

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
    this.state = 'team_select';
    this.team = [];
    this.teamSlots = [null, null, null, null, null];
    this.enemies = [];
    this.currentLevel = null;
    this.currentWave = 0;
    this.battleLog = [];
    this.leaderSkill = null;

    // Turn gauge system
    this.activeUnit = null; // The unit whose turn it is
    this.waitingForPlayer = false;

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
    return this.teamSlots.filter((s) => s !== null).length >= 1;
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
    this.team = [];
    for (const charId of this.teamSlots) {
      if (charId) {
        this.team.push(new Hero(CHARACTERS[charId]));
      }
    }

    // Mark leader (first hero in slot 0)
    if (this.team.length > 0) {
      this.team[0].isLeader = true;
    }

    // Apply leader skill
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

    this.currentWave = 0;
    this.startWave();
  }

  // --- Wave Management ---

  startWave() {
    const waveData = this.currentLevel.waves[this.currentWave];

    this.enemies = waveData.enemies.map((e) => {
      return new Enemy(getEnemyData(e.id), e.tier || 'normal');
    });

    // Reset turn gauges for all units at wave start
    for (const hero of this.team) {
      if (hero.alive) hero.turnGauge = 0;
    }
    for (const enemy of this.enemies) {
      enemy.turnGauge = 0;
    }

    this.state = 'battle';
    this.activeUnit = null;
    this.waitingForPlayer = false;

    const waveNum = this.currentWave + 1;
    const totalWaves = this.currentLevel.waves.length;
    this.addLog(`--- Хвиля ${waveNum}/${totalWaves} ---`, 'wave');

    // Advance to first turn
    this.advanceToNextTurn();
  }

  nextWave() {
    this.currentWave++;

    if (this.currentWave >= this.currentLevel.waves.length) {
      this.victory();
      return;
    }

    // Between waves: keep HP and cooldowns, clear non-passive effects
    for (const hero of this.team) {
      hero.effects = hero.effects.filter((e) => e.duration >= 999);
    }

    this.addLog('Баффи та дебаффи скинуто. HP та cooldown збережено.', 'info');
    this.startWave();
  }

  // --- Turn Gauge System ---

  // Get all alive units (heroes + enemies)
  getAllAliveUnits() {
    const units = [];
    for (const hero of this.team) {
      if (hero.alive) units.push(hero);
    }
    for (const enemy of this.enemies) {
      if (enemy.alive) units.push(enemy);
    }
    return units;
  }

  // Advance time until someone's gauge reaches 100
  advanceToNextTurn() {
    const allUnits = this.getAllAliveUnits();
    if (allUnits.length === 0) return;

    // Find the unit closest to 100 gauge
    // Calculate how many "ticks" each unit needs: (100 - gauge) / speed
    let minTicks = Infinity;
    for (const unit of allUnits) {
      const ticksNeeded = (100 - unit.turnGauge) / unit.getSpeed();
      if (ticksNeeded < minTicks) {
        minTicks = ticksNeeded;
      }
    }

    // Advance all gauges by minTicks * speed
    for (const unit of allUnits) {
      unit.turnGauge += minTicks * unit.getSpeed();
      // Clamp to 100
      if (unit.turnGauge >= 99.99) unit.turnGauge = 100;
    }

    // Find the unit with gauge at 100 (highest speed wins ties)
    let readyUnit = null;
    for (const unit of allUnits) {
      if (unit.turnGauge >= 100) {
        if (!readyUnit || unit.getSpeed() > readyUnit.getSpeed()) {
          readyUnit = unit;
        }
      }
    }

    this.activeUnit = readyUnit;

    if (readyUnit instanceof Hero) {
      // Player's turn — wait for input
      this.waitingForPlayer = true;

      // Elsa leader passive: heal on hero turn start
      this.processLeaderTurnStart();

      this.ui.render(this);
    } else if (readyUnit instanceof Enemy) {
      // Enemy turn — act automatically
      this.waitingForPlayer = false;
      this.ui.render(this);

      // Small delay so player can see the enemy's turn
      setTimeout(() => {
        this.executeEnemyTurn(readyUnit);
      }, 400);
    }
  }

  // --- Player Turn ---

  getCurrentHero() {
    if (this.activeUnit instanceof Hero && this.waitingForPlayer) {
      return this.activeUnit;
    }
    return null;
  }

  executeAbility(abilityId, targetIndex) {
    const hero = this.getCurrentHero();
    if (!hero) return;

    const ability = hero.useAbility(abilityId);
    if (!ability) return;

    // Process ability
    if (ability.type === 'attack') {
      if (ability.target === 'enemy_single') {
        const target = this.enemies[targetIndex];
        if (!target || !target.alive) return;
        const dmg = calculateDamage(hero, target, ability.damageMultiplier);
        const actual = target.takeDamage(dmg);
        this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: ${actual} шкоди`, 'attack');
        if (!target.alive) this.addLog(`${target.name} знищено!`, 'kill');
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
      const target = this.enemies[targetIndex];
      if (!target || !target.alive) return;
      const dmg = calculateDamage(hero, target, ability.damageMultiplier);
      const actual = target.takeDamage(dmg);
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: ${actual} шкоди`, 'attack');
      if (!target.alive) this.addLog(`${target.name} знищено!`, 'kill');
      const aliveAllies = this.team.filter((h) => h.alive && h.hp < h.maxHp);
      if (aliveAllies.length > 0) {
        aliveAllies.sort((a, b) => a.getHpPercent() - b.getHpPercent());
        const healed = aliveAllies[0].heal(ability.healAmount);
        if (healed > 0) this.addLog(`  ↳ ${aliveAllies[0].name} отримує +${healed} HP`, 'heal');
      }
    } else if (ability.type === 'heal') {
      if (ability.target === 'ally_all') {
        this.addLog(`${hero.name} → "${ability.name}" → ВСІ союзники`, 'heal');
        for (const ally of this.team) {
          if (!ally.alive) continue;
          const healed = ally.heal(ability.healAmount);
          if (healed > 0) this.addLog(`  → ${ally.name}: +${healed} HP`, 'heal');
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
      target.turnGauge = 0;
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name} воскрешено з ${hp} HP!`, 'revive');
    } else if (ability.type === 'buff') {
      const target = this.team[targetIndex];
      if (!target || !target.alive) return;
      const effects = [];
      for (const effectData of ability.effects) {
        const effect = { name: effectData.name, type: effectData.type, stat: effectData.stat, value: effectData.value, duration: effectData.duration, source: hero.name };
        target.addEffect(effect);
        effects.push(effect);
      }
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}`, 'buff');
      for (const e of effects) this.addLog(`  ↳ "${e.name}" (${e.duration} ходів)`, 'buff');
    } else if (ability.type === 'self_buff') {
      const effects = applySelfEffects(ability, hero);
      this.addLog(`${hero.name} → "${ability.name}"`, 'buff');
      for (const e of effects) this.addLog(`  ↳ "${e.name}" (${e.duration} ходів)`, 'buff');
    } else if (ability.type === 'cleanse') {
      const target = this.team[targetIndex];
      if (!target || !target.alive) return;
      target.removeEffectsByType('debuff');
      this.addLog(`${hero.name} → "${ability.name}" → ${target.name}: дебаффи знято!`, 'cleanse');
    }

    // End hero turn
    this.endUnitTurn(hero);
  }

  // --- Enemy Turn ---

  executeEnemyTurn(enemy) {
    if (!enemy.alive) {
      this.advanceToNextTurn();
      return;
    }

    // Process DoT
    const dotDmg = enemy.processDoTEffects();
    if (dotDmg > 0) {
      this.addLog(`${enemy.name} отримує ${dotDmg} шкоди від ефектів`, 'dot');
      if (!enemy.alive) {
        this.addLog(`${enemy.name} знищено від ефектів!`, 'kill');
        this.afterAction();
        return;
      }
    }

    // Try special ability
    if (enemy.specialAbility) {
      const special = enemy.specialAbility;

      if (special.type === 'buff_allies' && special.currentCooldown === 0) {
        this.addLog(`${enemy.name} → "${special.name}"!`, 'enemy_special');
        for (const ally of this.enemies) {
          if (!ally.alive || ally === enemy) continue;
          for (const effectData of special.effects) {
            ally.addEffect({ ...effectData, source: enemy.name });
          }
        }
        special.currentCooldown = special.cooldown;
        this.endUnitTurn(enemy);
        return;
      }

      if (special.type === 'revive_ally' && !special.used) {
        const deadAllies = this.enemies.filter((e) => !e.alive);
        if (deadAllies.length > 0) {
          const target = deadAllies[0];
          target.revive(0.5);
          target.turnGauge = 0;
          special.used = true;
          this.addLog(`${enemy.name} → "${special.name}" → ${target.name} воскрешено!`, 'enemy_special');
          this.endUnitTurn(enemy);
          return;
        }
      }

      if (special.type === 'attack_all' && special.currentCooldown === 0) {
        this.addLog(`${enemy.name} → "${special.name}"!`, 'enemy_special');
        for (const hero of this.team) {
          if (!hero.alive) continue;
          const dmg = calculateDamage(enemy, hero, special.damageMultiplier);
          const actual = this.applyDamageToHero(hero, dmg);
          this.addLog(`  → ${hero.name}: ${actual} шкоди${!hero.alive ? ' 💀' : ''}`, 'enemy_attack');
        }
        special.currentCooldown = special.cooldown;
        this.endUnitTurn(enemy);
        return;
      }

      if (special.currentCooldown > 0) {
        special.currentCooldown--;
      }
    }

    // Normal attack
    const target = enemy.chooseTarget(this.team);
    if (!target) {
      this.endUnitTurn(enemy);
      return;
    }

    const dmg = calculateDamage(enemy, target);
    const actual = this.applyDamageToHero(target, dmg);
    this.addLog(`${enemy.name} → ${target.name}: ${actual} шкоди${!target.alive ? ' 💀' : ''}`, 'enemy_attack');

    this.endUnitTurn(enemy);
  }

  applyDamageToHero(hero, dmg) {
    const actual = hero.takeDamage(dmg);

    if (!hero.alive && this.leaderSkill && this.leaderSkill.onDeathCheck) {
      const saved = this.leaderSkill.onDeathCheck(hero);
      if (saved) {
        this.addLog(`  ↳ "${this.leaderSkill.name}" рятує ${hero.name}! (1 HP)`, 'save');
      }
    }

    return actual;
  }

  // --- After a unit acts ---

  endUnitTurn(unit) {
    // Reset gauge
    unit.turnGauge = 0;

    // Tick effects on this unit
    unit.tickEffects();

    // Tick cooldowns if hero
    if (unit instanceof Hero) {
      unit.tickCooldowns();
    }

    this.afterAction();
  }

  afterAction() {
    // Check win/lose
    if (this.isTeamDead()) {
      this.defeat();
      return;
    }

    if (this.isEnemiesDead()) {
      this.waveComplete();
      return;
    }

    // Next turn
    this.advanceToNextTurn();
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

    const nextIndex = this.currentLevel.id;
    if (nextIndex < CAMPAIGN.length) {
      CAMPAIGN[nextIndex].unlocked = true;
    }

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
    if (this.battleLog.length > 50) {
      this.battleLog.shift();
    }
  }

  goToTeamSelect() {
    this.state = 'team_select';
    this.team = [];
    this.enemies = [];
    this.battleLog = [];
    this.teamSlots = [null, null, null, null, null];
    this.leaderSkill = null;
    this.activeUnit = null;
    this.ui.render(this);
  }

  goToLevelSelect() {
    this.state = 'level_select';
    this.ui.render(this);
  }
}
