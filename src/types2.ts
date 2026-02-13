export type AbilityScoreName =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type SavingThrows = {
  [K in AbilityScoreName]: {
    proficient: boolean;
    modifier: number; // auto-calculated from ability + prof bonus
  };
}

export interface Skill {
  id: string;
  name: string;
  ability: AbilityScoreName;
  proficient: boolean;
  expertise?: boolean;
  modifier: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: "melee" | "ranged" | "finesse" | "thrown";
  attackBonus: number;
  damage: string; // e.g. "1d8+3"
  properties: string[]; // e.g. ["light", "finesse"]
  range?: string; // e.g. "30/120"
}

export interface Armor {
  id: string;
  name: string;
  ac: number;
  type: "light" | "medium" | "heavy" | "shield";
  equipped: boolean;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string; // e.g. "Evocation"
  castingTime: string; // e.g. "1 action"
  range: string;
  components: string[]; // ["V", "S", "M"]
  duration: string;
  description: string;
  prepared?: boolean;
}

export interface SpellSlots {
  [level: number]: {
    max: number;
    used: number;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  uses?: { max: number; used: number };
}

export interface Condition {
  id: string;
  name: string; // e.g. "Poisoned"
  duration?: string; // "until end of turn", "1 minute"
}

export interface CombatAction {
  id: string;
  name: string; // Attack, Cast Spell, Dodge, Disengage, etc.
  type: "attack" | "spell" | "ability" | "other";
  description?: string;
}

export interface Combatant {
  id: string;
  name: string;
  type: "PC" | "NPC" | "Monster";
  race?: string;
  class?: string;
  level?: number;
  alignment?: string;

  team: number;
  inEncounter: boolean;

  // Combat basics
  ac: number;
  hp: number;
  maxHp: number;
  tempHp?: number;
  speed: number | { [movementType: string]: number }; // walking:30, flying:60
  initiativeMod: number;
  initiative?: number;
  profBonus: number;

  // Ability scores & saves
  abilities: AbilityScores;
  savingThrows: SavingThrows;
  skills: Skill[];

  // Combat resources
  attacks: Weapon[];
  actions: CombatAction[];
  features: Feature[];
  spells: Spell[];
  spellSlots: SpellSlots;

  // Equipment & inventory
  armor: Armor[];
  items: Item[];

  // Status
  conditions: Condition[];
  statusEffects: string[]; // e.g. ["Blessed", "Poisoned"]

  // Meta
  notes?: string;
}
