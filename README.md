# 🖼️ My Library — Public Domain Image Gallery

> A beautiful, dark-themed image discovery platform. Search and explore thousands of copyright-free images from The MET Museum, Harvard Art Museums, Unsplash, and Rijksmuseum — all in one place.

**Built by [DevenGajjar](https://github.com/DevenGajjar)**

---

## ✨ What It Does

- 🔍 Search across multiple public domain image sources simultaneously
- 🌊 Infinite scroll — images load automatically as you scroll
- 🧠 Click tracking — popular images rank higher over time
- 🎨 Masonry grid layout with smooth hover animations
- ⚡ Results cached so repeat searches are instant
- 🌑 Dark editorial aesthetic inspired by cosmos.so/public-work

---

## 🗂️ Image Sources

| Source | Type | API Key |
|---|---|---|
| The MET Museum | Artworks, paintings, prints | ❌ Not needed |
| Harvard Art Museums | Classical art, artifacts | ✅ Free |
| Rijksmuseum | Dutch masters, open linked data | ❌ Not needed |
| Unsplash | Modern photography | ✅ Free |

---

## 🛠️ Tech Stack

**Frontend**
- React + TypeScript
- TanStack Start (Vite)
- Tailwind CSS
- Intersection Observer API (infinite scroll)
- CSS Columns (masonry grid)

**Backend**
- Python + FastAPI
- httpx (async HTTP calls)
- asyncio.gather (parallel API fetching)
- In-memory cache + click tracking
- python-dotenv

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Clone the repo

```bash
git clone https://github.com/DevenGajjar/my-library.git
cd my-library
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Fill in your API keys in `backend/.env`:

```env
UNSPLASH_ACCESS_KEY=your_key_here
HARVARD_API_KEY=your_key_here
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Setup Frontend

Open a second terminal:

```bash
cd my-library
npm install
npm run dev
```

### 4. Open the site

```
Frontend  →  http://localhost:8080
Backend   →  http://localhost:8000
API Docs  →  http://localhost:8000/docs
```

---

## 🔑 Getting Free API Keys

| Service | Link |
|---|---|
| Unsplash | [unsplash.com/developers](https://unsplash.com/developers) |
| Harvard Art Museums | [harvardartmuseums.org/collections/api](https://harvardartmuseums.org/collections/api) |

> MET and Rijksmuseum are fully open — no signup needed.

---

## 📁 Project Structure

```
my-library/
├── src/
│   ├── hooks/
│   │   └── useImagePool.ts       # Infinite scroll + fetch logic
│   ├── routes/
│   │   └── index.tsx             # Main gallery page
│   └── styles.css                # Global styles
│
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── routers/
│   │   └── images.py             # API routes (/api/images)
│   ├── services/
│   │   ├── met.py                # The MET Museum API
│   │   ├── harvard.py            # Harvard Art Museums API
│   │   ├── unsplash.py           # Unsplash API
│   │   └── rijksmuseum.py        # Rijksmuseum linked data
│   ├── cache/
│   │   └── store.py              # In-memory cache + click tracking
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/images` | Fetch images with search + pagination |
| POST | `/api/images/{id}/click` | Track image click |
| GET | `/api/health` | Backend health check |

**Example:**
```
GET http://localhost:8000/api/images?q=botanical&page=0&per_page=16
```

---

## 🧠 How the Algorithm Works

1. User searches a query
2. Backend hits all 4 sources **in parallel** (asyncio.gather)
3. Results are merged and shuffled
4. Images get a +1 click score every time someone clicks them
5. On next search, popular images rank higher automatically
6. Results are cached for 1 hour — same search = instant response

---

## 📜 License

All images are public domain or open license. Built for educational and personal use.

---

<p align="center">Made with ☕ by <a href="https://github.com/DevenGajjar">DevenGajjar</a></p>
