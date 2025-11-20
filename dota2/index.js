// ====== CONSTANTS & DOM REFERENCES ======
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

// ====== STATE VARIABLES ======
// Match data storage - follows DotaMatch schema
let matchData = {
  match_id: null,
  barracks_status_dire: 0,
  barracks_status_radiant: 0,
  chat: [],
  cluster: 0,
  dire_score: 0,
  draft_timings: [],
  duration: 0,
  first_blood_time: null,
  game_mode: 0,
  human_players: null,
  lobby_type: 0,
  objectives: [],
  picks_bans: [],
  radiant_score: 0,
  radiant_win: null,
  radiant_gold_adv: [],
  radiant_xp_adv: [],
  start_time: null,
  teamfights: [],
  tower_status_dire: 0,
  tower_status_radiant: 0,
  version: null,
  players: [
    {
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
      item_neutral: null,
      kills_log: [],
      purchase_log: [],
      runes_log: [],
      connection_log: [],
      obs_log: [],
      sen_log: [],
      ability_upgrades_arr: [],
      ability_uses: {},
      damage: {},
      damage_taken: {},
      gold_reasons: {},
      xp_reasons: {},
      purchase: {},
      killed: {},
      item_uses: {}
    }
  ],
  pauses: []
};

// Session and logging state
let sessionStartTime = null;
let isLoggingActive = false;
let isGameRunning = false;

// Microphone recording state
let isMicRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let micStream = null;

// ====== UTILITY FUNCTIONS ======
function log(type, msg, data) {
  const now = new Date();
  const line = `[${now.toLocaleTimeString()}] ${msg}`;
  console.log(line, data || "");

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
  killsEl.textContent = matchData.players[0].kills;
  deathsEl.textContent = matchData.players[0].deaths;
  assistsEl.textContent = matchData.players[0].assists;
  goldEl.textContent = matchData.players[0].gold;
  levelEl.textContent = matchData.players[0].level;
  lastHitsEl.textContent = matchData.players[0].last_hits;

  // Calculate K/D ratio
  const kdRatio = matchData.players[0].deaths > 0 ?
    (matchData.players[0].kills / matchData.players[0].deaths).toFixed(2) :
    matchData.players[0].kills.toFixed(2);
  kdrEl.textContent = `K/D Ratio: ${kdRatio}`;

  // Calculate GPM and XPM
  gpmEl.textContent = `GPM: ${matchData.players[0].gold_per_min}`;
  xpmEl.textContent = `XPM: ${matchData.players[0].xp_per_min}`;

  // Show match stats when we have any data
  if (matchData.players[0].kills > 0 || matchData.players[0].deaths > 0 || matchData.players[0].level > 0) {
    matchStatsEl.style.display = 'block';
  }
}

function updateMicStatus(text, className) {
  const micStatusEl = document.getElementById('mic-status');
  if (micStatusEl) {
    micStatusEl.textContent = text;
    micStatusEl.className = className;
  }
}

// ====== DATA MANAGEMENT ======
function resetMatchData() {
  matchData = {
    match_id: null,
    barracks_status_dire: 0,
    barracks_status_radiant: 0,
    chat: [],
    cluster: 0,
    dire_score: 0,
    draft_timings: [],
    duration: 0,
    first_blood_time: null,
    game_mode: 0,
    human_players: null,
    lobby_type: 0,
    objectives: [],
    picks_bans: [],
    radiant_score: 0,
    radiant_win: null,
    radiant_gold_adv: [],
    radiant_xp_adv: [],
    start_time: null,
    teamfights: [],
    tower_status_dire: 0,
    tower_status_radiant: 0,
    version: null,
    players: [
      {
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
        item_neutral: null,
        kills_log: [],
        purchase_log: [],
        runes_log: [],
        connection_log: [],
        obs_log: [],
        sen_log: [],
        ability_upgrades_arr: [],
        ability_uses: {},
        damage: {},
        damage_taken: {},
        gold_reasons: {},
        xp_reasons: {},
        purchase: {},
        killed: {},
        item_uses: {}
      }
    ],
    pauses: []
  };
  
  // Reset session timing
  sessionStartTime = null;
  
  // Reset UI stats and hide match stats panel
  updateMatchStats();
  if (matchStatsEl) {
    matchStatsEl.style.display = 'none';
  }
  
  log("ok", "🔄 Match data reset - Fresh start for new game");
}

function updateMatchDataFromInfo(info) {
  if (!isLoggingActive) return;

  // Update player data from info updates
  if (info.me) {
    if (info.me.hero) {
      matchData.players[0].hero_id = info.me.hero;
    }
    if (info.me.level) {
      matchData.players[0].level = parseInt(info.me.level) || matchData.players[0].level;
      updateMatchStats();
    }
  }

  if (info.game) {
    if (info.game.match_id) {
      matchData.match_id = info.game.match_id;
      matchData.players[0].match_id = info.game.match_id;
    }
    if (info.game.game_mode) {
      matchData.game_mode = parseInt(info.game.game_mode) || matchData.game_mode;
    }
  }
}

// ====== GAME STATE MONITORING ======
function checkGameState() {
  overwolf.games.getRunningGameInfo((info) => {
    // Convert both to numbers for comparison (handles string vs number mismatch)

    const gameRunning = info && info.isRunning && info.title === "Dota 2";

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
    } else if (!gameRunning && !isGameRunning) {
      // Still waiting for game - only log once on first check
      if (statusEl.textContent !== "Waiting for Dota 2...") {
        log("warn", "⌛ Waiting for Dota 2 to start...");
        setStatus("Waiting for Dota 2...", "warn");
      }
    }
  });
}

function setRequiredFeatures() {
  // Dota 2 GEP features based on Overwolf documentation
  const features = [
    "gep_internal",
    "game_state",
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

// ====== EVENT HANDLERS ======
function setupEventListeners() {
  log("warn", "🎧 Setting up event listeners...");

  // Remove existing listeners to avoid duplicates
  overwolf.games.events.onNewEvents.removeListener(handleNewEvents);
  overwolf.games.events.onInfoUpdates2.removeListener(handleInfoUpdates);

  // Add new listeners
  overwolf.games.events.onNewEvents.addListener(handleNewEvents);
  overwolf.games.events.onInfoUpdates2.addListener(handleInfoUpdates);

  log("ok", "✅ Event listeners set up successfully");
  startLogging();
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
    overwolf.games.events.onNewEvents.addListener(function(info) {
      console.log('EVENT FIRED: ' + JSON.stringify(info));
      log("ok", "🔍 DEBUG: handleNewEvents called with:", info);
   });
  }, 2000);
}

function handleNewEvents(data) {
  // if (!isLoggingActive) return;

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

  const currentTime = sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000) : 0;

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
      case 'new_game':
        log("ok", "🏁 NEW GAME STARTED!", event.data);
        // Reset all match data for fresh start
        resetMatchData();
        // Set start time for new match
        matchData.start_time = Math.floor(Date.now() / 1000);
        // Automatically start logging when match starts
        if (!isLoggingActive) {
          startLogging();
        }
        break;

      case 'game_over':
        log("ok", "🏁 GAME OVER!", event.data);
        // Automatically stop logging when match ends
        if (isLoggingActive) {
          stopLogging();
        }
        break;

      case 'match_detected':
      case 'match_state_changed':
        log("ok", "🏁 MATCH DETECTED/CHANGED!", event.data);
        if (event.data && event.data.match_id) {
          matchData.match_id = event.data.match_id;
          matchData.players[0].match_id = event.data.match_id;
        }
        if (!matchData.start_time) {
          matchData.start_time = Math.floor(Date.now() / 1000);
        }
        break;

      case 'match_ended':
        log("ok", "🏁 MATCH ENDED!", event.data);
        if (event.data) {
          matchData.duration = currentTime;
          if (event.data.winner) {
            matchData.radiant_win = event.data.winner === 'radiant';
          }
        }
        // Automatically stop logging when match ends
        if (isLoggingActive) {
          stopLogging();
        }
        break;

      case 'kill':
        if (event.data) {
          matchData.players[0].kills = parseInt(event.data) || matchData.players[0].kills;
          log("ok", `💀 KILL! Total kills: ${matchData.players[0].kills}`, event.data);

          // Add to kill log
          matchData.players[0].kills_log.push({
            time: currentTime,
            key: event.data.toString()
          });

          updateMatchStats();
        }
        break;

      case 'death':
        if (event.data) {
          matchData.players[0].deaths = parseInt(event.data) || matchData.players[0].deaths;
          log("error", `💀 DEATH! Total deaths: ${matchData.players[0].deaths}`, event.data);
          updateMatchStats();
        }
        break;

      case 'assist':
        if (event.data) {
          matchData.players[0].assists = parseInt(event.data) || matchData.players[0].assists;
          log("warn", `🤝 ASSIST! Total assists: ${matchData.players[0].assists}`, event.data);
          updateMatchStats();
        }
        break;

      case 'cs':
        if (event.data) {
          matchData.players[0].last_hits = parseInt(event.data) || matchData.players[0].last_hits;
          updateMatchStats();
        }
        break;

      case 'gold':
        if (event.data) {
          matchData.players[0].gold = parseInt(event.data) || matchData.players[0].gold;
          updateMatchStats();
        }
        break;

      case 'gpm':
        if (event.data) {
          matchData.players[0].gold_per_min = parseInt(event.data) || matchData.players[0].gold_per_min;
          updateMatchStats();
        }
        break;

      case 'xpm':
        if (event.data) {
          matchData.players[0].xp_per_min = parseInt(event.data) || matchData.players[0].xp_per_min;
          updateMatchStats();
        }
        break;

      case 'hero_leveled_up':
        if (event.data) {
          matchData.players[0].level = parseInt(event.data) || matchData.players[0].level;
          log("ok", `⬆️ LEVEL UP! Now level ${matchData.players[0].level}`, event.data);
          updateMatchStats();
        }
        break;

      case 'hero_item_changed':
      case 'hero_item_used':
      case 'hero_item_consumed':
        log("ok", `🎒 ITEM EVENT: ${event.name}`, event.data);
        if (event.data) {
          matchData.players[0].purchase_log.push({
            time: currentTime,
            key: event.data.toString()
          });
        }
        break;

      case 'hero_ability_used':
        if (event.data) {
          const abilityKey = event.data.toString();
          if (!matchData.players[0].ability_uses[abilityKey]) {
            matchData.players[0].ability_uses[abilityKey] = 0;
          }
          matchData.players[0].ability_uses[abilityKey]++;
        }
        break;

      default:
        log("warn", `🎯 Other Event (${event.name}):`, event.data);
    }
  });
}

function handleInfoUpdates(data) {
  // if (!isLoggingActive) return;

  if (data && data.info) {
    log("warn", "📊 Info Update", data.info);

    // Update match data from info updates
    updateMatchDataFromInfo(data.info);
  }
}

// ====== LOGGING CONTROL ======
function startLogging() {
  if (!isLoggingActive) {
    isLoggingActive = true;
    sessionStartTime = new Date();

    // Start microphone recording
    startMicrophoneRecording();

    // Update UI
    setStatus("🟢 Logging Active - Match data being tracked", "ok");

    log("ok", "🟢 LOGGING STARTED - All match data will now be tracked");
  }
}

function stopLogging() {
  if (isLoggingActive) {
    isLoggingActive = false;

    // Calculate final duration
    if (sessionStartTime) {
      matchData.duration = Math.round((new Date() - sessionStartTime) / 1000);
    }

    // Stop microphone recording
    stopMicrophoneRecording();

    // Update UI
    setStatus("🔴 Logging Stopped - Match ended", "warn");

    log("warn", "🔴 LOGGING STOPPED - Match ended");

    // Automatically export match data after a short delay to ensure all data is finalized
    setTimeout(() => {
      exportMatchData();
    }, 1000);
  }
}

// ====== MICROPHONE RECORDING ======
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

  // Generate filename with match ID
  const matchId = matchData.match_id || 'unknown';
  const timestamp = sessionStartTime ? sessionStartTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const extension = mediaRecorder.mimeType.includes('mp4') ? 'm4a' : 'webm';
  const filename = `dota2-match-${matchId}-audio-${timestamp}.${extension}`;

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

// ====== EXPORT & CLEAR ======
function exportMatchData() {
  // Export in DotaMatch format
  const jsonString = JSON.stringify(matchData, null, 2);

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

  log("ok", `📊 Exported match data: Match ID ${matchId}, Duration: ${matchData.duration}s`);
}

function clearAndReload() {
  if (confirm("Are you sure you want to clear everything and reload the page? This will lose all current data.")) {
    window.location.reload();
  }
}

// ====== INITIALIZATION ======
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
  const clearBtn = document.getElementById('clear-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportMatchData);
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
