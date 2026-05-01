import React, { useRef, useEffect, useState, useCallback } from 'react'
import useGameStore from '../hooks/useGameStore'

export default function UI() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      zIndex: 100,
    }}>
      <FPSCounter />
      <HealthBar />
      <MiniMap />
      <Controls />
      <SpeedIndicator />
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
      const delta = now - lastTime.current

      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta))
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
      position: 'absolute',
      top: 15,
      right: 15,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '8px 14px',
      borderRadius: '8px',
      color: fps > 50 ? '#44ff44' : fps > 30 ? '#ffff44' : '#ff4444',
      fontSize: '14px',
      fontWeight: 'bold',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(5px)',
    }}>
      {fps} FPS
    </div>
  )
}

function HealthBar() {
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)
  const percentage = (health / maxHealth) * 100

  const barColor = percentage > 60 ? '#44ff44' : percentage > 30 ? '#ffaa00' : '#ff3333'

  return (
    <div style={{
      position: 'absolute',
      bottom: 30,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
    }}>
      {/* Health bar container */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '12px',
        padding: '4px',
        border: '2px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(5px)',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '16px',
          background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
          borderRadius: '8px',
          transition: 'width 0.3s ease, background 0.3s ease',
          boxShadow: `0 0 10px ${barColor}66`,
        }} />
      </div>

      {/* Health text */}
      <div style={{
        textAlign: 'center',
        marginTop: '4px',
        color: '#ffffff',
        fontSize: '12px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
      }}>
        ❤️ {health} / {maxHealth}
      </div>
    </div>
  )
}

function MiniMap() {
  const canvasRef = useRef(null)
  const playerPosition = useGameStore((s) => s.playerPosition)
  const playerMinimapAngle = useGameStore((s) => s.setPlayerMinimapAngle)
  const npcPositions = useGameStore((s) => s.npcPositions)
  const playerRotation = useGameStore((s) => s.playerRotation)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 180
    const scale = 0.5

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2

    // Draw grid roads
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)'
    ctx.lineWidth = 2
    const roadSpacing = 26 * scale
    for (let i = -8; i <= 8; i++) {
      const offset = i * roadSpacing
      // Horizontal
      const hy = cy + (offset - playerPosition[2] * scale)
      if (hy > 0 && hy < size) {
        ctx.beginPath()
        ctx.moveTo(0, hy)
        ctx.lineTo(size, hy)
        ctx.stroke()
      }
      // Vertical
      const hx = cx + (offset - playerPosition[0] * scale)
      if (hx > 0 && hx < size) {
        ctx.beginPath()
        ctx.moveTo(hx, 0)
        ctx.lineTo(hx, size)
        ctx.stroke()
      }
    }

    // Draw NPC vehicles as red dots
    ctx.fillStyle = '#ff4444'
    npcPositions.forEach((pos) => {
      const dx = (pos[0] - playerPosition[0]) * scale
      const dz = (pos[2] - playerPosition[2]) * scale
      const nx = cx + dx
      const ny = cy + dz
      if (nx > 0 && nx < size && ny > 0 && ny < size) {
        ctx.beginPath()
        ctx.arc(nx, ny, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw player (center) with direction indicator
    ctx.fillStyle = '#44aaff'
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()

    // Direction arrow
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    const arrowLen = 12
    const dirX = Math.sin(playerRotation) * arrowLen
    const dirZ = Math.cos(playerRotation) * arrowLen
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx - dirX, cy - dirZ)
    ctx.stroke()

    // Border circle
    ctx.strokeStyle = 'rgba(68, 170, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2)
    ctx.stroke()

    // Compass directions
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, 12)
    ctx.fillText('S', cx, size - 4)
    ctx.fillText('W', 8, cy + 4)
    ctx.fillText('E', size - 8, cy + 4)
  }, [playerPosition, npcPositions, playerRotation])

  return (
    <div style={{
      position: 'absolute',
      bottom: 70,
      right: 15,
    }}>
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        style={{
          borderRadius: '50%',
          border: '2px solid rgba(68, 170, 255, 0.4)',
          boxShadow: '0 0 20px rgba(0, 100, 255, 0.3)',
        }}
      />
    </div>
  )
}

function SpeedIndicator() {
  const speed = useGameStore((s) => s.speed)
  const isRunning = useGameStore((s) => s.isRunning)

  if (speed === 0) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      right: 210,
      background: 'rgba(0, 0, 0, 0.6)',
      padding: '6px 12px',
      borderRadius: '8px',
      color: isRunning ? '#ff8844' : '#44aaff',
      fontSize: '13px',
      fontWeight: 'bold',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {isRunning ? '🏃 SPRINT' : '🚶 WALK'}
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
      position: 'absolute',
      top: '50%',
      left: 15,
      transform: 'translateY(-50%)',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '15px',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '12px',
      lineHeight: '1.8',
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(5px)',
      maxWidth: '200px',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#44aaff' }}>
        🎮 Controls
      </div>
      <div>WASD / Arrows - Move</div>
      <div>Shift - Sprint</div>
      <div>Space - Jump</div>
      <div>Mouse Drag - Look</div>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#888' }}>
        Click to dismiss
      </div>
    </div>
  )
}
