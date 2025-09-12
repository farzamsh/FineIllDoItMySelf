export type RollResult = { total: number; parts: string[] }


const diceRe = /(?:(\d*)d(\d+))|([+-]\s*\d+)/ig


export function rollDice(notation: string): RollResult {
// Supports forms like: "d20", "2d6+3", "4d4-1"
let m: RegExpExecArray | null
const parts: string[] = []
let total = 0
const clean = notation.replace(/\s+/g, '')
while ((m = diceRe.exec(clean))) {
if (m[1] !== undefined && m[2] !== undefined) {
const count = m[1] ? parseInt(m[1], 10) : 1
const sides = parseInt(m[2], 10)
const rolls: number[] = []
for (let i = 0; i < count; i++) {
rolls.push(1 + Math.floor(Math.random() * sides))
}
const sum = rolls.reduce((a, b) => a + b, 0)
total += sum
parts.push(`${count}d${sides}[${rolls.join(',')}]`)
} else if (m[3] !== undefined) {
const mod = parseInt(m[3].replace(/\s+/g, ''), 10)
total += mod
parts.push(`${mod >= 0 ? '+' : ''}${mod}`)
}
}
return { total, parts }
}


export function d20(mod = 0, mode: 'normal'|'adv'|'dis' = 'normal'): RollResult {
const r1 = 1 + Math.floor(Math.random() * 20)
const r2 = 1 + Math.floor(Math.random() * 20)
let base = r1
if (mode === 'adv') base = Math.max(r1, r2)
if (mode === 'dis') base = Math.min(r1, r2)
const total = base + mod
const label = mode === 'adv' ? `adv(${r1},${r2})` : mode === 'dis' ? `dis(${r1},${r2})` : `${r1}`
return { total, parts: [`d20[${label}]`, mod ? (mod > 0 ? `+${mod}` : `${mod}`) : ''] }
}