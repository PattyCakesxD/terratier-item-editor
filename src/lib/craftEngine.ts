import YAML from "yaml";

export type TextStyle = {
  color: string;
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
  resetItalic: boolean;
};

export type LoreLine = {
  id: string;
  text: string;
  style: TextStyle;
};

export type EnchantmentEntry = {
  id: string;
  enchantment: string;
  level: number;
};

export type AttributeEntry = {
  id: string;
  type: string;
  amount: number;
  operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
  slot: string;
  display: string;
  customId: string;
};

export type ComponentEntry = {
  id: string;
  component: string;
  value: string;
};

export type TerratierAttributeEntry = {
  id: string;
  attribute: string;
  value: number;
};

export type RepairMode = "default" | "simple" | "detailed";
export type BehaviorType =
  | "none"
  | "block_item"
  | "furniture_item"
  | "ground_block_item"
  | "wall_block_item"
  | "ceiling_block_item"
  | "range_mining_item"
  | "compostable_item";

export type CraftRemainderMode =
  | "none"
  | "fixed"
  | "hurt_and_break"
  | "recipe_based";

export type ItemState = {
  namespace: string;
  itemId: string;
  magicUi: boolean;
  material: string;
  customModelData: number;
  itemModel: string;
  category: string;
  oversizedInGui: boolean;
  handAnimationOnSwap: boolean;
  swapAnimationScale: number;
  itemName: string;
  customNameEnabled: boolean;
  customName: string;
  nameStyle: TextStyle;
  lore: LoreLine[];
  unbreakable: boolean;
  enchantments: EnchantmentEntry[];
  enchantmentMerge: boolean;
  hideTooltip: string[];
  dyedColor: string;
  dataCustomModelData: number;
  dataItemModel: string;
  tooltipStyle: string;
  maxDamage: number;
  jukeboxPlayable: string;
  useRemainder: string;
  profile: string;
  removeComponents: string[];
  blockState: string;
  trimEnabled: boolean;
  trimPattern: string;
  trimMaterial: string;
  equippableEnabled: boolean;
  equipmentSlot: string;
  equipmentAssetId: string;
  equipmentCameraOverlay: string;
  equipmentDispensable: boolean;
  equipmentDamageOnHurt: boolean;
  equipmentSwappable: boolean;
  equipmentEquipOnInteract: boolean;
  foodEnabled: boolean;
  foodNutrition: number;
  foodSaturation: number;
  foodAlwaysEat: boolean;
  attributes: AttributeEntry[];
  components: ComponentEntry[];
  fuelTime: number;
  tags: string[];
  repairMode: RepairMode;
  repairable: boolean;
  repairCraftingTable: boolean;
  repairAnvilRepair: boolean;
  repairAnvilCombine: boolean;
  renameable: boolean;
  dyeable: boolean;
  settingsFoodEnabled: boolean;
  settingsFoodNutrition: number;
  settingsFoodSaturation: number;
  consumeReplacement: string;
  craftRemainderMode: CraftRemainderMode;
  craftRemainderItem: string;
  craftRemainderDamage: number;
  fuelRemainder: string;
  invulnerable: string[];
  enchantable: boolean;
  compostProbability: number;
  respectRepairableComponent: boolean;
  dyeColor: string;
  fireworkColor: string;
  ingredientSubstitute: string[];
  hatHeight: number;
  keepOnDeathChance: number;
  destroyOnDeathChance: number;
  dropDisplayMode: "default" | "false" | "true" | "custom";
  dropDisplayText: string;
  glowColor: string;
  settingsEquipmentEnabled: boolean;
  settingsEquipmentAssetId: string;
  settingsEquipmentSlot: string;
  projectileEnabled: boolean;
  projectileItem: string;
  projectileScale: number;
  projectileThrowSound: string;
  projectileHitEntitySound: string;
  projectileHitBlockSound: string;
  terratierAttributes: TerratierAttributeEntry[];
  behaviorType: BehaviorType;
  behaviorBlock: string;
  behaviorRadius: number;
};

export type MiniSegment = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
};

export function toRoman(value: number) {
  if (!Number.isFinite(value) || value <= 0) return String(value || 1);
  if (value > 10) return String(value);
  return (
    ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][value] ??
    String(value)
  );
}

export function formatMinecraftName(value: string) {
  const minorWords = new Set(["of", "the", "and", "in"]);
  return value
    .replace(/^minecraft:/, "")
    .split("_")
    .map((word, index) =>
      index > 0 && minorWords.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function formatSlotName(value: string) {
  const slotNames: Record<string, string> = {
    mainhand: "Main Hand",
    offhand: "Off Hand",
    head: "Head",
    chest: "Chest",
    legs: "Legs",
    feet: "Feet",
    hand: "Hand",
    armor: "Armor",
    body: "Body",
    saddle: "Saddle",
    any: "Any Slot",
  };
  return slotNames[value] ?? formatMinecraftName(value);
}

export function formatAttributeAmount(value: number, operation: string) {
  const isPercent =
    operation === "add_multiplied_base" || operation === "add_multiplied_total";
  const displayValue = isPercent ? value * 100 : value;
  const sign = displayValue > 0 ? "+" : "";
  const formattedNumber = Number.isInteger(displayValue)
    ? displayValue
    : displayValue.toFixed(2);
  return `${sign}${formattedNumber}${isPercent ? "%" : ""}`;
}

export function groupAttributesBySlot(attributes: AttributeEntry[]) {
  return attributes.reduce<Record<string, AttributeEntry[]>>(
    (groups, attribute) => {
      const slot = attribute.slot || "any";
      groups[slot] = [...(groups[slot] ?? []), attribute];
      return groups;
    },
    {},
  );
}

export const minecraftColors: Record<string, string> = {
  black: "#000000",
  dark_blue: "#0000aa",
  dark_green: "#00aa00",
  dark_aqua: "#00aaaa",
  dark_red: "#aa0000",
  dark_purple: "#aa00aa",
  gold: "#ffaa00",
  gray: "#aaaaaa",
  dark_gray: "#555555",
  blue: "#5555ff",
  green: "#55ff55",
  aqua: "#55ffff",
  red: "#ff5555",
  light_purple: "#ff55ff",
  yellow: "#ffff55",
  white: "#ffffff",
};

const legacyColorCodes: Record<string, string> = {
  "0": "black",
  "1": "dark_blue",
  "2": "dark_green",
  "3": "dark_aqua",
  "4": "dark_red",
  "5": "dark_purple",
  "6": "gold",
  "7": "gray",
  "8": "dark_gray",
  "9": "blue",
  a: "green",
  b: "aqua",
  c: "red",
  d: "light_purple",
  e: "yellow",
  f: "white",
};

const legacyFormatCodes: Record<string, string> = {
  k: "obfuscated",
  l: "bold",
  m: "strikethrough",
  n: "underlined",
  o: "italic",
  r: "reset",
};

export const materialOptions = [
  "paper",
  "stick",
  "wooden_sword",
  "stone_sword",
  "iron_sword",
  "golden_sword",
  "diamond_sword",
  "netherite_sword",
  "wooden_pickaxe",
  "golden_pickaxe",
  "diamond_pickaxe",
  "netherite_pickaxe",
  "golden_axe",
  "bow",
  "crossbow",
  "shield",
  "trident",
  "fishing_rod",
  "elytra",
  "leather_chestplate",
  "diamond_chestplate",
  "apple",
  "bread",
  "firework_rocket",
  "goat_horn",
  "player_head",
  "note_block",
  "mushroom_stem",
  "oak_sapling",
  "leather",
  "bundle",
];

export const enchantmentOptions = [
  "minecraft:sharpness",
  "minecraft:smite",
  "minecraft:bane_of_arthropods",
  "minecraft:knockback",
  "minecraft:fire_aspect",
  "minecraft:looting",
  "minecraft:sweeping_edge",
  "minecraft:efficiency",
  "minecraft:silk_touch",
  "minecraft:unbreaking",
  "minecraft:fortune",
  "minecraft:power",
  "minecraft:punch",
  "minecraft:flame",
  "minecraft:infinity",
  "minecraft:mending",
  "minecraft:protection",
  "minecraft:feather_falling",
  "minecraft:respiration",
  "minecraft:aqua_affinity",
  "minecraft:depth_strider",
  "minecraft:frost_walker",
  "minecraft:soul_speed",
  "minecraft:swift_sneak",
];

export const attributeOptions = [
  "armor",
  "armor_toughness",
  "attack_damage",
  "attack_knockback",
  "attack_speed",
  "block_break_speed",
  "burning_time",
  "entity_interaction_range",
  "fall_damage_multiplier",
  "flying_speed",
  "follow_range",
  "gravity",
  "jump_strength",
  "knockback_resistance",
  "luck",
  "max_absorption",
  "max_health",
  "mining_efficiency",
  "movement_efficiency",
  "movement_speed",
  "oxygen_bonus",
  "safe_fall_distance",
  "scale",
  "sneaking_speed",
  "step_height",
  "submerged_mining_speed",
  "sweeping_damage_ratio",
  "water_movement_efficiency",
];

export const terratierAttributeOptions = [
  "mining_speed",
  "mining_speed_multiplier",
];

export const slotOptions = [
  "any",
  "hand",
  "armor",
  "mainhand",
  "offhand",
  "head",
  "chest",
  "legs",
  "feet",
  "body",
  "saddle",
];

export const hideTooltipOptions = [
  "dyed_color",
  "enchantments",
  "attribute_modifiers",
  "unbreakable",
  "can_break",
  "can_place_on",
  "trim",
  "stored_enchantments",
];

export const invulnerableOptions = [
  "lava",
  "fire",
  "fire_tick",
  "block_explosion",
  "entity_explosion",
  "lightning",
  "contact",
];

export const glowColorOptions = Object.keys(minecraftColors);

export const blankStyle = (): TextStyle => ({
  color: "#ffcc66",
  bold: false,
  italic: false,
  underlined: false,
  strikethrough: false,
  obfuscated: false,
  resetItalic: true,
});

export const createInitialState = (): ItemState => ({
  namespace: "terratier",
  itemId: "",
  magicUi: true,
  material: "paper",
  customModelData: 0,
  itemModel: "",
  category: "",
  oversizedInGui: false,
  handAnimationOnSwap: true,
  swapAnimationScale: 1,
  itemName: "",
  customNameEnabled: false,
  customName: "",
  nameStyle: blankStyle(),
  lore: [
    {
      id: "lore-initial",
      text: "",
      style: blankStyle(),
    },
  ],
  unbreakable: false,
  enchantments: [],
  enchantmentMerge: false,
  hideTooltip: [],
  dyedColor: "",
  dataCustomModelData: 0,
  dataItemModel: "",
  tooltipStyle: "",
  maxDamage: 0,
  jukeboxPlayable: "",
  useRemainder: "",
  profile: "",
  removeComponents: [],
  blockState: "",
  trimEnabled: false,
  trimPattern: "",
  trimMaterial: "",
  equippableEnabled: false,
  equipmentSlot: "head",
  equipmentAssetId: "",
  equipmentCameraOverlay: "",
  equipmentDispensable: true,
  equipmentDamageOnHurt: true,
  equipmentSwappable: true,
  equipmentEquipOnInteract: false,
  foodEnabled: false,
  foodNutrition: 0,
  foodSaturation: 0,
  foodAlwaysEat: false,
  attributes: [],
  components: [],
  fuelTime: 0,
  tags: [],
  repairMode: "default",
  repairable: true,
  repairCraftingTable: true,
  repairAnvilRepair: true,
  repairAnvilCombine: true,
  renameable: true,
  dyeable: false,
  settingsFoodEnabled: false,
  settingsFoodNutrition: 0,
  settingsFoodSaturation: 0,
  consumeReplacement: "",
  craftRemainderMode: "none",
  craftRemainderItem: "",
  craftRemainderDamage: 1,
  fuelRemainder: "",
  invulnerable: [],
  enchantable: true,
  compostProbability: 0,
  respectRepairableComponent: false,
  dyeColor: "",
  fireworkColor: "",
  ingredientSubstitute: [],
  hatHeight: 0,
  keepOnDeathChance: 0,
  destroyOnDeathChance: 0,
  dropDisplayMode: "default",
  dropDisplayText: "",
  glowColor: "",
  settingsEquipmentEnabled: false,
  settingsEquipmentAssetId: "",
  settingsEquipmentSlot: "head",
  projectileEnabled: false,
  projectileItem: "",
  projectileScale: 0.5,
  projectileThrowSound: "",
  projectileHitEntitySound: "",
  projectileHitBlockSound: "",
  terratierAttributes: [],
  behaviorType: "none",
  behaviorBlock: "",
  behaviorRadius: 3,
});

const isFilled = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toResourceKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_./:-]/g, "");

const cleanList = (items: string[]) =>
  items.map((item) => item.trim()).filter(Boolean);

const compactObject = <T extends Record<string, unknown>>(input: T) => {
  const output: Record<string, unknown> = {};

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      return;
    }
    output[key] = value;
  });

  return output;
};

export const styleToMiniMessage = (text: string, style: TextStyle) => {
  const tags: string[] = [];

  if (style.resetItalic) tags.push("<!i>");
  if (style.color)
    tags.push(`<#${style.color.replace("#", "").toUpperCase()}>`);
  if (style.bold) tags.push("<bold>");
  if (style.italic) tags.push("<italic>");
  if (style.underlined) tags.push("<underlined>");
  if (style.strikethrough) tags.push("<strikethrough>");
  if (style.obfuscated) tags.push("<obfuscated>");

  return `${tags.join("")}${legacyCodesToMiniMessage(text)}`;
};

const legacyCodesToMiniMessage = (value: string) =>
  value.replace(/[&§](#[0-9a-f]{6}|[0-9a-fk-or])/gi, (_, rawCode: string) => {
    const code = rawCode.toLowerCase();

    if (code.startsWith("#")) return `<${code}>`;
    if (legacyColorCodes[code]) return `<${legacyColorCodes[code]}>`;
    if (legacyFormatCodes[code]) return `<${legacyFormatCodes[code]}>`;

    return "";
  });

const parseYamlValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    return YAML.parse(trimmed);
  } catch {
    return trimmed;
  }
};

export const buildCraftEngineConfig = (state: ItemState) => {
  const itemKey = `${toResourceKey(state.namespace) || "default"}:${
    toResourceKey(state.itemId) || "custom_item"
  }`;

  const item: Record<string, unknown> = {
    material: state.material.trim() || "paper",
  };

  if (state.customModelData > 0) item.custom_model_data = state.customModelData;
  if (isFilled(state.itemModel)) item.item_model = state.itemModel.trim();
  if (isFilled(state.category)) item.category = state.category.trim();
  if (state.oversizedInGui) item.oversized_in_gui = true;
  if (state.handAnimationOnSwap === false) item.hand_animation_on_swap = false;
  if (state.swapAnimationScale !== 1)
    item.swap_animation_scale = state.swapAnimationScale;

  const data: Record<string, unknown> = {};
  if (isFilled(state.itemName)) {
    data.item_name = styleToMiniMessage(state.itemName.trim(), state.nameStyle);
  }
  if (state.customNameEnabled && isFilled(state.customName)) {
    data.custom_name = styleToMiniMessage(
      state.customName.trim(),
      state.nameStyle,
    );
  }

  const lore = state.lore
    .filter((line) => isFilled(line.text))
    .map((line) => styleToMiniMessage(line.text.trim(), line.style));

  if (state.magicUi) {
    if (lore.length > 0) {
      lore.unshift("");
    }

    const activeEnchants = state.enchantments.filter((entry) =>
      isFilled(entry.enchantment),
    );
    if (activeEnchants.length > 0) {
      if (lore.length > 0) lore.push(""); // Inject spacing
      activeEnchants.forEach((entry) => {
        lore.push(
          `<!i><#aaaaff>${formatMinecraftName(entry.enchantment)} ${toRoman(entry.level)}`,
        );
      });
    }

    const activeAttributes = state.attributes.filter((entry) =>
      isFilled(entry.type),
    );
    if (activeAttributes.length > 0) {
      if (lore.length > 0 || activeEnchants.length > 0) lore.push(""); // Inject spacing
      const grouped = groupAttributesBySlot(activeAttributes);
      Object.entries(grouped).forEach(([slot, entries]) => {
        lore.push(`<!i><#aaaaaa>When in ${formatSlotName(slot)}:`);
        entries.forEach((entry) => {
          const color = entry.amount >= 0 ? "<#5555ff>" : "<#ff5555>";
          lore.push(
            `<!i>${color}${formatAttributeAmount(entry.amount, entry.operation)} ${formatMinecraftName(entry.type)}`,
          );
        });
      });
    }
  }

  if (lore.length > 0) data.lore = lore;

  if (state.unbreakable) data.unbreakable = true;

  const enchantments = Object.fromEntries(
    state.enchantments
      .filter((entry) => isFilled(entry.enchantment))
      .map((entry) => [entry.enchantment.trim(), Number(entry.level) || 1]),
  );
  if (Object.keys(enchantments).length > 0) {
    data.enchantment = state.enchantmentMerge
      ? {
          merge: true,
          enchantments,
        }
      : enchantments;
  }

  if (isFilled(state.dyedColor)) data.dyed_color = state.dyedColor.trim();
  if (state.dataCustomModelData > 0)
    data.custom_model_data = state.dataCustomModelData;
  if (isFilled(state.dataItemModel))
    data.item_model = state.dataItemModel.trim();
  if (isFilled(state.tooltipStyle))
    data.tooltip_style = state.tooltipStyle.trim();
  if (state.maxDamage > 0) data.max_damage = state.maxDamage;
  if (isFilled(state.jukeboxPlayable))
    data.jukebox_playable = state.jukeboxPlayable.trim();
  if (isFilled(state.useRemainder))
    data.use_remainder = state.useRemainder.trim();
  if (isFilled(state.profile)) data.profile = state.profile.trim();
  if (isFilled(state.blockState))
    data.block_state = parseYamlValue(state.blockState);

  const hidden = cleanList(state.hideTooltip);
  if (state.magicUi) {
    if (!hidden.includes("enchantments")) hidden.push("enchantments");
    if (!hidden.includes("attribute_modifiers"))
      hidden.push("attribute_modifiers");
  }
  if (hidden.length > 0) data.hide_tooltip = hidden;

  const attributes = state.attributes
    .filter((entry) => isFilled(entry.type))
    .map((entry) =>
      compactObject({
        type: entry.type.trim(),
        amount: Number(entry.amount) || 0,
        operation: entry.operation,
        id: isFilled(entry.customId) ? entry.customId.trim() : undefined,
        slot: entry.slot,
        display: isFilled(entry.display)
          ? {
              type: "override",
              value: entry.display.trim(),
            }
          : undefined,
      }),
    );
  if (attributes.length > 0) data.attribute_modifiers = attributes;

  if (state.foodEnabled) {
    data.food = {
      nutrition: Number(state.foodNutrition) || 0,
      saturation: Number(state.foodSaturation) || 0,
      can_always_eat: state.foodAlwaysEat,
    };
  }

  if (state.trimEnabled) {
    data.trim = compactObject({
      pattern: state.trimPattern.trim(),
      material: state.trimMaterial.trim(),
    });
  }

  if (state.equippableEnabled) {
    data.equippable = compactObject({
      slot: state.equipmentSlot,
      asset_id: isFilled(state.equipmentAssetId)
        ? state.equipmentAssetId.trim()
        : undefined,
      camera_overlay: isFilled(state.equipmentCameraOverlay)
        ? state.equipmentCameraOverlay.trim()
        : undefined,
      dispensable: state.equipmentDispensable,
      damage_on_hurt: state.equipmentDamageOnHurt,
      swappable: state.equipmentSwappable,
      equip_on_interact: state.equipmentEquipOnInteract,
    });
  }

  const customComponents = Object.fromEntries(
    state.components
      .filter((entry) => isFilled(entry.component))
      .map((entry) => [entry.component.trim(), parseYamlValue(entry.value)]),
  );

  const terratierCustomData: Record<string, unknown> = {};
  state.terratierAttributes.forEach((entry) => {
    if (isFilled(entry.attribute)) {
      terratierCustomData[`terratier:${entry.attribute.trim()}`] =
        Number(entry.value) || 0;
    }
  });

  if (Object.keys(terratierCustomData).length > 0) {
    const existingCustomData = customComponents["minecraft:custom_data"];
    const customData =
      existingCustomData &&
      typeof existingCustomData === "object" &&
      !Array.isArray(existingCustomData)
        ? existingCustomData
        : {};

    customComponents["minecraft:custom_data"] = compactObject({
      ...customData,
      ...terratierCustomData,
    });
  }

  if (Object.keys(customComponents).length > 0)
    data.components = customComponents;

  const removeComponents = cleanList(state.removeComponents);
  if (removeComponents.length > 0) data.remove_components = removeComponents;

  if (Object.keys(data).length > 0) item.data = data;

  const settings: Record<string, unknown> = {};
  if (state.fuelTime > 0) settings.fuel_time = state.fuelTime;
  const tags = cleanList(state.tags);
  if (tags.length > 0) settings.tags = tags;
  if (state.repairMode === "simple") settings.repairable = state.repairable;
  if (state.repairMode === "detailed") {
    settings.repairable = {
      crafting_table: state.repairCraftingTable,
      anvil_repair: state.repairAnvilRepair,
      anvil_combine: state.repairAnvilCombine,
    };
  }
  if (!state.renameable) settings.renameable = false;
  if (state.dyeable) settings.dyeable = true;
  if (state.settingsFoodEnabled) {
    settings.food = {
      nutrition: Number(state.settingsFoodNutrition) || 0,
      saturation: Number(state.settingsFoodSaturation) || 0,
    };
  }
  if (isFilled(state.consumeReplacement))
    settings.consume_replacement = state.consumeReplacement.trim();
  if (
    state.craftRemainderMode === "fixed" &&
    isFilled(state.craftRemainderItem)
  ) {
    settings.craft_remainder = {
      type: "fixed",
      item: state.craftRemainderItem.trim(),
      count: 1,
    };
  }
  if (state.craftRemainderMode === "hurt_and_break") {
    settings.craft_remainder = {
      type: "hurt_and_break",
      damage: Number(state.craftRemainderDamage) || 1,
    };
  }
  if (state.craftRemainderMode === "recipe_based") {
    settings.craft_remainder = {
      type: "recipe_based",
      terms: [
        {
          recipes: ["namespace:recipe_id"],
          craft_remainder: isFilled(state.craftRemainderItem)
            ? state.craftRemainderItem.trim()
            : "minecraft:stone",
        },
      ],
    };
  }
  if (isFilled(state.fuelRemainder))
    settings.fuel_remainder = state.fuelRemainder.trim();
  const invulnerable = cleanList(state.invulnerable);
  if (invulnerable.length > 0) settings.invulnerable = invulnerable;
  if (!state.enchantable) settings.enchantable = false;
  if (state.compostProbability > 0)
    settings.compost_probability = state.compostProbability;
  if (state.respectRepairableComponent)
    settings.respect_repairable_component = true;
  if (isFilled(state.dyeColor)) settings.dye_color = state.dyeColor.trim();
  if (isFilled(state.fireworkColor))
    settings.firework_color = state.fireworkColor.trim();
  const substitutes = cleanList(state.ingredientSubstitute);
  if (substitutes.length > 0) settings.ingredient_substitute = substitutes;
  if (state.hatHeight > 0) settings.hat_height = state.hatHeight;
  if (state.keepOnDeathChance > 0)
    settings.keep_on_death_chance = state.keepOnDeathChance;
  if (state.destroyOnDeathChance > 0) {
    settings.destroy_on_death_chance = state.destroyOnDeathChance;
  }
  if (state.dropDisplayMode === "false") settings.drop_display = false;
  if (state.dropDisplayMode === "true") settings.drop_display = true;
  if (state.dropDisplayMode === "custom" && isFilled(state.dropDisplayText)) {
    settings.drop_display = state.dropDisplayText.trim();
  }
  if (isFilled(state.glowColor)) settings.glow_color = state.glowColor;
  if (state.settingsEquipmentEnabled) {
    settings.equipment = compactObject({
      asset_id: isFilled(state.settingsEquipmentAssetId)
        ? state.settingsEquipmentAssetId.trim()
        : undefined,
      slot: state.settingsEquipmentSlot,
    });
  }
  if (state.projectileEnabled) {
    settings.projectile = compactObject({
      item: isFilled(state.projectileItem)
        ? state.projectileItem.trim()
        : itemKey,
      scale: Number(state.projectileScale) || 0.5,
      sounds: compactObject({
        throw: isFilled(state.projectileThrowSound)
          ? state.projectileThrowSound.trim()
          : undefined,
        hit_entity: isFilled(state.projectileHitEntitySound)
          ? state.projectileHitEntitySound.trim()
          : undefined,
        hit_block: isFilled(state.projectileHitBlockSound)
          ? state.projectileHitBlockSound.trim()
          : undefined,
      }),
    });
  }

  if (Object.keys(settings).length > 0) item.settings = settings;

  if (state.behaviorType !== "none") {
    item.behavior = compactObject({
      type: state.behaviorType,
      block: isFilled(state.behaviorBlock)
        ? state.behaviorBlock.trim()
        : undefined,
      radius:
        state.behaviorType === "range_mining_item"
          ? Number(state.behaviorRadius) || 3
          : undefined,
    });
  }

  return {
    [itemKey]: item,
  };
};

export const buildCraftEngineYaml = (state: ItemState) =>
  YAML.stringify(buildCraftEngineConfig(state), {
    lineWidth: 0,
    singleQuote: false,
    minContentWidth: 0,
  }).trimEnd();

export const parseMiniMessage = (value: string): MiniSegment[] => {
  const normalizedValue = legacyCodesToMiniMessage(value);
  const segments: MiniSegment[] = [];
  const tagPattern = /<([^>]+)>/g;
  let lastIndex = 0;
  let style: Omit<MiniSegment, "text"> = {};

  const pushText = (text: string) => {
    if (text.length > 0) {
      segments.push({ text, ...style });
    }
  };

  for (const match of normalizedValue.matchAll(tagPattern)) {
    pushText(normalizedValue.slice(lastIndex, match.index));
    lastIndex = (match.index ?? 0) + match[0].length;

    const tag = match[1].trim().toLowerCase();
    const normalized = tag.replace(/^\/+/, "");
    const closing = tag.startsWith("/");

    if (tag === "reset" || tag === "r") {
      style = {};
      continue;
    }

    if (tag === "!i" || tag === "!italic") {
      style.italic = false;
      continue;
    }

    const hex = /^#([0-9a-f]{6})$/i.exec(normalized);
    if (hex) {
      style.color = `#${hex[1]}`;
      continue;
    }

    if (minecraftColors[normalized]) {
      style.color = minecraftColors[normalized];
      continue;
    }

    if (["bold", "b"].includes(normalized)) style.bold = !closing;
    if (["italic", "i", "em"].includes(normalized)) style.italic = !closing;
    if (["underlined", "underline", "u"].includes(normalized)) {
      style.underlined = !closing;
    }
    if (["strikethrough", "st"].includes(normalized))
      style.strikethrough = !closing;
    if (["obfuscated", "magic"].includes(normalized))
      style.obfuscated = !closing;
  }

  pushText(normalizedValue.slice(lastIndex));

  return segments.length > 0 ? segments : [{ text: normalizedValue }];
};
