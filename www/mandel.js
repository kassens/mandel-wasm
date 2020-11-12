import getRenderer from "./render.js";
import getTextureUpdater from "./workerpool.js";

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
