// Main entry point — testing the foundation
// This file will be replaced with full game logic later

import { Hero } from './hero.js';
import { Enemy } from './enemy.js';
import { CHARACTERS } from './characters.js';
import { getEnemyData } from './enemies.js';
import { calculateDamage, applyAbilityEffects, applySelfEffects } from './combat.js';

// --- Create test team ---
const team = [
  new Hero(CHARACTERS.bjorn),
  new Hero(CHARACTERS.torin),
  new Hero(CHARACTERS.elsa),
  new Hero(CHARACTERS.linara),
  new Hero(CHARACTERS.ragnar),
];

// --- Create test enemies ---
const enemies = [
  new Enemy(getEnemyData('goblin'), 'normal'),
  new Enemy(getEnemyData('skeleton'), 'normal'),
  new Enemy(getEnemyData('orc_chief'), 'elite'),
];

// --- Apply leader skill (Bjorn is in slot 0 = leader) ---
const leader = team[0];
if (leader.leaderSkill && leader.hasTag('Лідер')) {
  const passiveEffects = leader.leaderSkill.apply(team);
  for (const { hero, effects } of passiveEffects) {
    for (const effect of effects) {
      hero.addEffect(effect);
    }
  }
}

// --- Render to page ---
const log = document.getElementById('log');

function addLog(text, type = 'info') {
  const line = document.createElement('div');
  line.className = `log-${type}`;
  line.textContent = text;
  log.appendChild(line);
}

function renderUnits(title, units) {
  addLog(`\n=== ${title} ===`, 'header');
  for (const unit of units) {
    addLog(unit.toString());
    if (unit.effects.length > 0) {
      const effectNames = unit.effects.map((e) => `${e.name} (${e.duration} ходів)`);
      addLog(`  Ефекти: ${effectNames.join(', ')}`, 'effect');
    }
    if (unit.abilities) {
      const abilityNames = unit.abilities.map(
        (a) => `${a.name}${a.currentCooldown > 0 ? ` [CD:${a.currentCooldown}]` : ' ✓'}`
      );
      addLog(`  Здібності: ${abilityNames.join(', ')}`, 'ability');
    }
  }
}

// --- Show initial state ---
addLog('🎮 RPG Turn-Based Game — Тест фундаменту', 'header');
addLog(`Лідер: ${leader.name} — "${leader.leaderSkill.name}"`, 'leader');

renderUnits('Команда героїв', team);
renderUnits('Вороги', enemies);

// --- Simulate one attack ---
addLog('\n=== Тест бою ===', 'header');

// Bjorn attacks goblin
const bjorn = team[0];
const goblin = enemies[0];
const ability = bjorn.abilities[0]; // Axe Swing

const damage = calculateDamage(bjorn, goblin, ability.damageMultiplier);
const actualDmg = goblin.takeDamage(damage);
addLog(`${bjorn.name} використовує "${ability.name}" → ${goblin.name}: ${actualDmg} шкоди`);

// Check for debuff
const effects = applyAbilityEffects(ability, goblin, bjorn);
if (effects.length > 0) {
  addLog(`  💥 Накладено: ${effects.map((e) => e.name).join(', ')}`, 'effect');
} else {
  addLog(`  (дебафф не спрацював — 15% шанс)`, 'miss');
}

addLog(`${goblin.name}: ${goblin.hp}/${goblin.maxHp} HP`);

// Ragnar uses Rage
const ragnar = team[4];
const rageAbility = ragnar.abilities[2]; // Rage
ragnar.useAbility('rage');
applySelfEffects(rageAbility, ragnar);
addLog(`\n${ragnar.name} використовує "${rageAbility.name}" — +50% ATK, -20% DEF`);
addLog(`  ATK: ${ragnar.baseAtk} → ${ragnar.getAtk()}, DEF: ${ragnar.baseDef} → ${ragnar.getDef()}`);

// Ragnar attacks same goblin
const ragnarDmg = calculateDamage(ragnar, goblin);
const ragnarActual = goblin.takeDamage(ragnarDmg);
addLog(`${ragnar.name} атакує ${goblin.name}: ${ragnarActual} шкоди`);
addLog(`${goblin.name}: ${goblin.hp}/${goblin.maxHp} HP ${!goblin.alive ? '💀 МЕРТВИЙ' : ''}`);

// Elsa heals
const elsa = team[2];
elsa.takeDamage(30); // Simulate some damage first
addLog(`\n${elsa.name} отримала 30 шкоди: ${elsa.hp}/${elsa.maxHp} HP`);
const healed = elsa.heal(20);
addLog(`${elsa.name} лікує себе на ${healed}: ${elsa.hp}/${elsa.maxHp} HP`);

// Torin uses Taunt
const torin = team[1];
torin.useAbility('taunt');
applySelfEffects(torin.abilities[1], torin);
addLog(`\n${torin.name} використовує "Провокація" — вороги мусять атакувати його`);

// Enemy chooses target (should be Torin due to Taunt)
const skeleton = enemies[1];
const target = skeleton.chooseTarget(team);
addLog(`${skeleton.name} обирає ціль → ${target.name} ${target === torin ? '(Провокація працює!)' : ''}`);

// Show final state
addLog('');
renderUnits('Фінальний стан команди', team);
renderUnits('Фінальний стан ворогів', enemies);

addLog('\n✅ Фундамент працює! Класи Hero, Enemy, система бою — все ок.', 'success');
