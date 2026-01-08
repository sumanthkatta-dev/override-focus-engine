# Override Extension - Testing Guide
**Author: Sumanth Katta**

## Quick Test Steps

### 1. Reload Extension
1. Open `chrome://extensions/`
2. Find "Override: The Attention Firewall"
3. Click the **Reload** button (↻)

### 2. Test on YouTube
1. Go to `https://www.youtube.com`
2. Open DevTools Console (F12)
3. You should see:
   ```
   Override Protocol Engaged
   Override: Initial blocking state: true
   ✅ Override: Class "override-active" added to body
   ```
4. **Expected Result**: Shorts button in sidebar should be GONE
5. Look in the Elements tab - `<body>` should have class `override-active`

### 3. Test on Instagram
1. Go to `https://www.instagram.com`
2. Check console for same messages
3. **Expected Result**: Reels icon in left sidebar should be GONE

### 4. Test Toggle
1. Click the Override icon in toolbar
2. Toggle "Focus Protocol" OFF
3. Refresh page → Shorts/Reels should REAPPEAR
4. Toggle ON → Refresh → They should DISAPPEAR again

### 5. Test Timer
1. Select "2m" duration
2. Click Play (▶) button
3. Watch countdown start
4. Progress ring should animate
5. Try to toggle OFF → Should be LOCKED

## Troubleshooting

### If Blocking Doesn't Work:

**Check 1: Extension Loaded**
- `chrome://extensions/` - Is Override enabled?
- Any errors shown?

**Check 2: Console Logs**
- F12 on YouTube/Instagram
- Do you see "Override Protocol Engaged"?
- Do you see "override-active" class added?

**Check 3: Body Class**
- F12 → Elements tab
- Click `<body>` tag
- Does it have class `override-active`?

**Check 4: CSS Loading**
- F12 → Sources tab
- Find `styles.css`
- Are the rules there?

**Check 5: Hard Refresh**
- Clear extension storage: `chrome://extensions/` → Override → Details → "Clear extension data"
- Reload extension
- Hard refresh page (Ctrl+Shift+R)

### If Timer Doesn't Work:
- Check background.js console: `chrome://extensions/` → Override → "service worker" link
- Look for alarm creation messages

## Expected Behavior

✅ **Working:**
- Console shows "Override Protocol Engaged"
- Body has class "override-active"
- Shorts/Reels are hidden
- Toggle works (on/off)
- Timer locks the toggle
- Stats update

❌ **Not Working:**
- No console messages → Content script not loading
- No class on body → enableProtocol() not running
- Elements still visible → CSS not targeting correctly
