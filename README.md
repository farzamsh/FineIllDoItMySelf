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

1. Fixing forced log clear on switching to roster bug
2. Adding Advantage and Disadvantage to attacks
3. Adding saving throws to character sheet
4. Relocating initiative rolls from battle page to character sheet and make it editable
5. Add Grapple, Shove as default actions and Athletic and Acrobatic checks to sheet
6. Add Multi choice Attack
7. Add Conditions and their effects
8. Add Attack types of attack roll, DC based and auto hit and multi parts for an attack
