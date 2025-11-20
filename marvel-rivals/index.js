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
  if (isLoggingActive || type === 'warn' || type === 'error' || msg.includes('App loaded') || msg.includes('API available') || msg.includes('Marvel Rivals detected')) {
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

function updateCombatStats() {
  killsEl.textContent = combatStats.kills;
  deathsEl.textContent = combatStats.deaths;
  assistsEl.textContent = combatStats.assists;
  
  // Calculate K/D ratio
  const kdRatio = combatStats.deaths > 0 ? (combatStats.kills / combatStats.deaths).toFixed(2) : combatStats.kills.toFixed(2);
  kdrEl.textContent = `K/D Ratio: ${kdRatio}`;
  
  // Calculate total actions
  const totalActions = combatStats.kills + combatStats.deaths + combatStats.assists;
  totalActionsEl.textContent = `Total Actions: ${totalActions}`;
  
  // Show combat stats when we have any data
  if (combatStats.kills > 0 || combatStats.deaths > 0 || combatStats.assists > 0) {
    combatStatsEl.style.display = 'block';
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
  currentBatch.playerDied = false;
  currentBatch.playerKilled = false;
  currentBatch.playerAssisted = false;
  currentBatch.deathCount = combatStats.deaths;
  currentBatch.killCount = combatStats.kills;
  currentBatch.assistCount = combatStats.assists;
  
  log("warn", "🔄 Started 10-second batch processing");
}

function processBatch() {
  const now = new Date();
  const batchDuration = Math.round((now - currentBatch.startTime) / 1000);
  
  // Get current stats from roster data to ensure accuracy
  let currentKills = combatStats.kills;
  let currentDeaths = combatStats.deaths;
  let currentAssists = combatStats.assists;
  
  // Try to get the most recent stats from roster
  overwolf.games.events.getInfo((result) => {
    if (result.success && result.res && result.res.match_info) {
      Object.keys(result.res.match_info).forEach(key => {
        if (key.startsWith('roster_')) {
          try {
            const rosterData = typeof result.res.match_info[key] === 'string' 
              ? JSON.parse(result.res.match_info[key]) 
              : result.res.match_info[key];
            
            if (rosterData.is_local) {
              currentKills = parseInt(rosterData.kills) || 0;
              currentDeaths = parseInt(rosterData.deaths) || 0;
              currentAssists = parseInt(rosterData.assists) || 0;
            }
          } catch (e) {
            // Use existing stats if parsing fails
          }
        }
      });
    }
    
    // Calculate stat changes from the start of this batch
    const deathsGained = currentDeaths - currentBatch.deathCount;
    const killsGained = currentKills - currentBatch.killCount;
    const assistsGained = currentAssists - currentBatch.assistCount;
  
    // Add special events for stat changes
    if (deathsGained > 0) {
      currentBatch.playerDied = true;
      currentBatch.events.push({
        timestamp: now.toISOString(),
        type: "death_event",
        message: `💀 PLAYER DIED ${deathsGained} time(s) in this batch`,
        data: { deaths_gained: deathsGained, total_deaths: currentDeaths }
      });
    }
    
    if (killsGained > 0) {
      currentBatch.playerKilled = true;
      currentBatch.events.push({
        timestamp: now.toISOString(),
        type: "kill_event", 
        message: `💀 PLAYER KILLED ${killsGained} enemy(ies) in this batch`,
        data: { kills_gained: killsGained, total_kills: currentKills }
      });
    }
    
    if (assistsGained > 0) {
      currentBatch.playerAssisted = true;
      currentBatch.events.push({
        timestamp: now.toISOString(),
        type: "assist_event",
        message: `🤝 PLAYER ASSISTED ${assistsGained} time(s) in this batch`,
        data: { assists_gained: assistsGained, total_assists: currentAssists }
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
        died: currentBatch.playerDied,
        killed: currentBatch.playerKilled,
        assisted: currentBatch.playerAssisted,
        deaths_gained: deathsGained,
        kills_gained: killsGained,
        assists_gained: assistsGained
      },
      events: currentBatch.events
    };
    
    // Log batch summary
    log("ok", `📦 Batch Complete: ${batchDuration}s, ${currentBatch.events.length} events, Died:${currentBatch.playerDied} Killed:${currentBatch.playerKilled} Assisted:${currentBatch.playerAssisted}`);
    
    // Store batch in event log
    eventLog.push({
      timestamp: now.toISOString(),
      type: "batch_summary",
      message: `📦 10-Second Batch Summary`,
      data: batchSummary
    });
    
    // Update combat stats with current values
    combatStats.kills = currentKills;
    combatStats.deaths = currentDeaths;
    combatStats.assists = currentAssists;
    updateCombatStats();
    
    // Reset for next batch
    currentBatch.startTime = now;
    currentBatch.events = [];
    currentBatch.playerDied = false;
    currentBatch.playerKilled = false;
    currentBatch.playerAssisted = false;
    currentBatch.deathCount = currentDeaths;
    currentBatch.killCount = currentKills;
    currentBatch.assistCount = currentAssists;
  });
}

function addEventToBatch(event) {
  if (currentBatch.startTime) {
    currentBatch.events.push(event);
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

// Combat statistics tracking
let combatStats = {
  kills: 0,
  deaths: 0,
  assists: 0
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
  playerDied: false,
  playerKilled: false,
  playerAssisted: false,
  deathCount: 0,
  killCount: 0,
  assistCount: 0
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
    
    switch (event.name) {
      case 'match_start':
        log("ok", "🏁 MATCH STARTED!", event.data);
        // Reset stats for new match
        combatStats.kills = 0;
        combatStats.deaths = 0;
        combatStats.assists = 0;
        updateCombatStats();
        break;
        
      case 'match_end':
        log("ok", "🏁 MATCH ENDED!", event.data);
        break;
        
      case 'round_start':
        log("ok", "🔔 ROUND STARTED!", event.data);
        break;
        
      case 'round_end':
        log("ok", "🔔 ROUND ENDED!", event.data);
        break;
        
      case 'kill':
        combatStats.kills = event.data || combatStats.kills;
        log("ok", `💀 KILL! Total kills: ${combatStats.kills}`, event.data);
        updateCombatStats();
        break;
        
      case 'death':
        combatStats.deaths = event.data || combatStats.deaths;
        log("error", `💀 DEATH! Total deaths: ${combatStats.deaths}`, event.data);
        updateCombatStats();
        break;
        
      case 'assist':
        combatStats.assists = event.data || combatStats.assists;
        log("warn", `🤝 ASSIST! Total assists: ${combatStats.assists}`, event.data);
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
  if (data && data.info) {
    // Log match info updates
    if (data.info.match_info) {
      // Store complete match info for export
      log("warn", "📊 Match Info Update", data.info.match_info);
      
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
              const oldKills = combatStats.kills;
              const oldDeaths = combatStats.deaths;
              const oldAssists = combatStats.assists;
              
              combatStats.kills = newKills;
              combatStats.deaths = newDeaths;
              combatStats.assists = newAssists;
              updateCombatStats();
              
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
    
    // Start batch processing
    startBatchProcessing();
    
    // Start microphone recording
    startMicrophoneRecording();
    
    // Update UI
    document.getElementById('start-logging-btn').style.display = 'none';
    document.getElementById('stop-logging-btn').style.display = 'inline-block';
    setStatus("🟢 Logging Active - Events being tracked", "ok");
    
    log("ok", "🟢 LOGGING STARTED - All events will now be tracked and batched");
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
              combatStats.kills = rosterData.kills || 0;
              combatStats.deaths = rosterData.deaths || 0;
              combatStats.assists = rosterData.assists || 0;
              updateCombatStats();
              
              log("ok", `📊 Current stats loaded: K:${combatStats.kills} D:${combatStats.deaths} A:${combatStats.assists}`);
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
  const filename = `marvel-rivals-mic-recording-${timestamp}.${extension}`;
  
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
  // Filter out setup/debug events, keep only gameplay events
  const gameplayEvents = eventLog.filter(e => 
    e.type === 'batch_summary' || 
    e.message.includes('KILL') || 
    e.message.includes('DEATH') || 
    e.message.includes('ASSIST') ||
    e.message.includes('MATCH') ||
    e.message.includes('ROUND') ||
    e.message.includes('PLAYER DIED') ||
    e.message.includes('PLAYER KILLED') ||
    e.message.includes('PLAYER ASSISTED')
  );
  
  // Get final stats from current roster data
  let finalStats = {
    kills: combatStats.kills,
    deaths: combatStats.deaths,
    assists: combatStats.assists
  };
  
  // Try to get the most recent stats from roster data
  overwolf.games.events.getInfo((result) => {
    if (result.success && result.res && result.res.match_info) {
      Object.keys(result.res.match_info).forEach(key => {
        if (key.startsWith('roster_')) {
          try {
            const rosterData = typeof result.res.match_info[key] === 'string' 
              ? JSON.parse(result.res.match_info[key]) 
              : result.res.match_info[key];
            
            if (rosterData.is_local) {
              finalStats = {
                kills: parseInt(rosterData.kills) || 0,
                deaths: parseInt(rosterData.deaths) || 0,
                assists: parseInt(rosterData.assists) || 0
              };
            }
          } catch (e) {
            console.log("Error parsing roster data for final stats:", e);
          }
        }
      });
    }
    
    // Proceed with export using the final stats
    performExport(finalStats, gameplayEvents);
  });
  
  // Fallback if getInfo fails
  setTimeout(() => {
    performExport(finalStats, gameplayEvents);
  }, 1000);
}

function performExport(finalStats, gameplayEvents) {
  const exportData = {
    session_info: {
      timestamp: new Date().toISOString(),
      total_batches: eventLog.filter(e => e.type === 'batch_summary').length,
      final_stats: finalStats
    },
    batch_summaries: eventLog.filter(e => e.type === 'batch_summary').map(e => e.data),
    key_events: gameplayEvents.filter(e => e.type !== 'batch_summary')
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create and download file
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marvel-rivals-analysis-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  const batchCount = eventLog.filter(e => e.type === 'batch_summary').length;
  log("ok", `📊 Exported analysis data: ${batchCount} batches, ${finalStats.kills} kills, ${finalStats.deaths} deaths`);
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
