const DOTA2_GAME_ID = 7314;
const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const matchStatsEl = document.getElementById("match-stats");
const killsEl = document.getElementById("kills");
const deathsEl = document.getElementById("deaths");
const assistsEl = document.getElementById("assists");
const goldEl = document.getElementById("gold");
const levelEl = document.getElementById("level");
const lastHitsEl = document.getElementById("last_hits");
const kdrEl = document.getElementById("kdr");
const gpmEl = document.getElementById("gpm");
const xpmEl = document.getElementById("xpm");

function log(type, msg, data) {
  const now = new Date();
  const timestamp = now.toISOString();
  const line = `[${now.toLocaleTimeString()}] ${msg}`;
  console.log(line, data || "");

  // Calculate relative timestamp (seconds from session start)
  const relativeTime = sessionStartTime ?
    Math.round((now - sessionStartTime) / 1000) : 0;

  // Create event object
  const event = {
    timestamp: timestamp,
    relative_time_seconds: relativeTime,
    type: type,
    message: msg,
    data: data || null
  };

  // Only store events if logging is active (except for system messages)
  if (isLoggingActive || type === 'warn' || type === 'error' || msg.includes('App loaded') || msg.includes('API available') || msg.includes('Dota 2 detected')) {
    eventLog.push(event);

    // Add to current batch only if logging is active
    if (isLoggingActive) {
      addEventToBatch(event);
    }
  }

  const el = document.createElement("div");
  el.className = type;
  el.textContent = line + (data ? " " + JSON.stringify(data) : "");
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text, cls = "warn") {
  statusEl.textContent = text;
  statusEl.className = cls;
}

function updateMatchStats() {
  killsEl.textContent = matchData.player.kills;
  deathsEl.textContent = matchData.player.deaths;
  assistsEl.textContent = matchData.player.assists;
  goldEl.textContent = matchData.player.gold;
  levelEl.textContent = matchData.player.level;
  lastHitsEl.textContent = matchData.player.last_hits;

  // Calculate K/D ratio
  const kdRatio = matchData.player.deaths > 0 ?
    (matchData.player.kills / matchData.player.deaths).toFixed(2) :
    matchData.player.kills.toFixed(2);
  kdrEl.textContent = `K/D Ratio: ${kdRatio}`;

  // Calculate GPM and XPM
  gpmEl.textContent = `GPM: ${matchData.player.gold_per_min}`;
  xpmEl.textContent = `XPM: ${matchData.player.xp_per_min}`;

  // Show match stats when we have any data
  if (matchData.player.kills > 0 || matchData.player.deaths > 0 || matchData.player.level > 0) {
    matchStatsEl.style.display = 'block';
  }
}

// ====== Batch Processing Functions ======
function startBatchProcessing() {
  if (batchInterval) {
    clearInterval(batchInterval);
  }

  // Set session start time for relative timestamps
  if (!sessionStartTime) {
    sessionStartTime = new Date();
  }

  // Process batches every 10 seconds
  batchInterval = setInterval(processBatch, 10000);

  // Initialize first batch
  currentBatch.startTime = new Date();
  currentBatch.events = [];
  currentBatch.matchData = JSON.parse(JSON.stringify(matchData));

  log("warn", "🔄 Started 10-second batch processing");
}

function processBatch() {
  const now = new Date();
  const batchDuration = Math.round((now - currentBatch.startTime) / 1000);

  // Calculate changes from the start of this batch
  const killsGained = matchData.player.kills - currentBatch.matchData.player.kills;
  const deathsGained = matchData.player.deaths - currentBatch.matchData.player.deaths;
  const assistsGained = matchData.player.assists - currentBatch.matchData.player.assists;
  const goldGained = matchData.player.gold - currentBatch.matchData.player.gold;
  const levelGained = matchData.player.level - currentBatch.matchData.player.level;

  // Add special events for stat changes
  if (deathsGained > 0) {
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "death_event",
      message: `💀 PLAYER DIED ${deathsGained} time(s) in this batch`,
      data: { deaths_gained: deathsGained, total_deaths: matchData.player.deaths }
    });
  }

  if (killsGained > 0) {
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "kill_event",
      message: `💀 PLAYER KILLED ${killsGained} enemy(ies) in this batch`,
      data: { kills_gained: killsGained, total_kills: matchData.player.kills }
    });
  }

  if (assistsGained > 0) {
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "assist_event",
      message: `🤝 PLAYER ASSISTED ${assistsGained} time(s) in this batch`,
      data: { assists_gained: assistsGained, total_assists: matchData.player.assists }
    });
  }

  if (levelGained > 0) {
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "level_up_event",
      message: `⬆️ PLAYER LEVELED UP to level ${matchData.player.level}`,
      data: { level_gained: levelGained, current_level: matchData.player.level }
    });
  }

  // Calculate relative times for batch
  const batchStartRelative = sessionStartTime ?
    Math.round((currentBatch.startTime - sessionStartTime) / 1000) : 0;
  const batchEndRelative = sessionStartTime ?
    Math.round((now - sessionStartTime) / 1000) : 0;

  // Create batch summary
  const batchSummary = {
    batch_id: `batch_${Math.floor(now.getTime() / 10000)}`,
    start_time: currentBatch.startTime.toISOString(),
    end_time: now.toISOString(),
    start_seconds: batchStartRelative,
    end_seconds: batchEndRelative,
    duration_seconds: batchDuration,
    total_events: currentBatch.events.length,
    player_actions: {
      died: deathsGained > 0,
      killed: killsGained > 0,
      assisted: assistsGained > 0,
      leveled_up: levelGained > 0,
      deaths_gained: deathsGained,
      kills_gained: killsGained,
      assists_gained: assistsGained,
      gold_gained: goldGained,
      level_gained: levelGained
    },
    events: currentBatch.events
  };

  // Log batch summary
  log("ok", `📦 Batch Complete: ${batchDuration}s, ${currentBatch.events.length} events, K:${killsGained} D:${deathsGained} A:${assistsGained}`);

  // Store batch in event log
  eventLog.push({
    timestamp: now.toISOString(),
    type: "batch_summary",
    message: `📦 10-Second Batch Summary`,
    data: batchSummary
  });

  // Reset for next batch
  currentBatch.startTime = now;
  currentBatch.events = [];
  currentBatch.matchData = JSON.parse(JSON.stringify(matchData));
}

function addEventToBatch(event) {
  if (currentBatch.startTime) {
    currentBatch.events.push(event);
  }
}

// ====== 1️⃣ Set required features ======
function setRequiredFeatures() {
  // Dota 2 GEP features based on Overwolf documentation
  const features = [
    "gep_internal",
    "game_state_changed",
    "match_state_changed",
    "match_detected",
    "daytime_changed",
    "clock_time_changed",
    "ward_purchase_cooldown_changed",
    "match_ended",
    "kill",
    "assist",
    "death",
    "cs",
    "xpm",
    "gpm",
    "gold",
    "hero_leveled_up",
    "hero_respawned",
    "hero_buyback_info_changed",
    "hero_boughtback",
    "hero_health_mana_info",
    "hero_status_effect_changed",
    "hero_attributes_skilled",
    "hero_ability_skilled",
    "hero_ability_used",
    "hero_ability_changed",
    "hero_item_changed",
    "hero_item_used",
    "hero_item_consumed",
    "hero_item_charged",
    "match_info",
    "roster",
    "party",
    "error",
    "hero_pool",
    "me",
    "game"
  ];

  log("warn", "🔧 Setting required features...", features);

  overwolf.games.events.setRequiredFeatures(features, (res) => {
    if (res.success) {
      log("ok", "✅ Features set successfully:", res.supportedFeatures);
      setStatus("Connected to Dota 2", "ok");

      // Set up event listeners after successful feature setup
      setupEventListeners();
    } else {
      log("error", "❌ Failed to set features:", res);
      log("warn", "⚠️ Retrying setRequiredFeatures in 3 seconds...");
      setStatus("Retrying feature setup...", "warn");
      setTimeout(setRequiredFeatures, 3000);
    }
  });
}

// ====== 4️⃣ Setup event listeners ======
function setupEventListeners() {
  log("warn", "🎧 Setting up event listeners...");

  // Remove existing listeners to avoid duplicates
  overwolf.games.events.onNewEvents.removeListener(handleNewEvents);
  overwolf.games.events.onInfoUpdates2.removeListener(handleInfoUpdates);

  // Add new listeners
  overwolf.games.events.onNewEvents.addListener(handleNewEvents);
  overwolf.games.events.onInfoUpdates2.addListener(handleInfoUpdates);

  log("ok", "✅ Event listeners set up successfully");

  // Test if listeners are working
  setTimeout(() => {
    log("warn", "🧪 Testing event listeners...");
    log("warn", "If you see this message, the app is running but no game events are being received yet.");
    log("warn", "Try starting a match in Dota 2 to see events!");
  }, 5000);

  // Check for info updates more frequently
  setInterval(() => {
    // Try to get current game info
    overwolf.games.events.getInfo((result) => {
      if (result.success && result.res) {
        // Update match data from current info
        updateMatchDataFromInfo(result.res);
      }
    });
  }, 2000);
}

// Match data storage
let matchData = {
  match_id: null,
  match_info: {},
  player: {
    match_id: null,
    player_slot: null,
    hero_id: null,
    kills: 0,
    deaths: 0,
    assists: 0,
    last_hits: 0,
    denies: 0,
    gold: 0,
    gold_per_min: 0,
    xp_per_min: 0,
    level: 0,
    hero_damage: 0,
    hero_healing: 0,
    tower_damage: 0,
    item_0: null,
    item_1: null,
    item_2: null,
    item_3: null,
    item_4: null,
    item_5: null,
    backpack_0: null,
    backpack_1: null,
    backpack_2: null,
  },
  chat: [],
  objectives: [],
  picks_bans: [],
  purchase_log: [],
  kill_log: [],
  rune_log: [],
  observer_log: [],
  teamfights: []
};

// Event log storage for JSON export
let eventLog = [];

// Session timing for relative timestamps
let sessionStartTime = null;

// Logging control
let isLoggingActive = false;

// Microphone recording control
let isMicRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let micStream = null;

// Batch processing for 10-second intervals
let currentBatch = {
  startTime: null,
  events: [],
  matchData: null
};

let batchInterval = null;

function handleNewEvents(data) {
  log("warn", "🔍 DEBUG: handleNewEvents called with:", data);

  // Try different possible data structures
  let events = [];

  if (data && data.events && Array.isArray(data.events)) {
    events = data.events;
  } else if (data && Array.isArray(data)) {
    events = data;
  } else if (data && data.data && Array.isArray(data.data)) {
    events = data.data;
  } else {
    log("error", "❌ No events array found in data structure:", data);
    return;
  }

  log("ok", `📋 Found ${events.length} events`);

  events.forEach((event, index) => {
    log("warn", `📝 Event ${index + 1}:`, {
      name: event.name,
      data: event.data,
      timestamp: event.timestamp
    });

    // Log ALL events first to see what we're getting
    log("ok", `🎯 EVENT: ${event.name}`, event);

    // Store event data based on type
    switch (event.name) {
      case 'match_detected':
      case 'match_state_changed':
        log("ok", "🏁 MATCH DETECTED/CHANGED!", event.data);
        if (event.data && event.data.match_id) {
          matchData.match_id = event.data.match_id;
        }
        break;

      case 'match_ended':
        log("ok", "🏁 MATCH ENDED!", event.data);
        break;

      case 'kill':
        if (event.data) {
          matchData.player.kills = parseInt(event.data) || matchData.player.kills;
          log("ok", `💀 KILL! Total kills: ${matchData.player.kills}`, event.data);

          // Add to kill log
          matchData.kill_log.push({
            time: Math.round((new Date() - sessionStartTime) / 1000),
            key: event.data.toString()
          });

          updateMatchStats();
        }
        break;

      case 'death':
        if (event.data) {
          matchData.player.deaths = parseInt(event.data) || matchData.player.deaths;
          log("error", `💀 DEATH! Total deaths: ${matchData.player.deaths}`, event.data);
          updateMatchStats();
        }
        break;

      case 'assist':
        if (event.data) {
          matchData.player.assists = parseInt(event.data) || matchData.player.assists;
          log("warn", `🤝 ASSIST! Total assists: ${matchData.player.assists}`, event.data);
          updateMatchStats();
        }
        break;

      case 'cs':
        if (event.data) {
          matchData.player.last_hits = parseInt(event.data) || matchData.player.last_hits;
          updateMatchStats();
        }
        break;

      case 'gold':
        if (event.data) {
          matchData.player.gold = parseInt(event.data) || matchData.player.gold;
          updateMatchStats();
        }
        break;

      case 'gpm':
        if (event.data) {
          matchData.player.gold_per_min = parseInt(event.data) || matchData.player.gold_per_min;
          updateMatchStats();
        }
        break;

      case 'xpm':
        if (event.data) {
          matchData.player.xp_per_min = parseInt(event.data) || matchData.player.xp_per_min;
          updateMatchStats();
        }
        break;

      case 'hero_leveled_up':
        if (event.data) {
          matchData.player.level = parseInt(event.data) || matchData.player.level;
          log("ok", `⬆️ LEVEL UP! Now level ${matchData.player.level}`, event.data);
          updateMatchStats();
        }
        break;

      case 'hero_item_changed':
      case 'hero_item_used':
      case 'hero_item_consumed':
        log("ok", `🎒 ITEM EVENT: ${event.name}`, event.data);
        if (event.data && sessionStartTime) {
          matchData.purchase_log.push({
            time: Math.round((new Date() - sessionStartTime) / 1000),
            key: event.data.toString()
          });
        }
        break;

      default:
        log("warn", `🎯 Other Event (${event.name}):`, event.data);
    }
  });
}

function updateMatchDataFromInfo(info) {
  // Update player data from info updates
  if (info.me) {
    if (info.me.hero) {
      matchData.player.hero_id = info.me.hero;
    }
    if (info.me.level) {
      matchData.player.level = parseInt(info.me.level) || matchData.player.level;
      updateMatchStats();
    }
  }

  if (info.game) {
    if (info.game.match_id) {
      matchData.match_id = info.game.match_id;
    }
  }

  // Store complete match info
  if (info.match_info) {
    matchData.match_info = { ...matchData.match_info, ...info.match_info };
  }
}

function handleInfoUpdates(data) {
  if (data && data.info) {
    log("warn", "📊 Info Update", data.info);

    // Update match data from info updates
    updateMatchDataFromInfo(data.info);
  }
}

// ====== 2️⃣ Monitor game state changes ======
let isGameRunning = false;

function checkGameState() {
  overwolf.games.getRunningGameInfo((info) => {
    const gameRunning = info && info.isRunning && info.id === DOTA2_GAME_ID;

    if (gameRunning && !isGameRunning) {
      // Game just started
      log("ok", "🎮 Dota 2 detected. Setting features...");
      setStatus("Dota 2 detected!", "ok");
      isGameRunning = true;
      setRequiredFeatures();
    } else if (!gameRunning && isGameRunning) {
      // Game just stopped
      log("warn", "🎮 Dota 2 stopped");
      setStatus("Dota 2 stopped", "warn");
      isGameRunning = false;
    } else if (!gameRunning) {
      // Still waiting for game
      log("warn", "⌛ Waiting for Dota 2 to start...");
      setStatus("Waiting for Dota 2...", "warn");
    }
  });
}

// ====== 6️⃣ Logging Control Functions ======
function startLogging() {
  if (!isLoggingActive) {
    isLoggingActive = true;
    sessionStartTime = new Date();

    // Start batch processing
    startBatchProcessing();

    // Start microphone recording
    startMicrophoneRecording();

    // Update UI
    document.getElementById('start-logging-btn').style.display = 'none';
    document.getElementById('stop-logging-btn').style.display = 'inline-block';
    setStatus("🟢 Logging Active - Match data being tracked", "ok");

    log("ok", "🟢 LOGGING STARTED - All match data will now be tracked and batched");
  }
}

function stopLogging() {
  if (isLoggingActive) {
    isLoggingActive = false;

    // Stop batch processing
    if (batchInterval) {
      clearInterval(batchInterval);
      batchInterval = null;
    }

    // Process final batch if there are events
    if (currentBatch.events.length > 0) {
      processBatch();
    }

    // Stop microphone recording
    stopMicrophoneRecording();

    // Update UI
    document.getElementById('start-logging-btn').style.display = 'inline-block';
    document.getElementById('stop-logging-btn').style.display = 'none';
    setStatus("🔴 Logging Stopped - Click Start to resume", "warn");

    log("warn", "🔴 LOGGING STOPPED - No new events will be tracked");
  }
}

// ====== 7️⃣ Microphone Recording Functions ======
async function startMicrophoneRecording() {
  try {
    // Request microphone access
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });

    // Create MediaRecorder - use M4A for best compatibility and ML transcription
    let mimeType = 'audio/mp4'; // M4A format
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      // Fallback to WebM if M4A not supported
      mimeType = 'audio/webm';
    }

    mediaRecorder = new MediaRecorder(micStream, {
      mimeType: mimeType
    });

    // Reset audio chunks
    audioChunks = [];

    // Handle data available event
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Handle recording stop event
    mediaRecorder.onstop = () => {
      saveAudioRecording();
    };

    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    isMicRecording = true;

    log("ok", "🎤 Microphone recording started");
    updateMicStatus("🎤 Recording...", "ok");

  } catch (error) {
    log("error", "❌ Failed to start microphone recording:", error);
    if (error.name === 'NotAllowedError') {
      updateMicStatus("❌ Mic Permission Denied", "error");
      log("warn", "⚠️ Please allow microphone access to record audio");
    } else if (error.name === 'NotFoundError') {
      updateMicStatus("❌ No Microphone Found", "error");
      log("warn", "⚠️ No microphone device found");
    } else {
      updateMicStatus("❌ Mic Error", "error");
    }
  }
}

function stopMicrophoneRecording() {
  if (mediaRecorder && isMicRecording) {
    mediaRecorder.stop();
    isMicRecording = false;

    // Stop all tracks
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    log("warn", "🎤 Microphone recording stopped");
    updateMicStatus("🎤 Stopped", "warn");
  }
}

function saveAudioRecording() {
  if (audioChunks.length === 0) {
    log("warn", "⚠️ No audio data to save");
    return;
  }

  // Create blob from audio chunks
  const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });

  // Generate filename with same timestamp as logs
  const timestamp = sessionStartTime ? sessionStartTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const extension = mediaRecorder.mimeType.includes('mp4') ? 'm4a' : 'webm';
  const filename = `dota2-mic-recording-${timestamp}.${extension}`;

  // Create download link
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log("ok", `🎤 Audio recording saved as: ${filename}`);
  updateMicStatus("🎤 Saved", "ok");

  // Clear audio chunks
  audioChunks = [];
}

function updateMicStatus(text, className) {
  const micStatusEl = document.getElementById('mic-status');
  if (micStatusEl) {
    micStatusEl.textContent = text;
    micStatusEl.className = className;
  }
}

// ====== 8️⃣ Clear functionality ======
function clearAndReload() {
  if (confirm("Are you sure you want to clear everything and reload the page? This will lose all current data.")) {
    window.location.reload();
  }
}

// ====== 9️⃣ Export functionality ======
function exportMatchData() {
  // Filter out setup/debug events, keep only gameplay events
  const gameplayEvents = eventLog.filter(e =>
    e.type === 'batch_summary' ||
    e.message.includes('KILL') ||
    e.message.includes('DEATH') ||
    e.message.includes('ASSIST') ||
    e.message.includes('MATCH') ||
    e.message.includes('LEVEL')
  );

  const exportData = {
    session_info: {
      timestamp: new Date().toISOString(),
      total_batches: eventLog.filter(e => e.type === 'batch_summary').length,
      match_id: matchData.match_id
    },
    match: matchData,
    batch_summaries: eventLog.filter(e => e.type === 'batch_summary').map(e => e.data),
    key_events: gameplayEvents.filter(e => e.type !== 'batch_summary')
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  // Create and download file
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const matchId = matchData.match_id || 'unknown';
  a.download = `dota2-match-${matchId}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const batchCount = eventLog.filter(e => e.type === 'batch_summary').length;
  log("ok", `📊 Exported match data: ${batchCount} batches, Match ID: ${matchId}`);
}

// ====== 5️⃣ On load ======
window.onload = () => {
  log("warn", "🚀 App loaded. Starting game monitoring...");
  setStatus("App loaded. Waiting for Dota 2...", "warn");

  // Check if Overwolf API is available
  if (typeof overwolf === 'undefined') {
    log("error", "❌ Overwolf API not available!");
    setStatus("Overwolf API not available", "error");
    return;
  }

  log("ok", "✅ Overwolf API available");

  // Check if games.events is available
  if (!overwolf.games || !overwolf.games.events) {
    log("error", "❌ Overwolf games.events API not available!");
    setStatus("Games events API not available", "error");
    return;
  }

  log("ok", "✅ Overwolf games.events API available");

  // Set up buttons
  const exportBtn = document.getElementById('export-btn');
  const startBtn = document.getElementById('start-logging-btn');
  const stopBtn = document.getElementById('stop-logging-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportMatchData);
  }
  if (startBtn) {
    startBtn.addEventListener('click', startLogging);
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', stopLogging);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAndReload);
  }

  // Start monitoring game state
  checkGameState();
  setInterval(checkGameState, 2000); // Check every 2 seconds

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (isMicRecording) {
      stopMicrophoneRecording();
    }
  });
};
