import { useRef, useEffect } from 'react'

const keysPressed = {}

export function useKeyboardControls() {
  const keysRef = useRef(keysPressed)

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed[e.code] = true
    }
    const handleKeyUp = (e) => {
      keysPressed[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keysRef
}

export function getMovementVector(keys) {
  let forward = 0
  let right = 0
  let jump = false
  let sprint = false

  if (keys['KeyW'] || keys['ArrowUp']) forward += 1
  if (keys['KeyS'] || keys['ArrowDown']) forward -= 1
  if (keys['KeyA'] || keys['ArrowLeft']) right -= 1
  if (keys['KeyD'] || keys['ArrowRight']) right += 1
  if (keys['Space']) jump = true
  if (keys['ShiftLeft'] || keys['ShiftRight']) sprint = true

  return { forward, right, jump, sprint }
}

export { keysPressed }
