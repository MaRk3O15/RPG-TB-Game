// Enemy class — an AI-controlled opponent
// Extends Unit with enemy-specific behavior

import { Unit } from './unit.js';

export class Enemy extends Unit {
  constructor(enemyData, tier = 'normal') {
    // Apply tier multipliers (normal / elite / boss)
    const multipliers = {
      normal: { hp: 1, atk: 1 },
      elite: { hp: 2, atk: 1.5 },
      boss: { hp: 4, atk: 2.5 },
    };

    const mult = multipliers[tier] || multipliers.normal;

    super({
      name: enemyData.name,
      hp: Math.round(enemyData.hp * mult.hp),
      atk: Math.round(enemyData.atk * mult.atk),
      def: enemyData.def,
      speed: enemyData.speed || 10,
      tags: enemyData.tags || [],
    });

    this.id = enemyData.id + '_' + Math.random().toString(36).slice(2, 6);
    this.tier = tier;

    // Special ability (elites and bosses may have one)
    this.specialAbility = enemyData.specialAbility || null;
    this.specialUsed = false; // Some specials can only be used once

    // Passive effects (like Dragon Scale)
    this.passive = enemyData.passive || null;
  }

  // --- AI: Choose a target to attack ---

  // Basic AI: pick a target from alive heroes
  chooseTarget(heroes) {
    const aliveHeroes = heroes.filter((h) => h.alive);
    if (aliveHeroes.length === 0) return null;

    // Check if any hero has Taunt active — must attack them
    const tauntedHero = aliveHeroes.find((h) =>
      h.effects.some((e) => e.name === 'Провокація')
    );
    if (tauntedHero) return tauntedHero;

    // Otherwise pick a random alive hero
    const index = Math.floor(Math.random() * aliveHeroes.length);
    return aliveHeroes[index];
  }

  // --- For display ---

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      tier: this.tier,
      hp: this.hp,
      maxHp: this.maxHp,
      atk: this.getAtk(),
      def: this.getDef(),
      alive: this.alive,
      effects: this.effects,
    };
  }
}
