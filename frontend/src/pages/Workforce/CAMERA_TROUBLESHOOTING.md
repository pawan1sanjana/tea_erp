# Camera Access Troubleshooting Guide

## Quick Diagnosis

If your camera isn't working on the Face Attendance page, follow these steps:

### Step 1: Check the Browser Permission Prompt
When you first visit the page, your browser should show a permission prompt at the top or sides of the address bar.

**Browser behavior by type:**
- **Chrome/Edge**: Permission bar appears at the top
- **Firefox**: Permission bar appears at the top  
- **Safari**: Modal dialog pops up in the center
- **Mobile**: Usually shows as a permission request popup

✅ **Action**: Look for the camera permission prompt and click "Allow" or "Grant"

---

## Common Issues & Solutions

### 1. ❌ "Camera Access Denied" / Permission Not Granted

**Symptoms:**
- You see a red error screen
- Status shows "Camera permission denied"
- No permission prompt appeared

**Solutions:**

**Method A: Grant Permission (Simple)**
1. Look at your browser's address bar
2. Click the site info icon (🔒 or ℹ️)
3. Find "Camera" or "Permissions"
4. Change from "Block" to "Allow"
5. Refresh the page (F5 or Ctrl+R)

**Method B: Chrome/Edge**
1. Go to **Settings**
2. Click **Privacy and security** → **Site settings**
3. Click **Camera**
4. Add this website to "Allow" list
5. Refresh the page

**Method C: Firefox**
1. Go to **Preferences**
2. Click **Privacy & Security**
3. Scroll to **Permissions** → **Camera**
4. Find this website and change to "Allow"
5. Refresh the page

**Method D: Safari (Mac)**
1. Go to **System Preferences**
2. Click **Security & Privacy**
3. Go to **Camera** tab
4. Look for your browser and enable it
5. Refresh the page

**Method E: Mobile (iOS/Android)**
1. Go to **Device Settings**
2. Find **Apps** or **Permissions**
3. Select your browser
4. Enable **Camera** permission
5. Return to the app and refresh

---

### 2. ❌ "No Camera Device Found"

**Symptoms:**
- Error message: "No camera device found"
- Status shows "Camera hardware offline"
- Your computer/device has a camera but it's not detected

**Possible Causes & Fixes:**

| Cause | Solution |
|-------|----------|
| **Camera not connected** | Physically check USB camera connection |
| **Built-in camera disabled** | Check BIOS settings or Device Manager |
| **Camera driver missing** | Update device drivers in Device Manager |
| **Cable disconnected** | Reseat the camera cable (internal camera) |
| **Wrong port** | Try USB 2.0 vs USB 3.0 ports |

**Step-by-step fix for Windows:**
1. Right-click **Start Menu** → **Device Manager**
2. Expand **Cameras** section
3. If no cameras listed:
   - Expand **Other devices** and look for yellow ⚠️ icons
   - Right-click and select **Update driver**
4. If cameras are listed but showing errors:
   - Right-click the camera → **Disable device**
   - Wait 5 seconds
   - Right-click again → **Enable device**
5. Restart your browser

**For Mac:**
1. Click **Apple Menu** → **About This Mac**
2. Go to **System Report** → **Hardware**
3. Check **USB** section to see if camera appears
4. Restart the browser

---

### 3. ❌ "Camera is in Use by Another Application"

**Symptoms:**
- Error: "Camera is busy" or "NotReadableError"
- Another app is using the camera

**Solution:**
1. Close all other applications using camera:
   - Zoom, Teams, Skype, Google Meet
   - OBS Studio, Streamlabs
   - Photo/Camera apps
   - Other browser tabs
2. Close your browser completely
3. Open the browser again
4. Navigate back to Face Attendance page

**Quick check (Windows):**
- Open **Task Manager** (Ctrl+Shift+Esc)
- Look for running apps with camera access
- Right-click and **End Task**

---

### 4. ❌ "Security Error" or HTTPS Warning

**Symptoms:**
- Error: "Camera blocked due to security"
- Page shows "http://" in address bar (not "https://")
- Mixed content warning in browser console

**Solution:**
Browsers require HTTPS (secure connection) for camera access, except on localhost.

| Scenario | Fix |
|----------|-----|
| **Local development** | Access via `http://localhost:3000` (not computer IP) |
| **Production server** | Ensure URL starts with `https://` |
| **Self-signed certificate** | Accept the certificate warning and proceed |
| **Mixed content** | Ensure all resources load over HTTPS |

---

### 5. ❌ Camera Works but Gets Permission Denied Again

**Symptoms:**
- Camera worked once but now shows "Permission Denied"
- Keeps asking for permission

**Solution:**
1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete → Check "Cookies and cached images"
   - Firefox: Ctrl+Shift+Delete → Check "Cookies" and "Cache"
   - Safari: History → Clear History → All time

2. **Reset permissions:**
   - Chrome: Settings → Site settings → Reset all permissions
   - Firefox: about:preferences → Privacy → Cookies and data → Manage Data

3. **Try incognito/private mode:**
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P  
   - Safari: Cmd+Shift+N
   - If it works, your site settings are corrupted

4. **Reinstall browser** (as last resort)

---

### 6. ❌ Camera Shows Video But Face Recognition Not Working

**Symptoms:**
- Camera feed is visible ✓
- "Capture & Recognize" button is disabled
- Status shows "Initializing..."

**Possible Causes:**

| Cause | Solution |
|-------|----------|
| **Face models loading** | Wait 10-30 seconds for models to load from server |
| **Face models missing** | Check that `/models/` folder exists on server |
| **Models corrupted** | Clear browser cache and reload page |
| **Slow internet** | Check internet connection speed |

---

## Advanced Diagnostics

### Use Camera Diagnostic Tool

1. Open your browser's **Developer Console** (Press `F12`)
2. Go to **Console** tab
3. Paste and run:
   ```javascript
   window.diagnoseCameraIssues()
   ```
4. A popup will appear with diagnostic report
5. Share this report with IT support if needed

### Manual Camera Test

Test camera access in browser console:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera works!');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => {
    console.error('❌ Camera error:', err.name, err.message);
  });
```

---

## Browser Compatibility

| Browser | Support | Status |
|---------|---------|--------|
| Chrome | ✅ Full | Recommended |
| Edge | ✅ Full | Recommended |
| Firefox | ✅ Full | Fully supported |
| Safari | ⚠️ Limited | May need permission changes |
| IE 11 | ❌ None | Not supported |

---

## Verification Checklist

Before troubleshooting, verify:

- [ ] Browser is up to date (latest version)
- [ ] Website uses HTTPS (or localhost)
- [ ] Camera hardware is physically connected
- [ ] Camera is not in use by other applications
- [ ] Camera permission is granted to this browser
- [ ] No antivirus/firewall blocking camera
- [ ] JavaScript is enabled in browser
- [ ] Browser is not in restricted mode

---

## System Requirements

### Minimum
- **Screen Resolution**: 1024x768 minimum
- **Camera**: 320x240 minimum
- **Internet**: 2+ Mbps for model loading
- **RAM**: 2GB free
- **Browser**: Modern browser (2020+)

### Recommended
- **Screen Resolution**: 1920x1080 or higher
- **Camera**: 1280x720 (720p) or higher
- **Internet**: 5+ Mbps
- **RAM**: 4GB+ free
- **Browser**: Latest Chrome/Edge/Firefox

---

## Contact IT Support

If none of these solutions work, contact IT support with:

1. **Device info:** (Run in console)
   ```javascript
   navigator.userAgent
   ```

2. **Browser info:** Chrome/Firefox version number

3. **Camera info:** Camera manufacturer and model

4. **Error message:** Exact error text shown

5. **Diagnostic report:** Output from `window.diagnoseCameraIssues()`

6. **Steps already tried:** List of solutions you attempted

---

## Key Points to Remember

✅ **Do:**
- Grant camera permission when prompted
- Use HTTPS connection
- Check other apps aren't using camera
- Keep browser updated
- Clear cache if issues persist

❌ **Don't:**
- Block permissions then forget about it
- Use HTTP instead of HTTPS
- Have multiple camera apps open
- Use very old browser versions
- Use VPN that blocks camera (sometimes)

---

## Quick Fix Checklist (90% of issues)

1. **Refresh page** (F5) ← Try this first!
2. **Grant camera permission** in browser settings
3. **Close other camera apps** (Zoom, Teams, etc.)
4. **Check HTTPS** in address bar
5. **Restart browser** completely
6. **Clear browser cache**
7. **Restart computer**
8. **Check Windows/Device Manager** for camera
9. **Update camera drivers**
10. **Contact IT support** with diagnostic report

---

For additional help, see [FACE_RECOGNITION_SETUP.md](./FACE_RECOGNITION_SETUP.md)
