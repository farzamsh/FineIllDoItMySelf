import { type Combatant } from "./types2"

function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

const fighter: Combatant = {
    id: uid(),
    name: "Aragorn",
    type: "PC",
    race: "Human",
    class: "Fighter",
    level: 5,
    alignment: "Neutral Good",
  
    team: 1,
    inEncounter: true,
  
    ac: 18,
    hp: 44,
    maxHp: 44,
    speed: { walking: 30 },
    initiativeMod: 2,
    profBonus: 3,
  
    abilities: {
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 10,
      wisdom: 12,
      charisma: 13,
    },
  
    savingThrows: {
      strength: { proficient: true, modifier: 7 },
      dexterity: { proficient: false, modifier: 2 },
      constitution: { proficient: true, modifier: 6 },
      intelligence: { proficient: false, modifier: 0 },
      wisdom: { proficient: false, modifier: 1 },
      charisma: { proficient: false, modifier: 1 },
    },
  
    skills: [
      { id: uid(), name: "Perception", ability: "wisdom", proficient: true, modifier: 4 },
      { id: uid(), name: "Athletics", ability: "strength", proficient: true, modifier: 7 },
    ],
  
    attacks: [
      { id: uid(), name: "Longsword", type: "melee", attackBonus: 7, damage: "1d8+4", properties: ["versatile"] },
      { id: uid(), name: "Longbow", type: "ranged", attackBonus: 5, damage: "1d8+2", properties: ["ranged"], range: "150/600" },
    ],
  
    actions: [
      { id: uid(), name: "Second Wind", type: "ability", description: "Regain 1d10 + fighter level HP" },
    ],
  
    features: [
      { id: uid(), name: "Action Surge", description: "Take one additional action on your turn", uses: { max: 1, used: 0 } },
    ],
  
    spells: [],
    spellSlots: {},
  
    armor: [
      { id: uid(), name: "Chain Mail", ac: 16, type: "heavy", equipped: true },
      { id: uid(), name: "Shield", ac: 2, type: "shield", equipped: true },
    ],
  
    items: [
      { id: uid(), name: "Potion of Healing", quantity: 2, description: "Heals 2d4+2 HP" },
    ],
  
    conditions: [],
    statusEffects: ["Normal"],
  
    notes: "Leader of the Fellowship",
  };
  