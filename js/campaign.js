// Campaign data — levels, waves, enemy compositions
// Setting: zombie apocalypse

export const CAMPAIGN = [
  {
    id: 1,
    name: 'Покинуте місто',
    description: 'Вулиці заповнені зомбі. Потрібно пробитися через руїни міста до безпечної зони.',
    unlocked: true,
    waves: [
      { enemies: [{ id: 'zombie_runner' }, { id: 'zombie_runner' }] },
      { enemies: [{ id: 'zombie_runner' }, { id: 'zombie_shambler' }, { id: 'zombie_runner' }] },
      { enemies: [{ id: 'zombie_shambler' }, { id: 'zombie_spitter' }, { id: 'mutant_brute', tier: 'elite' }] },
    ],
  },
  {
    id: 2,
    name: 'Підземна лабораторія',
    description: 'Секретна лабораторія, де створювали вірус. Тут мутанти набагато небезпечніші.',
    unlocked: false,
    waves: [
      { enemies: [{ id: 'zombie_shambler' }, { id: 'zombie_shambler' }, { id: 'zombie_spitter' }] },
      { enemies: [{ id: 'zombie_spitter' }, { id: 'zombie_bloater' }, { id: 'zombie_runner' }, { id: 'zombie_runner' }] },
      { enemies: [{ id: 'zombie_bloater' }, { id: 'zombie_spitter' }, { id: 'hive_mind', tier: 'elite' }] },
    ],
  },
  {
    id: 3,
    name: 'Гніздо Альфи',
    description: 'Фінальне випробування. Зомбі-Альфа контролює всю орду з центру гнізда.',
    unlocked: false,
    waves: [
      { enemies: [{ id: 'zombie_bloater' }, { id: 'zombie_runner' }, { id: 'zombie_spitter' }] },
      { enemies: [{ id: 'zombie_spitter' }, { id: 'zombie_spitter' }, { id: 'mutant_brute' }, { id: 'zombie_bloater' }] },
      { enemies: [{ id: 'zombie_shambler' }, { id: 'hive_mind' }, { id: 'alpha_zombie', tier: 'boss' }] },
    ],
  },
];
