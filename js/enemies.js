// Enemy database — all enemy types with their stats

export const ENEMIES = {
  goblin: {
    id: 'goblin',
    name: 'Гоблін',
    hp: 35,
    atk: 10,
    def: 3,
    speed: 12,
    tags: ['Гоблін'],
    specialAbility: null,
    passive: null,
  },

  skeleton: {
    id: 'skeleton',
    name: 'Скелет-воїн',
    hp: 45,
    atk: 12,
    def: 5,
    speed: 8,
    tags: ['Нежить'],
    specialAbility: null,
    passive: null,
  },

  orc: {
    id: 'orc',
    name: 'Орк-громила',
    hp: 65,
    atk: 16,
    def: 8,
    speed: 5,
    tags: ['Орк'],
    specialAbility: null,
    passive: null,
  },

  dark_mage: {
    id: 'dark_mage',
    name: 'Темний маг',
    hp: 30,
    atk: 18,
    def: 2,
    speed: 9,
    tags: ['Маг'],
    specialAbility: null,
    // Ignores 50% of target's DEF
    passive: { name: 'Магічна атака', stat: 'defIgnore', value: 0.5 },
  },

  orc_chief: {
    id: 'orc_chief',
    name: 'Орк-вождь',
    hp: 65,
    atk: 16,
    def: 12,
    speed: 7,
    tags: ['Орк', 'Еліта'],
    specialAbility: {
      name: 'Бойовий клич',
      description: '+20% ATK всім ворогам на 2 ходи',
      type: 'buff_allies',
      cooldown: 4,
      currentCooldown: 0,
      effects: [
        { name: 'Бойовий клич', type: 'buff', stat: 'atk', value: 0.2, duration: 2 },
      ],
    },
    passive: null,
  },

  necromancer: {
    id: 'necromancer',
    name: 'Некромант',
    hp: 45,
    atk: 14,
    def: 6,
    speed: 9,
    tags: ['Нежить', 'Маг', 'Еліта'],
    specialAbility: {
      name: 'Воскресіння нежиті',
      description: 'Воскрешає одного полеглого ворога (раз за бій)',
      type: 'revive_ally',
      oncePerBattle: true,
    },
    passive: null,
  },

  dragon_lord: {
    id: 'dragon_lord',
    name: 'Драконолорд Ігніс',
    hp: 70,
    atk: 16,
    def: 15,
    speed: 8,
    tags: ['Дракон', 'Бос'],
    specialAbility: {
      name: 'Вогняне дихання',
      description: 'АоЕ атака по всій команді (70% від ATK)',
      type: 'attack_all',
      damageMultiplier: 0.7,
      cooldown: 3,
      currentCooldown: 0,
    },
    // Passively reduces incoming damage by 15%
    passive: { name: 'Чешуя дракона', stat: 'damageReduction', value: 0.15 },
  },
};

// Get enemy data by ID (returns a copy to avoid mutation)
export function getEnemyData(id) {
  const data = ENEMIES[id];
  if (!data) return null;
  return JSON.parse(JSON.stringify(data));
}
