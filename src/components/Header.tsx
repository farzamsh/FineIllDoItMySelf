import React from 'react'


export default function Header() {
return (
<header className="sticky top-0 z-10 backdrop-blur bg-slate-950/70 border-b border-slate-800">
<div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
<h1 className="text-xl font-semibold tracking-tight">⚔️ DnD Combat Manager</h1>
<nav className="flex gap-3 text-sm text-slate-300">
<a href="#encounter" className="link">Encounter</a>
<a href="#initiative" className="link">Initiative</a>
<a href="#dice" className="link">Dice Roller</a>
</nav>
</div>
</header>
)
}