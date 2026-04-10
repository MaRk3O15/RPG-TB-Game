// Enemy database — zombies, mutants and abominations

export const ENEMIES = {
  zombie_runner: {
    id: 'zombie_runner',
    name: 'Зомбі-бігун',
    hp: 30,
    atk: 10,
    def: 2,
    speed: 14,
    tags: ['Зомбі'],
    specialAbility: null,
    passive: null,
  },

  zombie_shambler: {
    id: 'zombie_shambler',
    name: 'Зомбі-повзун',
    hp: 50,
    atk: 12,
    def: 5,
    speed: 5,
    tags: ['Зомбі'],
    specialAbility: null,
    passive: null,
  },

  zombie_spitter: {
    id: 'zombie_spitter',
    name: 'Зомбі-плювач',
    hp: 35,
    atk: 16,
    def: 3,
    speed: 9,
    tags: ['Зомбі', 'Мутант'],
    specialAbility: null,
    // Ignores 50% of target's DEF (acid spit)
    passive: { name: 'Кислотний плювок', stat: 'defIgnore', value: 0.5 },
  },

  zombie_bloater: {
    id: 'zombie_bloater',
    name: 'Зомбі-товстун',
    hp: 70,
    atk: 8,
    def: 10,
    speed: 4,
    tags: ['Зомбі'],
    specialAbility: {
      name: 'Токсичний вибух',
      description: 'АоЕ атака по всій команді (60% від ATK)',
      type: 'attack_all',
      damageMultiplier: 0.6,
      cooldown: 4,
      currentCooldown: 0,
    },
    passive: null,
  },

  mutant_brute: {
    id: 'mutant_brute',
    name: 'Мутант-танк',
    hp: 80,
    atk: 18,
    def: 12,
    speed: 6,
    tags: ['Мутант', 'Еліта'],
    specialAbility: {
      name: 'Лють орди',
      description: '+20% ATK всім ворогам на 2 ходи',
      type: 'buff_allies',
      cooldown: 4,
      currentCooldown: 0,
      effects: [
        { name: 'Лють орди', type: 'buff', stat: 'atk', value: 0.2, duration: 2 },
      ],
    },
    passive: null,
  },

  hive_mind: {
    id: 'hive_mind',
    name: 'Контролер',
    hp: 50,
    atk: 14,
    def: 6,
    speed: 10,
    tags: ['Мутант', 'Еліта'],
    specialAbility: {
      name: 'Команда орди',
      description: 'Атакує ціль, накладає дебафф -30% ATK на 2 ходи. Всі союзники-вороги атакують ту ж ціль на 60% шкоди',
      type: 'attack_and_horde',
      damageMultiplier: 1.0,
      cooldown: 3,
      currentCooldown: 0,
      effects: [
        { name: 'Контроль розуму', type: 'debuff', stat: 'atk', value: -0.3, duration: 2 },
      ],
    },
    passive: null,
  },

  alpha_zombie: {
    id: 'alpha_zombie',
    name: 'Зомбі-Альфа',
    hp: 90,
    atk: 20,
    def: 15,
    speed: 8,
    tags: ['Мутант', 'Бос'],
    specialAbility: {
      name: 'Смертельний ривок',
      description: 'АоЕ атака по всій команді (70% від ATK)',
      type: 'attack_all',
      damageMultiplier: 0.7,
      cooldown: 3,
      currentCooldown: 0,
    },
    // Passively reduces incoming damage by 15%
    passive: { name: 'Мутована шкіра', stat: 'damageReduction', value: 0.15 },
  },

  armored_zombie: {
    id: 'armored_zombie',
    name: 'Броньований Зомбі',
    hp: 130,
    atk: 13,
    def: 22,
    speed: 3,
    tags: ['Зомбі', 'Броньований'],
    specialAbility: null,
    // Takes 50% less damage from ranged attacks
    passive: { name: 'Бронеплити', stat: 'rangedDamageReduction', value: 0.5 },
  },

  assimilated_officer: {
    id: 'assimilated_officer',
    name: 'Асимільований Офіцер',
    hp: 70,
    atk: 15,
    def: 10,
    speed: 9,
    tags: ['Асимільований', 'Офіцер', 'Еліта'],
    specialAbility: {
      name: 'Командування',
      description: 'Зомбі: +2 швидкості та +20% крит на 2 ходи. Морпіхи: -20% вхідної шкоди та 10 HP регенерації/хід на 3 ходи',
      type: 'buff_faction',
      cooldown: 3,
      currentCooldown: 0,
      zombieEffects: [
        { name: 'Прискорення', type: 'buff', stat: 'speed', value: 2, duration: 2 },
        { name: 'Бойовий крит', type: 'buff', stat: 'crit', value: 0.2, duration: 2 },
      ],
      marineEffects: [
        { name: 'Захисний бриф', type: 'buff', stat: 'damageReduction', value: 0.2, duration: 2 },
        { name: 'Регенерація', type: 'buff', stat: 'regen', value: 10, duration: 3 },
      ],
    },
    // When attacked, 1-2 random alive Assimilated Marines counterattack the attacker
    passive: { name: 'Захист Орди', stat: 'counterattack_marines', marineTag: 'Морпіх' },
  },

  assimilated_marine: {
    id: 'assimilated_marine',
    name: 'Асимільований Морпіх',
    hp: 100,
    atk: 24,
    def: 16,
    speed: 10,
    tags: ['Асимільований', 'Морпіх', 'Еліта'],
    specialAbility: {
      name: 'Масивний удар',
      description: 'Нищівний удар — x1.7 шкоди по одній цілі',
      type: 'attack_single',
      damageMultiplier: 1.7,
      cooldown: 3,
      currentCooldown: 0,
    },
    passive: null,
  },
};

// Get enemy data by ID (returns a copy to avoid mutation)
export function getEnemyData(id) {
  const data = ENEMIES[id];
  if (!data) return null;
  return JSON.parse(JSON.stringify(data));
}
