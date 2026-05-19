const fs = require('fs');

const items = JSON.parse(fs.readFileSync('src/lib/data/items.json', 'utf8'));
const enchantments = JSON.parse(fs.readFileSync('src/lib/data/enchantments.json', 'utf8'));
const attributes = JSON.parse(fs.readFileSync('src/lib/data/attributes.json', 'utf8'));
const sounds = JSON.parse(fs.readFileSync('src/lib/data/sounds.json', 'utf8'));
const blocks = JSON.parse(fs.readFileSync('src/lib/data/blocks.json', 'utf8'));
const effects = JSON.parse(fs.readFileSync('src/lib/data/effects.json', 'utf8'));

const materialOptions = items
  .filter(i => i.name !== 'air')
  .map(i => i.name)
  .sort();

const enchantmentOptions = enchantments
  .map(e => `minecraft:${e.name}`)
  .sort();

const attributeOptions = attributes
  .map(a => {
    let res = a.resource;
    if (res.startsWith('minecraft:generic.')) {
      return res.replace('minecraft:generic.', '');
    }
    if (res.startsWith('minecraft:')) {
      return res.replace('minecraft:', '');
    }
    return res;
  })
  .sort();

const soundOptions = sounds
  .map(s => `minecraft:${s.name}`)
  .sort();

const blockOptions = blocks
  .map(b => b.name)
  .sort();

const potionEffectOptions = effects
  .map(e => `minecraft:${e.name}`)
  .sort();

const trimPatternOptions = [
  'minecraft:bolt',
  'minecraft:coast',
  'minecraft:dune',
  'minecraft:eye',
  'minecraft:flow',
  'minecraft:host',
  'minecraft:raiser',
  'minecraft:rib',
  'minecraft:sentry',
  'minecraft:shaper',
  'minecraft:silence',
  'minecraft:snout',
  'minecraft:spire',
  'minecraft:tide',
  'minecraft:vex',
  'minecraft:ward',
  'minecraft:wayfinder',
  'minecraft:wild'
].sort();

const trimMaterialOptions = [
  'minecraft:amethyst',
  'minecraft:copper',
  'minecraft:diamond',
  'minecraft:emerald',
  'minecraft:gold',
  'minecraft:iron',
  'minecraft:lapis',
  'minecraft:netherite',
  'minecraft:quartz',
  'minecraft:redstone'
].sort();

const content = `// This file is auto-generated. Do not edit manually.

export const materialOptions = ${JSON.stringify(materialOptions, null, 2)};

export const enchantmentOptions = ${JSON.stringify(enchantmentOptions, null, 2)};

export const attributeOptions = ${JSON.stringify(attributeOptions, null, 2)};

export const soundOptions = ${JSON.stringify(soundOptions, null, 2)};

export const blockOptions = ${JSON.stringify(blockOptions, null, 2)};

export const potionEffectOptions = ${JSON.stringify(potionEffectOptions, null, 2)};

export const trimPatternOptions = ${JSON.stringify(trimPatternOptions, null, 2)};

export const trimMaterialOptions = ${JSON.stringify(trimMaterialOptions, null, 2)};
`;

fs.writeFileSync('src/lib/minecraftData.ts', content);
console.log('Generated src/lib/minecraftData.ts');
