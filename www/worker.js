var i = 0;
let chunk = null;

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function run() {
    console.log('run', chunk)
    if (chunk == null) return;
    i = i + 1;
    sleep(1)
    let rChunk = chunk;
    chunk = null;
    let colorArr = getColors()
    console.log('fe', colorArr.length, colorArr)
    postMessage({...rChunk, colorArr}, [colorArr.buffer]);
    console.log('af', colorArr.length, colorArr)
}

onmessage = function(e) {
  chunk = e.data;
  console.log('Message received from main script', e.data);
  setTimeout(run);
}

function getColors() {
    const colors = [
        255,0,0,255,
        0,255, 0, 255,
        0,0, 255, 255,
        0,255, 255, 255,

        255,255,0,255,
        0,0, 0, 0,
        255,0, 255, 255,
        255,255, 255, 255,
        ];
    return Uint8ClampedArray.from(colors);
}
