/* Presets + Profiles for the develop op-stack.
 *
 * Presets are user-saved snapshots of the full `adj` object, persisted in
 * localStorage (no backend needed; a Supabase `presets` table is the later
 * sync upgrade). Profiles are built-in starting looks — a base the user picks,
 * then refines, Lightroom-style. Both are just `adj` partials. */

const KEY = 'kol-lr-presets'

export function loadPresets() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function persistPresets(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage blocked — presets just won't survive reload */
  }
}

export function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `p${Math.random().toString(36).slice(2)}`
  }
}

// Built-in profiles — base looks applied before the user's tweaks.
export const PROFILES = [
  { name: 'Standard', adj: {} },
  { name: 'Punchy', adj: { contrast: 22, clarity: 28, vibrance: 22 } },
  { name: 'Flat', adj: { contrast: -22, highlights: -18, shadows: 20 } },
  { name: 'Mono', adj: { saturation: -100, contrast: 14, clarity: 12 } },
  { name: 'Warm', adj: { temp: 28, vibrance: 14 } },
  { name: 'Cool', adj: { temp: -26, tint: -10 } },
  { name: 'Matte', adj: { blacks: 18, contrast: -10, highlights: -8 } },
]
