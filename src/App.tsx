import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { gsap } from "gsap";
import Lenis from "lenis";
import {
  Box,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Gem,
  ListPlus,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  attributeOptions,
  blankStyle,
  buildCraftEngineYaml,
  createInitialState,
  enchantmentOptions,
  glowColorOptions,
  hideTooltipOptions,
  invulnerableOptions,
  materialOptions,
  parseMiniMessage,
  slotOptions,
  styleToMiniMessage,
  toRoman,
  formatMinecraftName,
  formatSlotName,
  formatAttributeAmount,
  groupAttributesBySlot,
  type AttributeEntry,
  type ComponentEntry,
  type EnchantmentEntry,
  type ItemState,
  type LoreLine,
  type TextStyle,
  terratierAttributeOptions,
  type TerratierAttributeEntry,
  soundOptions,
  trimPatternOptions,
  trimMaterialOptions,
  potionEffectOptions,
} from "./lib/craftEngine";
import "./App.css";

type AppMode = "edit" | "advanced" | "export";
type Patch = Partial<ItemState> | ((current: ItemState) => Partial<ItemState>);

const STORAGE_KEY = "craftengine-item-editor-state-v5";

const colorPresets = [
  "#ffdf7e",
  "#ff4d38",
  "#ff8a3d",
  "#78e08f",
  "#5eead4",
  "#7dd3fc",
  "#c084fc",
  "#f9a8d4",
  "#ffffff",
  "#aaaaaa",
];

const formatButtons: Array<{
  key: keyof Pick<
    TextStyle,
    "bold" | "italic" | "underlined" | "strikethrough" | "obfuscated"
  >;
  label: string;
  icon: string;
}> = [
  { key: "bold", label: "Bold", icon: "B" },
  { key: "italic", label: "Italic", icon: "I" },
  { key: "underlined", label: "Underline", icon: "U" },
  { key: "strikethrough", label: "Strikethrough", icon: "S" },
  { key: "obfuscated", label: "Obfuscate", icon: "?" },
];

const fancyTextMap: Record<string, string> = {
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "s",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ",
};

const normalTextMap = Object.entries(fancyTextMap).reduce<
  Record<string, string>
>(
  (map, [normal, fancy]) =>
    fancy === normal
      ? map
      : {
          ...map,
          [fancy]: normal,
        },
  { ꜱ: "s" },
);

const isHexDigit = (value: string | undefined) =>
  Boolean(value && /^[0-9a-f]$/i.test(value));

const toggleMinecraftFancyText = (value: string) => {
  const characters = Array.from(value);
  const hasFancyText = characters.some((character) => normalTextMap[character]);
  let output = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const next = characters[index + 1];

    if (character === "<") {
      const tagEndIndex = characters.indexOf(">", index + 1);
      if (tagEndIndex !== -1) {
        output += characters.slice(index, tagEndIndex + 1).join("");
        index = tagEndIndex;
        continue;
      }
    }

    if ((character === "&" || character === "§") && next) {
      const hexDigits = characters.slice(index + 2, index + 8);
      const hexColor =
        next === "#" && hexDigits.length === 6 && hexDigits.every(isHexDigit);
      const codeLength = hexColor ? 8 : 2;
      output += characters.slice(index, index + codeLength).join("");
      index += codeLength - 1;
      continue;
    }

    output += hasFancyText
      ? (normalTextMap[character] ?? character)
      : (fancyTextMap[character.toLowerCase()] ?? character);
  }

  return output;
};

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.-]/g, "") || "craftengine_item";

const formatItemKey = (state: ItemState) =>
  `${state.namespace || "lowclicker"}:${state.itemId || "custom_item"}`;

const itemIconUrl = (material: string, type: "item" | "block" = "item") =>
  `https://assets.mcasset.cloud/snapshot/assets/minecraft/textures/${type}/${material || "paper"}.png`;

function App() {
  const [state, setState] = useState<ItemState>(() => {
    const fallback = createInitialState();
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) return fallback;

    try {
      return { ...fallback, ...JSON.parse(stored) };
    } catch {
      return fallback;
    }
  });
  const [mode, setMode] = useState<AppMode>("edit");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const yaml = useMemo(() => buildCraftEngineYaml(state), [state]);
  const itemKey = formatItemKey(state);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.72,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.82,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".topbar.motion-in",
        {
          y: -18,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.46,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".command.motion-in",
        {
          y: 18,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.68,
          ease: "power4.out",
        },
      );
      gsap.fromTo(
        ".workbench.motion-in, .preview.motion-in",
        {
          y: 34,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.92,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.16,
        },
      );
      gsap.fromTo(
        ".signal-line span",
        {
          scaleX: 0,
        },
        {
          scaleX: 1,
          duration: 1.35,
          ease: "power3.out",
          delay: 0.35,
        },
      );
    }, rootRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;

    const root = rootRef.current;
    const revealTargets = Array.from(
      root.querySelectorAll<HTMLElement>(".reveal-line, .text-reveal"),
    ).filter((target) => !target.classList.contains("is-revealed"));

    if (revealTargets.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top ||
              first.boundingClientRect.left - second.boundingClientRect.left,
          );

        visibleEntries.forEach((entry, index) => {
          const target = entry.target as HTMLElement;
          target.style.setProperty(
            "--reveal-delay",
            `${Math.min(index * 0.105, 0.42)}s`,
          );
          target.classList.add("is-revealed");
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    if (!rootRef.current) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".view-transition .creator-card, .view-transition .advanced-group, .view-transition .advanced-disclosure, .view-transition .export-head, .view-transition .export-actions, .view-transition .yaml-output",
        {
          y: 28,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.72,
          ease: "power3.out",
          stagger: 0.055,
        },
      );
    }, rootRef);

    return () => context.revert();
  }, [mode]);

  const patchState = (patch: Patch) => {
    setState((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));
  };

  const resetState = () => {
    setState(createInitialState());
    toast.success("Configuration reset!");
  };

  const copyYaml = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(yaml);
        toast.success("CraftEngine YAML copied");
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = yaml;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (copied) {
        toast.success("CraftEngine YAML copied");
      } else {
        toast.info("YAML selected for copying");
      }
    } catch {
      toast.error("Copy was blocked by the browser");
    }
  };

  const downloadYaml = () => {
    const blob = new Blob([`${yaml}\n`], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(state.itemId)}.yml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={rootRef} className="studio-shell">
      <Toaster richColors position="top-center" duration={2000} />
      <Topbar
        mode={mode}
        setMode={setMode}
        onCopy={copyYaml}
        onReset={resetState}
      />

      <main className="studio-grid">
        <section className="command motion-in">
          <div className="command-copy">
            <h1>
              <span className="reveal-line" data-text="Item">
                Item
              </span>
              <span className="reveal-line second" data-text="Studio">
                Studio
              </span>
            </h1>
          </div>
          <StatusBoard state={state} yaml={yaml} />
        </section>

        <section className="workbench motion-in">
          <motion.div
            className="view-transition"
            key={mode}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          >
            {mode === "edit" && (
              <EditorView state={state} patchState={patchState} />
            )}
            {mode === "advanced" && (
              <AdvancedSection state={state} patchState={patchState} />
            )}
            {mode === "export" && (
              <ExportView
                yaml={yaml}
                itemKey={itemKey}
                magicUi={state.magicUi}
                setMagicUi={(magicUi) => patchState({ magicUi })}
                includeItemsKey={state.includeItemsKey}
                setIncludeItemsKey={(includeItemsKey) =>
                  patchState({ includeItemsKey })
                } // <-- Add this
                onCopy={copyYaml}
                onDownload={downloadYaml}
              />
            )}
          </motion.div>
        </section>

        <aside className="preview motion-in">
          <PreviewDock
            state={state}
            yaml={yaml}
            itemKey={itemKey}
            onCopy={copyYaml}
            onDownload={downloadYaml}
          />
        </aside>
      </main>
    </div>
  );
}

function Topbar({
  mode,
  setMode,
  onCopy,
  onReset,
}: {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <header className="topbar motion-in">
      <div className="brand">
        <div className="brand-glyph">
          <Gem size={21} />
        </div>
        <div>
          <strong>Item Studio</strong>
          <span>CraftEngine builder</span>
        </div>
      </div>

      <nav className="mode-switch" aria-label="View mode">
        <button
          type="button"
          className={mode === "edit" ? "active" : ""}
          onClick={() => setMode("edit")}
        >
          Create
        </button>
        <button
          type="button"
          className={mode === "advanced" ? "active" : ""}
          onClick={() => setMode("advanced")}
        >
          Advanced
        </button>
        <button
          type="button"
          className={mode === "export" ? "active" : ""}
          onClick={() => setMode("export")}
        >
          Export
        </button>
      </nav>

      <div className="top-actions">
        <button
          className="icon-button"
          type="button"
          onClick={onReset}
          title="Reset example"
        >
          <RefreshCw size={17} />
        </button>
        <button className="primary-action" type="button" onClick={onCopy}>
          <Copy size={17} />
          Copy YAML
        </button>
      </div>
    </header>
  );
}

function StatusBoard({ state, yaml }: { state: ItemState; yaml: string }) {
  const rows = [
    ["01", "Item", formatItemKey(state)],
    ["02", "Material", state.material || "paper"],
    ["03", "Model", state.itemModel || "generated"],
    ["04", "YAML", `${yaml.split("\n").length} lines`],
  ];

  return (
    <div className="status-board">
      <div className="signal-line" aria-hidden="true">
        <span />
      </div>
      <p className="kicker">Config status</p>
      <ul>
        {rows.map(([number, label, value]) => (
          <li key={label}>
            <span>{number}</span>
            <strong>{label}</strong>
            <em>{value}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditorView({ state, patchState }: ViewProps) {
  const updateEnchantment = (id: string, patch: Partial<EnchantmentEntry>) => {
    patchState((current) => ({
      enchantments: current.enchantments.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const updateLoreLine = (id: string, patch: Partial<LoreLine>) => {
    patchState((current) => ({
      lore: current.lore.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      ),
    }));
  };

  return (
    <div className="creator-view">
      <section className="creator-card primary">
        <div className="creator-card-head">
          <span className="reveal-line">01 / IDENTITY</span>
        </div>
        <div className="name-composer">
          <Field label="Display name">
            <TextInput
              value={state.itemName}
              onChange={(itemName) => {
                const generatedId = itemName
                  .replace(/<[^>]*>/g, "") // Strip MiniMessage tags
                  .replace(/[&§][0-9a-fk-or]/gi, "") // Strip legacy codes
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, "_")
                  .replace(/[^a-z0-9_.-]/g, "");

                patchState({
                  itemName,
                  itemId: generatedId,
                });
              }}
            />
          </Field>
          <ColorEditor
            style={state.nameStyle}
            onChange={(nameStyle) => patchState({ nameStyle })}
          />
          <FormatToolbar
            style={state.nameStyle}
            onChange={(nameStyle) => patchState({ nameStyle })}
            onFancy={() =>
              patchState({ itemName: toggleMinecraftFancyText(state.itemName) })
            }
          />
        </div>
      </section>

      <section className="creator-card split">
        <div>
          <div className="creator-card-head">
            <span className="reveal-line">02 / BASE ITEM</span>
          </div>
          <div className="compact-grid tight">
            <Field label="Material">
              <Select
                value={state.material}
                options={materialOptions}
                onChange={(material) => patchState({ material })}
              />
            </Field>
            <Field label="Visual ID">
              <NumberInput
                value={state.customModelData}
                min={0}
                onChange={(customModelData) => patchState({ customModelData })}
              />
            </Field>
          </div>
        </div>

        <div className="key-card">
          <span>Export key</span>
          <strong>{formatItemKey(state)}</strong>
          <small>
            Root custom model data stays here; item model lives in Advanced.
          </small>
        </div>
      </section>

      <section className="creator-card">
        <div className="creator-card-head">
          <span className="reveal-line">03 / LORE</span>
        </div>

        <div className="lore-workbench">
          {state.lore.map((line, index) => (
            <div className="lore-line-editor" key={line.id}>
              <span className="line-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <TextInput
                value={line.text}
                placeholder="Try &aGreen, &lBold, <#FFCC66>hex, or &#FFCC66hex"
                onChange={(text) => updateLoreLine(line.id, { text })}
              />
              <ColorEditor
                compact
                style={line.style}
                onChange={(style) => updateLoreLine(line.id, { style })}
              />
              <FormatToolbar
                compact
                style={line.style}
                onChange={(style) => updateLoreLine(line.id, { style })}
                onFancy={() =>
                  updateLoreLine(line.id, {
                    text: toggleMinecraftFancyText(line.text),
                  })
                }
              />
              <RemoveButton
                label="Remove lore line"
                onClick={() =>
                  patchState((current) => ({
                    lore: current.lore.filter((item) => item.id !== line.id),
                  }))
                }
              />
            </div>
          ))}
        </div>

        <button
          className="line-action add-line"
          type="button"
          onClick={() =>
            patchState((current) => ({
              lore: [
                ...current.lore,
                {
                  id: createId("lore"),
                  text: "",
                  style: { ...blankStyle(), color: "#d7efff" },
                },
              ],
            }))
          }
        >
          <ListPlus size={15} />
          Add lore line
        </button>
      </section>

      <section className="creator-card power-card">
        <button className="power-toggle" type="button">
          <span className="reveal-line">Enchantments</span>
          <em>{state.enchantments.length} active</em>
        </button>

        <div className="power-list">
          <div className="section-tools">
            <button
              className="line-action"
              type="button"
              onClick={() =>
                patchState((current) => ({
                  enchantments: [
                    ...current.enchantments,
                    {
                      id: createId("ench"),
                      enchantment: "minecraft:sharpness",
                      level: 1,
                    },
                  ],
                }))
              }
            >
              <ListPlus size={15} />
              Add
            </button>
          </div>

          <div className="repeater-list">
            {state.enchantments.map((entry) => (
              <div className="repeat-row enchant-row" key={entry.id}>
                <Select
                  value={entry.enchantment}
                  options={enchantmentOptions}
                  onChange={(enchantment) =>
                    updateEnchantment(entry.id, { enchantment })
                  }
                />
                <NumberInput
                  value={entry.level}
                  min={1}
                  onChange={(level) => updateEnchantment(entry.id, { level })}
                />
                <RemoveButton
                  label="Remove enchantment"
                  onClick={() =>
                    patchState((current) => ({
                      enchantments: current.enchantments.filter(
                        (item) => item.id !== entry.id,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AdvancedSection({ state, patchState }: ViewProps) {
  const updateComponent = (id: string, patch: Partial<ComponentEntry>) => {
    patchState((current) => ({
      components: current.components.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const updateAttribute = (id: string, patch: Partial<AttributeEntry>) => {
    patchState((current) => ({
      attributes: current.attributes.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const updateTerratierAttribute = (
    id: string,
    patch: Partial<TerratierAttributeEntry>,
  ) => {
    patchState((current) => ({
      terratierAttributes: current.terratierAttributes.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  return (
    <div className="advanced-view">
      <div className="export-head">
        <div>
          <h2 className="text-reveal">Advanced Settings</h2>
        </div>
      </div>

      <div className="advanced-grid">
        <AdvancedGroup title="Terratier Attributes">
          <div className="section-tools">
            <button
              className="line-action"
              type="button"
              onClick={() =>
                patchState((current) => ({
                  terratierAttributes: [
                    ...current.terratierAttributes,
                    {
                      id: createId("terratier"),
                      attribute: "mining_speed",
                      value: 1.0,
                      slot: "any",
                      source: "equipped",
                    },
                  ],
                }))
              }
            >
              <ListPlus size={15} />
              Add attribute
            </button>
          </div>

          <div className="repeater-list">
            {state.terratierAttributes.map((entry) => (
              <div className="repeat-row terratier-row" key={entry.id}>
                <Select
                  value={entry.attribute}
                  options={terratierAttributeOptions}
                  onChange={(attribute) =>
                    updateTerratierAttribute(entry.id, { attribute })
                  }
                />
                <NumberInput
                  value={entry.value}
                  step={0.1}
                  onChange={(value) =>
                    updateTerratierAttribute(entry.id, { value })
                  }
                />
                <Select
                  value={entry.slot || "any"}
                  options={slotOptions}
                  onChange={(slot) =>
                    updateTerratierAttribute(entry.id, { slot })
                  }
                />
                <Select
                  value={entry.source || "equipped"}
                  options={["equipped", "inventory"]}
                  onChange={(source) =>
                    updateTerratierAttribute(entry.id, {
                      source: source as TerratierAttributeEntry["source"],
                    })
                  }
                />
                <RemoveButton
                  label="Remove terratier attribute"
                  onClick={() =>
                    patchState((current) => ({
                      terratierAttributes: current.terratierAttributes.filter(
                        (item) => item.id !== entry.id,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </AdvancedGroup>

        <AdvancedGroup title="Item data">
          <div className="inline-options">
            <Toggle
              checked={state.unbreakable}
              label="Unbreakable"
              onChange={(unbreakable) => patchState({ unbreakable })}
            />
            <Toggle
              checked={state.enchantmentMerge}
              label="Merge enchantments"
              onChange={(enchantmentMerge) => patchState({ enchantmentMerge })}
            />
          </div>

          <div className="compact-grid">
            <Field label="Dyed color">
              <TextInput
                value={state.dyedColor}
                placeholder="255,204,102"
                onChange={(dyedColor) => patchState({ dyedColor })}
              />
            </Field>
            <Field label="Max damage">
              <NumberInput
                value={state.maxDamage}
                min={0}
                onChange={(maxDamage) => patchState({ maxDamage })}
              />
            </Field>
            <Field label="Tooltip style">
              <TextInput
                value={state.tooltipStyle}
                placeholder="minecraft:topaz"
                onChange={(tooltipStyle) => patchState({ tooltipStyle })}
              />
            </Field>
            <Field label="Use remainder">
              <TextInput
                value={state.useRemainder}
                onChange={(useRemainder) => patchState({ useRemainder })}
              />
            </Field>
          </div>

          <Field label="Hidden tooltip parts">
            <ChipPicker
              values={state.hideTooltip}
              options={hideTooltipOptions}
              onChange={(hideTooltip) => patchState({ hideTooltip })}
            />
          </Field>

          <Field label="Block state">
            <Textarea
              value={state.blockState}
              rows={4}
              placeholder={'note: "1"\npowered: "false"\ninstrument: "harp"'}
              onChange={(blockState) => patchState({ blockState })}
            />
          </Field>
        </AdvancedGroup>

        <AdvancedGroup title="Attributes">
          <button
            className="line-action"
            type="button"
            onClick={() =>
              patchState((current) => ({
                attributes: [
                  ...current.attributes,
                  {
                    id: createId("attr"),
                    type: "attack_damage",
                    amount: 1,
                    operation: "add_value",
                    slot: "mainhand",
                    display: "",
                    customId: "",
                  },
                ],
              }))
            }
          >
            <ListPlus size={15} />
            Add attribute
          </button>

          <div className="repeater-list">
            {state.attributes.map((entry) => (
              <div className="repeat-row attribute-row" key={entry.id}>
                <Select
                  value={entry.type}
                  options={attributeOptions}
                  onChange={(type) => updateAttribute(entry.id, { type })}
                />
                <NumberInput
                  value={entry.amount}
                  step={0.1}
                  onChange={(amount) => updateAttribute(entry.id, { amount })}
                />
                <Select
                  value={entry.operation}
                  options={[
                    "add_value",
                    "add_multiplied_base",
                    "add_multiplied_total",
                  ]}
                  onChange={(operation) =>
                    updateAttribute(entry.id, {
                      operation: operation as AttributeEntry["operation"],
                    })
                  }
                />
                <Select
                  value={entry.slot}
                  options={slotOptions}
                  onChange={(slot) => updateAttribute(entry.id, { slot })}
                />
                <RemoveButton
                  label="Remove attribute"
                  onClick={() =>
                    patchState((current) => ({
                      attributes: current.attributes.filter(
                        (item) => item.id !== entry.id,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </AdvancedGroup>

        <AdvancedGroup title="Plugin settings">
          <div className="compact-grid">
            <Field label="Fuel time">
              <NumberInput
                value={state.fuelTime}
                min={0}
                onChange={(fuelTime) => patchState({ fuelTime })}
              />
            </Field>
            <Field label="Glow color">
              <Select
                value={state.glowColor}
                options={["", ...glowColorOptions]}
                onChange={(glowColor) => patchState({ glowColor })}
              />
            </Field>
            <Field label="Consume replacement">
              <TextInput
                value={state.consumeReplacement}
                onChange={(consumeReplacement) =>
                  patchState({ consumeReplacement })
                }
              />
            </Field>
            <Field label="Fuel remainder">
              <TextInput
                value={state.fuelRemainder}
                onChange={(fuelRemainder) => patchState({ fuelRemainder })}
              />
            </Field>
          </div>

          <div className="inline-options">
            <Toggle
              checked={state.renameable}
              label="Renamable"
              onChange={(renameable) => patchState({ renameable })}
            />
            <Toggle
              checked={state.dyeable}
              label="Dyeable"
              onChange={(dyeable) => patchState({ dyeable })}
            />
            <Toggle
              checked={state.enchantable}
              label="Enchantable"
              onChange={(enchantable) => patchState({ enchantable })}
            />
            <Toggle
              checked={state.projectileEnabled}
              label="Projectile"
              onChange={(projectileEnabled) =>
                patchState({ projectileEnabled })
              }
            />
          </div>

          {state.projectileEnabled && (
            <div className="compact-grid">
              <Field label="Projectile item">
                <Select
                  value={state.projectileItem}
                  options={["", ...materialOptions]}
                  onChange={(projectileItem) => patchState({ projectileItem })}
                />
              </Field>
              <Field label="Projectile scale">
                <NumberInput
                  value={state.projectileScale}
                  step={0.1}
                  min={0.1}
                  max={5}
                  onChange={(projectileScale) => patchState({ projectileScale })}
                />
              </Field>
              <Field label="Throw sound">
                <Select
                  value={state.projectileThrowSound}
                  options={["", ...soundOptions]}
                  onChange={(projectileThrowSound) =>
                    patchState({ projectileThrowSound })
                  }
                />
              </Field>
              <Field label="Hit entity sound">
                <Select
                  value={state.projectileHitEntitySound}
                  options={["", ...soundOptions]}
                  onChange={(projectileHitEntitySound) =>
                    patchState({ projectileHitEntitySound })
                  }
                />
              </Field>
              <Field label="Hit block sound">
                <Select
                  value={state.projectileHitBlockSound}
                  options={["", ...soundOptions]}
                  onChange={(projectileHitBlockSound) =>
                    patchState({ projectileHitBlockSound })
                  }
                />
              </Field>
            </div>
          )}

          <Field label="Invulnerable to">
            <ChipPicker
              values={state.invulnerable}
              options={invulnerableOptions}
              onChange={(invulnerable) => patchState({ invulnerable })}
            />
          </Field>

          <Field label="Ingredient substitutes">
            <TagEditor
              values={state.ingredientSubstitute}
              onChange={(ingredientSubstitute) =>
                patchState({ ingredientSubstitute })
              }
            />
          </Field>
        </AdvancedGroup>

        <AdvancedDisclosure
          title="Optional Vanilla Components"
          defaultOpen={
            state.foodEnabled || state.trimEnabled || state.equippableEnabled
          }
        >
          <div className="inline-options">
            <Toggle
              checked={state.foodEnabled}
              label="Food"
              onChange={(foodEnabled) => patchState({ foodEnabled })}
            />
            <Toggle
              checked={state.trimEnabled}
              label="Armor trim"
              onChange={(trimEnabled) => patchState({ trimEnabled })}
            />
            <Toggle
              checked={state.equippableEnabled}
              label="Equippable"
              onChange={(equippableEnabled) =>
                patchState({ equippableEnabled })
              }
            />
          </div>

          {state.foodEnabled && (
            <div className="compact-grid">
              <Field label="Nutrition">
                <NumberInput
                  value={state.foodNutrition}
                  min={0}
                  max={20}
                  onChange={(foodNutrition) => patchState({ foodNutrition })}
                />
              </Field>
              <Field label="Saturation">
                <NumberInput
                  value={state.foodSaturation}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={(foodSaturation) => patchState({ foodSaturation })}
                />
              </Field>
              <Toggle
                checked={state.foodAlwaysEat}
                label="Always edible"
                onChange={(foodAlwaysEat) => patchState({ foodAlwaysEat })}
              />
            </div>
          )}

          {state.trimEnabled && (
            <div className="compact-grid">
              <Field label="Trim pattern">
                <Select
                  value={state.trimPattern}
                  options={trimPatternOptions}
                  onChange={(trimPattern) => patchState({ trimPattern })}
                />
              </Field>
              <Field label="Trim material">
                <Select
                  value={state.trimMaterial}
                  options={trimMaterialOptions}
                  onChange={(trimMaterial) => patchState({ trimMaterial })}
                />
              </Field>
            </div>
          )}

          {state.equippableEnabled && (
            <div className="compact-grid">
              <Field label="Equipment slot">
                <Select
                  value={state.equipmentSlot}
                  options={slotOptions.filter(
                    (slot) =>
                      slot !== "any" && slot !== "armor" && slot !== "hand",
                  )}
                  onChange={(equipmentSlot) => patchState({ equipmentSlot })}
                />
              </Field>
              <Field label="Asset id">
                <TextInput
                  value={state.equipmentAssetId}
                  onChange={(equipmentAssetId) =>
                    patchState({ equipmentAssetId })
                  }
                />
              </Field>
              <Field label="Camera overlay">
                <TextInput
                  value={state.equipmentCameraOverlay}
                  onChange={(equipmentCameraOverlay) =>
                    patchState({ equipmentCameraOverlay })
                  }
                />
              </Field>
            </div>
          )}
        </AdvancedDisclosure>

        <AdvancedGroup title="Behavior">
          <Field label="Behavior type">
            <Select
              value={state.behaviorType}
              options={[
                "none",
                "block_item",
                "furniture_item",
                "ground_block_item",
                "wall_block_item",
                "ceiling_block_item",
                "range_mining_item",
                "compostable_item",
              ]}
              onChange={(behaviorType) =>
                patchState({ behaviorType: behaviorType as any })
              }
            />
          </Field>
          {state.behaviorType !== "none" && (
            <div className="compact-grid">
              <Field label="Target block">
                <Select
                  value={state.behaviorBlock}
                  options={["", ...blockOptions]}
                  onChange={(behaviorBlock) => patchState({ behaviorBlock })}
                />
              </Field>
              {state.behaviorType === "range_mining_item" && (
                <Field label="Mining radius">
                  <NumberInput
                    value={state.behaviorRadius}
                    min={1}
                    max={10}
                    onChange={(behaviorRadius) =>
                      patchState({ behaviorRadius })
                    }
                  />
                </Field>
              )}
            </div>
          )}
        </AdvancedGroup>

        <AdvancedGroup title="Custom components">
          <button
            className="line-action"
            type="button"
            onClick={() =>
              patchState((current) => ({
                components: [
                  ...current.components,
                  {
                    id: createId("comp"),
                    component: "minecraft:unbreakable",
                    value: "{}",
                  },
                ],
              }))
            }
          >
            <ListPlus size={15} />
            Add component
          </button>

          <div className="repeater-list">
            {state.components.map((entry) => (
              <div className="component-row" key={entry.id}>
                <TextInput
                  value={entry.component}
                  placeholder="minecraft:component_id"
                  onChange={(component) =>
                    updateComponent(entry.id, { component })
                  }
                />
                <Textarea
                  value={entry.value}
                  rows={4}
                  placeholder={"nutrition: 4\nsaturation: 2.0"}
                  onChange={(value) => updateComponent(entry.id, { value })}
                />
                <RemoveButton
                  label="Remove component"
                  onClick={() =>
                    patchState((current) => ({
                      components: current.components.filter(
                        (item) => item.id !== entry.id,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </AdvancedGroup>
      </div>
    </div>
  );
}

function ExportView({
  yaml,
  itemKey,
  magicUi,
  setMagicUi,
  includeItemsKey,
  setIncludeItemsKey,
  onCopy,
  onDownload,
}: {
  yaml: string;
  itemKey: string;
  magicUi: boolean;
  setMagicUi: (value: boolean) => void;
  includeItemsKey: boolean;
  setIncludeItemsKey: (value: boolean) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const handleWheel = (event: WheelEvent) => {
      const scrollTop = pre.scrollTop;
      const scrollHeight = pre.scrollHeight;
      const clientHeight = pre.clientHeight;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight;

      if ((event.deltaY > 0 && isAtBottom) || (event.deltaY < 0 && isAtTop)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pre.scrollTop += event.deltaY;
    };

    pre.addEventListener("wheel", handleWheel, { passive: false });
    return () => pre.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="export-panel">
      <div className="export-head">
        <div>
          <p className="kicker">Copy-paste output</p>
          <h2 className="text-reveal">CraftEngine YAML</h2>
        </div>
        <div className="export-pills">
          <InfoPill icon={Check} label={itemKey} />
          <InfoPill icon={Code2} label={`${yaml.split("\n").length} lines`} />
        </div>
      </div>

      <div className="export-actions-bar">
        <div className="inline-options">
          <Toggle
            checked={magicUi}
            label="Magic UI Compiler"
            onChange={setMagicUi}
          />
          <Toggle
            checked={includeItemsKey}
            label="Include 'items:' key"
            onChange={setIncludeItemsKey}
          />
        </div>

        <div className="export-actions">
          <button className="primary-action" type="button" onClick={onCopy}>
            <Copy size={17} />
            Copy YAML
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={onDownload}
          >
            <Download size={17} />
            Download .yml
          </button>
        </div>
      </div>

      <pre className="yaml-output" tabIndex={0} ref={preRef}>
        <code>{yaml}</code>
      </pre>
    </div>
  );
}

function PreviewDock({
  state,
  yaml,
  itemKey,
  onCopy,
  onDownload,
}: {
  state: ItemState;
  yaml: string;
  itemKey: string;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const displayName = styleToMiniMessage(
    state.itemName || "Unnamed Item",
    state.nameStyle,
  );
  const loreLines = state.lore.filter((line) => line.text.trim().length > 0);
  const showEnchantments = !state.hideTooltip.includes("enchantments");
  const showAttributes = !state.hideTooltip.includes("attribute_modifiers");
  
  const variations = useMemo(() => {
    const base = state.material;
    const v: Array<{ name: string; type: "item" | "block" }> = [
      { name: base, type: "item" },
      { name: base, type: "block" },
    ];

    const suffixes = ["_top", "_front", "_side", "_bottom", "_outside"];
    suffixes.forEach(s => v.push({ name: `${base}${s}`, type: "block" }));

    const stripRegex = /_(stairs|slab|fence|button|wall|fence_gate|pressure_plate|gate|door|trapdoor|sign|hanging_sign)$/;
    if (stripRegex.test(base)) {
      const stripped = base.replace(stripRegex, "");
      const fallbacks = [stripped, `${stripped}_planks`, `${stripped}_block` , `${stripped}_top`];
      fallbacks.forEach(f => {
        v.push({ name: f, type: "item" });
        v.push({ name: f, type: "block" });
      });
    }

    return v;
  }, [state.material]);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  
  // Reset when material changes
  useEffect(() => {
    setAttemptIndex(0);
    setFailed(false);
  }, [state.material]);

  const handleIconError = () => {
    if (attemptIndex + 1 < variations.length) {
      setAttemptIndex(attemptIndex + 1);
    } else {
      setFailed(true);
    }
  };

  const currentVariant = variations[attemptIndex];
  const currentIconUrl = itemIconUrl(currentVariant?.name || state.material, currentVariant?.type || "item");

  return (
    <>
      <div className="preview-title">
        <div>
          <p className="kicker">Live item</p>
          <h2 className="text-reveal">Tooltip</h2>
        </div>
        <Eye size={19} />
      </div>

      <div className="item-preview-stage">
        <div className="slot-shell">
          <div className="slot-inner">
            <div
              className="pixel-item"
              style={{ "--item-color": state.nameStyle.color } as CSSProperties}
            >
              {!failed && (
                <img
                  className="item-icon"
                  src={currentIconUrl}
                  alt=""
                  onError={handleIconError}
                />
              )}
              {failed && <Gem size={32} />}
            </div>
          </div>
        </div>

        <MinecraftTooltip
          displayName={displayName}
          loreLines={loreLines}
          enchantments={state.enchantments}
          attributes={state.attributes}
          showEnchantments={showEnchantments}
          showAttributes={showAttributes}
          state={state}
        />
      </div>

      <div className="preview-meta">
        <InfoPill icon={Package} label={itemKey} />
        <InfoPill icon={Box} label={state.material || "paper"} />
        <InfoPill
          icon={Code2}
          label={`${yaml.length.toLocaleString()} chars`}
        />
      </div>

      <div className="preview-actions">
        <button className="secondary-action" type="button" onClick={onCopy}>
          <Copy size={16} />
          Copy
        </button>
        <button className="secondary-action" type="button" onClick={onDownload}>
          <Download size={16} />
          .yml
        </button>
      </div>
    </>
  );
}

function MinecraftTooltip({
  displayName,
  loreLines,
  enchantments,
  attributes,
  showEnchantments,
  showAttributes,
  state,
}: {
  displayName: string;
  loreLines: LoreLine[];
  enchantments: EnchantmentEntry[];
  attributes: AttributeEntry[];
  showEnchantments: boolean;
  showAttributes: boolean;
  state: ItemState;
}) {
  return (
    <div className="minecraft-tooltip">
      <div className="tooltip-name">
        <MiniMessageText value={displayName} />
      </div>

      {loreLines.length > 0 && (
        <div className="tooltip-section">
          {loreLines.map((line) => (
            <div key={line.id}>
              <MiniMessageText
                value={styleToMiniMessage(line.text, line.style)}
              />
            </div>
          ))}
        </div>
      )}

      {showEnchantments && enchantments.length > 0 && (
        <div className="tooltip-section enchant-list">
          {enchantments.map((entry) => (
            <span key={entry.id}>
              {formatMinecraftName(entry.enchantment)} {toRoman(entry.level)}
            </span>
          ))}
        </div>
      )}

      {(state.unbreakable || state.maxDamage > 0 || state.foodEnabled) && (
        <div className="tooltip-section muted-lines">
          {state.unbreakable && <span>Unbreakable</span>}
          {state.maxDamage > 0 && <span>Durability: {state.maxDamage}</span>}
          {state.foodEnabled && (
            <span>
              Food: {state.foodNutrition} nutrition, {state.foodSaturation}{" "}
              saturation
            </span>
          )}
        </div>
      )}

      {showAttributes && attributes.length > 0 && (
        <div className="tooltip-section attribute-lines">
          {Object.entries(groupAttributesBySlot(attributes)).map(
            ([slot, entries]) => (
              <div className="attribute-group" key={slot}>
                <span className="attribute-heading">
                  When in {formatSlotName(slot)}:
                </span>
                {entries.map((entry) => (
                  <span
                    className={
                      entry.amount >= 0
                        ? "attribute-positive"
                        : "attribute-negative"
                    }
                    key={entry.id}
                  >
                    {formatAttributeAmount(entry.amount, entry.operation)}{" "}
                    {formatMinecraftName(entry.type)}
                  </span>
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ObfuscatedText({ text }: { text: string }) {
  const [scrambled, setScrambled] = useState(text);

  useEffect(() => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

    const interval = setInterval(() => {
      setScrambled(
        text
          .split("")
          .map((char) =>
            char.trim() === ""
              ? char
              : chars[Math.floor(Math.random() * chars.length)],
          )
          .join(""),
      );
    }, 50);

    return () => clearInterval(interval);
  }, [text]);

  return <>{scrambled}</>;
}

function MiniMessageText({ value }: { value: string }) {
  return (
    <>
      {parseMiniMessage(value).map((segment, index) => {
        const classes = [];
        if (segment.bold) classes.push("mc-bold");
        if (segment.italic) classes.push("mc-italic");

        return (
          <span
            key={`${segment.text}-${index}`}
            className={classes.join(" ")}
            style={{
              color: segment.color,
              textDecoration:
                [
                  segment.underlined && "underline",
                  segment.strikethrough && "line-through",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined,
            }}
          >
            {segment.obfuscated ? (
              <ObfuscatedText text={segment.text} />
            ) : (
              segment.text
            )}
          </span>
        );
      })}
    </>
  );
}

type ViewProps = {
  state: ItemState;
  patchState: (patch: Patch) => void;
};

function AdvancedGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="advanced-group">
      <h3 className="text-reveal">{title}</h3>
      {children}
    </section>
  );
}

function AdvancedDisclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      className="advanced-disclosure"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="text-reveal">{title}</summary>
      <div className="advanced-disclosure-body">{children}</div>
    </details>
  );
}

function Field({
  label,
  compact = false,
  children,
}: {
  label: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={compact ? "field compact" : "field"}>
      <span>{label}</span>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="control"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const increment = (direction: 1 | -1) => {
    const next = value + step * direction;
    const clamped = Math.min(max ?? next, Math.max(min ?? next, next));
    onChange(Number(clamped.toFixed(4)));
  };

  return (
    <div className="number-control">
      <input
        className="control"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
      />
      <div className="number-steppers" aria-hidden="true">
        <button type="button" tabIndex={-1} onClick={() => increment(1)}>
          +
        </button>
        <button type="button" tabIndex={-1} onClick={() => increment(-1)}>
          -
        </button>
      </div>
    </div>
  );
}

function Textarea({
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="control textarea"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });
  const selectId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selected = value || "none";

  const filteredOptions = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    let filtered = options;
    if (lowerSearch) {
      filtered = options.filter((opt) => opt.toLowerCase().includes(lowerSearch));
    }
    return filtered;
  }, [options, search, value]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    // Focus search input when menu opens
    setTimeout(() => searchInputRef.current?.focus(), 10);

    const positionMenu = () => {
      const trigger = containerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const viewportMargin = 12;
      const spaceBelow = window.innerHeight - rect.bottom - viewportMargin;
      const spaceAbove = rect.top - viewportMargin;
      const openUp = spaceBelow < 230 && spaceAbove > spaceBelow;
      const available = Math.max(
        150,
        openUp ? spaceAbove - gap : spaceBelow - gap,
      );
      const maxHeight = Math.min(260, available);

      setMenuStyle({
        left: rect.left,
        top: openUp ? "auto" : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : "auto",
        width: rect.width,
        maxHeight,
        visibility: "visible",
      });
    };

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const repositionOnScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) return;
      positionMenu();
    };

    const closeForOtherSelect = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== selectId) setOpen(false);
    };

    positionMenu();

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", repositionOnScroll, true);
    window.addEventListener("item-studio-select-open", closeForOtherSelect);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", repositionOnScroll, true);
      window.removeEventListener(
        "item-studio-select-open",
        closeForOtherSelect,
      );
    };
  }, [open, selectId]);

  const toggleOpen = () => {
    setOpen((isOpen) => {
      const next = !isOpen;
      if (next) {
        window.dispatchEvent(
          new CustomEvent("item-studio-select-open", { detail: selectId }),
        );
      }
      return next;
    });
  };

  return (
    <div
      className={open ? "select-control open" : "select-control"}
      ref={containerRef}
    >
      <button
        type="button"
        className="control select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <span>{selected}</span>
        <span className="select-chevron" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            className="select-menu"
            ref={menuRef}
            style={menuStyle}
            role="listbox"
            data-lenis-prevent
            data-lenis-prevent-wheel
            onWheelCapture={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="select-search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="select-search-input"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  e.stopPropagation();
                }}
              />
            </div>
            {filteredOptions.length === 0 && (
              <div className="select-no-results">No results</div>
            )}
            <div className="select-menu-items">
              {filteredOptions.map((option) => (
                <button
                  key={option || "empty"}
                  type="button"
                  className={option === value ? "active" : ""}
                  role="option"
                  aria-selected={option === value}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {option || "none"}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={checked ? "toggle active" : "toggle"}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span />
      {label}
    </button>
  );
}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeHexColor = (value: string) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? `#${match[1].toUpperCase()}` : "#FFFFFF";
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b]
    .map((channel) =>
      clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;

const hexToRgb = (hex: string) => {
  const normalized = normalizeHexColor(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHsv = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === red) h = 60 * (((green - blue) / delta) % 6);
    if (max === green) h = 60 * ((blue - red) / delta + 2);
    if (max === blue) h = 60 * ((red - green) / delta + 4);
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
};

const hsvToRgb = ({ h, s, v }: { h: number; s: number; v: number }) => {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - chroma;
  const [red, green, blue] =
    h < 60
      ? [chroma, x, 0]
      : h < 120
        ? [x, chroma, 0]
        : h < 180
          ? [0, chroma, x]
          : h < 240
            ? [0, x, chroma]
            : h < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return {
    r: (red + m) * 255,
    g: (green + m) * 255,
    b: (blue + m) * 255,
  };
};

function ColorEditor({
  style,
  onChange,
  compact = false,
}: {
  style: TextStyle;
  onChange: (style: TextStyle) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const color = normalizeHexColor(style.color);
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);

  useEffect(() => {
    if (!open) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 350 && rect.top > spaceBelow) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const commitColor = (nextColor: string) => {
    onChange({ ...style, color: normalizeHexColor(nextColor) });
  };

  const updateColor = (value: string) => {
    const raw = value.replace(/[^0-9a-fA-F#]/g, "").slice(0, 7);
    const next = raw.startsWith("#") ? raw : `#${raw}`;
    onChange({ ...style, color: next.toUpperCase() });
  };

  const updateRgbChannel = (channel: "r" | "g" | "b", value: string) => {
    const next = {
      ...rgb,
      [channel]: clampNumber(Number(value.replace(/\D/g, "")) || 0, 0, 255),
    };

    commitColor(rgbToHex(next));
  };

  const updateSpectrum = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const s = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
    const v = clampNumber(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    commitColor(rgbToHex(hsvToRgb({ ...hsv, s, v })));
  };

  const updateHue = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const h = clampNumber((event.clientX - rect.left) / rect.width, 0, 1) * 360;
    commitColor(rgbToHex(hsvToRgb({ ...hsv, h })));
  };

  return (
    <div
      className={compact ? "color-editor compact" : "color-editor"}
      ref={containerRef}
    >
      <input
        className="control color-hex"
        aria-label="Hex text color"
        value={style.color}
        maxLength={7}
        spellCheck={false}
        onChange={(event) => updateColor(event.target.value)}
      />
      <button
        type="button"
        className="color-current"
        aria-label="Open RGB color mixer"
        aria-expanded={open}
        style={{ "--swatch": color } as CSSProperties}
        onClick={() => setOpen((isOpen) => !isOpen)}
      />
      {!compact && (
        <div className="swatches">
          {colorPresets.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color}`}
              className={style.color.toLowerCase() === color ? "active" : ""}
              style={{ "--swatch": color } as CSSProperties}
              onClick={() => onChange({ ...style, color })}
            />
          ))}
        </div>
      )}
      {open && (
        <div className={`color-popover ${openUp ? "open-up" : ""}`}>
          <div
            className="color-spectrum"
            style={
              {
                "--hue": `${hsv.h}deg`,
                "--sat": `${hsv.s * 100}%`,
                "--val": `${(1 - hsv.v) * 100}%`,
              } as CSSProperties
            }
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSpectrum(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) updateSpectrum(event);
            }}
          >
            <span />
          </div>
          <div
            className="hue-track"
            style={{ "--hue-pos": `${(hsv.h / 360) * 100}%` } as CSSProperties}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateHue(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) updateHue(event);
            }}
          >
            <span />
          </div>
          <div className="rgb-grid">
            {(["r", "g", "b"] as const).map((channel) => (
              <label key={channel}>
                <span>{channel.toUpperCase()}</span>
                <input
                  value={rgb[channel]}
                  inputMode="numeric"
                  maxLength={3}
                  onChange={(event) =>
                    updateRgbChannel(channel, event.target.value)
                  }
                />
              </label>
            ))}
          </div>
          <div className="minecraft-colors">
            <div className="minecraft-colors-label">Minecraft Codes</div>
            <div className="minecraft-colors-grid">
              {[
                { code: "&0", hex: "#000000", name: "Black" },
                { code: "&1", hex: "#0000AA", name: "Dark Blue" },
                { code: "&2", hex: "#00AA00", name: "Dark Green" },
                { code: "&3", hex: "#00AAAA", name: "Dark Aqua" },
                { code: "&4", hex: "#AA0000", name: "Dark Red" },
                { code: "&5", hex: "#AA00AA", name: "Dark Purple" },
                { code: "&6", hex: "#FFAA00", name: "Gold" },
                { code: "&7", hex: "#AAAAAA", name: "Gray" },
                { code: "&8", hex: "#555555", name: "Dark Gray" },
                { code: "&9", hex: "#5555FF", name: "Blue" },
                { code: "&a", hex: "#55FF55", name: "Green" },
                { code: "&b", hex: "#55FFFF", name: "Aqua" },
                { code: "&c", hex: "#FF5555", name: "Red" },
                { code: "&d", hex: "#FF55FF", name: "Light Purple" },
                { code: "&e", hex: "#FFFF55", name: "Yellow" },
                { code: "&f", hex: "#FFFFFF", name: "White" },
              ].map(({ code, hex, name }) => (
                <button
                  key={code}
                  type="button"
                  title={`${name} (${code})`}
                  className={
                    style.color.toLowerCase() === hex.toLowerCase()
                      ? "active"
                      : ""
                  }
                  style={{ "--swatch": hex } as CSSProperties}
                  data-code={code}
                  onClick={() => onChange({ ...style, color: hex })}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormatToolbar({
  style,
  onChange,
  compact = false,
  onFancy,
}: {
  style: TextStyle;
  onChange: (style: TextStyle) => void;
  compact?: boolean;
  onFancy?: () => void;
}) {
  return (
    <div className={compact ? "format-toolbar compact" : "format-toolbar"}>
      {formatButtons.map((button) => (
        <button
          key={button.key}
          type="button"
          className={style[button.key] ? "active" : ""}
          title={button.label}
          aria-pressed={style[button.key]}
          onClick={() =>
            onChange({ ...style, [button.key]: !style[button.key] })
          }
        >
          {button.icon}
        </button>
      ))}
      {onFancy && (
        <button
          type="button"
          title="Toggle Minecraft fancy text"
          onClick={onFancy}
        >
          <Sparkles size={13} />
        </button>
      )}
    </div>
  );
}

function TagEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="tag-editor">
      <div className="tag-list">
        {values.map((value, index) => (
          <button
            key={`${value}-${index}`}
            type="button"
            className="tag-chip"
            onClick={() =>
              onChange(values.filter((_, itemIndex) => itemIndex !== index))
            }
            title="Remove"
          >
            {value}
            <Minus size={12} />
          </button>
        ))}
      </div>
      <div className="tag-add-row">
        <input
          className="control"
          value={draft}
          placeholder="Add value"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
        />
        <button
          className="icon-button"
          type="button"
          onClick={addValue}
          title="Add value"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function ChipPicker({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const toggleValue = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  return (
    <div className="chip-picker">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={values.includes(option) ? "active" : ""}
          onClick={() => toggleValue(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="remove-button"
      type="button"
      onClick={onClick}
      title={label}
    >
      <Trash2 size={16} />
    </button>
  );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="info-pill">
      <Icon size={14} />
      {label}
    </span>
  );
}

export default App;
