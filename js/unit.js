// Base class for all combat units (heroes and enemies)
// A "unit" is anything that can fight: attack, take damage, or die

export class Unit {
  constructor({ name, hp, atk, def, speed = 10, tags = [] }) {
    this.name = name;

    // Stats
    this.maxHp = hp;
    this.hp = hp;
    this.baseAtk = atk;
    this.baseDef = def;
    this.speed = speed;

    // Turn gauge (0-100). When it reaches 100, this unit can act
    this.turnGauge = 0;

    // Tags for synergy system (e.g., "Barbarian", "Leader", "Attacker")
    this.tags = tags;

    // Active buffs and debuffs on this unit
    // Each effect: { name, type: "buff"/"debuff", stat, value, duration }
    this.effects = [];

    // Is this unit alive?
    this.alive = true;
  }

  // --- HP Management ---

  // Deal damage to this unit (after defense calculation)
  takeDamage(amount) {
    if (!this.alive) return 0;

    // Damage cannot be less than 1
    const finalDamage = Math.max(1, Math.round(amount));
    this.hp -= finalDamage;

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }

    return finalDamage;
  }

  // Heal this unit
  heal(amount) {
    if (!this.alive) return 0;

    const before = this.hp;
    this.hp = Math.min(this.hp + amount, this.maxHp);

    // Return actual amount healed
    return this.hp - before;
  }

  // Revive a dead unit with a percentage of max HP
  revive(hpPercent) {
    if (this.alive) return 0;

    this.alive = true;
    this.hp = Math.round(this.maxHp * hpPercent);
    this.effects = [];

    return this.hp;
  }

  // --- Stats with Effects ---

  // Get current ATK (base + buffs/debuffs)
  getAtk() {
    let multiplier = 1;

    for (const effect of this.effects) {
      if (effect.stat === 'atk') {
        multiplier += effect.value;
      }
    }

    return Math.round(this.baseAtk * multiplier);
  }

  // Get current DEF (base + buffs/debuffs)
  getDef() {
    let multiplier = 1;

    for (const effect of this.effects) {
      if (effect.stat === 'def') {
        multiplier += effect.value;
      }
    }

    return Math.round(this.baseDef * multiplier);
  }

  // Get damage reduction multiplier from shield-type effects
  getDamageReduction() {
    let reduction = 0;

    for (const effect of this.effects) {
      if (effect.stat === 'damageReduction') {
        reduction += effect.value;
      }
    }

    // Cap at 80% reduction so damage is never fully blocked
    return Math.min(reduction, 0.8);
  }

  // --- Effects (Buffs & Debuffs) ---

  // Add a buff or debuff to this unit
  addEffect(effect) {
    // Check if this effect already exists — refresh duration instead of stacking
    const existing = this.effects.find(
      (e) => e.name === effect.name && e.source === effect.source
    );

    if (existing) {
      existing.duration = effect.duration;
      return;
    }

    this.effects.push({ ...effect });
  }

  // Remove a specific effect by name
  removeEffect(name) {
    this.effects = this.effects.filter((e) => e.name !== name);
  }

  // Remove all effects of a specific type ("buff" or "debuff")
  removeEffectsByType(type) {
    this.effects = this.effects.filter((e) => e.type !== type);
  }

  // Remove ALL effects (used between waves)
  clearAllEffects() {
    this.effects = [];
  }

  // Tick all effects: reduce duration by 1, remove expired ones
  // Returns list of expired effect names
  tickEffects() {
    const expired = [];

    this.effects = this.effects.filter((effect) => {
      effect.duration -= 1;
      if (effect.duration <= 0) {
        expired.push(effect.name);
        return false;
      }
      return true;
    });

    return expired;
  }

  // Process damage-over-time effects (like Poison)
  // Returns total DoT damage taken
  processDoTEffects() {
    let totalDamage = 0;

    for (const effect of this.effects) {
      if (effect.stat === 'dot') {
        const dmg = this.takeDamage(effect.value);
        totalDamage += dmg;
      }
    }

    return totalDamage;
  }

  // --- Tags ---

  // Check if this unit has a specific tag
  hasTag(tag) {
    return this.tags.includes(tag);
  }

  // --- Info ---

  // Check if this unit is stunned (skips their turn)
  isStunned() {
    return this.effects.some((e) => e.stat === 'stun');
  }

  // Get effective speed (affected by debuffs)
  getSpeed() {
    let speed = this.speed;
    for (const effect of this.effects) {
      if (effect.stat === 'speed') {
        speed += effect.value;
      }
    }
    return Math.max(1, speed);
  }

  // Get HP as percentage (for HP bars)
  getHpPercent() {
    return Math.round((this.hp / this.maxHp) * 100);
  }

  // Get a summary string for debugging
  toString() {
    const status = this.alive ? `${this.hp}/${this.maxHp} HP` : 'DEAD';
    return `${this.name} [${status}] ATK:${this.getAtk()} DEF:${this.getDef()}`;
  }
}
