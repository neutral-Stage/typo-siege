# TYPO SIEGE — Critical Fixes

Read all files in src/ and index.html. Fix these issues ONLY. Do not change game logic.

## Fix 1: Real English words instead of code keywords
Replace the word bank in src/words.ts with real English words. Organized by difficulty:
- Easy (3-4 letters): the, and, for, are, but, not, you, all, can, had, her, was, one, our, out, day, get, has, him, his, how, its, may, new, now, old, see, way, who, boy, did, big, cat, dog, run, eat, top, red, sun, car, sea, sky
- Medium (5-6 letters): about, after, again, below, could, every, first, found, great, house, large, learn, never, other, place, plant, point, right, small, sound, spell, still, study, their, there, these, thing, think, three, water, where, which, world, would, write, rapid, focus, blend, craft, shift, power, force
- Hard (7-8 letters): ability, balance, capture, dynamic, element, fashion, general, habitat, imagine, journey, kitchen, library, machine, natural, obscure, perfect, quality, reality, science, triumph, uniform, venture, weather, extreme, measure, network, organic, pattern, quantum, reflect
- Expert (9+ letters): absolute, beautiful, challenge, dangerous, elaborate, fantastic, gorgeous, hurricane, immediate, juggling, knowledge, landscape, marvelous, narrative, offensive, panoramic, questions, recording, structure, technique, ultimate, vibration, wanderlust, xylophone, yearning, zenmaster

## Fix 2: Words should be destroyable as soon as visible
In src/game.ts, make sure words can be targeted and typed as soon as they appear on canvas (y > 0 or even while still entering). The findTargetWord function should not skip words that are partially off-screen.

## Fix 3: Power-ups not working on click
The power-up buttons in index.html have no click handlers. In src/main.ts, add click event listeners to each power-up button element that call game.handleKey() with the corresponding key ('1','2','3','4'). Also make sure keyboard shortcuts 1/2/3/4 work.

## Fix 4: Better landing/menu screen
Update index.html overlay to show:
- Large title 'TYPO SIEGE' with a subtle gradient text effect
- Tagline: 'Type words. Charge towers. Defend the page.'
- Brief instructions: 'Type falling words to destroy them. Charge power-ups to unleash special attacks.'
- Power-up legend showing all 4 power-ups with icons and descriptions
- High score display
- Styled start button

After all fixes, run 'npx vite build' to verify it compiles with zero errors.
