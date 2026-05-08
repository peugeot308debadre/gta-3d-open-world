import React, { useRef, useEffect, useState, useMemo } from 'react'
import useGameStore from '../hooks/useGameStore'

export default function UI() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Rajdhani', 'Segoe UI', 'Arial Black', sans-serif",
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
      <Crosshair />
    </div>
  )
}

function Crosshair() {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
        <line x1="12" y1="0" x2="12" y2="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <line x1="12" y1="18" x2="12" y2="24" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <line x1="0" y1="12" x2="6" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <line x1="18" y1="12" x2="24" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1.5" fill="rgba(255,80,80,0.8)"/>
      </svg>
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
      position: 'absolute', top: 12, right: 12,
      background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,20,30,0.5))',
      padding: '5px 14px', borderRadius: '6px',
      color: fps > 50 ? '#44ff88' : fps > 30 ? '#ffcc44' : '#ff4444',
      fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(8px)',
      textShadow: '0 0 8px currentColor',
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
      position: 'absolute', bottom: 140, left: 20,
      display: 'flex', flexDirection: 'column', gap: '4px', width: '220px',
    }}>
      {/* Armor bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#4488ff', fontSize: '14px', fontWeight: 'bold', textShadow: '0 0 8px #4488ff' }}>🛡</span>
        <div style={{
          flex: 1, height: '10px', borderRadius: '3px', overflow: 'hidden',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(68,136,255,0.3)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(90deg, #2255cc, #4488ff, #66aaff)',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(68,136,255,0.4)',
          }} />
        </div>
      </div>
      {/* Health bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', textShadow: '0 0 8px #ff4444' }}>❤️</span>
        <div style={{
          flex: 1, height: '12px', borderRadius: '3px', overflow: 'hidden',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,80,80,0.3)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%', transition: 'width 0.3s ease',
            background: pct > 50
              ? 'linear-gradient(90deg, #22aa22, #44dd44, #66ff66)'
              : pct > 25
                ? 'linear-gradient(90deg, #cc8800, #ffaa22, #ffcc44)'
                : 'linear-gradient(90deg, #aa0000, #ff2222, #ff4444)',
            borderRadius: '2px',
            boxShadow: pct <= 25 ? '0 0 15px rgba(255,0,0,0.5)' : '0 0 8px rgba(255,100,100,0.2)',
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

    // Dark background with gradient
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
    grad.addColorStop(0, '#1a2a1a')
    grad.addColorStop(1, '#0a150a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2

    // Roads with subtle color
    ctx.fillStyle = 'rgba(90, 90, 85, 0.5)'
    const roadSpacing = 26 * scale
    const roadW = 8 * scale
    for (let i = -8; i <= 8; i++) {
      const offset = i * roadSpacing
      const hy = cy + offset - playerPosition[2] * scale
      if (hy > -10 && hy < size + 10) ctx.fillRect(0, hy - roadW / 2, size, roadW)
      const hx = cx + offset - playerPosition[0] * scale
      if (hx > -10 && hx < size + 10) ctx.fillRect(hx - roadW / 2, 0, roadW, size)
    }

    // Buildings
    ctx.fillStyle = 'rgba(70, 70, 80, 0.7)'
    buildingFootprints.forEach((b) => {
      const bx = cx + (b.x - playerPosition[0]) * scale
      const bz = cy + (b.z - playerPosition[2]) * scale
      const bw = b.w * scale
      const bd = b.d * scale
      if (bx + bw > 0 && bx < size && bz + bd > 0 && bz < size) {
        ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd)
      }
    })

    // NPCs as glowing dots
    npcPositions.forEach((pos) => {
      const dx = (pos[0] - playerPosition[0]) * scale
      const dz = (pos[2] - playerPosition[2]) * scale
      const nx = cx + dx
      const ny = cy + dz
      if (nx > 5 && nx < size - 5 && ny > 5 && ny < size - 5) {
        ctx.shadowColor = '#ffaa33'
        ctx.shadowBlur = 4
        ctx.fillStyle = '#ffaa33'
        ctx.beginPath()
        ctx.arc(nx, ny, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    })

    // Player arrow with glow
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-playerRotation + Math.PI)
    ctx.shadowColor = '#44aaff'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(-5, 5)
    ctx.lineTo(0, 2)
    ctx.lineTo(5, 5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Circular mask
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Border ring glow
    ctx.shadowColor = '#44aaff'
    ctx.shadowBlur = 8
    ctx.strokeStyle = 'rgba(68,170,255,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 - 3, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    // Compass
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, 14)
    ctx.fillText('S', cx, size - 6)

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
        border: '2px solid rgba(68,170,255,0.2)',
        boxShadow: '0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(68,170,255,0.1), inset 0 0 30px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

function GTAMoney() {
  const money = useGameStore((s) => s.money)

  return (
    <div style={{
      position: 'absolute', top: 15, right: 15,
      color: '#88dd44',
      fontSize: '24px', fontWeight: 'bold',
      textShadow: '0 0 12px rgba(136,221,68,0.5), 2px 2px 4px rgba(0,0,0,0.9)',
      letterSpacing: '2px',
      fontFamily: "'Rajdhani', monospace",
    }}>
      ${money.toLocaleString()}
    </div>
  )
}

function GTAWantedStars() {
  const wanted = useGameStore((s) => s.wantedLevel)

  return (
    <div style={{
      position: 'absolute', top: 48, right: 15,
      display: 'flex', gap: '2px',
    }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          fontSize: '18px',
          filter: i < wanted ? 'drop-shadow(0 0 6px #ff4444) brightness(1.3)' : 'brightness(0.3)',
          opacity: i < wanted ? 1 : 0.25,
          textShadow: i < wanted ? '0 0 12px #ff4444' : 'none',
          transition: 'all 0.3s ease',
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
      background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(15,15,25,0.6))',
      padding: '10px 18px', borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', gap: '12px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: '30px', filter: 'drop-shadow(0 0 8px rgba(255,200,50,0.3))' }}>{weapon.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', fontFamily: "'Rajdhani', monospace", textShadow: '1px 1px 2px #000', letterSpacing: '1px' }}>
          {weapon.name}
        </span>
        <span style={{
          color: weapon.ammo === Infinity ? '#88ff88' : weapon.ammo > 10 ? '#ffdd44' : '#ff4444',
          fontSize: '16px', fontFamily: 'monospace', fontWeight: 'bold',
          textShadow: weapon.ammo <= 10 ? '0 0 8px #ff4444' : 'none',
        }}>
          {weapon.ammo === Infinity ? '∞' : weapon.ammo}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {weapons.map((w, i) => (
          <div key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: i === currentWeaponIndex ? '#ffdd44' : 'rgba(255,255,255,0.2)',
            boxShadow: i === currentWeaponIndex ? '0 0 8px #ffdd44' : 'none',
            transition: 'all 0.2s ease',
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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'KeyB') setOpen((v) => !v)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!open) return (
    <div style={{
      position: 'absolute', bottom: 85, right: 20,
      color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: "'Rajdhani', monospace",
      textShadow: '0 0 4px rgba(255,255,255,0.2)',
    }}>
      [B] BOUTIQUE
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
      background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(15,15,30,0.85))',
      padding: '20px', borderRadius: '10px',
      border: '1px solid rgba(255,200,0,0.3)',
      color: '#fff', fontSize: '13px',
      fontFamily: "'Rajdhani', monospace", minWidth: '200px',
      pointerEvents: 'auto',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,200,0,0.05)',
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', color: '#ffcc00', textShadow: '0 0 10px rgba(255,200,0,0.4)', letterSpacing: '2px' }}>
        💰 AMMU-NATION
      </div>
      <div style={{ textAlign: 'center', color: '#88dd44', fontSize: '13px', marginBottom: '12px', textShadow: '0 0 8px rgba(136,221,68,0.3)' }}>
        ${money.toLocaleString()}
      </div>
      {shopItems.map((item) => (
        <div key={item.idx} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span>{item.label}</span>
          <button
            onClick={() => { if (spendMoney(item.price)) addAmmo(item.idx, item.amount) }}
            style={{
              background: money >= item.price
                ? 'linear-gradient(135deg, #44aa22, #33cc11)'
                : '#333',
              color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '5px',
              cursor: money >= item.price ? 'pointer' : 'not-allowed',
              fontSize: '12px', fontWeight: 'bold', fontFamily: "'Rajdhani', monospace",
              boxShadow: money >= item.price ? '0 0 10px rgba(68,170,34,0.3)' : 'none',
              letterSpacing: '1px',
            }}
          >
            ${item.price}
          </button>
        </div>
      ))}
      <div style={{ textAlign: 'center', marginTop: '12px', color: '#666', fontSize: '11px' }}>
        [B] Fermer
      </div>
    </div>
  )
}

function Controls() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute', top: '50%', left: 15, transform: 'translateY(-50%)',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(10,10,20,0.7))',
      padding: '14px 18px', borderRadius: '10px',
      color: '#ccc', fontSize: '12px', lineHeight: '2',
      border: '1px solid rgba(68,170,255,0.15)',
      backdropFilter: 'blur(12px)', maxWidth: '190px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px', color: '#44aaff', textShadow: '0 0 10px rgba(68,170,255,0.3)', letterSpacing: '1px' }}>
        🎮 CONTRÔLES
      </div>
      <div><b style={{ color: '#fff' }}>WASD</b> — Déplacer</div>
      <div><b style={{ color: '#fff' }}>Shift</b> — Sprinter</div>
      <div><b style={{ color: '#fff' }}>Espace</b> — Sauter</div>
      <div><b style={{ color: '#fff' }}>Souris</b> — Viser + Tirer</div>
      <div><b style={{ color: '#fff' }}>1-4</b> — Armes</div>
      <div><b style={{ color: '#fff' }}>Scroll</b> — Changer arme</div>
      <div><b style={{ color: '#fff' }}>B</b> — Boutique</div>
    </div>
  )
}
