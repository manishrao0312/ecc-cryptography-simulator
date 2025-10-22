# 🔐 ECC Cryptography Simulator

**Interactive visualization of Elliptic Curve Cryptography (ECC)** — watch how encryption and decryption work in real-time using points on an elliptic curve.

👉 **Live Demo:** [https://ecc-cryptography-simulator-z1ik-97lc8gp3z-manish-raos-projects.vercel.app/]

---

## 🧠 Overview

This project is an **educational web-based simulator** that demonstrates how **Elliptic Curve Cryptography (ECC)** works.  
It visually shows how private and public keys are generated, how messages are encrypted and decrypted, and how both parties compute the same shared secret securely.

The simulator is built with **Next.js**, **TypeScript**, and **Tailwind CSS**, and deployed via **Vercel**.

---

## 🧩 Features

✅ Interactive ECC visualization  
✅ Key generation (`d`, `Q = d·G`)  
✅ Encryption and decryption workflow  
✅ Real-time point movement on elliptic curve  
✅ Educational explanations and warnings  
✅ Deployed with Vercel for instant web access  

---

## ⚙️ Technology Stack

| Category | Technology |
|-----------|-------------|
| Frontend Framework | **Next.js** (React + TypeScript) |
| Styling | **Tailwind CSS** |
| Deployment | **Vercel** |
| Language | TypeScript |
| Package Manager | npm / pnpm |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/manishrao0312/ecc-cryptography-simulator.git
cd ecc-cryptography-simulator
```

### 2️⃣ Install Dependencies
Using npm (recommended):
```bash
npm install
```

or with pnpm:
```bash
pnpm install
```

### 3️⃣ Run the Development Server
```bash
npm run dev
```

Now open your browser and visit:
```
http://localhost:3000
```

---

## 🌐 Deployment

This app is deployed on **Vercel**.  
To deploy your own version:

1. Fork or clone the repo  
2. Go to [Vercel.com](https://vercel.com)  
3. Import the repository  
4. Set **Framework Preset** to “Next.js”  
5. Deploy — done 🎉

---

## 🧮 How It Works

The simulator uses a toy elliptic curve equation:
```
y² = x³ + 2x + 3 (mod 97)
```

- **Base Point (G):** Starting point on the curve  
- **Private Key (d):** Random integer between 1 and n-1  
- **Public Key (Q = d·G):** Point derived from the private key  
- **Ephemeral Key (k):** Temporary key for each message  
- **Shared Secret:** Computed as `k·Q` (for sender) or `d·C1` (for receiver)

The system visually shows:
- 🟢 Base Point (G)
- 🔵 Public Key (Q)
- 🟠 Ephemeral Point (C1)
- ⚪ All valid curve points

Both sender and receiver compute the same shared secret — even though an attacker only sees G, Q, and C1.

---

## ⚠️ Educational Disclaimer

> This simulator uses a **small elliptic curve** (p = 97, n = 50) for visualization only.  
> It is **NOT cryptographically secure** and should not be used for real encryption.  
> Real-world systems use standardized curves like **secp256r1 (P-256)** or **Curve25519**, along with strong symmetric ciphers such as **AES-GCM** or **ChaCha20-Poly1305**.

---

## 📘 Example Flow

1️⃣ Choose a private key `d` → generates a public key `Q = d·G`  
2️⃣ Type a message → generate ephemeral key `k`  
3️⃣ Encrypt → compute `C1 = k·G`, `shared = k·Q` → ciphertext  
4️⃣ Decrypt → compute `shared = d·C1` → recover plaintext  

---

## 🧑‍💻 Author

**Manish Rao**  
📧 [manishmahesh456@gmail.com](mailto:manishmahesh456@gmail.com)  
🌐 [GitHub: manishrao0312](https://github.com/manishrao0312)

---

## ⭐ Acknowledgments

- Inspired by ECC concepts from **ECIES** (Elliptic Curve Integrated Encryption Scheme)  
- Built to make cryptography **visual and intuitive**  
- Educational resource for students learning about **modern encryption**

---

### 💡 “The beauty of ECC is in its simplicity — multiply points, share secrets, protect data.”
