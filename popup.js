/**
 * Override: The Attention Firewall
 * Popup Control Panel - Modern UI
 * Author: Sumanth Katta
 * Description: Manages timer state, UI controls, and communication with content script
 */

// Manages state and communicates with content script

const focusToggle = document.getElementById('focusToggle');
const statusBadge = document.getElementById('statusBadge');
const vectorsBlocked = document.getElementById('vectorsBlocked');
const sessionsComplete = document.getElementById('sessionsComplete');
const totalTime = document.getElementById('totalTime');
const countdownDisplay = document.getElementById('countdownDisplay');
const timeAdded = document.getElementById('timeAdded');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const sessionText = document.getElementById('sessionText');
const lockIndicator = document.getElementById('lockIndicator');
const progressCircle = document.getElementById('progressCircle');
const durationBtns = document.querySelectorAll('.duration-btn');

let selectedDuration = 5; // Default 5 minutes
let isRunning = false;
let isPaused = false;
let totalDuration = 0;
const circumference = 2 * Math.PI * 110; // Circle circumference

// Initialize popup state
async function initializePopup() {
  try {
    const result = await chrome.storage.local.get([
      'isBlocking', 
      'vectorsBlocked', 
      'sessionsComplete',
      'totalTime',
      'lockEndTime', 
      'isLocked',
      'selectedDuration',
      'startTime'
    ]);
    
    const isBlocking = result.isBlocking !== undefined ? result.isBlocking : true;
    
    // Ensure blocking is enabled by default on first run
    if (result.isBlocking === undefined) {
      await chrome.storage.local.set({ isBlocking: true });
    }
    
    focusToggle.checked = isBlocking;
    updateStatusDisplay(isBlocking);
    
    // Update stats
    if (result.vectorsBlocked) {
      vectorsBlocked.textContent = result.vectorsBlocked;
    }
    if (result.sessionsComplete) {
      sessionsComplete.textContent = result.sessionsComplete;
      updateSessionDots(result.sessionsComplete % 4);
    }
    if (result.totalTime) {
      totalTime.textContent = Math.floor(result.totalTime / 60) + 'm';
    }
    
    // Check for active time lock
    if (result.lockEndTime && result.isLocked) {
      const now = Date.now();
      if (result.lockEndTime > now) {
        isRunning = true;
        totalDuration = Math.floor((result.lockEndTime - result.startTime) / 1000);
        startCountdown(result.lockEndTime);
        lockUI();
        updateButtonState('running');
      } else {
        await chrome.storage.local.set({ isLocked: false, lockEndTime: null });
        unlockUI();
      }
    }
    
    // Restore selected duration
    if (result.selectedDuration) {
      selectedDuration = result.selectedDuration;
      durationBtns.forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.duration) === selectedDuration);
      });
    }
    
  } catch (error) {
    console.error('Override: Failed to initialize popup', error);
  }
}

// Update status display
function updateStatusDisplay(isActive) {
  if (isActive) {
    statusBadge.textContent = 'Focusing';
    statusBadge.classList.remove('inactive');
  } else {
    statusBadge.textContent = 'Inactive';
    statusBadge.classList.add('inactive');
  }
}

// Duration button selection
durationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return; // Can't change during session
    
    selectedDuration = parseInt(btn.dataset.duration);
    durationBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    chrome.storage.local.set({ selectedDuration });
    countdownDisplay.textContent = `${selectedDuration}:00`;
    sessionText.textContent = `Ready to start ${selectedDuration} min session`;
  });
});

// Handle toggle change
focusToggle.addEventListener('change', async (e) => {
  const result = await chrome.storage.local.get(['isLocked']);
  if (result.isLocked) {
    e.target.checked = true;
    return;
  }
  
  const isBlocking = e.target.checked;
  
  try {
    await chrome.storage.local.set({
      isBlocking,
      sessionStart: isBlocking ? Date.now() : null
    });
    
    updateStatusDisplay(isBlocking);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateState',
        isBlocking: isBlocking
      }).catch(() => {});
    }
    
  } catch (error) {
    console.error('Override: Failed to update state', error);
  }
});

// Play/Pause/Stop controls
playBtn.addEventListener('click', async () => {
  if (!isRunning) {
    // Start new session
    startSession();
  } else if (isPaused) {
    // Resume
    resumeSession();
  }
});

pauseBtn.addEventListener('click', () => {
  pauseSession();
});

stopBtn.addEventListener('click', () => {
  stopSession();
});

async function startSession() {
  const startTime = Date.now();
  const endTime = startTime + (selectedDuration * 60 * 1000);
  totalDuration = selectedDuration * 60;
  
  await chrome.storage.local.set({
    isLocked: true,
    lockEndTime: endTime,
    startTime: startTime,
    isBlocking: true,
    selectedDuration
  });
  
  focusToggle.checked = true;
  updateStatusDisplay(true);
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateState',
      isBlocking: true
    }).catch(() => {});
  }
  
  chrome.runtime.sendMessage({
    action: 'startTimer',
    endTime: endTime
  });
  
  isRunning = true;
  isPaused = false;
  lockUI();
  updateButtonState('running');
  startCountdown(endTime);
  
  const currentSession = (await chrome.storage.local.get('sessionsComplete')).sessionsComplete || 0;
  sessionText.textContent = `Session ${(currentSession % 4) + 1} of 4`;
  
  console.log(`🔒 Override: Session started for ${selectedDuration} minutes`);
}

function pauseSession() {
  isPaused = true;
  updateButtonState('paused');
  // Note: countdown continues in background, this is UI only
}

function resumeSession() {
  isPaused = false;
  updateButtonState('running');
}

async function stopSession() {
  if (!confirm('Stop focus session early?')) return;
  
  clearInterval(countdownInterval);
  isRunning = false;
  isPaused = false;
  
  await chrome.storage.local.set({
    isLocked: false,
    lockEndTime: null
  });
  
  chrome.alarms.clear('focusTimer');
  
  unlockUI();
  updateButtonState('stopped');
  countdownDisplay.textContent = '--:--';
  timeAdded.textContent = '';
  sessionText.textContent = 'Session stopped';
  updateProgress(0);
}

function updateButtonState(state) {
  if (state === 'stopped') {
    playBtn.style.display = 'flex';
    playBtn.innerHTML = '▶';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'none';
  } else if (state === 'running') {
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';
    stopBtn.style.display = 'flex';
  } else if (state === 'paused') {
    playBtn.style.display = 'flex';
    playBtn.innerHTML = '▶';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
  }
}

function lockUI() {
  focusToggle.disabled = true;
  lockIndicator.style.display = 'block';
  durationBtns.forEach(btn => btn.disabled = true);
}

function unlockUI() {
  focusToggle.disabled = false;
  lockIndicator.style.display = 'none';
  durationBtns.forEach(btn => btn.disabled = false);
}

// Countdown timer with progress ring
let countdownInterval;
function startCountdown(endTime) {
  clearInterval(countdownInterval);
  
  const updateCountdown = async () => {
    const remaining = endTime - Date.now();
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      await completeSession();
      return;
    }
    
    const totalSeconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    countdownDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update progress ring
    const progress = 1 - (totalSeconds / totalDuration);
    updateProgress(progress);
  };
  
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateProgress(progress) {
  const offset = circumference * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
}

async function completeSession() {
  clearInterval(countdownInterval);
  
  const result = await chrome.storage.local.get(['sessionsComplete', 'totalTime']);
  const newSessions = (result.sessionsComplete || 0) + 1;
  const newTotalTime = (result.totalTime || 0) + selectedDuration;
  
  await chrome.storage.local.set({
    isLocked: false,
    lockEndTime: null,
    sessionsComplete: newSessions,
    totalTime: newTotalTime
  });
  
  sessionsComplete.textContent = newSessions;
  totalTime.textContent = Math.floor(newTotalTime / 60) + 'm';
  updateSessionDots(newSessions % 4);
  
  isRunning = false;
  unlockUI();
  updateButtonState('stopped');
  
  countdownDisplay.textContent = 'DONE';
  sessionText.textContent = 'Focus session complete!';
  
  setTimeout(() => {
    countdownDisplay.textContent = '--:--';
    sessionText.textContent = 'Select duration to start';
    updateProgress(0);
  }, 3000);
}

function updateSessionDots(activeIndex) {
  const dots = document.querySelectorAll('.progress-dot');
  dots.forEach((dot, index) => {
    dot.classList.remove('active', 'completed');
    if (index < activeIndex) {
      dot.classList.add('completed');
    } else if (index === activeIndex) {
      dot.classList.add('active');
    }
  });
}

// Listen for updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    if (request.vectorsBlocked !== undefined) {
      vectorsBlocked.textContent = request.vectorsBlocked;
      chrome.storage.local.set({ vectorsBlocked: request.vectorsBlocked });
    }
  } else if (request.action === 'timerComplete') {
    completeSession();
  }
});

// Initialize progress circle
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// Initialize on load
initializePopup();

// Cleanup on close
window.addEventListener('unload', () => {
  clearInterval(countdownInterval);
});
