"use client"

import { useMemo, useState, useEffect } from "react"

/**
 * ECC Simulation Website – Single File React App
 * -------------------------------------------------
 * Educational demo of ECC (Elliptic Curve Cryptography) using a small toy curve
 * over a finite field for visualization + an ECIES-like encryption flow (XOR with
 * keystream derived from ECDH). NOT CRYPTOGRAPHICALLY SECURE. For learning only.
 *
 * Curve parameters (toy curve): y^2 = x^3 + ax + b mod p
 * p = 97, a = 2, b = 3
 * A convenient base point G = (0, 10) with order n = 50 (on this curve).
 * Group size is small so we can visualize points; do NOT use in production.
 */

// ---------- Math helpers (mod p) ----------
const p = 97n
const a = 2n
const b = 3n
const G = { x: 0n, y: 10n }
const n = 50n

function mod(x) {
  const m = x % p
  return m >= 0n ? m : m + p
}

function inv(x) {
  return mod(pow(x, p - 2n))
}

function pow(base, exp) {
  let result = 1n
  let b = mod(base)
  let e = exp
  while (e > 0n) {
    if (e & 1n) result = mod(result * b)
    b = mod(b * b)
    e >>= 1n
  }
  return result
}

function isOnCurve(P) {
  if (!P) return true
  const { x, y } = P
  return mod(y * y) === mod(x * x * x + a * x + b)
}

const INF = null

function eq(P, Q) {
  if (P === INF && Q === INF) return true
  if (P === INF || Q === INF) return false
  return P.x === Q.x && P.y === Q.y
}

function negate(P) {
  if (P === INF) return INF
  return { x: P.x, y: mod(-P.y) }
}

function add(P, Q) {
  if (P === INF) return Q
  if (Q === INF) return P
  if (P.x === Q.x && mod(P.y + Q.y) === 0n) return INF

  let m
  if (!eq(P, Q)) {
    m = mod((Q.y - P.y) * inv(mod(Q.x - P.x)))
  } else {
    m = mod((3n * P.x * P.x + a) * inv(mod(2n * P.y)))
  }
  const x3 = mod(m * m - P.x - Q.x)
  const y3 = mod(m * (P.x - x3) - P.y)
  return { x: x3, y: y3 }
}

function mul(k, P) {
  let N = P
  let R = INF
  let kk = k
  while (kk > 0n) {
    if (kk & 1n) R = add(R, N)
    N = add(N, N)
    kk >>= 1n
  }
  return R
}

function enumerateCurvePoints() {
  const pts = []
  for (let xv = 0n; xv < p; xv++) {
    const rhs = mod(xv * xv * xv + a * xv + b)
    for (let yv = 0n; yv < p; yv++) {
      if (mod(yv * yv) === rhs) pts.push({ x: xv, y: yv })
    }
  }
  return pts
}

function lcgKeystream(seed32, length) {
  const out = new Uint8Array(length)
  let state = seed32 >>> 0
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    out[i] = state & 0xff
  }
  return out
}

function utf8Encode(str) {
  return new TextEncoder().encode(str)
}

function utf8Decode(bytes) {
  return new TextDecoder().decode(bytes)
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex) {
  const clean = hex.replace(/[^0-9a-f]/gi, "")
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(2 * i, 2 * i + 2), 16)
  return out
}

function xorBytes(a, b) {
  const out = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i]
  return out
}

function sharedSecretX(P) {
  if (!P || P === INF) return 0
  const x = Number(P.x % 4294967291n)
  return x >>> 0
}

function randBetween(min, max) {
  const range = max - min + 1n
  const r = BigInt(Math.floor(Math.random() * Number(range)))
  return min + r
}

function PointBadge({ P, label, color = "bg-primary" }) {
  if (!P) return null
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white ${color} animate-bounce-in shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-xs opacity-90">
        ({P.x.toString()}, {P.y.toString()})
      </span>
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 hover:border-primary/50 transition-all duration-300 animate-float-up hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
      <div className="text-xs uppercase tracking-widest text-foreground/60 font-semibold">{title}</div>
      <div className="mt-2 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
        {value}
      </div>
    </div>
  )
}

function Button({ children, onClick, variant = "primary" }) {
  const classes =
    variant === "ghost"
      ? "px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-foreground font-medium transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 active:scale-95 hover:scale-105"
      : "px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 text-white font-semibold transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden group"
  return (
    <button onClick={onClick} className={classes}>
      {variant === "primary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <span className="relative">{children}</span>
    </button>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border/50 bg-input/50 backdrop-blur-sm px-4 py-2 text-foreground placeholder-foreground/40 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/30 hover:border-primary/30"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-border/50 bg-input/50 backdrop-blur-sm px-4 py-2 text-foreground placeholder-foreground/40 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 focus:shadow-lg focus:shadow-primary/30 hover:border-primary/30 resize-none"
    />
  )
}

function CurvePlot({ points, highlight = [], width = 480, height = 360 }) {
  const margin = 24
  const scaleX = (x) => (Number(x) / (Number(p) - 1)) * (width - 2 * margin) + margin
  const scaleY = (y) => height - ((Number(y) / (Number(p) - 1)) * (height - 2 * margin) + margin)

  return (
    <svg
      width={width}
      height={height}
      className="rounded-xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300"
    >
      {/* animated background grid */}
      <defs>
        <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.05)" />
          <stop offset="100%" stopColor="rgba(251, 146, 60, 0.05)" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="url(#gridGradient)" />

      {/* grid */}
      <g opacity={0.15}>
        {[...Array(6)].map((_, i) => (
          <line
            key={"v" + i}
            x1={(i * width) / 5}
            y1={0}
            x2={(i * width) / 5}
            y2={height}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <line
            key={"h" + i}
            x1={0}
            y1={(i * height) / 5}
            x2={width}
            y2={(i * height) / 5}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* curve points with animation */}
      <g>
        {points.map((P, idx) => (
          <circle
            key={idx}
            cx={scaleX(P.x)}
            cy={scaleY(P.y)}
            r={2}
            fill="rgba(139, 92, 246, 0.4)"
            opacity={0.5}
            style={{
              animation: `point-pulse ${2 + (idx % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(idx % 5) * 0.1}s`,
            }}
          />
        ))}
      </g>

      {/* highlights with glow */}
      <g>
        {highlight.map(({ P, color, label }, i) =>
          P ? (
            <g key={i}>
              <circle
                cx={scaleX(P.x)}
                cy={scaleY(P.y)}
                r={7}
                fill={color}
                opacity={0.2}
                style={{
                  animation: "glow-pulse 2s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
              <circle cx={scaleX(P.x)} cy={scaleY(P.y)} r={5} fill={color} />
              {label && (
                <text
                  x={scaleX(P.x) + 12}
                  y={scaleY(P.y) - 10}
                  fontSize={12}
                  fill="#fff"
                  fontWeight="bold"
                  style={{
                    animation: "float-up 0.6s ease-out",
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {label}
                </text>
              )}
            </g>
          ) : null,
        )}
      </g>
    </svg>
  )
}

export default function App() {
  const curvePoints = useMemo(() => enumerateCurvePoints(), [])

  const [priv, setPriv] = useState(() => randBetween(1n, n - 1n))
  const pub = useMemo(() => mul(priv, G), [priv])

  const [plaintext, setPlaintext] = useState("Hello ECC 👋")
  const [ephemeralK, setEphemeralK] = useState(() => randBetween(1n, n - 1n))

  const [C1, setC1] = useState(null)
  const [cipherHex, setCipherHex] = useState("")

  const [C1Input, setC1Input] = useState("")
  const [cipherInput, setCipherInput] = useState("")
  const [decrypted, setDecrypted] = useState("")

  const highlights = useMemo(() => {
    const list = []
    if (G) list.push({ P: G, color: "#10b981", label: "G" })
    if (pub) list.push({ P: pub, color: "#3b82f6", label: "Q" })
    if (C1) list.push({ P: C1, color: "#f59e0b", label: "C1" })
    return list
  }, [pub, C1])

  function regenKeys() {
    setPriv(randBetween(1n, n - 1n))
  }

  function encrypt() {
    const Q = pub
    if (!Q) return

    const k = ephemeralK
    const C1p = mul(k, G)
    const shared = mul(k, Q)
    const seed = sharedSecretX(shared)

    const msg = utf8Encode(plaintext)
    const ks = lcgKeystream(seed, msg.length)
    const ct = xorBytes(msg, ks)

    setC1(C1p)
    setCipherHex(toHex(ct))
    setC1Input(`${C1p?.x?.toString() || ""},${C1p?.y?.toString() || ""}`)
    setCipherInput(toHex(ct))
  }

  function decrypt() {
    try {
      const [xStr, yStr] = C1Input.split(",").map((s) => s.trim())
      const C1point = {
        x: BigInt(xStr),
        y: BigInt(yStr),
      }
      if (!isOnCurve(C1point)) throw new Error("C1 is not on curve")

      const shared = mul(priv, C1point)
      const seed = sharedSecretX(shared)
      const ct = fromHex(cipherInput)
      const ks = lcgKeystream(seed, ct.length)
      const pt = xorBytes(ct, ks)
      setDecrypted(utf8Decode(pt))
    } catch (e) {
      setDecrypted("(error) " + e.message)
    }
  }

  useEffect(() => {
    if (C1Input && cipherInput) decrypt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [C1Input, cipherInput, priv])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float-bounce" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <header className="mb-12 animate-slide-in-left">
          <div className="mb-2 inline-block animate-bounce-in">
            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-sm font-semibold text-primary hover:bg-primary/30 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300">
              🔐 Cryptography Simulator
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-neon-glow">
            ECC Encryption
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl animate-slide-up stagger-1">
            Interactive visualization of Elliptic Curve Cryptography. Watch how points move on the curve as you encrypt
            and decrypt messages.
          </p>
        </header>

        {/* Top: Curve plot & Key generation */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Curve visualization */}
          <div
            className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 animate-slide-in-left hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold animate-slide-down">Elliptic Curve Visualization</h2>
              <div className="flex gap-2 animate-fade-in-scale">
                <div className="flex items-center gap-2 text-sm hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-scale" />
                  <span>Base G</span>
                </div>
                <div className="flex items-center gap-2 text-sm hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse-scale" />
                  <span>Public Q</span>
                </div>
                <div className="flex items-center gap-2 text-sm hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse-scale" />
                  <span>Ephemeral C1</span>
                </div>
              </div>
            </div>
            <CurvePlot points={curvePoints} highlight={highlights} />
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat title="Points on Curve" value={`${curvePoints.length}`} />
              <Stat title="Order of G" value={n.toString()} />
              <Stat title="Prime p" value={p.toString()} />
            </div>
          </div>

          {/* Key generation */}
          <div
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 animate-slide-in-right hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-xl font-bold mb-6 animate-rotate-in">Key Generation</h2>
            <div className="space-y-4">
              <div className="animate-slide-up stagger-1">
                <label className="text-sm font-semibold text-foreground/70 block mb-2">Private Key (d)</label>
                <div className="flex gap-2">
                  <Input
                    value={priv.toString()}
                    onChange={(v) => {
                      try {
                        const vv = BigInt(v || "0")
                        if (vv >= 1n && vv < n) setPriv(vv)
                      } catch {}
                    }}
                    placeholder="1…n-1"
                  />
                  <Button onClick={regenKeys}>Random</Button>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50 animate-slide-up stagger-2">
                <div className="text-sm font-semibold text-foreground/70 mb-3">Public Key</div>
                {pub && <PointBadge P={pub} label="Q = d·G" color="bg-blue-500" />}
              </div>
              <p className="text-xs text-foreground/50 pt-2 animate-slide-up stagger-3">
                Change d to see Q move on the curve in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Encrypt / Decrypt workflow */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Encrypt */}
          <div
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 animate-slide-in-left hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            style={{ animationDelay: "0.3s" }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 animate-bounce-in">
              <span className="text-2xl">📤</span> Encrypt
            </h2>
            <div className="space-y-4">
              <div className="animate-slide-up stagger-1">
                <label className="text-sm font-semibold text-foreground/70 block mb-2">Message</label>
                <Textarea value={plaintext} onChange={setPlaintext} placeholder="Enter plaintext" rows={2} />
              </div>
              <div className="animate-slide-up stagger-2">
                <label className="text-sm font-semibold text-foreground/70 block mb-2">Ephemeral k</label>
                <div className="flex gap-2">
                  <Input
                    value={ephemeralK.toString()}
                    onChange={(v) => {
                      try {
                        const vv = BigInt(v || "0")
                        if (vv >= 1n && vv < n) setEphemeralK(vv)
                      } catch {}
                    }}
                    placeholder="1…n-1"
                  />
                  <Button onClick={() => setEphemeralK(randBetween(1n, n - 1n))}>Random</Button>
                </div>
              </div>
              <div className="flex gap-2 pt-2 animate-slide-up stagger-3">
                <Button onClick={encrypt}>Encrypt</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setC1(null)
                    setCipherHex("")
                  }}
                >
                  Clear
                </Button>
              </div>
              {C1 && (
                <div className="pt-4 border-t border-border/50 space-y-3 animate-bounce-in">
                  <PointBadge P={C1} label="C1 = k·G" color="bg-amber-500" />
                  <div>
                    <div className="text-xs font-semibold text-foreground/70 mb-2">Ciphertext (hex)</div>
                    <div className="rounded-lg bg-black/30 p-3 font-mono text-xs break-all border border-border/50 max-h-24 overflow-y-auto hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
                      {cipherHex || ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transmit */}
          <div
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 animate-slide-in-left hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 animate-bounce-in">
              <span className="text-2xl">📡</span> Transmit
            </h2>
            <div className="space-y-4">
              <div className="animate-slide-up stagger-1">
                <label className="text-sm font-semibold text-foreground/70 block mb-2">C1 Point (x,y)</label>
                <Input value={C1Input} onChange={setC1Input} placeholder="e.g., 12,34" />
              </div>
              <div className="animate-slide-up stagger-2">
                <label className="text-sm font-semibold text-foreground/70 block mb-2">Ciphertext (hex)</label>
                <Textarea value={cipherInput} onChange={setCipherInput} rows={4} placeholder="hex bytes" />
              </div>
              <p className="text-xs text-foreground/50 pt-2 animate-slide-up stagger-3">
                Sender shares (C1, ciphertext) with receiver over any channel.
              </p>
            </div>
          </div>

          {/* Decrypt */}
          <div
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 animate-slide-in-right hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            style={{ animationDelay: "0.5s" }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 animate-bounce-in">
              <span className="text-2xl">📥</span> Decrypt
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-foreground/70 animate-slide-up stagger-1">
                Uses private key d and C1 to derive the shared secret and recover the message.
              </p>
              <Button onClick={decrypt}>Decrypt Message</Button>
              <div className="pt-4 border-t border-border/50 animate-slide-up stagger-2">
                <div className="text-xs font-semibold text-foreground/70 mb-2">Decrypted Message</div>
                <div className="rounded-lg bg-black/30 p-3 font-mono text-sm break-all border border-border/50 min-h-20 flex items-center justify-center hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
                  {decrypted ? (
                    <span className="text-accent font-semibold animate-pulse-ring">{decrypted}</span>
                  ) : (
                    <span className="text-foreground/40">Waiting for input...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-12 rounded-2xl border border-accent/30 bg-accent/10 backdrop-blur-sm p-6 animate-float-up hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/30"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex gap-3">
            <span className="text-2xl animate-bounce-in">⚠️</span>
            <div>
              <div className="font-bold text-lg mb-2 animate-slide-down">Educational Demo Only</div>
              <ul className="space-y-1 text-sm text-foreground/80">
                <li className="animate-slide-up stagger-1">
                  • This uses a tiny curve (p = 97) and simple keystream —{" "}
                  <span className="font-semibold">NOT secure</span>
                </li>
                <li className="animate-slide-up stagger-2">
                  • Real systems use standardized curves (P-256, Curve25519) and strong KDFs/AEs (HKDF + AES-GCM)
                </li>
                <li className="animate-slide-up stagger-3">
                  • Try changing d and k to see how points Q and C1 move on the curve
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
