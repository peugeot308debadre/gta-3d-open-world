import React, { useRef, useEffect, useState, useMemo } from 'react'
import useGameStore from '../hooks/useGameStore'

export default function UI() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', fontFamily: "'Pricedown', 'Impact', 'Arial Black', sans-serif",
      zIndex: 100,
    }}>
      <FPSCounter />
      <GTAHealthArmor />
      <GTAMiniMap />
      <GTAMoney />
      <GTAWantedStars />
      <GTAWeapon />
      <AmmoShop />
      <Controls />
    </div>
  )
}

function FPSCounter() {
  const [fps, setFps] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let animId
    const update = () => {
      frameCount.current++
      const now = performance.now()
      if (now - lastTime.current >= 1000) {
        setFps(Math.round(frameCount.current * 1000 / (now - lastTime.current)))
        frameCount.current = 0
        lastTime.current = now
      }
      animId = requestAnimationFrame(update)
    }
    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10,
      background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '4px',
      color: fps > 50 ? '#44ff44' : fps > 30 ? '#ffff44' : '#ff4444',
      fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {fps} FPS
    </div>
  )
}

function GTAHealthArmor() {
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)
  const pct = (health / maxHealth) * 100

  return (
    <div style={{
      position: 'absolute', bottom: 130, left: 20,
      display: 'flex', flexDirection: 'column', gap: '3px', width: '200px',
    }}>
      {/* Armor bar (decorative) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#4488ff', fontSize: '12px', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>🛡️</span>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', height: '8px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #4488ff, #66aaff)', borderRadius: '2px' }} />
        </div>
      </div>
      {/* Health bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', textShadow: '1px 1px 2px #000' }}>❤️</span>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', height: '10px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', transition: 'width 0.3s',
            background: pct > 50 ? 'linear-gradient(180deg, #ff6666, #cc2222)' : pct > 25 ? 'linear-gradient(180deg, #ffaa44, #cc6600)' : 'linear-gradient(180deg, #ff4444, #aa0000)',
            borderRadius: '2px',
          }} />
        </div>
      </div>
    </div>
  )
}

function GTAMiniMap() {
  const canvasRef = useRef(null)
  const playerPosition = useGameStore((s) => s.playerPosition)
  const npcPositions = useGameStore((s) => s.npcPositions)
  const playerRotation = useGameStore((s) => s.playerRotation)
  const speed = useGameStore((s) => s.speed)
  const isRunning = useGameStore((s) => s.isRunning)

  // Store building footprints for minimap
  const buildingFootprints = useMemo(() => {
    const buildings = []
    function makeRng() {
      let s = 42
      return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
      }
    }
    const rng = makeRng()
    const gridSize = 6
    for (let gx = -gridSize; gx <= gridSize; gx++) {
      for (let gz = -gridSize; gz <= gridSize; gz++) {
        if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue
        const bx = gx * 26
        const bz = gz * 26
        const num = Math.floor(rng() * 3) + 1
        for (let b = 0; b < num; b++) {
          const w = 4 + rng() * 10
          const d = 4 + rng() * 10
          const ox = (rng() - 0.5) * (18 - w)
          const oz = (rng() - 0.5) * (18 - d)
          buildings.push({ x: bx + ox, z: bz + oz, w, d })
        }
      }
    }
    return buildings
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 220
    const scale = 0.45

    // Clear with dark background
    ctx.fillStyle = '#1a2a1a'
    ctx.fillRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2

    // Draw roads
    ctx.fillStyle = 'rgba(80, 80, 75, 0.6)'
    const roadSpacing = 26 * scale
    const roadW = 8 * scale
    for (let i = -8; i <= 8; i++) {
      const offset = i * roadSpacing
      // Horizontal road
      const hy = cy + offset - playerPosition[2] * scale
      if (hy > -10 && hy < size + 10) {
        ctx.fillRect(0, hy - roadW / 2, size, roadW)
      }
      // Vertical road
      const hx = cx + offset - playerPosition[0] * scale
      if (hx > -10 && hx < size + 10) {
        ctx.fillRect(hx - roadW / 2, 0, roadW, size)
      }
    }

    // Draw building footprints
    ctx.fillStyle = 'rgba(60, 60, 70, 0.8)'
    buildingFootprints.forEach((b) => {
      const bx = cx + (b.x - playerPosition[0]) * scale
      const bz = cy + (b.z - playerPosition[2]) * scale
      const bw = b.w * scale
      const bd = b.d * scale
      if (bx + bw > 0 && bx < size && bz + bd > 0 && bz < size) {
        ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd)
      }
    })

    // Draw NPC vehicles as colored dots
    npcPositions.forEach((pos) => {
      const dx = (pos[0] - playerPosition[0]) * scale
      const dz = (pos[2] - playerPosition[2]) * scale
      const nx = cx + dx
      const ny = cy + dz
      if (nx > 5 && nx < size - 5 && ny > 5 && ny < size - 5) {
        ctx.fillStyle = '#ffaa33'
        ctx.beginPath()
        ctx.arc(nx, ny, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw player (GTA-style wedge/arrow)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-playerRotation + Math.PI)

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(0, -7)
    ctx.lineTo(-5, 5)
    ctx.lineTo(0, 2)
    ctx.lineTo(5, 5)
    ctx.closePath()
    ctx.fill()

    // Player glow
    ctx.shadowColor = '#44aaff'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.restore()

    // Circular mask border (GTA style)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Outer ring
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2)
    ctx.stroke()

    // Compass labels
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, 14)
    ctx.fillText('S', cx, size - 6)

    // Speed indicator
    if (speed > 0) {
      ctx.fillStyle = isRunning ? '#ff8844' : '#44ff88'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(isRunning ? 'SPRINT' : 'WALK', cx, size - 18)
    }
  }, [playerPosition, npcPositions, playerRotation, speed, isRunning, buildingFootprints])

  return (
    <div style={{ position: 'absolute', bottom: 15, left: 15 }}>
      <canvas ref={canvasRef} width={220} height={220} style={{
        borderRadius: '50%',
        border: '2px solid rgba(200,200,200,0.25)',
        boxShadow: '0 0 15px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

function GTAMoney() {
  const [money] = useState(125000)

  return (
    <div style={{
      position: 'absolute', top: 15, right: 15,
      color: '#88dd44',
      fontSize: '22px', fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5)',
      letterSpacing: '1px',
    }}>
      ${money.toLocaleString()}
    </div>
  )
}

function GTAWantedStars() {
  const [wanted] = useState(0)

  return (
    <div style={{
      position: 'absolute', top: 45, right: 15,
      display: 'flex', gap: '2px',
    }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          fontSize: '16px',
          filter: i < wanted ? 'drop-shadow(0 0 4px #ff4444)' : 'none',
          opacity: i < wanted ? 1 : 0.3,
          textShadow: i < wanted ? '0 0 8px #ff4444' : 'none',
        }}>⭐</span>
      ))}
    </div>
  )
}

function GTAWeapon() {
  const weapons = useGameStore((s) => s.weapons)
  const currentWeaponIndex = useGameStore((s) => s.currentWeaponIndex)
  const weapon = weapons[currentWeaponIndex]

  return (
    <div style={{
      position: 'absolute', bottom: 20, right: 20,
      background: 'rgba(0,0,0,0.6)', padding: '8px 14px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '10px',
      backdropFilter: 'blur(3px)',
    }}>
      <span style={{ fontSize: '26px' }}>{weapon.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', textShadow: '1px 1px 2px #000' }}>
          {weapon.name}
        </span>
        <span style={{ color: weapon.ammo === Infinity ? '#88ff88' : weapon.ammo > 10 ? '#ffdd44' : '#ff4444', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}>
          {weapon.ammo === Infinity ? '∞' : weapon.ammo}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {weapons.map((w, i) => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: i === currentWeaponIndex ? '#ffdd44' : 'rgba(255,255,255,0.3)',
          }} />
        ))}
      </div>
    </div>
  )
}

function AmmoShop() {
  const [open, setOpen] = useState(false)
  const weapons = useGameStore((s) => s.weapons)
  const money = useGameStore((s) => s.money)
  const addAmmo = useGameStore((s) => s.addAmmo)
  const spendMoney = useGameStore((s) => s.spendMoney)

  // Press B to open shop
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'KeyB') setOpen((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!open) return (
    <div style={{
      position: 'absolute', bottom: 80, right: 20,
      color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace',
    }}>
      [B] Munitions
    </div>
  )

  const shopItems = [
    { idx: 1, label: 'Pistolet ×30', price: 200, amount: 30 },
    { idx: 2, label: 'SMG ×100', price: 800, amount: 100 },
    { idx: 3, label: 'RPG ×2', price: 3000, amount: 2 },
  ]

  return (
    <div style={{
      position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
      background: 'rgba(0,0,0,0.85)', padding: '16px', borderRadius: '8px',
      border: '2px solid rgba(255,200,0,0.4)', color: '#fff', fontSize: '12px',
      fontFamily: 'monospace', minWidth: '180px', pointerEvents: 'auto',
      backdropFilter: 'blur(5px)',
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px', color: '#ffcc00' }}>
        💰 BOUTIQUE
      </div>
      <div style={{ textAlign: 'center', color: '#88dd44', fontSize: '11px', marginBottom: '10px' }}>
        ${money.toLocaleString()}
      </div>
      {shopItems.map((item) => (
        <div key={item.idx} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span>{item.label}</span>
          <button
            onClick={() => { if (spendMoney(item.price)) addAmmo(item.idx, item.amount) }}
            style={{
              background: money >= item.price ? '#44aa22' : '#444',
              color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px',
              cursor: money >= item.price ? 'pointer' : 'not-allowed', fontSize: '11px', fontWeight: 'bold',
            }}
          >
            ${item.price}
          </button>
        </div>
      ))}
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#888', fontSize: '10px' }}>
        [B] Fermer
      </div>
    </div>
  )
}

function Controls() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute', top: '50%', left: 15, transform: 'translateY(-50%)',
      background: 'rgba(0,0,0,0.75)', padding: '12px 16px', borderRadius: '8px',
      color: '#ccc', fontSize: '11px', lineHeight: '1.9',
      border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', maxWidth: '180px',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#44aaff' }}>
        🎮 Controls
      </div>
      <div><b style={{ color: '#fff' }}>WASD</b> — Move</div>
      <div><b style={{ color: '#fff' }}>Shift</b> — Sprint</div>
      <div><b style={{ color: '#fff' }}>Space</b> — Jump</div>
      <div><b style={{ color: '#fff' }}>Mouse</b> — Look + Shoot</div>
      <div><b style={{ color: '#fff' }}>1-4</b> — Switch weapon</div>
      <div><b style={{ color: '#fff' }}>Scroll</b> — Cycle weapon</div>
      <div><b style={{ color: '#fff' }}>B</b> — Ammo shop</div>
    </div>
  )
}
