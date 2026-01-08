/**
 * Override: The Attention Firewall
 * Background Service Worker (Manifest V3)
 * Author: Sumanth Katta
 * Description: Manages timer alarms, notifications, and persistent state
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("Override Extension Installed");
  
  // Initialize default state - blocking enabled by default
  chrome.storage.local.set({ 
    isBlocking: true,
    overrideEnabled: true,
    vectorsBlocked: 0,
    sessionsComplete: 0,
    totalTime: 0
  });
});

// ========================================
// TIME LOCK MANAGEMENT
// ========================================

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStatus") {
    chrome.storage.local.get(["overrideEnabled"], (result) => {
      sendResponse({ enabled: result.overrideEnabled ?? true });
    });
    return true;
  }
  
  if (request.action === "startTimer") {
    const duration = request.endTime - Date.now();
    
    // Clear any existing alarms
    chrome.alarms.clear('focusTimer');
    
    // Create new alarm
    chrome.alarms.create('focusTimer', {
      when: request.endTime
    });
    
    console.log(`🔒 Override: Timer set for ${Math.floor(duration / 60000)} minutes`);
    sendResponse({ success: true });
    return true;
  }
});

// Handle alarm (timer complete)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusTimer') {
    console.log('✅ Override: Focus session complete');
    
    // Unlock the system
    await chrome.storage.local.set({
      isLocked: false,
      lockEndTime: null
    });
    
    // Send notification
    chrome.notifications.create('focusComplete', {
      type: 'basic',
      iconUrl: 'icon48.png',
      title: '⚡ Override Protocol',
      message: 'Focus Session Complete. Protocol Unlocked.',
      priority: 2
    });
    
    // Notify popup if open
    chrome.runtime.sendMessage({
      action: 'timerComplete'
    }).catch(() => {}); // Ignore if popup is closed
  }
});

// Check for expired locks on startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['lockEndTime', 'isLocked']);
  
  if (result.isLocked && result.lockEndTime) {
    const now = Date.now();
    if (result.lockEndTime <= now) {
      // Lock expired, clean up
      await chrome.storage.local.set({
        isLocked: false,
        lockEndTime: null
      });
    }
  }
});
