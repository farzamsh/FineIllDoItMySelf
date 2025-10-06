# ⚔️ D&D Combat Manager

A lightweight, local-first combat tracker to help DMs run faster, cleaner fights.  
Track initiative, rolls, and damage — all stored locally so your PCs never vanish.

---

## ✨ Features

- 📌 **Local-only**: runs in your browser, no server or signup required.
- 📝 **Persistent PCs/monsters**: state is auto-saved in `localStorage`.
- 🎲 **Attack + damage rolls** (with nat 20 / nat 1 highlights).
- 📖 **Readable combat log**: shows attacker, defender, hits/misses, damage, deaths.
- 🔄 **Export/Import JSON**: share encounters or back up progress.

---

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/farzamsh/FineIllDoItMySelf.git
   cd FineIllDoItMySelf
   ```

   or

   ```bash
   ssh -T git@github.com
   git clone git@github.com:farzamsh/FineIllDoItMySelf.git
   cd FineIllDoItMySelf
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open in your browser at:
   ```
   http://localhost:5173/
   ```
   (or whichever port Vite shows).

---

## 👤 Adding Your Players

Player characters (PCs) are defined in the initial state file (e.g. `src/state.ts` or `app.tsx`).  
Update the `INITIAL` object to include your party:

```ts
const INITIAL: AppState = {
  combatants: [
    {
      id: "1",
      name: "Thorn the Fighter",
      team: 1,
      hp: 34,
      ac: 16,
      init: 14,
      mod: +5,
    },
    {
      id: "2",
      name: "Lyra the Wizard",
      team: 1,
      hp: 22,
      ac: 13,
      init: 12,
      mod: +3,
    },
  ],
  round: 1,
  activeId: null,
};
```

💡 **Tip:** PCs and monsters are saved automatically in `localStorage`.  
To keep backups or share with friends, use **Export JSON** in the app.

---

## 💡 Why We Built This

As DMs, we wanted combat to feel fast and cinematic — not bogged down by dice math and initiative chaos.  
Most online tools were too heavy, so we made something **simple, local, and customizable**.

---

## 📜 License

MIT — free to use, modify, and share.

---

## 🤝 Contributing

Pull requests are welcome!  
If you have ideas for new features or better UI for logs, feel free to open an issue.

---

## 📋 To-Do List

Stage 1: Making the app viable via essential mechanics and manual modifications

1. ✅ Fixing forced log clear on switching to roster bug
2. ✅ Adding Advantage and Disadvantage to attacks
   - ✅ In attack card
   - ✅ In logs
3. ✅ Two step attacks in battle page, first show the dice and access to add or change or reroll
   - ✅ Building new attack card and the two steps
   - ✅ Dice format support for added amount to the dice
   - ✅ Cleaning the code and deleting the old format
   - ✅ UI improvment of the attack card
4. ✅ Adding saving throws to character sheet
5. ✅ Adding Attack types of attack roll, DC based and auto hit
   - ✅ To the roster card
   - ✅ To the action card
     - ✅ Auto Hit Logic & UI
     - ✅ Save DC Logic & UI
   - ✅ To the logs
6. Adding Multi choice target in action card

Stage 2: Providing smoother gameplay and UI

1. Making the initiatives editable
2. ✅ Adding type Heal to the actions
   - ✅ To the roster card
   - ✅ To the action card
3. Hidden mode to hide enemies HP and AC for Projection mode
4. Nat 1 and 20 implication on attack pass and damage
5. Designing Button UIs
6. ✅ Improving UI of roster cards on action section
7. Improving action card's UI
8. Removing ac from target select box
9. Adding ac or save modifier of the contested box
10. Max hp input fix

Stage 3: Improving overall layout and add a bit automation

1. Designig different formats of attack and spell types
2. Adding Multi choice attack on action card
3. Adding default weapons and spells
4. Adding customable weapons and spells with ability to combine and correlate(ones success adding another, different outcomes on fails)
5. Adding Grapple, Shove as default actions and Athletic and Acrobatic checks to sheet
6. Adding ability checks, proficiencies and advantages in them
7. Building a whole turn section for each player turn with attacks, spells, slots and bonus actions

Stage 4: Full character sheet and features and Maximum automation!

1. Adding character full features and abilities
2. Adding Conditions and their effects
3. Adding feats and class and subclass features
4. Adding items and their features, atunements and item charges

Stage 5: Multi account access, defining roles and access
...

Stage 6: Too many ideas to cover here! let's finish these first then we will get to them 😊
