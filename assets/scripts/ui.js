const defaultHomeMessage = 'Please scan your QR code<br>to access your appointment';

let deviceName = getStorage('deviceName');
let server = getStorage('server');
let maxCallRate = getStorage('maxCallRate');
let maxCallDuration = getStorage('maxCallDuration');
let backgroundUrl = getStorage('backgroundUrl');
let logoUrl = getStorage('logoUrl');
let customHomeMessage = getStorage('customHomeMessage');

var inCall = false;
var channelID;

var scanStop=false;

var preflightContainer = document.getElementById('preflightContainer');
var callContainer = document.getElementById('callContainer');
var callPinRequestContainer = document.getElementById('callPinRequestContainer');
var callSelfviewContainer = document.getElementById('callSelfviewContainer');
var settingsContainer = document.getElementById('settingsContainer');

var debugButton=document.getElementById('debugButton');

var callPinTitle = document.getElementById('callPinTitle');
var micMute = document.getElementById('micMute');
var vidMute = document.getElementById('vidMute');

var pexipBackground;

var logo = document.getElementById('logo');
var footer_logo = document.getElementById('footer_logo');
var pexip_logo = document.getElementById('pexip_logo');
var clock = document.getElementById('clock');
var homeMessage = document.getElementById('homeMessageContainer');
var statusZone = document.getElementById('statusZone');

var settingsButton = document.getElementById('settingsButton');

//Use your PubNub account details.  Details must match PexQr companion application
var virtualRemote = new PubNub({
  publishKey: 'pub-c-xxxxxxxxxxxxxxxxxxxxxx',
  subscribeKey: 'sub-c-xxxxxxxxxxxxxxxxxxxxx',
  keepAlive: true, // Keep the connection alive
  presenceTimeout: 600, // Don't timeout for 10 minutes
  uuid: 'PexME_Receiver',
});

virtualRemote.addListener({
  message: function (obj) {
    debugLog('RX: ' + obj.message);

    if (obj.message.includes('TerminateCall') === true) {
      debugLog('✅Action: The call has ended');
      virtualRemote.unsubscribeAll();
      hangup();
    }

    if (obj.message.includes('ToggleMicrophone') === true) {
      debugLog('✅Action: Toggle Microphone 🎙️');
      toggleMicMute();
    }

    if (obj.message.includes('ToggleCamera') === true) {
      debugLog('✅Action: Toggle Camera 📹');
      toggleVidMute();
    }

    if (obj.message.includes('SwitchView') === true) {
      debugLog('✅Action: Switch View 🔀');
      showToast('🔀 Switching view', 4000);
    }

    if (obj.message.includes('GetStatus') === true) {
      debugLog('✅Action: Remote Connected');
      showToast('📱Virtual remote connected', 4000);

      virtualRemote.publish({
        channel: channelID,
        message: '🟢Hello PexME',
        x: '🟢Hello PexME',
      });
    }
  },
});

function navigateToPreflight() {
  //preflightContainer.style.display = 'flex';
  callContainer.style.display = 'none';
  callSelfviewContainer.style.outline = '4px solid rgba(255, 108, 2, 0.3)';
  logo.style.display = 'flex';
  footer_logo.style.display = 'flex';
  clock.style.display = 'block';
  homeMessage.style.display = 'flex';
  statusZone.style.display = 'block';
  inCall = false;
  debugLog('In a call:', inCall);
  //hideSettings();
  settingsButton.style.display = 'block';
  scanQR();
}

function navigateToCall() {
  //preflightContainer.style.display = 'none';
  callContainer.style.display = 'flex';
  callSelfviewContainer.style.outline = 'transparent';
  logo.style.display = 'none';
  footer_logo.style.display = 'none';
  clock.style.display = 'none';
  homeMessage.style.display = 'none';
  statusZone.style.display = 'none';
  settingsButton.style.display = 'none';

  inCall = true;
  showToast('🌐 Connecting...', 4000);
}

function showPinPopup() {
  callPinRequestContainer.style.display = 'flex';
}

function hidePinPopup() {
  callPinRequestContainer.style.display = 'none';
}

function updateMicMuteState(micState) {
  micMute.classList.remove(micState ? 'fa-microphone' : 'fa-microphone-slash');
  micMute.classList.add(!micState ? 'fa-microphone' : 'fa-microphone-slash');
}

function updateVideoMuteState(vidState) {
  vidMute.classList.remove(vidState ? 'fa-video' : 'fa-video-slash');
  vidMute.classList.add(!vidState ? 'fa-video' : 'fa-video-slash');
}

function showSettings() {
  settingsContainer.style.display = 'flex';
  debugLog('User clicked show settings');
  //  showToast('Configuration Settings', 2000);
}

function hideSettings() {
  settingsContainer.style.display = 'none';
}

function closeSettings() {

  //Check if Android: which uses non-persistent DeviceID's which can't utilised
  const { userAgent } = navigator;

if (userAgent.includes("Android")) { 
  window.location.reload();
} else {
let videoDevice = document.getElementsByClassName('videoDevices')[0];
let videoDeviceId = videoDevice.options[videoDevice.selectedIndex].value;
let audioDevice = document.getElementsByClassName('audioDevices')[0];
let audioDeviceId = audioDevice.options[audioDevice.selectedIndex].value;
selectDevices(videoDeviceId, audioDeviceId);
hideSettings();
//Force reload of website
window.location.reload();
}
}

// Used for testing only
function closeSettingsWithoutRestart() {
  hideSettings();
}

function showToast(msg, duration) {
  Toastify({
    text: msg,
    duration: duration,
    class: "showToast",
    close: false,
    gravity: 'top', // `top` or `bottom`
    position: 'right', // `left`, `center` or `right`
    stopOnFocus: false, // Prevents dismissing of toast on hover
    style: {
      backgroundColor: 'linear-gradient(to right, #00B0F0AO, #00B0F0AO)',
      borderRadius: '5px',
    },
  }).showToast();
}


function showChatToast(msg, duration) {
  Toastify({
    text: msg,
    duration: duration,
    class: "showToast",
    close: false,
    gravity: "bottom", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: false, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #000000A0, #000000A0)",
    },
  }).showToast();
}

window.addEventListener('load', function () {
  function getDate() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const d = new Date();

    document.getElementById('date').innerHTML = `${days[d.getDay()]}, ${
      months[d.getMonth()]
    } ${d.getDate()}`;
  }

  function getTime() {
    document.getElementById('time').innerHTML = new Date()
      .toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
      .toUpperCase();
    getDate();
    setTimeout(getTime, 1000);
  }

  getTime();
});

var callSelfviewContainer = document.getElementById('callSelfviewContainer');

function decodeOnce(codeReader, selectedDeviceId) {
  codeReader
    .decodeFromInputVideoDevice(selectedDeviceId, 'selfViewVideo')
    .then((result) => {
      debugLog('Found QR code!', result);

      try {
        const myQR = JSON.parse(result);
        debugLog('QR (Json):', myQR);

        if (myQR.pexConfig) {
          //Get QR configuration
          setStorage('backgroundUrl', myQR.backgroundUrl);
          setStorage('logoUrl', myQR.logoUrl);
          setStorage('customHomeMessage', myQR.customHomeMessage);
          setStorage('server', myQR.pexipServer);
          setStorage('deviceName', myQR.deviceName);
          setStorage('maxCallRate', myQR.maxCallRate);
          setStorage('maxCallDuration', myQR.maxCallDuration);

          location.reload();
        } else if (myQR.meeting && myQR.session) {
          //Get QR Meeting
          channelID = myQR.session;
          debugLog('Meeting ID:', myQR.meeting);
          debugLog('Name:', myQR.name);
          debugLog('Session:', myQR.session);
          debugLog('Attempting call:', myQR.name + ' ▶️ ' + myQR.meeting);
          showToast(myQR.name + ' ▶️ ' + myQR.meeting, 4000);

          if (inCall === false) {
            callSelfviewContainer.style.outline =
              '4px solid rgba(153, 255, 51, 0.3)';
            inCall = true;
            debugLog('Virtual Remote Channel id:', channelID);

            virtualRemote.unsubscribeAll();
            virtualRemote.subscribe({ channels: [channelID] });
            virtualRemote.setHeartbeatInterval(60); // Send a heartbeat every 60 seconds

            channelID = myQR.session;
            const dialURI = myQR.meeting;
            const participantName = myQR.name + ' (PexME)';
            debugLog('Trying call:', dialURI, participantName);

            //Make Call -> PexRTC
            connectCall(dialURI, participantName, maxCallRate);
          }
        } else {
          debugLog('Invalid QR');
          showToast('Invalid QR', 4000);
          scanQR();
        }

        //End Try Block
      } catch (err) {
        debugLog('Error:', err.message);
        showToast('Error: ' + err.message, 8000);
        scanQR();
        //Force reboot on error --This shold be fixed with correct device selection
        location.reload();
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

const codeReader = new ZXing.BrowserQRCodeReader();
debugLog('QR code reader initialized');

window.addEventListener('load', function () {
  scanQR();
});

function scanQR() {
  let selectedDeviceId;
  
 if (scanStop===true)  {
  console.log ("ScanQR stopped!");
  return};

  codeReader
    .getVideoInputDevices()
    .then((videoInputDevices) => {
      selectedDeviceId =
        localStorage.getItem('videoDeviceId') || videoInputDevices[0].deviceId;

      decodeOnce(codeReader, selectedDeviceId);
      debugLog('Started QR scanner on camera id: ', selectedDeviceId);
    })
    .catch((err) => {
      console.error(err);
      showToast('QR device error: ' + err);
    });
}

function savePexipDeviceName(deviceName) {
  setStorage('deviceName', deviceName);
  pexDeviceName = deviceName;
}

function savePexipServer(server) {
  setStorage('server', server);
  pexServer = server;
}

function savePexipCallRate(maxCallRate) {
  setStorage('maxCallRate', maxCallRate);
  pexCallRate = maxCallRate;
}

function savePexipCallDuration(maxCallDuration) {
  setStorage('maxCallDuration', maxCallDuration);
  pexCallDuration = maxCallDuration;
}

function savePexipBackground(background) {
  setStorage('backgroundUrl', background);
  pexbackgroundUrl = background;
}

function savePexipLogo(logo) {
  setStorage('logoUrl', logo);
  pexlogoURL = logo;
}

function savePexipVideoDeviceID(videoDeviceId) {
  setStorage('videoDeviceId', videoDeviceId);
  videoDeviceId = videoDeviceId;
}

function savePexipAudioDeviceID(audioDeviceId) {
  setStorage('audioDeviceId', audioDeviceId);
  audioDeviceId = audioDeviceId;
}

function savePexipCustomHomeMessage(customHomeMessage) {
  setStorage('customHomeMessage', customHomeMessage);
  pexCustomHomeMessage = customHomeMessage;
}

function resetSettings() {
  localStorage.clear();
  location.reload();
}

function checkTabFocused() {
  if (document.visibilityState === 'visible') {
    debugLog('Browser tab has focus');
  } else {
    debugLog('Browser tab does NOT have focus');
    endCall();
  }
}

function testCall() {
  closeSettingsWithoutRestart();
  let testCall = 'test';
  showToast('Placing test call to ▶️ ' + testCall, 8000);
  connectCall(testCall, 'PexMe', maxCallRate);
}

function exportQRConfig() {
  var myObj = {
    pexConfig: true,
    logoUrl: logoUrl,
    backgroundUrl: backgroundUrl,
    deviceName: deviceName,
    pexipServer: server,
    customHomeMessage: customHomeMessage,
  };



  var qrConfig = JSON.stringify(myObj);
  
  navigator.clipboard.writeText(qrConfig);
  debugLog('Export QR configuration:', qrConfig);

  showToast('QR configuration data has been copied to clipboard. \n Please use with a 3rd party QR code generator.', 10000);
  
}

//ON LOAD
window.addEventListener('load', (event) => {
  // showToast('📱 Scan your meeting code to join your appointment' , 4000);

  //Get Browser Version
  var browserUserAgent = document.getElementById('browserUserAgent');
  var browserLanguage = document.getElementById('browserLanguage');

  const { userAgent } = navigator;
  debugLog(userAgent);
  debugLog("Language:", navigator.languages);

  browserUserAgent.innerHTML = "Browser version: " + userAgent;
  browserLanguage.innerHTML = "Language: " + navigator.languages;

  if (userAgent.includes("Android")){
    document.getElementById('audioDevices').disabled = true;
    document.getElementById('videoDevices').disabled = true;

    document.getElementById('audioDevices').style.backgroundColor = "LightGray";
    document.getElementById('videoDevices').style.backgroundColor = "LightGray";

  } else {
    document.getElementById('audioDevices').disabled = false;
    document.getElementById('videoDevices').disabled = false;

    document.getElementById('audioDevices').style.backgroundColor = "White";
    document.getElementById('videoDevices').style.backgroundColor = "White";

  }

  //Get Local Storage Settings
  debugLog('local storage');
  for (i = 0; i < localStorage.length; i++) {
    debugLog(
      localStorage.key(i) +
        '=[' +
        localStorage.getItem(localStorage.key(i)) +
        ']'
    );
  }

  //Load UI from Local Storage (if present)

  if (deviceName) {
    document.getElementById('pexDeviceName').value = deviceName;
  }
  if (server) {
    document.getElementById('pexServer').value = server;
  }
  if (maxCallRate) {
    document.getElementById('pexMaxCallRate').value = maxCallRate;
  }
  if (maxCallDuration) {
    document.getElementById('pexMaxCallDuration').value = maxCallDuration;
  }
  if (backgroundUrl) {
    document.getElementById('pexBackgroundUrl').value = backgroundUrl;
  }
  if (logoUrl) {
    document.getElementById('pexLogoUrl').value = logoUrl;
  }
  if (customHomeMessage) {
    document.getElementById('pexHomeMessage').value = customHomeMessage;
  }


  document.body.style.backgroundImage =
    'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.5) 100%), url(' +
    backgroundUrl +
    ')';
  document.getElementById('logo').src = logoUrl;

  if (customHomeMessage) {
    document.getElementById('homeMessage').innerHTML = customHomeMessage;
  } else {
    document.getElementById('homeMessage').innerHTML = defaultHomeMessage;
  }

  statusZone.innerHTML = document.getElementById('pexDeviceName').value;




});
