import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // Player state
  playerPosition: [0, 1, 0],
  playerRotation: 0,
  health: 100,
  maxHealth: 100,
  armor: 100,
  maxArmor: 100,
  isRunning: false,
  speed: 0,
  money: 125000,

  // Weapon system
  weapons: [
    { name: 'Fists', type: 'melee', damage: 10, ammo: Infinity, maxAmmo: Infinity, fireRate: 0.5, range: 2, icon: '👊', price: 0 },
    { name: 'Pistol', type: 'bullet', damage: 25, ammo: 60, maxAmmo: 120, fireRate: 0.3, range: 80, icon: '🔫', price: 500 },
    { name: 'SMG', type: 'bullet', damage: 15, ammo: 150, maxAmmo: 300, fireRate: 0.08, range: 60, icon: '🔫', price: 2000 },
    { name: 'RPG', type: 'rocket', damage: 100, ammo: 5, maxAmmo: 10, fireRate: 1.5, range: 120, icon: '🚀', price: 5000 },
  ],
  currentWeaponIndex: 0,
  lastFireTime: 0,
  isShooting: false,

  // Time state
  timeOfDay: 0.3,

  // FPS tracking
  fps: 0,
  fpsHistory: [],

  // Minimap data
  npcPositions: [],
  playerMinimapAngle: 0,

  // Wanted level
  wantedLevel: 0,

  // Actions
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setHealth: (health) => set({ health: Math.max(0, Math.min(get().maxHealth, health)) }),
  setArmor: (armor) => set({ armor: Math.max(0, Math.min(get().maxArmor, armor)) }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setSpeed: (speed) => set({ speed }),
  setFps: (fps) => set({ fps }),
  setFpsHistory: (history) => set({ fpsHistory: history }),
  setNpcPositions: (positions) => set({ npcPositions: positions }),
  setPlayerMinimapAngle: (angle) => set({ playerMinimapAngle: angle }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setCurrentWeaponIndex: (idx) => set({ currentWeaponIndex: idx }),
  setLastFireTime: (t) => set({ lastFireTime: t }),
  setIsShooting: (v) => set({ isShooting: v }),
  setWantedLevel: (v) => set({ wantedLevel: Math.max(0, Math.min(5, v)) }),
  addAmmo: (weaponIndex, amount) => set((state) => {
    const weapons = [...state.weapons]
    weapons[weaponIndex] = { ...weapons[weaponIndex], ammo: Math.min(weapons[weaponIndex].maxAmmo, weapons[weaponIndex].ammo + amount) }
    return { weapons }
  }),
  spendMoney: (amount) => {
    const current = get().money
    if (current >= amount) { set({ money: current - amount }); return true }
    return false
  },
}))

export default useGameStore
