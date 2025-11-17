# Marvel Rivals Event Logger

A real-time event tracking and analysis tool for Marvel Rivals built with Overwolf. Perfect for AI analysis, gameplay review, and performance tracking.

## 🎮 What It Does

- **Real-time Event Tracking**: Captures kills, deaths, assists, and match events
- **10-Second Batch Processing**: Groups events into 10-second intervals for AI analysis
- **Audio-Ready Timestamps**: Provides relative timestamps (0, 10, 20 seconds) for easy audio matching
- **Combat Statistics**: Live K/D/A tracking with visual display
- **JSON Export**: Clean data export for analysis and AI training

## 🚀 Features

### Event Tracking

- ✅ Player kills, deaths, and assists
- ✅ Match start/end events
- ✅ Round start/end events
- ✅ Kill feed (who killed whom)
- ✅ Real-time roster updates
- ✅ Live combat stats display with K/D ratio

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

- Monitors for Marvel Rivals (Game ID: 248901)
- Automatically connects when game starts
- Sets up required Overwolf features

### 2. Event Capture

- Listens for game events via Overwolf API
- Tracks roster updates for stat changes
- Logs all events with timestamps

### 3. Batch Processing

- Groups events into 10-second intervals
- Detects player actions (died/killed/assisted)
- Creates batch summaries for AI analysis

### 4. Data Export

- Filters out setup/debug events
- Exports only gameplay-relevant data
- Provides both absolute and relative timestamps

## 📊 JSON Export Format

```json
{
  "session_info": {
    "timestamp": "2024-01-15T15:30:00.000Z",
    "total_batches": 120,
    "final_stats": {
      "kills": 15,
      "deaths": 8,
      "assists": 12
    }
  },
  "batch_summaries": [
    {
      "batch_id": "batch_1735659917",
      "start_seconds": 0,
      "end_seconds": 10,
      "duration_seconds": 10,
      "player_actions": {
        "died": true,
        "killed": false,
        "assisted": true,
        "deaths_gained": 1,
        "kills_gained": 0,
        "assists_gained": 1
      },
      "events": [
        /* events in this batch */
      ]
    }
  ],
  "key_events": [
    /* important gameplay events */
  ]
}
```

## 🎵 Audio Matching

Perfect for AI analysis with audio clips:

- **Audio 0-10s** → Batch with `start_seconds: 0, end_seconds: 10`
- **Audio 10-20s** → Batch with `start_seconds: 10, end_seconds: 20`
- **Simple alignment** - No complex calculations needed

## 🚀 Installation

1. **Install Overwolf** from [overwolf.com](https://www.overwolf.com)
2. Open the Overwolf desktop client settings (by right-clicking the client and selecting "Packages" Or by clicking on the wrench icon in the dock and going to the "About" tab => "Development Options").
3. Click on "Development options".
4. In the opened window, click on "Load unpacked extension" and select the app's root folder. Make sure you are logged in to the OW client. Otherwise, you will get an "Unauthorized App" error message. (Click on the "Appstore" icon in the OW dock to login to the OW client).
5. **Start Marvel Rivals** - app will auto-connect

YOU MUST BE A WHITELISTED DEVELOPER BY OVERWOLF FIRST

## 📁 File Structure

```
marvel-rivals-logger/
├── manifest.json          # Overwolf app configuration
├── index.html             # Main UI
├── index.js               # Core logic and event handling
├── icon.png               # App icon
└── README.md              # This file
```

## 🎯 Usage

1. **Launch the app** in Overwolf
2. **Start Marvel Rivals** - app detects game automatically
3. **Click "Start Logging"** - begins tracking events and batch processing
4. **Play matches** - events are tracked in real-time with live stats display
5. **Click "Stop Logging"** - stops tracking and processes final batch
6. **Click "Export Events as JSON"** - downloads clean analysis data

## 🔧 Technical Details

### Overwolf Features Used

- `gep_internal` - Core game events
- `match_info` - Match and roster data
- `game_info` - Game state information

### Event Types Tracked

- `kill` - Player gets a kill
- `death` - Player dies
- `assist` - Player gets an assist
- `kill_feed` - Any player death in match
- `match_start/end` - Match events
- `round_start/end` - Round events

### Batch Processing

- **Interval**: 10 seconds
- **Detection**: Stat changes within batch (fixed calculation)
- **Flags**: `died`, `killed`, `assisted` per batch
- **Timestamps**: Both absolute and relative
- **Accuracy**: Compares current stats vs batch start stats

## 🤖 AI Analysis Ready

The exported JSON is optimized for AI analysis:

- **Clean data** - No debug/setup noise
- **Batch structure** - 10-second intervals
- **Action flags** - Clear player actions per batch
- **Audio timestamps** - Easy audio matching
- **Event timeline** - Complete event history



