// Character database — all playable heroes and their stats/abilities
// Setting: zombie apocalypse / modern era

export const CHARACTERS = {
  rex: {
    id: 'rex',
    name: 'Сержант Рекс',
    title: 'Командир',
    className: 'Танк',
    tags: ['Військовий', 'Лідер', 'Танк'],
    hp: 160,
    atk: 14,
    def: 18,
    speed: 7,
    abilities: [
      {
        id: 'machete_strike',
        name: 'Удар мачете',
        description: 'Базова атака по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [],
      },
      {
        id: 'cover_fire',
        name: 'Вогонь на прикриття',
        description: 'Усі вороги атакують тільки Рекса 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 3,
        effects: [
          {
            name: 'Вогонь на прикриття',
            type: 'buff',
            stat: 'taunt',
            value: 1,
            duration: 2,
            appliesTo: 'self',
          },
        ],
      },
      {
        id: 'fortify',
        name: 'Укріплення',
        description: '-50% вхідної шкоди на 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 4,
        effects: [
          {
            name: 'Укріплення',
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
      name: 'Бойовий дух',
      description: '+10% DEF усім. Кожен союзник 1 раз за бій виживає смертельний удар з 1 HP',
      apply: (team) => {
        const passiveEffects = [];

        for (const hero of team) {
          // +10% DEF
          passiveEffects.push({
            hero: hero,
            effects: [
              { name: 'Бойовий дух', type: 'buff', stat: 'def', value: 0.10, duration: 999 },
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

  lina: {
    id: 'lina',
    name: 'Док Ліна',
    title: 'Польовий медик',
    className: 'Медик',
    tags: ['Медик', 'Лідер', 'Підтримка'],
    hp: 90,
    atk: 8,
    def: 10,
    speed: 9,
    abilities: [
      {
        id: 'pistol_shot',
        name: 'Постріл з пістолета',
        description: 'Слабка атака + лікує союзника з найнижчим HP на 10',
        type: 'attack_heal',
        target: 'enemy_single',
        ranged: true,
        damageMultiplier: 1.0,
        healAmount: 10,
        healTarget: 'ally_lowest_hp',
        cooldown: 0,
        effects: [],
      },
      {
        id: 'first_aid',
        name: 'Перша допомога',
        description: 'Лікує ВСІХ союзників на 20 HP',
        type: 'heal',
        target: 'ally_all',
        healAmount: 20,
        cooldown: 3,
        effects: [],
      },
      {
        id: 'adrenaline',
        name: 'Адреналін',
        description: 'Воскрешає полеглого союзника з 40% HP',
        type: 'revive',
        target: 'ally_dead',
        revivePercent: 0.4,
        cooldown: 6,
        effects: [],
      },
    ],
    leaderSkill: {
      name: 'Польовий госпіталь',
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

  shadow: {
    id: 'shadow',
    name: 'Шедоу',
    title: 'Снайпер',
    className: 'Нападник',
    tags: ['Стрілець', 'Нападник'],
    hp: 75,
    atk: 26,
    def: 5,
    speed: 13,
    abilities: [
      {
        id: 'sniper_shot',
        name: 'Снайперський постріл',
        description: 'Точний постріл по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        ranged: true,
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [],
      },
      {
        id: 'headshot',
        name: 'Хедшот',
        description: 'Потужний постріл x1.8 шкоди по одному ворогу',
        type: 'attack',
        target: 'enemy_single',
        ranged: true,
        damageMultiplier: 1.8,
        cooldown: 3,
        effects: [],
      },
      {
        id: 'poison_rounds',
        name: 'Отруйні кулі',
        description: 'Атака + отрута на 3 ходи (8 шкоди/хід)',
        type: 'attack',
        target: 'enemy_single',
        ranged: true,
        damageMultiplier: 0.8,
        cooldown: 3,
        effects: [
          {
            name: 'Отрута',
            type: 'debuff',
            stat: 'dot',
            value: 8,
            duration: 3,
            chance: 1.0,
          },
        ],
      },
    ],
    leaderSkill: null, // No leader tag
  },

  bulldozer: {
    id: 'bulldozer',
    name: 'Бульдозер',
    title: 'Штурмовик',
    className: 'Нападник',
    tags: ['Військовий', 'Нападник'],
    hp: 100,
    atk: 22,
    def: 8,
    speed: 10,
    abilities: [
      {
        id: 'shotgun_blast',
        name: 'Постріл з дробовика',
        description: 'Базова атака по одному ворогу. 15% шанс сповільнити',
        type: 'attack',
        target: 'enemy_single',
        ranged: true,
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [
          {
            name: 'Контузія',
            type: 'debuff',
            stat: 'speed',
            value: -1,
            duration: 2,
            chance: 0.15,
          },
        ],
      },
      {
        id: 'frag_grenade',
        name: 'Осколкова граната',
        description: 'Атака по ВСІХ ворогах + шкода понаднормово 2 ходи',
        type: 'attack',
        target: 'enemy_all',
        ranged: true,
        damageMultiplier: 0.7,
        cooldown: 4,
        effects: [
          {
            name: 'Осколки',
            type: 'debuff',
            stat: 'dot',
            value: 8,
            duration: 2,
            chance: 1.0,
          },
        ],
      },
      {
        id: 'battle_rage',
        name: 'Бойова лють',
        description: '+50% ATK, але -20% DEF на 2 ходи',
        type: 'self_buff',
        target: 'self',
        cooldown: 4,
        effects: [
          {
            name: 'Бойова лють (ATK)',
            type: 'buff',
            stat: 'atk',
            value: 0.5,
            duration: 2,
            appliesTo: 'self',
          },
          {
            name: 'Бойова лють (DEF)',
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

  spark: {
    id: 'spark',
    name: 'Спарк',
    title: 'Інженер',
    className: 'Підтримка',
    tags: ['Технік', 'Підтримка'],
    hp: 80,
    atk: 10,
    def: 7,
    speed: 11,
    abilities: [
      {
        id: 'taser',
        name: 'Електрошокер',
        description: 'Базова атака по одному ворогу. 30% шанс оглушити на 1 хід',
        type: 'attack',
        target: 'enemy_single',
        damageMultiplier: 1.0,
        cooldown: 0,
        effects: [
          {
            name: 'Оглушення',
            type: 'debuff',
            stat: 'stun',
            value: 1,
            duration: 1,
            chance: 0.30,
          },
        ],
      },
      {
        id: 'stim_pack',
        name: 'Стимулятор',
        description: '+30% атаки союзнику на 3 ходи',
        type: 'buff',
        target: 'ally_single',
        cooldown: 2,
        effects: [
          {
            name: 'Стимулятор',
            type: 'buff',
            stat: 'atk',
            value: 0.3,
            duration: 3,
          },
        ],
      },
      {
        id: 'emp_pulse',
        name: 'Очищення',
        description: 'Знімає всі дебаффи з союзника',
        type: 'cleanse',
        target: 'ally_single',
        cooldown: 3,
        effects: [],
      },
      {
        id: 'armor_boost',
        name: 'Бронежилет',
        description: '-30% вхідної шкоди союзнику на 2 ходи',
        type: 'buff',
        target: 'ally_single',
        cooldown: 3,
        effects: [
          {
            name: 'Бронежилет',
            type: 'buff',
            stat: 'damageReduction',
            value: 0.3,
            duration: 2,
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
