// An edge's third value is its required tide. The fourth is a one-way current.
export const phases = ['Ebb', 'Slack', 'Flood'];

export const charts = [
  {
    name: 'The Gloaming Shoals', subtitle: 'A first light for the outer harbor',
    budget: 7, par: 4, start: 0, goal: 4, lights: [3],
    nodes: [[125, 425, 'HOME'], [300, 360, 'BELL'], [460, 420, 'REEF'],
      [570, 225, 'LANTERN'], [775, 155, 'HARBOR'], [315, 150, 'NORTH']],
    edges: [[0, 1], [1, 2, 0], [2, 3], [3, 4, 0], [1, 5], [5, 3, 2]],
    land: `M0 0H270 Q250 55 185 76T75 130Q35 145 0 133Z
      M900 0H735Q715 36 744 76T815 110Q875 105 900 133Z
      M900 610H690Q705 555 760 535T900 490Z M0 610V505Q80 480 145 520T260 610Z`,
    landmark: 'village',
  },
  {
    name: 'The Narrows', subtitle: 'Two passages, one patient tide',
    budget: 9, par: 6, start: 0, goal: 6, lights: [3, 5],
    nodes: [[100, 350, 'HOME'], [240, 215, 'WEST'], [250, 450, 'LOWER'],
      [410, 140, 'LANTERN'], [440, 350, 'CROSSING'],
      [650, 445, 'LANTERN'], [790, 225, 'HARBOR']],
    edges: [[0, 1], [0, 2], [1, 3, 1], [3, 4], [2, 4, 1],
      [4, 5, 1], [5, 6], [4, 6, 0]],
    land: `M0 0H340Q315 45 270 75T180 125Q90 110 0 170Z
      M900 0H600Q610 65 680 95T790 115Q860 105 900 140Z
      M0 610V490Q80 470 120 520T220 610Z M900 610H700Q705 570 760 535T900 490Z
      M350 230Q390 200 430 225T510 220Q555 240 535 270T455 290Q390 275 350 290Q320 270 350 230Z`,
    landmark: 'fort',
  },
  {
    name: 'The Broken Crown', subtitle: 'A one-way current divides the islands',
    budget: 11, par: 9, start: 0, goal: 7, lights: [2, 5, 6],
    nodes: [[100, 470, 'HOME'], [235, 345, 'SOUTH'], [175, 150, 'LANTERN'],
      [390, 205, 'CROWN'], [430, 430, 'PASS'], [610, 130, 'LANTERN'],
      [650, 390, 'LANTERN'], [805, 250, 'HARBOR']],
    edges: [[0, 1], [1, 2, 1], [2, 3], [1, 4], [3, 4, 0],
      [3, 5, 0], [4, 6, 0], [5, 7, 2], [6, 7, 2], [5, 6, null, [6, 5]]],
    land: `M0 0H240Q230 45 180 65T80 100L0 130Z M900 0H735Q730 45 780 80T900 100Z
      M0 610V550Q100 510 160 555T240 610Z M900 610H690Q710 560 770 535T900 505Z
      M300 265Q330 235 365 255T390 300Q375 325 330 310T300 265Z
      M505 250Q535 220 570 245T590 295Q560 320 520 300T505 250Z`,
    landmark: 'ruins',
  },
  {
    name: 'The Afterlight Run', subtitle: 'One key, two lantern orders',
    budget: 10, par: 5, start: 0, goal: 6, lights: [2, 4], tideKey: true,
    nodes: [[105, 425, 'HOME'], [250, 320, 'FORK'], [350, 155, 'NORTH LIGHT'],
      [460, 350, 'STRAIT'], [615, 435, 'SOUTH LIGHT'], [650, 190, 'NEEDLE'],
      [790, 300, 'HARBOR']],
    edges: [[0, 1], [1, 2, 0], [1, 3], [2, 3, 0], [3, 4, 0],
      [3, 5, 2], [4, 5], [5, 6, 1], [4, 6, 1], [2, 5, null, [2, 5]]],
    land: `M0 0H310Q280 50 220 77T95 130L0 115Z
      M900 0H700Q720 45 780 85T900 125Z
      M0 610V500Q90 475 155 530T265 610Z
      M900 610H720Q730 550 795 520T900 485Z
      M500 240Q520 200 550 220T570 265Q540 285 500 260Z`,
    landmark: 'needle',
  },
];
