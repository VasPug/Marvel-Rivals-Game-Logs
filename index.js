const MARVEL_RIVALS_ID = 248901;
const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const combatStatsEl = document.getElementById("combat-stats");
const killsEl = document.getElementById("kills");
const deathsEl = document.getElementById("deaths");
const assistsEl = document.getElementById("assists");

function log(type, msg, data) {
  const timestamp = new Date().toISOString();
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line, data || "");
  
  // Create event object
  const event = {
    timestamp: timestamp,
    type: type,
    message: msg,
    data: data || null
  };
  
  // Store event for JSON export
  eventLog.push(event);
  
  // Add to current batch
  addEventToBatch(event);
  
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
  
  // Check for stat changes during this batch
  const deathsGained = combatStats.deaths - currentBatch.deathCount;
  const killsGained = combatStats.kills - currentBatch.killCount;
  const assistsGained = combatStats.assists - currentBatch.assistCount;
  
  // Add special events for stat changes
  if (deathsGained > 0) {
    currentBatch.playerDied = true;
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "death_event",
      message: `💀 PLAYER DIED ${deathsGained} time(s) in this batch`,
      data: { deaths_gained: deathsGained, total_deaths: combatStats.deaths }
    });
  }
  
  if (killsGained > 0) {
    currentBatch.playerKilled = true;
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "kill_event", 
      message: `💀 PLAYER KILLED ${killsGained} enemy(ies) in this batch`,
      data: { kills_gained: killsGained, total_kills: combatStats.kills }
    });
  }
  
  if (assistsGained > 0) {
    currentBatch.playerAssisted = true;
    currentBatch.events.push({
      timestamp: now.toISOString(),
      type: "assist_event",
      message: `🤝 PLAYER ASSISTED ${assistsGained} time(s) in this batch`,
      data: { assists_gained: assistsGained, total_assists: combatStats.assists }
    });
  }
  
  // Create batch summary
  const batchSummary = {
    batch_id: `batch_${Math.floor(now.getTime() / 10000)}`,
    start_time: currentBatch.startTime.toISOString(),
    end_time: now.toISOString(),
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
  
  // Reset for next batch
  currentBatch.startTime = now;
  currentBatch.events = [];
  currentBatch.playerDied = false;
  currentBatch.playerKilled = false;
  currentBatch.playerAssisted = false;
  currentBatch.deathCount = combatStats.deaths;
  currentBatch.killCount = combatStats.kills;
  currentBatch.assistCount = combatStats.assists;
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
      
      // Start batch processing for AI analysis
      startBatchProcessing();
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
              const newKills = rosterData.kills || 0;
              const newDeaths = rosterData.deaths || 0;
              const newAssists = rosterData.assists || 0;
              
              // Check if stats changed
              if (newKills !== combatStats.kills) {
                log("ok", `💀 KILL! Total kills: ${newKills}`, rosterData);
                combatStats.kills = newKills;
                updateCombatStats();
              }
              
              if (newDeaths !== combatStats.deaths) {
                log("error", `💀 DEATH! Total deaths: ${newDeaths}`, rosterData);
                combatStats.deaths = newDeaths;
                updateCombatStats();
              }
              
              if (newAssists !== combatStats.assists) {
                log("warn", `🤝 ASSIST! Total assists: ${newAssists}`, rosterData);
                combatStats.assists = newAssists;
                updateCombatStats();
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

// ====== 6️⃣ Export functionality ======
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
  
  const exportData = {
    session_info: {
      timestamp: new Date().toISOString(),
      total_batches: eventLog.filter(e => e.type === 'batch_summary').length,
      final_stats: {
        kills: combatStats.kills,
        deaths: combatStats.deaths,
        assists: combatStats.assists
      }
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
  log("ok", `📊 Exported analysis data: ${batchCount} batches, ${combatStats.kills} kills, ${combatStats.deaths} deaths`);
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
  
  // Set up export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportEventsAsJSON);
  }
  
  // Start monitoring game state
  checkGameState();
  setInterval(checkGameState, 2000); // Check every 2 seconds
};
