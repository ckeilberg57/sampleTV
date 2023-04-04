// Instantiate PexRTC
var pexRTC = new PexRTC();

// Important! You must have a valid SSL cert for device selection to work!!
// Set the constraints of the video to search for
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
let constraints = {
  audio: true,
  video: {
    width: { min: 1024, ideal: 1920, max: 3840 },
    height: { min: 720, ideal: 1080, max: 2160 },
  },
};

// An async function to get the video and audio devices
async function getMediaDevices(constraints) {
  try {
    // Request permission to list devices
    await navigator.mediaDevices.getUserMedia(constraints);
    // Enumerate the devices
    let devices = await navigator.mediaDevices.enumerateDevices();

    // Filter only video (camera) devices
    let video_devices = devices.filter((d) => d.kind === 'videoinput');
    debugLog('📹 Video Input Devices:', video_devices);
    // Filter only audio input (microphone) devices
    let audio_devices = devices.filter((d) => d.kind === 'audioinput');
    debugLog('🎙️ Audio Input Devices:', audio_devices);

    // Filter only audio output (Speaker) devices
    let speaker_devices = devices.filter((d) => d.kind === 'audiooutput');
    debugLog('🔊 Audio Output Devices:', speaker_devices);

    // Set the Video Devices so we can show on the UI
    addDevicesToDropDown(
      'videoDevices',
      video_devices,
      localStorage.getItem('videoDeviceId')
    );

    // Set the Audio Devices so we can show on the UI
    addDevicesToDropDown(
      'audioDevices',
      audio_devices,
      localStorage.getItem('audioDeviceId')
    );

    debugLog(
      '📹 Selected Video Device:',
      localStorage.getItem('videoDeviceId')
    );
    debugLog(
      '🎙️ Selected Audio Device:',
      localStorage.getItem('audioDeviceId')
    );
  } catch (err) {
    showToast('🔌Media device(s) detection error: ' + err.message, 16000);
    debugLog('🔌Media device(s) detection error: ' + err.message);
  }
}

// Run the async function
getMediaDevices(constraints);

// This method is used to add devices to the device selection box
function addDevicesToDropDown(parent, devices, defaultVal = '') {
  // Track the count of devices, for labelling only
  let deviceCount = 0;

  // Get an array of elements from the passed parent class name
  let selectors = document.getElementsByClassName(parent);

  // Iterate through all elements
  for (let selector of selectors) {
    // Clear the elements content
    selector.innerHTML = '';

    // Iterate through the devices
    for (let device of devices) {
      // Iterate the count of devices
      deviceCount++;

      // Get the device ID
      let deviceId = device.deviceId;
      // Create the label for the device
      let deviceLabel = device.label
        ? device.label
        : `Device ${deviceCount} (${deviceId.substring(deviceId.length - 8)})`;

      // Create an option for the select dropdown with the device label and device ID
      let deviceOption = new Option(deviceLabel, deviceId);
      // Append the option to the select dropdown
      selector.append(deviceOption);
    }

    // Set the select dropdown to the default value
    selector.value = defaultVal;
  }
}

// This method is used to select the audio and video devices
function selectDevices(videoDeviceId, audioDeviceId) {
  // If a video device has been selected
  if (videoDeviceId !== 'loading') {
    // Set the video device to the ID from our video dropdown
    pexRTC.video_source = videoDeviceId;
    // Save the video device to local storage for recall later
    localStorage.setItem('videoDeviceId', videoDeviceId);
    debugLog('videoDeviceId is set:', videoDeviceId);
  }

  // If an audio device has been selected
  if (audioDeviceId !== 'loading') {
    // Set the audio device to the ID from our audio dropdown
    pexRTC.audio_device = audioDeviceId;
    // Save the audio device to local storage for recall later
    localStorage.setItem('audioDeviceId', audioDeviceId);
    debugLog('audioDeviceId is set:', audioDeviceId);
  }

  pexRTC.renegotiate(false);
}

// This method is called on button push to connect our call
function connectCall(dialURI, participantName, maxCallRate) {
  // Get the device ID from the selector element
  let videoDeviceId = localStorage.getItem('videoDeviceId');
  let audioDeviceId = localStorage.getItem('audioDeviceId');

  // Select the correct video and audio devices in PexRTC
  pexRTC.audio_device = audioDeviceId;
  pexRTC.video_source = videoDeviceId;

//Disable VP9 video codec
  pexRTC.vp9_enabled = false;

  pexRTC.makeCall(server, dialURI, participantName, maxCallRate);
}
