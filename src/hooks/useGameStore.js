import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // Player state
  playerPosition: [0, 1, 0],
  playerRotation: 0,
  health: 100,
  maxHealth: 100,
  isRunning: false,
  speed: 0,

  // Time state
  timeOfDay: 0.3, // 0-1 representing full day cycle

  // FPS tracking
  fps: 0,
  fpsHistory: [],

  // Minimap data
  npcPositions: [],
  playerMinimapAngle: 0,

  // Actions
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  setHealth: (health) => set({ health: Math.max(0, Math.min(get().maxHealth, health)) }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setSpeed: (speed) => set({ speed }),
  setFps: (fps) => set({ fps }),
  setFpsHistory: (history) => set({ fpsHistory: history }),
  setNpcPositions: (positions) => set({ npcPositions: positions }),
  setPlayerMinimapAngle: (angle) => set({ playerMinimapAngle: angle }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
}))

export default useGameStore
