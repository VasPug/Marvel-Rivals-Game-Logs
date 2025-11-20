const MARVEL_RIVALS_ID = 248901;
const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const combatStatsEl = document.getElementById("combat-stats");
const killsEl = document.getElementById("kills");
const deathsEl = document.getElementById("deaths");
const assistsEl = document.getElementById("assists");
const kdrEl = document.getElementById("kdr");
const totalActionsEl = document.getElementById("total-actions");

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

function updateCombatStats() {
  killsEl.textContent = matchData.kills;
  deathsEl.textContent = matchData.deaths;
  assistsEl.textContent = matchData.assists;

  // Calculate K/D ratio
  const kdRatio = matchData.deaths > 0 ? (matchData.kills / matchData.deaths).toFixed(2) : matchData.kills.toFixed(2);
  kdrEl.textContent = `K/D Ratio: ${kdRatio}`;

  // Calculate total actions
  const totalActions = matchData.kills + matchData.deaths + matchData.assists;
  totalActionsEl.textContent = `Total Actions: ${totalActions}`;

  // Show combat stats when we have any data
  if (matchData.kills > 0 || matchData.deaths > 0 || matchData.assists > 0) {
    combatStatsEl.style.display = 'block';
  }
}

// ====== 1️⃣ Set required features ======
function setRequiredFeatures() {
  const features = [
    "gep_internal",
    "match_info",
    "game_info"
  ];

  log("warn", "🔧 Setting required features...", features);

  overwolf.games.events.setRequiredFeatures(features, (res) => {
    if (res.success) {
      log("ok", "✅ Features set successfully:", features);
      setStatus("Connected to Marvel Rivals", "ok");

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
    log("warn", "Try starting a match in Marvel Rivals to see events!");
  }, 5000);

  // Check for info updates more frequently
  setInterval(() => {
    // Try to get current game info
    overwolf.games.events.getInfo((result) => {
      if (result.success) {
        log("ok", "📊 Current game info:", result.res);
      } else {
        log("error", "❌ Failed to get game info:", result);
      }
    });
  }, 10000);
}

// Match data storage
let matchData = {
  match_id: null,
  start_time: null,
  end_time: null,
  duration: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  events: [],
  roster_updates: [],
  match_info_updates: []
};

// Session timing
let sessionStartTime = null;

// Logging control
let isLoggingActive = false;

// Microphone recording control
let isMicRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let micStream = null;

function handleNewEvents(data) {
  if (!isLoggingActive) return;

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

    // Store event in match data
    matchData.events.push({
      time: currentTime,
      event_name: event.name,
      event_data: event.data
    });

    switch (event.name) {
      case 'match_start':
        log("ok", "🏁 MATCH STARTED!", event.data);
        if (!matchData.start_time) {
          matchData.start_time = new Date().toISOString();
        }
        // Reset stats for new match
        matchData.kills = 0;
        matchData.deaths = 0;
        matchData.assists = 0;
        updateCombatStats();
        break;

      case 'match_end':
        log("ok", "🏁 MATCH ENDED!", event.data);
        matchData.end_time = new Date().toISOString();
        matchData.duration = currentTime;
        break;

      case 'round_start':
        log("ok", "🔔 ROUND STARTED!", event.data);
        break;

      case 'round_end':
        log("ok", "🔔 ROUND ENDED!", event.data);
        break;

      case 'kill':
        matchData.kills = event.data || matchData.kills;
        log("ok", `💀 KILL! Total kills: ${matchData.kills}`, event.data);
        updateCombatStats();
        break;

      case 'death':
        matchData.deaths = event.data || matchData.deaths;
        log("error", `💀 DEATH! Total deaths: ${matchData.deaths}`, event.data);
        updateCombatStats();
        break;

      case 'assist':
        matchData.assists = event.data || matchData.assists;
        log("warn", `🤝 ASSIST! Total assists: ${matchData.assists}`, event.data);
        updateCombatStats();
        break;

      case 'kill_feed':
        try {
          const killData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          log("ok", `📰 KILL FEED: ${killData.attacker || 'Unknown'} killed ${killData.victim || 'Unknown'}`, killData);
        } catch (e) {
          log("ok", `📰 KILL FEED:`, event.data);
        }
        break;

      default:
        log("warn", `🎯 Other Event (${event.name}):`, event.data);
    }
  });
}

function handleInfoUpdates(data) {
  if (!isLoggingActive) return;

  if (data && data.info) {
    // Log match info updates
    if (data.info.match_info) {
      // Store complete match info for export
      log("warn", "📊 Match Info Update", data.info.match_info);

      matchData.match_info_updates.push({
        time: sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000) : 0,
        data: data.info.match_info
      });

      // Check for roster updates (this is where kills/deaths are tracked)
      Object.keys(data.info.match_info).forEach(key => {
        if (key.startsWith('roster_')) {
          try {
            const rosterData = typeof data.info.match_info[key] === 'string'
              ? JSON.parse(data.info.match_info[key])
              : data.info.match_info[key];

            // Check if this is the local player
            if (rosterData.is_local) {
              const newKills = parseInt(rosterData.kills) || 0;
              const newDeaths = parseInt(rosterData.deaths) || 0;
              const newAssists = parseInt(rosterData.assists) || 0;

              // Always update stats to current values
              const oldKills = matchData.kills;
              const oldDeaths = matchData.deaths;
              const oldAssists = matchData.assists;

              matchData.kills = newKills;
              matchData.deaths = newDeaths;
              matchData.assists = newAssists;
              updateCombatStats();

              // Store roster update
              matchData.roster_updates.push({
                time: sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000) : 0,
                kills: newKills,
                deaths: newDeaths,
                assists: newAssists,
                data: rosterData
              });

              // Check if stats changed and log the changes
              if (newKills > oldKills) {
                const killsGained = newKills - oldKills;
                log("ok", `💀 KILL! Total kills: ${newKills} (+${killsGained})`, rosterData);
              }

              if (newDeaths > oldDeaths) {
                const deathsGained = newDeaths - oldDeaths;
                log("error", `💀 DEATH! Total deaths: ${newDeaths} (+${deathsGained})`, rosterData);
              }

              if (newAssists > oldAssists) {
                const assistsGained = newAssists - oldAssists;
                log("warn", `🤝 ASSIST! Total assists: ${newAssists} (+${assistsGained})`, rosterData);
              }
            }
          } catch (e) {
            log("error", "❌ Error parsing roster data:", e);
          }
        }
      });
    }

    if (data.info.game_info) {
      // Store game info updates
      log("warn", "🎮 Game Info Update", data.info.game_info);
    }
  }
}

// ====== 2️⃣ Monitor game state changes ======
let isGameRunning = false;

function checkGameState() {
  overwolf.games.getRunningGameInfo((info) => {
    const gameRunning = info && info.isRunning && info.id === MARVEL_RIVALS_ID;

    if (gameRunning && !isGameRunning) {
      // Game just started
      log("ok", "🎮 Marvel Rivals detected. Setting features...");
      setStatus("Marvel Rivals detected!", "ok");
      isGameRunning = true;
      setRequiredFeatures();
    } else if (!gameRunning && isGameRunning) {
      // Game just stopped
      log("warn", "🎮 Marvel Rivals stopped");
      setStatus("Marvel Rivals stopped", "warn");
      isGameRunning = false;
    } else if (!gameRunning) {
      // Still waiting for game
      log("warn", "⌛ Waiting for Marvel Rivals to start...");
      setStatus("Waiting for Marvel Rivals...", "warn");
    }
  });
}

// ====== 6️⃣ Logging Control Functions ======
function startLogging() {
  if (!isLoggingActive) {
    isLoggingActive = true;
    sessionStartTime = new Date();

    // Get current stats from roster data
    updateCurrentStatsFromRoster();

    // Start microphone recording
    startMicrophoneRecording();

    // Update UI
    document.getElementById('start-logging-btn').style.display = 'none';
    document.getElementById('stop-logging-btn').style.display = 'inline-block';
    setStatus("🟢 Logging Active - Events being tracked", "ok");

    log("ok", "🟢 LOGGING STARTED - All events will now be tracked");
  }
}

function updateCurrentStatsFromRoster() {
  // Try to get current game info to update stats
  overwolf.games.events.getInfo((result) => {
    if (result.success && result.res && result.res.match_info) {
      Object.keys(result.res.match_info).forEach(key => {
        if (key.startsWith('roster_')) {
          try {
            const rosterData = typeof result.res.match_info[key] === 'string'
              ? JSON.parse(result.res.match_info[key])
              : result.res.match_info[key];

            if (rosterData.is_local) {
              matchData.kills = rosterData.kills || 0;
              matchData.deaths = rosterData.deaths || 0;
              matchData.assists = rosterData.assists || 0;
              updateCombatStats();

              log("ok", `📊 Current stats loaded: K:${matchData.kills} D:${matchData.deaths} A:${matchData.assists}`);
            }
          } catch (e) {
            log("error", "❌ Error parsing roster data on start:", e);
          }
        }
      });
    }
  });
}

function stopLogging() {
  if (isLoggingActive) {
    isLoggingActive = false;

    // Calculate final duration
    if (sessionStartTime) {
      matchData.duration = Math.round((new Date() - sessionStartTime) / 1000);
    }
    matchData.end_time = new Date().toISOString();

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
  const filename = `marvel-rivals-audio-${timestamp}.${extension}`;

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
function exportEventsAsJSON() {
  const jsonString = JSON.stringify(matchData, null, 2);

  // Create and download file
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marvel-rivals-match-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  log("ok", `📊 Exported match data: ${matchData.kills} kills, ${matchData.deaths} deaths, ${matchData.assists} assists`);
}

// ====== 5️⃣ On load ======
window.onload = () => {
  log("warn", "🚀 App loaded. Starting game monitoring...");
  setStatus("App loaded. Waiting for Marvel Rivals...", "warn");

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
    exportBtn.addEventListener('click', exportEventsAsJSON);
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
