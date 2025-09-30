export type RollResult = { raw: number; total: number; parts: string[] }


export function rollDice(notation: string): RollResult {
    const diceRe = /([+-]?)(\d*)d(\d+)|([+-]?\d+)(?!d)/gi;
  
    const parts: string[] = [];
    let total = 0;
    let raw = 0;
  
    const clean = (notation || "").replace(/\s+/g, "").toLowerCase();
  
    let m: RegExpExecArray | null;
    while ((m = diceRe.exec(clean))) {
      if (m[2] !== undefined && m[3] !== undefined) {
        // Dice roll
        const sign = m[1] === "-" ? -1 : 1;
        const count = m[2] ? parseInt(m[2], 10) : 1;
        const sides = parseInt(m[3], 10);
  
        const rolls: number[] = [];
        for (let i = 0; i < count; i++) {
          rolls.push(1 + Math.floor(Math.random() * sides));
        }
        const sum = rolls.reduce((a, b) => a + b, 0);
  
        raw += sign * sum;
        total += sign * sum;
  
        // ✅ Always prefix "+" for positive dice too
        const part = `${sign < 0 ? "-" : "+"}${count}d${sides}[${rolls.join(",")}]`;
        parts.push(part);
      } else if (m[4] !== undefined) {
        // Modifier
        const mod = parseInt(m[4], 10);
        total += mod;
        parts.push(`${mod >= 0 ? "+" : ""}${mod}`);
      }
    }
  
    return { total, raw, parts };
  }
  
  


export function d20(mod = 0, mode: "normal" | "advantage" | "disadvantage" = "normal"): RollResult {
const r1 = 1 + Math.floor(Math.random() * 20)
const r2 = 1 + Math.floor(Math.random() * 20)
let base = r1
if (mode === 'advantage') base = Math.max(r1, r2)
if (mode === 'disadvantage') base = Math.min(r1, r2)
const raw = base
const total = base + mod
const label = mode === 'advantage' ? `Adv(${r1},${r2})` : mode === 'disadvantage' ? `Dis(${r1},${r2})` : `${r1}`
return { raw, total, parts: [`(d20 ${label}`, mod ? (mod > 0 ? `+${mod}` : `${mod}`) : '', ')'] }
}