// Combat logic — damage calculation, applying abilities

// Calculate damage from attacker to target
export function calculateDamage(attacker, target, damageMultiplier = 1.0) {
  const atk = attacker.getAtk();

  // Check if attacker has passive that ignores DEF
  let defIgnore = 0;
  if (attacker.passive && attacker.passive.stat === 'defIgnore') {
    defIgnore = attacker.passive.value;
  }

  // Target's effective DEF (reduced by armor break etc.)
  const targetDef = target.getDef() * (1 - defIgnore);

  // Base damage = ATK * multiplier - DEF
  let damage = Math.round(atk * damageMultiplier) - targetDef;

  // Apply damage reduction buffs (shield, iron wall, dragon scale)
  const reduction = target.getDamageReduction();
  damage = Math.round(damage * (1 - reduction));

  // Also check target passive damage reduction
  if (target.passive && target.passive.stat === 'damageReduction') {
    damage = Math.round(damage * (1 - target.passive.value));
  }

  // Minimum 1 damage
  return Math.max(1, damage);
}

// Apply an ability's effects to a target (buffs/debuffs with chance)
export function applyAbilityEffects(ability, target, source) {
  const appliedEffects = [];

  for (const effectData of ability.effects) {
    // Check chance
    const roll = Math.random();
    if (roll > effectData.chance) continue;

    const effect = {
      name: effectData.name,
      type: effectData.type,
      stat: effectData.stat,
      value: effectData.value,
      duration: effectData.duration,
      source: source.name,
    };

    target.addEffect(effect);
    appliedEffects.push(effect);
  }

  return appliedEffects;
}

// Apply self-buff effects (like Taunt, Iron Wall, Rage)
export function applySelfEffects(ability, hero) {
  const appliedEffects = [];

  for (const effectData of ability.effects) {
    const effect = {
      name: effectData.name,
      type: effectData.type,
      stat: effectData.stat,
      value: effectData.value,
      duration: effectData.duration,
      source: hero.name,
    };

    hero.addEffect(effect);
    appliedEffects.push(effect);
  }

  return appliedEffects;
}
