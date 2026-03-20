// Character database — all playable heroes and their stats/abilities
// This is pure data, no logic here

export const CHARACTERS = {
  bjorn: {
    id: 'bjorn',
    name: 'Бйорн',
    title: 'Варвар',
    className: 'Нападник',
    tags: ['Варвар', 'Лідер', 'Нападник'],
    hp: 95,
    atk: 22,
    def: 8,
    abilities: [
      {
        id: 'axe_swing',
        name: 'Взмах сокири',
        description: 'Базова атака. 15% шанс накласти "Зменшення швидкості"',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [
          {
            name: 'Зменшення швидкості',
            type: 'debuff',
            stat: 'speed',
            value: -1,
            duration: 2,
            chance: 0.15,
          },
        ],
      },
      {
        id: 'for_valhalla',
        name: 'ЗА ВАЛХАЛУ!',
        description: 'Атака по всіх ворогах. 100% шанс "Шкода понаднормово" на 2 ходи',
        type: 'attack',
        target: 'enemy_all',
        damageMultiplier: 0.7,
        cooldown: 4,
        effects: [
          {
            name: 'Шкода понаднормово',
            type: 'debuff',
            stat: 'dot',
            value: 8,
            duration: 2,
            chance: 1.0,
          },
        ],
      },
    ],
    leaderSkill: {
      name: 'Хоробре серце',
      description: '+5% ATK та DEF усім. Додаткові +5% Варварам (після 2-го)',
      apply: (team) => {
        const passiveEffects = [];

        // Count barbarians in team
        const barbarianCount = team.filter((h) => h.hasTag('Варвар')).length;

        for (const hero of team) {
          // Base: +5% ATK and DEF to everyone
          passiveEffects.push({
            hero: hero,
            effects: [
              { name: 'Хоробре серце (ATK)', type: 'buff', stat: 'atk', value: 0.05, duration: 999 },
              { name: 'Хоробре серце (DEF)', type: 'buff', stat: 'def', value: 0.05, duration: 999 },
            ],
          });

          // Bonus: extra +5% per barbarian beyond the 2nd
          if (hero.hasTag('Варвар') && barbarianCount > 2) {
            const extraBonus = (barbarianCount - 2) * 0.05;
            passiveEffects.push({
              hero: hero,
              effects: [
                { name: 'Варварська сила (ATK)', type: 'buff', stat: 'atk', value: extraBonus, duration: 999 },
                { name: 'Варварська сила (DEF)', type: 'buff', stat: 'def', value: extraBonus, duration: 999 },
              ],
            });
          }
        }

        return passiveEffects;
      },
    },
  },

  elsa: {
    id: 'elsa',
    name: 'Ельза',
    title: 'Жриця',
    className: 'Лікар',
    tags: ['Жриця', 'Лідер', 'Лікар'],
    hp: 85,
    atk: 8,
    def: 10,
    abilities: [
      {
        id: 'sacred_touch',
        name: 'Священний дотик',
        description: 'Слабка атака + лікує союзника з найнижчим HP на 10',
        type: 'attack_heal',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        healAmount: 10,
        healTarget: 'ally_lowest_hp',
        cooldown: 0,
        effects: [],
      },
      {
        id: 'healing_prayer',
        name: 'Молитва зцілення',
        description: 'Лікує ВСІХ союзників на 20 HP',
        type: 'heal',
        target: 'ally_all',
        healAmount: 20,
        cooldown: 3,
        effects: [],
      },
      {
        id: 'resurrection',
        name: 'Воскресіння',
        description: 'Воскрешає полеглого союзника з 40% HP',
        type: 'revive',
        target: 'ally_dead',
        revivePercent: 0.4,
        cooldown: 6,
        effects: [],
      },
    ],
    leaderSkill: {
      name: 'Благословення богині',
      description: '+8% макс. HP усім. Найпоранеший союзник отримує 5 HP на початку ходу',
      apply: (team) => {
        const passiveEffects = [];

        for (const hero of team) {
          // +8% max HP
          const bonusHp = Math.round(hero.maxHp * 0.08);
          hero.maxHp += bonusHp;
          hero.hp += bonusHp;
        }

        return passiveEffects;
      },
      // This runs at the start of each team turn
      onTurnStart: (team) => {
        const aliveHeroes = team.filter((h) => h.alive);
        if (aliveHeroes.length === 0) return null;

        // Find most wounded hero (lowest HP percentage)
        let mostWounded = aliveHeroes[0];
        for (const hero of aliveHeroes) {
          if (hero.getHpPercent() < mostWounded.getHpPercent()) {
            mostWounded = hero;
          }
        }

        // Only heal if they are actually wounded
        if (mostWounded.hp < mostWounded.maxHp) {
          const healed = mostWounded.heal(5);
          return { hero: mostWounded, healed };
        }

        return null;
      },
    },
  },

  torin: {
    id: 'torin',
    name: 'Торін',
    title: 'Щитоносець',
    className: 'Танк',
    tags: ['Лицар', 'Лідер', 'Танк'],
    hp: 170,
    atk: 12,
    def: 20,
    abilities: [
      {
        id: 'shield_bash',
        name: 'Удар щитом',
        description: 'Базова атака по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [],
      },
      {
        id: 'taunt',
        name: 'Провокація',
        description: 'Усі вороги атакують тільки Торіна 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 3,
        effects: [
          {
            name: 'Провокація',
            type: 'buff',
            stat: 'taunt',
            value: 1,
            duration: 2,
            appliesTo: 'self',
          },
        ],
      },
      {
        id: 'iron_wall',
        name: 'Залізна стіна',
        description: '-50% вхідної шкоди на 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 4,
        effects: [
          {
            name: 'Залізна стіна',
            type: 'buff',
            stat: 'damageReduction',
            value: 0.5,
            duration: 2,
            appliesTo: 'self',
          },
        ],
      },
    ],
    leaderSkill: {
      name: 'Непохитна оборона',
      description: '+10% DEF усім. Кожен союзник 1 раз за бій виживає смертельний удар з 1 HP',
      apply: (team) => {
        const passiveEffects = [];

        for (const hero of team) {
          // +10% DEF
          passiveEffects.push({
            hero: hero,
            effects: [
              { name: 'Непохитна оборона', type: 'buff', stat: 'def', value: 0.10, duration: 999 },
            ],
          });

          // Mark that death save is available
          hero.deathSaveUsed = false;
        }

        return passiveEffects;
      },
      // This is checked when a hero would die
      onDeathCheck: (hero) => {
        if (!hero.deathSaveUsed) {
          hero.deathSaveUsed = true;
          hero.hp = 1;
          hero.alive = true;
          return true; // Saved from death!
        }
        return false;
      },
    },
  },

  linara: {
    id: 'linara',
    name: 'Лінара',
    title: 'Чарівниця',
    className: 'Підтримка',
    tags: ['Маг', 'Лідер', 'Підтримка'],
    hp: 78,
    atk: 10,
    def: 6,
    abilities: [
      {
        id: 'magic_missile',
        name: 'Магічний снаряд',
        description: 'Базова атака по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [],
      },
      {
        id: 'inspire',
        name: 'Натхнення',
        description: '+30% атаки союзнику на 3 ходи',
        type: 'buff',
        target: 'ally_single',
        cooldown: 2,
        effects: [
          {
            name: 'Натхнення',
            type: 'buff',
            stat: 'atk',
            value: 0.3,
            duration: 3,
          },
        ],
      },
      {
        id: 'purify',
        name: 'Очищення',
        description: 'Знімає всі дебаффи з союзника',
        type: 'cleanse',
        target: 'ally_single',
        cooldown: 3,
        effects: [],
      },
      {
        id: 'magic_shield',
        name: 'Чарівний щит',
        description: '-30% вхідної шкоди союзнику на 2 ходи',
        type: 'buff',
        target: 'ally_single',
        cooldown: 3,
        effects: [
          {
            name: 'Чарівний щит',
            type: 'buff',
            stat: 'damageReduction',
            value: 0.3,
            duration: 2,
          },
        ],
      },
    ],
    leaderSkill: {
      name: 'Аркана потік',
      description: '+10% ATK усім. Cooldown здібностей -1',
      apply: (team) => {
        const passiveEffects = [];

        for (const hero of team) {
          // +10% ATK
          passiveEffects.push({
            hero: hero,
            effects: [
              { name: 'Аркана потік', type: 'buff', stat: 'atk', value: 0.10, duration: 999 },
            ],
          });

          // Reduce all ability cooldowns by 1 (min 1)
          hero.reduceCooldowns(1);
        }

        return passiveEffects;
      },
    },
  },

  ragnar: {
    id: 'ragnar',
    name: 'Рагнар',
    title: 'Берсерк',
    className: 'Нападник',
    tags: ['Варвар', 'Нападник'],
    hp: 88,
    atk: 28,
    def: 5,
    abilities: [
      {
        id: 'mad_strike',
        name: 'Шалений удар',
        description: 'Потужна атака по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [],
      },
      {
        id: 'blood_whirlwind',
        name: 'Кривавий вихор',
        description: 'Атака по ВСІХ ворогах',
        type: 'attack',
        target: 'enemy_all',
        damageMultiplier: 0.6,
        cooldown: 3,
        effects: [],
      },
      {
        id: 'rage',
        name: 'Лють',
        description: '+50% ATK, але -20% DEF на 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 4,
        effects: [
          {
            name: 'Лють (ATK)',
            type: 'buff',
            stat: 'atk',
            value: 0.5,
            duration: 2,
            appliesTo: 'self',
          },
          {
            name: 'Лють (DEF)',
            type: 'debuff',
            stat: 'def',
            value: -0.2,
            duration: 2,
            appliesTo: 'self',
          },
        ],
      },
    ],
    leaderSkill: null, // No leader tag
  },
};

// Get all character IDs
export function getAllCharacterIds() {
  return Object.keys(CHARACTERS);
}

// Get character data by ID
export function getCharacter(id) {
  return CHARACTERS[id] || null;
}
