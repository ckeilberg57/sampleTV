// The far end video elementpexRTC.renegotiate
var farEndVideo = document.getElementById('farEndVideo');
// The self view video element
var selfViewVideo = document.getElementById('selfViewVideo');
// The pin entry text box
var pin = document.getElementById('pin');

// Run when the page loads
window.addEventListener('load', function (e) {
  // Link the callSetup method to the onSetup callback
  pexRTC.onSetup = callSetup;
  // Link the callConnected method to the onConnect callback
  pexRTC.onConnect = callConnected;
  // Link the callDisconnected method to the onError callback
  pexRTC.onError = callDisconnected;
  // Link the callDisconnected method to the onDisconnect callback
  pexRTC.onDisconnect = callDisconnected;
  // Link the callDisconnected method to the onError callback
  pexRTC.onError = callError;
  // Link the onChatMessage to the getMessage callback
  pexRTC.onChatMessage = getMessage;

});

window.addEventListener('beforeunload', function (e) {
  // Disconnect the call
  pexRTC.disconnect();

  //Stop QR Scanner Process (Not to self: need to validate this!)
  scanStop=true;

  //Stop PubNub IOT Services
  virtualRemote.unsubscribeAll();

});

// This method is called when the call is setting up
function callSetup(stream, pinStatus) {
  pexRTC.setPresentationInMix(true);

  // If no pin is required, connect to the call with no pin
  if (pinStatus === 'none') {
    // Hie the pin popup
    hidePinPopup();

    // Connect to the call without a pin
    pexRTC.connect();
  } else {
    // The pin is optional
    if (pinStatus === 'optional') {
      // Set the title of the pin entry to reflect its requirement
      callPinTitle.innerText = 'Enter your PIN or press Connect';
    } else {
      // Set the title of the pin entry to reflect its requirement
      callPinTitle.innerText = 'A PIN is required to enter this meeting';
    }

    // Show the pin popup
    showPinPopup();
  }

  // Check that the selfview stream is defined
  if (stream) {
    // Set the selfview video window's source to the stream
    selfViewVideo.srcObject = stream;
  }

  // Enable presentation in mix
  // Presentation in mix allows us to show presentation in the same video window
  pexRTC.setPresentationInMix();

  // Call the ui navigateToCall method to change the visible div's
  navigateToCall();
}

//On Chat Message
function getMessage(message) {
  showChatToast(message.origin + ':  ' + message.payload, 30000);
   console.log ("Chat Message: ", message.origin, message.payload);

   var statistics = JSON.stringify(pexRTC.getMediaStatistics(), null, 2);
   console.log ("Media Statistics:", statistics);

}

// When the call is connected
function callConnected(stream) {
  // Check that the stream is defined and is a Media Stream
  if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
    // Set the far end video window's source to the stream
    farEndVideo.srcObject = stream;
  } else {
    // Set the far end video window's source to the stream
    farEndVideo.src = stream;
  }

  // Clear the pin, if we don't do this it will be cached for the next call
  pexRTC.pin = null;
  // Hide the pin entry screen
  hidePinPopup();
}

// When the call is disconnected
function callDisconnected(reason = '') {
  // Call the ui navigateToPreflight method to change the visible div's
  showToast('❌ You have been disconnected', 4000);
  navigateToPreflight();
  virtualRemote.unsubscribeAll();
}

// When the call not placed due to error
function callError(reason = '') {
  // Call the ui navigateToPreflight method to change the visible div's
  showToast('❌ The call could not be completed', 4000);
  navigateToPreflight();
  virtualRemote.unsubscribeAll();
}

// This method hangs up the cxall
function hangup() {
  // Tell the PextRTC library to disconnect
  pexRTC.disconnect();
  showToast('❌ The call has ended', 4000);
  virtualRemote.unsubscribeAll();

  // Call the ui navigateToPreflight method to change the visible div's
  navigateToPreflight();
}

// Toggle the microphone mute
function toggleMicMute() {
  // Tell the pexRTC lib to mute the microphone and store the response
  // This will ensure that the mute state is in sync
  let micState = pexRTC.muteAudio();
  // Update the front end to reflect the mute state
  updateMicMuteState(micState);
  if (micState === true) {
    showToast('🎙️ Microphone is disabled', 4000);

    virtualRemote.publish({
      channel: channelID,
      message: '🎙️ Microphone is disabled',
      x: '🎙️ Microphone is disabled',
    });
  } else {
    showToast('🎙️ Microphone is enabled', 4000);

    virtualRemote.publish({
      channel: channelID,
      message: '🎙️ Microphone is enabled',
      x: '🎙️ Microphone is enabled',
    });
  }
}

// Toggle the video mute
function toggleVidMute() {
  // Tell the pexRTC lib to mute the video and store the response
  // This will ensure that the mute state is in sync
  let vidState = pexRTC.muteVideo();
  // Update the front end to reflect the mute state
  updateVideoMuteState(vidState);
  if (vidState === true) {
    showToast('📹 Camera is disabled', 4000);

    virtualRemote.publish({
      channel: channelID,
      message: '📹 Camera is disabled',
      x: '📹 Camera is disabled',
    });
  } else {
    showToast('📹 Camera is enabled', 4000);

    virtualRemote.publish({
      channel: channelID,
      message: '📹 Camera is enabled',
      x: '📹 Camera is enabled',
    });
  }
}

// This method is used to connect to the call with a pin
function enterCall() {
  // Connect to the call with the pin entered in the text field
  pexRTC.connect(pin.value);
  // Hide the pin popup
  hidePinPopup();
}

// Select the video and audio devices
function selectMedia() {
  // Find the first selected video device, as they are sync'd we can just use the first found element
  let videoDevice = document.getElementsByClassName('videoDevices')[1];
  // Get the device ID from the selector element
  let videoDeviceId = videoDevice.options[videoDevice.selectedIndex].value;

  // Find the first selected audio device, as they are sync'd we can just use the first found element
  let audioDevice = document.getElementsByClassName('audioDevices')[1];
  // Get the device ID from the selector element
  let audioDeviceId = audioDevice.options[audioDevice.selectedIndex].value;

  // Release the video devices
  stopStreamedVideo(selfViewVideo);
  // Select the devices
  selectDevices(videoDeviceId, audioDeviceId);
}

// This method is used to release the video tracks to prevent the camera staying active when switching devices
function stopStreamedVideo(videoElem) {
  // Get the current source
  const stream = videoElem.srcObject;
  // Get the stream tracks
  const tracks = stream.getTracks();

  // Step through each track
  tracks.forEach(function (track) {
    // Stop the track
    track.stop();
  });

  // Clear the video element source
  videoElem.srcObject = null;
}
