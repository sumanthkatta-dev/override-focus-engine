/**
 * Override: The Attention Firewall
 * Content Script - Distraction Blocker
 * Author: Sumanth Katta
 * Description: Removes addictive UI elements (Reels/Shorts) from Instagram and YouTube
 */

console.log("Override Protocol Engaged");

// Check if extension context is valid
function isExtensionValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

// Handle extension context invalidation gracefully
window.addEventListener('error', (e) => {
  if (e.message.includes('Extension context invalidated')) {
    console.log('⚠️ Override: Extension reloaded. Please refresh this page.');
    e.preventDefault();
  }
});

// ========================================
// OVERRIDE: STATE MANAGEMENT
// ========================================

let isBlocking = true; // Default state
let observer = null;
let lastExecution = 0;
let totalVectorsBlocked = 0;
const THROTTLE_DELAY = 500; // ms between executions

// Load initial state from storage
if (isExtensionValid()) {
  chrome.storage.local.get(['isBlocking'], (result) => {
    if (!isExtensionValid()) return;
    
    isBlocking = result.isBlocking !== undefined ? result.isBlocking : true;
    
    console.log('Override: Initial blocking state:', isBlocking);
    
    if (isBlocking) {
      enableProtocol();
    } else {
      disableProtocol();
    }
  });
}

// Listen for state changes from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateState') {
    isBlocking = request.isBlocking;
    
    if (isBlocking) {
      enableProtocol();
      console.log('🔥 Override: Protocol ENGAGED');
    } else {
      disableProtocol();
      console.log('⏸️ Override: Protocol SUSPENDED');
    }
    
    sendResponse({ success: true });
  }
  return true;
});

// Enable the protocol
function enableProtocol() {
  if (document.body) {
    document.body.classList.add('override-active');
    console.log('✅ Override: Class "override-active" added to body');
    removeDistractionVectors();
    startObserver();
  } else {
    // Wait for body to be ready
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('override-active');
      console.log('✅ Override: Class "override-active" added to body (after DOMContentLoaded)');
      removeDistractionVectors();
      startObserver();
    });
  }
}

// Disable the protocol
function disableProtocol() {
  document.body.classList.remove('override-active');
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// ========================================
// OVERRIDE: THE MUTATION OBSERVER
// ========================================

// The Surgical Strike Function
function removeDistractionVectors() {
  if (!isBlocking) return; // Respect the kill switch
  
  const now = Date.now();
  
  // Throttle execution to avoid performance issues
  if (now - lastExecution < THROTTLE_DELAY) {
    return;
  }
  lastExecution = now;

  const currentUrl = window.location.hostname;
  let vectorsRemoved = 0;

  // ========================================
  // INSTAGRAM: REELS REMOVAL
  // ========================================
  if (currentUrl.includes('instagram.com')) {
    // Find all Reels links
    const reelsLinks = document.querySelectorAll('a[href*="/reels/"]');
    reelsLinks.forEach(link => {
      if (link.style.display !== 'none') {
        link.style.cssText = 'display: none !important; visibility: hidden !important;';
        vectorsRemoved++;
      }
    });

    // Find Reels navigation items
    const reelsNavItems = document.querySelectorAll('svg[aria-label="Reels"]');
    reelsNavItems.forEach(svg => {
      const parentLink = svg.closest('a');
      if (parentLink && parentLink.style.display !== 'none') {
        parentLink.style.cssText = 'display: none !important;';
        vectorsRemoved++;
      }
    });
  }

  // ========================================
  // YOUTUBE: SHORTS REMOVAL
  // ========================================
  if (currentUrl.includes('youtube.com')) {
    // Remove Shorts shelf on homepage
    const shortsShelves = document.querySelectorAll('ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer');
    shortsShelves.forEach(shelf => {
      if (shelf.style.display !== 'none') {
        shelf.remove(); // Complete removal for SPA persistence
        vectorsRemoved++;
      }
    });

    // Remove Shorts button in sidebar
    const shortsButtons = document.querySelectorAll('ytd-guide-entry-renderer a[title="Shorts"], ytd-mini-guide-entry-renderer a[title="Shorts"]');
    shortsButtons.forEach(button => {
      const guideEntry = button.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
      if (guideEntry && guideEntry.style.display !== 'none') {
        guideEntry.style.cssText = 'display: none !important;';
        vectorsRemoved++;
      }
    });

    // Remove Shorts tabs on channel pages
    const shortsTabs = document.querySelectorAll('yt-tab-shape[tab-title="Shorts"], .yt-tab-shape-wiz[tab-title="Shorts"]');
    shortsTabs.forEach(tab => {
      if (tab.style.display !== 'none') {
        tab.style.cssText = 'display: none !important;';
        vectorsRemoved++;
      }
    });

    // Remove Shorts from search results
    const shortsVideos = document.querySelectorAll('[is-shorts], [href*="/shorts/"]');
    shortsVideos.forEach(video => {
      if (video.style.display !== 'none') {
        video.style.cssText = 'display: none !important;';
        vectorsRemoved++;
      }
    });
  }

  // Log only when vectors are actually removed
  if (vectorsRemoved > 0) {
    totalVectorsBlocked += vectorsRemoved;
    console.log(`🚫 Override: ${vectorsRemoved} distraction vector(s) neutralized (Total: ${totalVectorsBlocked})`);
    
    // Send stats to popup (only if extension context is valid)
    if (isExtensionValid()) {
      try {
        chrome.runtime.sendMessage({
          action: 'updateStats',
          vectorsBlocked: totalVectorsBlocked
        }).catch(() => {}); // Ignore errors if popup is closed
      } catch (e) {
        // Extension context invalidated, ignore
      }
    }
  }
}

// Start the observer
function startObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  // Initial strike
  removeDistractionVectors();
  
  // The Observer: Watch for DOM changes
  observer = new MutationObserver((mutations) => {
    if (!isBlocking) return; // Double-check state
    
    // Check if any meaningful changes occurred
    const hasRelevantChanges = mutations.some(mutation => 
      mutation.addedNodes.length > 0 || 
      mutation.type === 'childList'
    );

    if (hasRelevantChanges) {
      removeDistractionVectors();
    }
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (observer) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }
}

// Re-run on URL changes (for SPAs)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (isBlocking) {
      console.log("🔄 Override: Navigation detected, re-scanning...");
      setTimeout(removeDistractionVectors, 1000); // Delay for SPA render
    }
  }
});

// Only observe title if it exists
if (document.querySelector('title')) {
  urlObserver.observe(document.querySelector('title'), {
    subtree: true,
    characterData: true,
    childList: true
  });
}
