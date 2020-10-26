//import {MandelPlot} from "wasm-try";


const ctx = document.getElementById('viewport').getContext('2d');
const width = 800;
const height = 800;

console.log('dall render')
async function init() {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    const buffer_address = instance.exports.IMG_BUFFER.value;
    console.log(instance.exports.memory.buffer);
    const arr = new Uint8ClampedArray(
        instance.exports.memory.buffer,
        buffer_address,
        4 * width * height,
    );
    const image = new ImageData(arr, width, height);

    instance.exports.render_js();

    ctx.putImageData(image, 0, 0);
    console.log("did render")
    
}
init();

/*
let bufPtr = plot.render(width, height, 6);
console.log('did call render')
const image = new ImageData(
  new Uint8Array(memory.buffer, bufPtr, 4 * width * height),
  width, height);

ctx.putImageData(imageData, 0, 0);
*/

/*
const pointer = instance.exports._render();
const data = new Uint8ClampedArray(memory.buffer, pointer, width * height * 4);
const img = new ImageData(data, width, height);
ctx.putImageData(img, 0, 0);
scale = width/?
*/
