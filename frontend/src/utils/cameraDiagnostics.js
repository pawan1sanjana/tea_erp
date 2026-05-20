/**
 * Camera Diagnostic & Troubleshooting Utilities
 * 
 * Helps diagnose and resolve camera access issues
 */

/**
 * Run comprehensive camera diagnostics
 * @returns {Promise<Object>} Diagnostic results
 */
export const runCameraDiagnostics = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    browserSupport: {
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices?.getUserMedia),
      userAgent: navigator.userAgent,
    },
    connectionSecurity: {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isLocalhost: window.location.hostname.includes('localhost'),
      isHTTPS: window.location.protocol === 'https:',
      isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    },
    devices: {
      availableDevices: [],
      hasVideoInput: false,
      hasAudioInput: false
    },
    permissions: {
      status: 'unknown'
    },
    tests: {}
  };

  // Test 1: Browser API Support
  try {
    if (!navigator.mediaDevices) {
      results.browserSupport.apiAvailable = false;
      results.browserSupport.error = 'mediaDevices not available - Browser may not support getUserMedia';
    } else {
      results.browserSupport.apiAvailable = true;
    }
  } catch (e) {
    results.browserSupport.error = e.message;
  }

  // Test 2: List available devices
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    results.devices.availableDevices = devices.map(d => ({
      deviceId: d.deviceId,
      label: d.label || 'Unknown Device',
      kind: d.kind
    }));
    
    results.devices.hasVideoInput = devices.some(d => d.kind === 'videoinput');
    results.devices.hasAudioInput = devices.some(d => d.kind === 'audioinput');
  } catch (e) {
    results.devices.error = e.message;
  }

  // Test 3: Check permissions
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
    results.permissions.status = permissionStatus.state; // granted, denied, prompt
    results.permissions.listeningForChanges = true;
  } catch (e) {
    results.permissions.error = e.message;
  }

  // Test 4: Attempt minimal camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { max: 320 } },
      audio: false
    });
    
    results.tests.minimalVideoTest = {
      status: 'success',
      resolution: `${stream.getVideoTracks()[0].getSettings().width}x${stream.getVideoTracks()[0].getSettings().height}`,
      deviceId: stream.getVideoTracks()[0].getSettings().deviceId
    };
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {
    results.tests.minimalVideoTest = {
      status: 'failed',
      errorName: e.name,
      errorMessage: e.message,
      solutions: getCameraSolutions(e.name)
    };
  }

  // Test 5: Attempt optimal camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    
    results.tests.optimalVideoTest = {
      status: 'success',
      resolution: `${stream.getVideoTracks()[0].getSettings().width}x${stream.getVideoTracks()[0].getSettings().height}`
    };
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
  } catch (e) {
    results.tests.optimalVideoTest = {
      status: 'failed',
      errorName: e.name,
      errorMessage: e.message
    };
  }

  return results;
};

/**
 * Get solutions based on error type
 * @param {string} errorName - The error name from getUserMedia
 * @returns {string[]} Array of potential solutions
 */
export const getCameraSolutions = (errorName) => {
  const solutions = {
    'NotAllowedError': [
      'User denied camera permission',
      'Check browser permission prompt - click "Allow"',
      'Go to browser Settings → Privacy → Camera and enable this site',
      'Clear site data and reload the page',
      'Try in private/incognito window'
    ],
    'NotFoundError': [
      'No camera device detected',
      'Check physical camera connection',
      'Verify camera is recognized by OS (Device Manager/System Preferences)',
      'Try restarting the computer',
      'Check if another app is using the camera'
    ],
    'NotReadableError': [
      'Camera is busy or in use by another application',
      'Close other video conference apps (Zoom, Teams, Skype)',
      'Close browser tabs using camera',
      'Restart the browser',
      'Restart the computer'
    ],
    'OverconstrainedError': [
      'Camera does not support requested resolution',
      'This is OK - system will use lower resolution',
      'Page will automatically adjust constraints and retry'
    ],
    'SecurityError': [
      'Camera blocked due to security settings',
      'Verify you are using HTTPS (not HTTP)',
      'Check for mixed content warnings',
      'Ensure page is not in an iframe with wrong permissions'
    ],
    'TypeError': [
      'Invalid camera constraints',
      'Browser API issue',
      'Try updating your browser to the latest version'
    ]
  };

  return solutions[errorName] || [
    'Unknown camera error',
    'Try refreshing the page',
    'Check browser console for detailed error',
    'Try a different browser'
  ];
};

/**
 * Format diagnostic results for display
 * @param {Object} results - Results from runCameraDiagnostics
 * @returns {string} Formatted diagnostic report
 */
export const formatDiagnosticReport = (results) => {
  return `
=== CAMERA DIAGNOSTICS REPORT ===
Time: ${results.timestamp}

BROWSER SUPPORT:
- API Available: ${results.browserSupport.apiAvailable}
- MediaDevices: ${results.browserSupport.hasMediaDevices}
- GetUserMedia: ${results.browserSupport.hasGetUserMedia}
${results.browserSupport.error ? `- Error: ${results.browserSupport.error}` : ''}

CONNECTION SECURITY:
- Protocol: ${results.connectionSecurity.protocol}
- Is HTTPS: ${results.connectionSecurity.isHTTPS}
- Is Localhost: ${results.connectionSecurity.isLocalhost}
- Is Secure: ${results.connectionSecurity.isSecure}

AVAILABLE DEVICES:
- Video Devices: ${results.devices.availableDevices.filter(d => d.kind === 'videoinput').length}
- Audio Devices: ${results.devices.availableDevices.filter(d => d.kind === 'audioinput').length}
${results.devices.availableDevices.map(d => `  • ${d.label} (${d.kind})`).join('\n')}

PERMISSIONS:
- Status: ${results.permissions.status}
${results.permissions.error ? `- Error: ${results.permissions.error}` : ''}

TEST RESULTS:
- Minimal Video: ${results.tests.minimalVideoTest.status}
${results.tests.minimalVideoTest.status === 'failed' ? `  Error: ${results.tests.minimalVideoTest.errorName}` : ''}
- Optimal Video: ${results.tests.optimalVideoTest.status}
${results.tests.optimalVideoTest.status === 'failed' ? `  Error: ${results.tests.optimalVideoTest.errorName}` : ''}

RECOMMENDATIONS:
${
  !results.connectionSecurity.isSecure 
    ? '⚠️ Not using HTTPS - Camera access may be restricted\n'
    : ''
}
${
  !results.devices.hasVideoInput
    ? '⚠️ No video input device detected\n'
    : ''
}
${
  results.permissions.status === 'denied'
    ? '⚠️ Camera permission has been denied\n'
    : ''
}
${
  results.tests.minimalVideoTest.status === 'failed' && 
  results.tests.minimalVideoTest.errorName === 'NotAllowedError'
    ? '⚠️ Enable camera permission and refresh the page\n'
    : ''
}
==================================
  `.trim();
};

/**
 * Export diagnostics to console for user to share
 * @returns {Promise<void>}
 */
export const exportCameraDiagnostics = async () => {
  const results = await runCameraDiagnostics();
  const report = formatDiagnosticReport(results);
  
  console.log(report);
  console.log('Full diagnostics object:', results);
  
  // Also return for potential upload
  return { report, results };
};
