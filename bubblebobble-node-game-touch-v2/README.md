# BubbleBobble Node Game (Touch-enabled) — v2
Node.js (Express + Socket.IO) server + Vite/Phaser client.

**New in v2**
- Level Select screen (3 sample levels)
- Combo multipliers (time-based): chain pops within 1.2s to increase multiplier
- Sound effects via WebAudio (no assets needed): pop, shoot, combo chime
- Fixed `render.yaml` so Render finds the right package.json

## Deploy on Render (no terminal)
1. Create GitHub repo and upload contents of this zip.
2. On Render: New → Blueprint → pick your repo → Create.
3. Render builds `client/` and installs `server/`, then runs `node server/index.js`.

## Local (optional)
```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start
# http://localhost:3000
```
