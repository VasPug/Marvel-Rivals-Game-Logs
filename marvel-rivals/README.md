# Game Analysis - Overwolf Data Collectors

A collection of Overwolf-based data collection tools for game analysis, AI training, and performance tracking. This repository contains separate applications for different games, each designed to capture comprehensive match data using the Overwolf Game Events Provider (GEP).

## 📁 Repository Structure

```
.
├── marvel-rivals/     # Marvel Rivals Event Logger
├── dota2/            # Dota 2 Match Logger
└── README.md         # This file
```

## 🎮 Supported Games

### [Marvel Rivals Event Logger](./marvel-rivals/)
**Game ID**: 248901

A real-time event tracking and analysis tool for Marvel Rivals.

**Features:**
- Real-time K/D/A tracking
- 10-second batch processing for AI analysis
- Microphone recording with synchronized timestamps
- Combat statistics visualization
- JSON export for analysis

[→ Read Marvel Rivals Documentation](./marvel-rivals/README.md)

---

### [Dota 2 Match Logger](./dota2/)
**Game ID**: 7314

A comprehensive match data tracking tool for Dota 2 built on Overwolf GEP.

**Features:**
- Complete match data collection
- Hero stats, items, abilities tracking
- Gold, XP, and GPM/XPM monitoring
- Kill logs, purchase logs, and more
- Full Dota 2 match schema support
- JSON export following OpenDota format

[→ Read Dota 2 Documentation](./dota2/README.md)

---

## 🚀 Quick Start

### Prerequisites

1. **Install Overwolf** from [overwolf.com](https://www.overwolf.com)
2. **Become a whitelisted developer** (required for development mode)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/VasPug/Marvel-Rivals-Game-Logs.git
   cd Marvel-Rivals-Game-Logs
   ```

2. Load the app you want to use:
   - Open Overwolf client
   - Go to Settings → Support → Development options
   - Click "Load unpacked extension"
   - Select either the `marvel-rivals/` or `dota2/` folder

3. Start the respective game and the app will auto-launch!

## 🎯 Common Features

All apps in this repository share these features:

### 📊 10-Second Batch Processing
Events are grouped into 10-second batches, making it easy to correlate with audio recordings and analyze specific time periods.

### 🎤 Audio Recording
Synchronized microphone recording with timestamps matching the event batches - perfect for AI voice analysis and coaching.

### 📈 Real-Time Statistics
Live visualization of key stats during gameplay.

### 💾 JSON Export
Clean, structured data export ready for:
- Machine learning training
- Performance analysis
- Replay analysis
- Statistical analysis
- Custom dashboards

### ⏱️ Relative Timestamps
All events include relative timestamps from session start (0, 10, 20 seconds, etc.) for easy audio synchronization.

## 📊 Data Schema

### Dota 2 Complete Data Schema

The Dota 2 logger collects data following this comprehensive schema:

```typescript
interface DotaMatch {
  match_id: number;
  barracks_status_dire: number;
  barracks_status_radiant: number;
  chat?: ChatMessage[];
  cluster: number;
  dire_score: number;
  draft_timings?: DraftTiming[];
  duration: number;
  first_blood_time?: number;
  game_mode: number;
  human_players?: number;
  objectives?: Objective[];
  picks_bans?: PickBan[];
  radiant_score: number;
  radiant_win: boolean;
  start_time: number;
  teamfights?: Teamfight[];
  tower_status_dire: number;
  tower_status_radiant: number;
  players: Player[];
  // ... and more
}

interface Player {
  match_id: number;
  player_slot: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  last_hits: number;
  denies: number;
  gold: number;
  gold_per_min: number;
  xp_per_min: number;
  level: number;
  hero_damage: number;
  hero_healing: number;
  tower_damage: number;
  purchase_log?: PurchaseLog[];
  kills_log?: KillLog[];
  runes_log?: RuneLog[];
  obs_log?: ObserverLog[];
  // ... 100+ more fields
}

interface ChatMessage {
  time: number;
  unit?: string;
  key?: string;
  slot?: number;
  player_slot?: number;
  type?: string;
}

interface KillLog {
  time: number;
  key: string;
}

interface PurchaseLog {
  time: number;
  key: string;
  charges?: number;
}

interface ObserverLog {
  time: number;
  type: string;
  slot: number;
  x: number;
  y: number;
  z: number;
  entityleft: boolean;
  ehandle: number;
  key: string;
  player_slot: number;
  attackername?: string;
}

interface Teamfight {
  start: number;
  end: number;
  last_death: number;
  deaths: number;
  players: TeamfightPlayer[];
}

// And many more interfaces for comprehensive data collection
```

See [dota2/README.md](./dota2/README.md) for complete schema documentation.

## 🎯 Use Cases

### AI & Machine Learning
- Train voice recognition models with synchronized audio and events
- Analyze decision-making patterns
- Predict match outcomes
- Performance coaching AI

### Performance Analysis
- Track improvement over time
- Identify strengths and weaknesses
- Compare strategies across matches
- Analyze teamfight effectiveness

### Content Creation
- Generate highlight clips with event markers
- Create data-driven content
- Automated match summaries
- Statistical breakdowns

### Research
- Game balance analysis
- Meta analysis
- Player behavior studies
- Strategy effectiveness

## 🔧 Development

### Adding a New Game

1. Create a new folder with the game name
2. Copy the structure from an existing game folder
3. Update `manifest.json` with the new game ID
4. Modify `index.js` to collect game-specific events
5. Update `index.html` for game-specific UI
6. Add documentation in the game's README.md

### Required Files

Each game folder should contain:
- `manifest.json` - Overwolf app configuration
- `index.html` - UI and layout
- `index.js` - Core logic and event handling
- `README.md` - Game-specific documentation
- Image assets (icon.png, etc.)

## 📚 Resources

- [Overwolf Documentation](https://overwolf.github.io/)
- [Overwolf GEP Documentation](https://dev.overwolf.com/ow-native/live-game-data-gep/)
- [Dota 2 GEP Events](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/dota-2/)
- [Marvel Rivals GEP Events](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/marvel-rivals/)

## 🤝 Contributing

Contributions are welcome! To add support for a new game:

1. Fork the repository
2. Create a new folder for the game
3. Implement the data collection based on Overwolf GEP
4. Test thoroughly
5. Submit a pull request

## 📝 Notes

- You must be a whitelisted Overwolf developer to load unpacked extensions
- Each app runs independently - load only the one you need
- Microphone permissions must be granted for audio recording
- All data is stored locally and exported manually

## 🐛 Troubleshooting

### App doesn't launch with game
- Check that the game ID in manifest.json is correct
- Verify Overwolf is running
- Try manually launching the app from Overwolf dock

### No events being captured
- Make sure you're in an active match (not menu)
- Check that required features are set correctly
- Look for errors in the developer console (F12)

### Export has no data
- Make sure you clicked "Start Logging" before playing
- Verify events are appearing in the log window
- Check that logging is active (green status)

## 📄 License

This project is open source. See individual game folders for specific details.

## 👤 Author

**Vasanth**

## 🙏 Acknowledgments

- Overwolf for the Game Events Provider API
- The gaming community for feedback and testing
