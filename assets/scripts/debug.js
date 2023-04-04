// Don't go crazy with this, not sure how much memory the TV has
const MAX_DEBUG_LINES = 256;

var debugMessages = [];

function debugLog() {
  let message = '';
  let args = arguments;
  let consoleMessage = [];
  let currentdate = new Date();
  let datetime = '>';

    /*
    let datetime = '>' +
    currentdate.getDate().toString().padStart(2, '0') +
    '/' +
    (currentdate.getMonth() + 1).toString().padStart(2, '0') +
    '/' +
    currentdate.getFullYear() +
    ' @ ' +
    currentdate.getHours().toString().padStart(2, '0') +
    ':' +
    currentdate.getMinutes().toString().padStart(2, '0') +
    ':' +
    currentdate.getSeconds().toString().padStart(2, '0'); */

  if (debugMessages.length > MAX_DEBUG_LINES) {
    debugMessages.shift();
  }

  message = '';

  for (let argIndex = 0; argIndex < args.length; argIndex++) {
    consoleMessage.push(args[argIndex]);
    //console.log('args[argIndex]', argIndex, args[argIndex]);
    if (typeof args[argIndex] === 'object' && args[argIndex] !== null) {
      message = message + JSON.stringify(args[argIndex]);
    } else {
      message = message + args[argIndex];
    }
  }

  console.log(...consoleMessage);

  debugMessages.push({
    datetime: datetime,
    message: message,
  });

  renderDebug();
}

function renderDebug() {
  let debugTextarea = document.getElementById('debugTextarea');

  if (debugTextarea) {
    debugTextarea.value = '';

    for (let db of debugMessages) {
      debugTextarea.value = `${debugTextarea.value}${
        debugTextarea.value != '' ? '\n' : ''
      }${db.datetime} ${db.message}`;
    }

    debugTextarea.scrollTop = debugTextarea.scrollHeight;
  }
}

function hideDebug() {
  let debugContainer = document.getElementById('debugContainer');
  debugContainer.style.display = 'none';
}

function showDebug() {
  let debugContainer = document.getElementById('debugContainer');
  debugContainer.style.display = 'flex';
  debugTextarea.scrollTop = debugTextarea.scrollHeight;
}

function clearDebug() {
  debugMessages = [];
  renderDebug();
}
