import getRenderer from "./render.js";
import getTextureUpdater from "./workerpool.js";
let start = {x:BigInt(-340), y:BigInt(-200)};
let stepSize = BigInt(160);

export default async function init(canvas, width, height) {
    const [centerX, centerY] = [width, height].map(x=> BigInt(x/2));
    const SCALE_FACTOR = BigInt(10);

    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const {render, copyTexture, resetAnimation} = getRenderer(gl, width, height);
    resetAnimation();
    const enqueueWork = getTextureUpdater('./wasmwrapper.js', 8);
    let frameInfo = {x:BigInt(-340), y:BigInt(-200), stepSize : BigInt(160)}
    const initialTasks = getFrameRenderParams(frameInfo, width, height);
    let promises = initialTasks.map(enqueueWork);
    promises.map(p => p.then( params => {
        copyTexture(params.yOffset, params.arr, params.height);
    }));
    const tstart = Date.now();
    Promise.all(promises).then( _ => console.log("did", Date.now() - tstart));

    const clickHandler = function(e) {
        frameInfo.x = SCALE_FACTOR * (frameInfo.x + BigInt(e.offsetX)) - centerX;
        frameInfo.y = SCALE_FACTOR * (frameInfo.y + BigInt(e.offsetY)) - centerY;
        frameInfo.stepSize = SCALE_FACTOR * frameInfo.stepSize;
        console.log(frameInfo)
        const nextFrame = getFrameRenderParams(frameInfo, width, height);
        let promises = nextFrame.map(enqueueWork);
        promises.map(p => p.then( params => {
            copyTexture(params.yOffset, params.arr, params.height);
        }));
        // add animation here
        Promise.all([animate(), ...promises]).then(completeUpdate);
    };
    canvas.addEventListener('click', clickHandler, false);

    function completeUpdate([newFrameInfo, ...frames]) {
        console.log('newFrameInfo', newFrameInfo, frames)
    }

}
//empirically chosen based on (high) variance of chunk render time
const NUM_CHUNKS = 20; 
function getFrameRenderParams(frameInfo, width, canvasHeight) {
    if (canvasHeight % NUM_CHUNKS != 0) {
        throw new Error("Bad chunk height", canvasHeight/NUM_CHUNKS);
    }
    const height = canvasHeight/NUM_CHUNKS;
    const {x, y, stepSize} = frameInfo;
    let chunks = Array(NUM_CHUNKS).fill(null).map((_, n) => {
        let yOffset = n*height;
        return {x, y: y + BigInt(yOffset), width, height, stepSize, yOffset};
    });

    let midOut = [];
    let pa = Math.floor(NUM_CHUNKS/2);
    let pb = pa+1;
    var keepGoing;
    do {
        keepGoing = false;
        if (pa >= 0) {
            midOut.push(chunks[pa--]);
            keepGoing = true;
        }
        if (pb < NUM_CHUNKS) {
            midOut.push(chunks[pb++]);
            keepGoing = true;
        }
    } while (keepGoing)
    return midOut;
}

window.scaleArr = [1,1]

function animate() {
    return 'not yet';
    const segmentDuration = 2000;
    let start = null;
    const step = function(ts) {
        if (start == null) start = ts;
        let elapsed = ts - start;
        if (elapsed > segmentDuration) {
            elapsed = segmentDuration;
        } else {
            requestAnimationFrame(step);
        }

        const sc = 1.0 + 0.25 * elapsed/segmentDuration;
        render(sc);
    }

    requestAnimationFrame(step);
}

function fitCanvasSize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawing buffer match it in
  // device pixels.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (gl.canvas.width  !== displayWidth ||
      gl.canvas.height !== displayHeight) {

    // Make the canvas the same size
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}

