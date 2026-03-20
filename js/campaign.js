// Campaign data — levels, waves, enemy compositions

export const CAMPAIGN = [
  {
    id: 1,
    name: 'Темний ліс',
    description: 'Команда вирушає через зачарований ліс, де їх чекають небезпечні створіння.',
    unlocked: true,
    waves: [
      { enemies: [{ id: 'goblin' }, { id: 'goblin' }] },
      { enemies: [{ id: 'goblin' }, { id: 'goblin' }, { id: 'skeleton' }] },
      { enemies: [{ id: 'skeleton' }, { id: 'skeleton' }, { id: 'orc_chief', tier: 'elite' }] },
    ],
  },
  {
    id: 2,
    name: 'Покинуті катакомби',
    description: 'Глибоко під землею ховається армія нежиті. Треба пробитися через катакомби.',
    unlocked: false,
    waves: [
      { enemies: [{ id: 'skeleton' }, { id: 'skeleton' }, { id: 'skeleton' }] },
      { enemies: [{ id: 'skeleton' }, { id: 'skeleton' }, { id: 'dark_mage' }, { id: 'orc' }] },
      { enemies: [{ id: 'orc' }, { id: 'dark_mage' }, { id: 'necromancer', tier: 'elite' }] },
    ],
  },
  {
    id: 3,
    name: 'Логово Дракона',
    description: 'Фінальне випробування. Драконолорд Ігніс чекає у серці вулкана.',
    unlocked: false,
    waves: [
      { enemies: [{ id: 'orc' }, { id: 'orc' }, { id: 'dark_mage' }] },
      { enemies: [{ id: 'dark_mage' }, { id: 'dark_mage' }, { id: 'orc' }, { id: 'orc' }] },
      { enemies: [{ id: 'skeleton' }, { id: 'dark_mage' }, { id: 'dragon_lord', tier: 'boss' }] },
    ],
  },
];
