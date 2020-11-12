import getRenderer from "./render.js";

window.scaleArr = [1,1]

function fitCanvasSize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
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
function animate() {
    return;
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
let start = {x:BigInt(-340), y:BigInt(-200)};
let stepSize = BigInt(160);

// does not queue
async function getTextureUpdater(count, width, height, copyTexture) {
    let workers = await Promise.all(Array(count).fill(null).map(makeWorker));
    return async function(frameInfo, textureNum) {
        const {x, y, stepSize} = frameInfo;
        const available = workers.length;
        if (!available) throw new Error("No workers available");
        const chunkHeight = height/available;
        const getChunkOffset = n => chunkHeight * n;
        let buffers = await Promise.all(workers.map(
                (work, n) => work(x, y + BigInt(getChunkOffset(n)), width, chunkHeight, stepSize)));
        let offset = textureNum * height;
        buffers.forEach(
            (data, n) => copyTexture(offset + getChunkOffset(n), data.arr, chunkHeight));
        return frameInfo;
    }
}

function makeWorker() {
    const worker = new Worker("./worker.js");
    return new Promise((resolveWorker, rejectWorker) => {
        let resolver = null;
        let t = null;
        worker.onmessage = function(event) {
            if (event.data == "READY") {
                resolveWorker(function(x, y, width, height, stepSize) {
                    t = Date.now();
                    return new Promise((resolve, reject) => {
                        // no queuing
                        if (resolver != null) reject();
                        resolver = resolve;
                        worker.postMessage({x, y, width, height, stepSize});
                    });
                });
            } else {
                console.log('worker took', Date.now() - t);
                const resolve = resolver;
                resolver = null;
                t = null;
                resolve(event.data);
            }
        }
    });
}

export default async function init(canvas) {
    const DIMENSIONS = [500, 400];
    const [width, height] = DIMENSIONS;
    const [centerX, centerY] = DIMENSIONS.map(x=> BigInt(x/2));

    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const {render, copyTexture, resetAnimation} = getRenderer(gl, width, height);
    resetAnimation();
    const callWorkers = await getTextureUpdater(4, width, height, copyTexture);
    const initialFrame = {x:BigInt(-340), y:BigInt(-200), stepSize : BigInt(160)}
    let frameInfo = await callWorkers(initialFrame, 0);


    console.log(centerX, centerY)
    const SCALE_FACTOR = BigInt(10);
    const clickHandler = function(e) {
        const x = SCALE_FACTOR * (frameInfo.x + BigInt(e.offsetX)) - centerX;
        const y = SCALE_FACTOR * (frameInfo.y + BigInt(e.offsetY)) - centerY;
        const stepSize = SCALE_FACTOR * frameInfo.stepSize;
        // add animation here
        Promise.all([
            callWorkers({x, y, stepSize}, 0),
            animate({x, y, stepSize}, 0)])
        .then(completeUpdate);
    };
    canvas.addEventListener('click', clickHandler, false);

    function completeUpdate([newFrameInfo, animComplete]) {
        console.log('newFrameInfo', newFrameInfo)
        frameInfo = newFrameInfo;
    }

}
