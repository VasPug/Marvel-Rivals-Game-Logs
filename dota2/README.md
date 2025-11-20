# Dota 2 Match Logger

A comprehensive match data tracking and analysis tool for Dota 2 built with Overwolf GEP (Game Events Provider). Perfect for AI analysis, gameplay review, and performance tracking.

## 🎮 What It Does

- **Real-time Match Data Tracking**: Captures all match events, player stats, and game state
- **10-Second Batch Processing**: Groups events into 10-second intervals for AI analysis
- **Comprehensive Data Collection**: Tracks kills, deaths, assists, gold, XP, items, and more
- **Audio Recording**: Synchronized microphone recording for voice analysis
- **JSON Export**: Clean data export for analysis and AI training

## 🚀 Features

### Match Data Tracking

- ✅ Player kills, deaths, and assists
- ✅ Gold, XP, and GPM/XPM tracking
- ✅ Hero level progression
- ✅ Last hits and denies
- ✅ Item purchases and usage
- ✅ Kill log with timestamps
- ✅ Live match statistics display

### Logging Control

- ▶️ **Start/Stop Logging** - Manual control over when to track events
- 🎯 **Precise Timing** - Start logging exactly when you want
- 🧹 **Clean Data** - No pre-match or setup noise in exports
- 📊 **Session-based** - Each logging session is independent

### Batch Processing

- 📦 10-second event batches
- 🎯 Player action detection per batch
- ⏰ Relative timestamps for audio matching
- 📊 Batch summaries with action flags
- 🔄 **Real-time stat tracking** - Accurate change detection

### Export & Analysis

- 📄 Clean JSON export (no debug noise)
- 🎵 Audio-ready timestamps
- 📈 Session statistics
- 🤖 AI analysis format
- 🎮 **Live stats panel** - Visual K/D/A tracking

## 🛠️ How It Works

### 1. Game Detection

- Monitors for Dota 2 (Game ID: 7314)
- Automatically connects when game starts
- Sets up required Overwolf GEP features

### 2. Event Capture

- Listens for game events via Overwolf API
- Tracks match state changes and player actions
- Logs all events with timestamps

### 3. Data Collection

Based on Overwolf Dota 2 GEP, the following data is collected:

#### Match Events
- Match start/end
- Match state changes
- Game time and daytime changes

#### Player Stats
- Kills, deaths, assists
- Gold, GPM, XPM
- Hero level
- Last hits, denies
- Hero damage and healing
- Tower damage

#### Hero Events
- Ability usage and leveling
- Item changes and usage
- Health/mana status
- Buyback information
- Status effects

#### Game Logs
- Kill log with timestamps
- Purchase log
- Rune pickups
- Observer ward placement

### 4. Data Export

The exported JSON follows the Dota 2 match data schema:

```typescript
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
  // ... and many more fields
}
```

## 📊 JSON Export Format

```json
{
  "session_info": {
    "timestamp": "2024-01-15T15:30:00.000Z",
    "total_batches": 180,
    "match_id": 123456789
  },
  "match": {
    "match_id": 123456789,
    "player": {
      "kills": 12,
      "deaths": 5,
      "assists": 18,
      "gold": 25000,
      "level": 25,
      "hero_id": 1,
      "gold_per_min": 650,
      "xp_per_min": 720
    },
    "kill_log": [...],
    "purchase_log": [...],
    "chat": [...]
  },
  "batch_summaries": [...],
  "key_events": [...]
}
```

## 🚀 Installation

1. **Install Overwolf** from [overwolf.com](https://www.overwolf.com)
2. Open the Overwolf desktop client settings
3. Click on "Development options"
4. Click "Load unpacked extension" and select the `dota2` folder
5. **Start Dota 2** - app will auto-connect

**Note**: You must be a whitelisted developer by Overwolf first.

## 📁 File Structure

```
dota2/
├── manifest.json          # Overwolf app configuration
├── index.html             # Main UI
├── index.js               # Core logic and event handling
├── icon.png               # App icon
└── README.md              # This file
```

## 🎯 Usage

1. **Launch the app** in Overwolf
2. **Start Dota 2** - app detects game automatically
3. **Click "Start Logging"** - begins tracking events and batch processing
4. **Play your match** - all data is tracked in real-time
5. **Click "Stop Logging"** - stops tracking and processes final batch
6. **Click "Export Match Data"** - downloads complete match data as JSON

## 🔧 Technical Details

### Overwolf GEP Features Used

Based on the [Dota 2 GEP documentation](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/dota-2/):

- Game state tracking
- Match state changes
- Kill/Death/Assist events
- Gold, XP, CS tracking
- Hero level and ability events
- Item events
- Match info and roster data

### Event Types Tracked

- `kill` - Player gets a kill
- `death` - Player dies
- `assist` - Player gets an assist
- `cs` - Last hit/creep score
- `gold` - Gold changes
- `gpm` - Gold per minute
- `xpm` - Experience per minute
- `hero_leveled_up` - Level up event
- `hero_item_changed` - Item purchase/change
- And many more...

### Batch Processing

- **Interval**: 10 seconds
- **Detection**: Stat changes within batch
- **Flags**: `died`, `killed`, `assisted`, `leveled_up` per batch
- **Timestamps**: Both absolute and relative
- **Accuracy**: Compares current stats vs batch start stats

## 🤖 AI Analysis Ready

The exported JSON is optimized for AI analysis:

- **Clean data** - No debug/setup noise
- **Batch structure** - 10-second intervals
- **Action flags** - Clear player actions per batch
- **Audio timestamps** - Easy audio matching
- **Event timeline** - Complete event history
- **Dota 2 Schema** - Follows standard match data format

## 📚 Data Schema

The data collection follows the standard Dota 2 match data interfaces. See the main README for complete TypeScript interface definitions including:

- `DotaMatch` - Complete match data
- `Player` - Player statistics and actions
- `ChatMessage` - In-game chat
- `KillLog` - Kill events with timestamps
- `PurchaseLog` - Item purchases
- `Teamfight` - Teamfight data
- And more...

## 🎵 Audio Matching

Perfect for AI analysis with audio clips:

- **Audio 0-10s** → Batch with `start_seconds: 0, end_seconds: 10`
- **Audio 10-20s** → Batch with `start_seconds: 10, end_seconds: 20`
- **Simple alignment** - No complex calculations needed

## 🐛 Troubleshooting

1. **No events being received**
   - Make sure you're in an active match
   - Check that Overwolf is running
   - Try restarting the app

2. **Microphone not recording**
   - Grant microphone permissions to Overwolf
   - Check your default microphone in system settings

3. **Export contains no data**
   - Make sure you clicked "Start Logging" before playing
   - Check that events are appearing in the log window

## 📝 License

Same as parent project.
