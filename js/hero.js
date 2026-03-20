// Hero class — a playable character controlled by the player
// Extends Unit with abilities, cooldowns, and leader skills

import { Unit } from './unit.js';

export class Hero extends Unit {
  constructor(characterData) {
    // Initialize base unit stats
    super({
      name: characterData.name,
      hp: characterData.hp,
      atk: characterData.atk,
      def: characterData.def,
      tags: characterData.tags,
    });

    // Character identity
    this.id = characterData.id;
    this.title = characterData.title;
    this.className = characterData.className;

    // Abilities — each hero has a list of abilities with cooldowns
    this.abilities = characterData.abilities.map((ability) => ({
      ...ability,
      currentCooldown: 0, // Ready to use at start
    }));

    // Leader skill (only activates if this hero is in slot 1)
    this.leaderSkill = characterData.leaderSkill || null;

    // Track if this hero has used their "save from death" (Torin's leader skill)
    this.deathSaveUsed = false;
  }

  // --- Abilities ---

  // Get list of abilities that are ready to use (cooldown = 0)
  getAvailableAbilities() {
    if (!this.alive) return [];

    return this.abilities.filter((ability) => ability.currentCooldown === 0);
  }

  // Use an ability: put it on cooldown
  useAbility(abilityId) {
    const ability = this.abilities.find((a) => a.id === abilityId);
    if (!ability) return null;
    if (ability.currentCooldown > 0) return null;

    // Set cooldown (basic attacks have cooldown: 0, so they stay ready)
    ability.currentCooldown = ability.cooldown;

    return ability;
  }

  // Reduce all cooldowns by 1 (called at end of each turn)
  tickCooldowns() {
    for (const ability of this.abilities) {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown -= 1;
      }
    }
  }

  // Reduce all cooldowns by a flat amount (for Linara's leader skill)
  reduceCooldowns(amount) {
    for (const ability of this.abilities) {
      if (ability.cooldown > 0) {
        ability.cooldown = Math.max(1, ability.cooldown - amount);
      }
    }
  }

  // Reset all cooldowns to 0 (for new battle)
  resetCooldowns() {
    for (const ability of this.abilities) {
      ability.currentCooldown = 0;
    }
  }

  // --- For display ---

  // Get short info about this hero
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      className: this.className,
      tags: this.tags,
      hp: this.hp,
      maxHp: this.maxHp,
      atk: this.getAtk(),
      def: this.getDef(),
      alive: this.alive,
      effects: this.effects,
      abilities: this.abilities,
    };
  }
}
