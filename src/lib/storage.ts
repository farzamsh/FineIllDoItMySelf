const KEY = 'dnd-combat-state-v1'


export function saveState<T>(state: T) {
localStorage.setItem(KEY, JSON.stringify(state))
}


export function loadState<T>(fallback: T): T {
try {
const raw = localStorage.getItem(KEY)
return raw ? JSON.parse(raw) as T : fallback
} catch {
return fallback
}
}


export function downloadJSON(filename: string, data: unknown) {
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = filename
a.click()
URL.revokeObjectURL(url)
}