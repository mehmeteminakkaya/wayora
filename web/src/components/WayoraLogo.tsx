import { useEffect, useRef, useState } from 'react'

type WayoraLogoProps = {
  size?: number
  wordmark?: boolean
  className?: string
}

/**
 * Wayora'nın 3B işareti: koyu W ve sarı rota düğümü.
 * Three.js yalnızca logo görünürken dinamik olarak yüklenir; sürekli bir render
 * döngüsü çalıştırmaz. WebGL yoksa metin tabanlı yedek işaret görünür.
 */
export function WayoraLogo({ size = 30, wordmark = true, className = '' }: WayoraLogoProps) {
  const holderRef = useRef<HTMLSpanElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let renderer: import('three').WebGLRenderer | undefined
    const geometries: import('three').BufferGeometry[] = []
    const materials: import('three').Material[] = []
    const holder = holderRef.current
    if (!holder) return

    void import('three')
      .then((THREE) => {
        if (cancelled || !holder) return

        try {
          const scene = new THREE.Scene()
          scene.background = null

          const camera = new THREE.OrthographicCamera(-1.55, 1.55, 1.55, -1.55, -10, 20)
          camera.position.set(2.55, 1.65, 5.2)
          camera.lookAt(0, 0, 0)

          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
          })
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
          renderer.setSize(size, size, false)
          renderer.outputColorSpace = THREE.SRGBColorSpace
          renderer.domElement.className = 'wayora-canvas'
          renderer.domElement.setAttribute('aria-hidden', 'true')
          holder.appendChild(renderer.domElement)

          const shape = new THREE.Shape()
          const points: Array<[number, number]> = [
            [-1.18, 1.02],
            [-0.7, 1.02],
            [-0.22, -0.58],
            [0, 0.08],
            [0.22, -0.58],
            [0.7, 1.02],
            [1.18, 1.02],
            [0.64, -1.02],
            [0.2, -1.02],
            [0, -0.24],
            [-0.2, -1.02],
            [-0.64, -1.02],
          ]
          shape.moveTo(points[0]![0], points[0]![1])
          for (const point of points.slice(1)) shape.lineTo(point[0], point[1])
          shape.closePath()

          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.26,
            bevelEnabled: true,
            bevelSegments: 2,
            bevelSize: 0.045,
            bevelThickness: 0.045,
          })
          geometry.center()

          const dark = new THREE.MeshStandardMaterial({
            color: 0x121212,
            roughness: 0.34,
            metalness: 0.12,
          })
          const signal = new THREE.MeshStandardMaterial({
            color: 0xffc400,
            roughness: 0.3,
            metalness: 0.08,
          })
          geometries.push(geometry)
          materials.push(dark, signal)

          const mark = new THREE.Mesh(geometry, dark)
          mark.rotation.set(0.16, -0.28, -0.02)
          scene.add(mark)

          const nodeGeometry = new THREE.SphereGeometry(0.15, 20, 12)
          geometries.push(nodeGeometry)
          const node = new THREE.Mesh(nodeGeometry, signal)
          node.position.set(1.03, 1.02, 0.2)
          node.rotation.copy(mark.rotation)
          scene.add(node)

          scene.add(new THREE.AmbientLight(0xffffff, 2.2))
          const key = new THREE.DirectionalLight(0xffffff, 3.4)
          key.position.set(3, 4, 5)
          scene.add(key)
          const rim = new THREE.DirectionalLight(0xffffff, 1.2)
          rim.position.set(-4, -1, 2)
          scene.add(rim)

          renderer.render(scene, camera)
          setReady(true)
        } catch {
          // WebGL yoksa fallback W görünür kalır.
          renderer?.dispose()
          renderer = undefined
        }
      })
      .catch(() => {
        // Ağ/chunk yüklenemezse fallback W görünür kalır.
      })

    return () => {
      cancelled = true
      renderer?.dispose()
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      if (renderer?.domElement.parentElement === holder) {
        holder.removeChild(renderer.domElement)
      }
    }
  }, [size])

  return (
    <span className={`wayora-logo ${className}`.trim()}>
      <span
        ref={holderRef}
        className={`wayora-mark${ready ? ' is-ready' : ''}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {!ready && <span className="wayora-mark-fallback">W</span>}
      </span>
      {wordmark && <span className="wayora-word">WAYORA</span>}
    </span>
  )
}
