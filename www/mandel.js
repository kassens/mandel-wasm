"use strict";
const width = 500;
const height = 400;

function getRenderer() {
    const canvas = document.getElementById('viewport');
    canvas.addEventListener('click', clickHandler, false);
    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const program = createProgram(gl, vertexSource, fragmentSource);

    let animStepSize = 5;
    const clipSquare = [-1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1];
    const vertices = new Float32Array(clipSquare.concat(clipSquare.map(v => v * 0.8)));
    (createPositionBuffer(gl, gl.getAttribLocation(program, "a_position")))(vertices);

    const texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        //new ImageData(new Uint8ClampedArray(width*(height)*4), width, height));
        new ImageData(new Uint8ClampedArray(width*(height*2)*4), width, height*2));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  

    const setTextureCoords = createPositionBuffer(gl, gl.getAttribLocation(program, "a_tex"));
    const topSquare    = [0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.0, 0.5, 1.0, 0.0, 1.0, 0.5];
    const bottomSquare = topSquare.map((v, n) => v + n%2 * 0.5);
    const texturePing = new Float32Array(topSquare.concat(bottomSquare));
    const texturePong = new Float32Array(bottomSquare.concat(topSquare));
    let pong = true;
    window.resetAnimation = function() {
        pong = !pong;
        setTextureCoords(pong ? texturePong : texturePing);
    }

    window.updateTexture = function(y, arr, chunkHeight) {
        let img = new ImageData(arr, width, chunkHeight);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, gl.RGBA, gl.UNSIGNED_BYTE, img);
        render();

    }
    resetAnimation();
    
    gl.viewport(0, 0, width, height);
    return function render(scale) {
        if (!scale) scale=1;
        gl.useProgram(program);
        const scaleLocation = gl.getUniformLocation(program, "u_scale");
        gl.uniform2fv(scaleLocation, [scale, scale]);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 12;
        gl.drawArrays(primitiveType, offset, count);
    }
}

window.scaleArr = [1,1]

function createProgram(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();
    const createShader = (source, type) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    const v = createShader(vertexSource, gl.VERTEX_SHADER);
    const f = createShader(fragmentSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, f);
    gl.attachShader(program, v);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        //throw new Error();
    }
    return program;
}

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

function createPositionBuffer(gl, location) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Turn on the position attribute
    gl.enableVertexAttribArray(location);

    const size = 2;          // 2 components per iteration
    const type = gl.FLOAT;   // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0;        // 0 = move forward size * sizeof(type) each iteration
    const offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(location, size, type, normalize, stride, offset);

    return function(data) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
}

const vertexSource = `
attribute vec2 a_position;
attribute vec2 a_tex;

uniform vec2 u_scale;

varying vec2 v_texCoord;

void main() {
    vec2 scaledPosition = a_position * u_scale;
    gl_Position = vec4(scaledPosition, 0, 1);
    v_texCoord = a_tex;
}`;

const  fragmentSource = `
precision mediump float;

uniform sampler2D u_image0;

varying vec2 v_texCoord;
void main() {
   
   vec4 color0 = texture2D(u_image0, v_texCoord);
   gl_FragColor = color0;
   
}`;

window.render = getRenderer();

render();
function animate() {
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

function makeWorker() {
    const worker = new Worker("./worker.js");
    let isResolved = false;
    return new Promise((resolve, reject) => {
        worker.onmessage = function(event) {
            if (!isResolved && event.data == "READY") {
                isResolved = true;
                resolve(worker);
            } else {
                let data = event.data;
                let y = data.y;
                console.log(data.r)
                let {chunkHeight, offset} = data.r;
                updateTexture(offset * chunkHeight, data.arr);
            }
        }
    });
}

//let center = {x:BigInt(-90), y:BigInt(0)};
let start = {x:BigInt(-340), y:BigInt(-200)};
let stepSize = BigInt(160);
const scaleFac = BigInt(10);
let promisedWorkers =Array(4).fill(null).map(makeWorker);
console.log('romis', promisedWorkers);
let workers = null;
Promise.all(promisedWorkers).then(values => {
    console.log('workers', values)
    workers = values;
    let y = start.y;
    const chunkHeight = 100;
    workers.map((w, i) => {
        let y = start.y + BigInt(chunkHeight*i);
        let r = {chunkHeight, offset: i};
        w.postMessage({x: start.x, y, stepSize, width, height: chunkHeight, r});
    });
})

/*
const w1 = makeWorker(data => {
    if (data == "READY") {
        console.log('Ready!')
        w1.postMessage({center, stepSize, width, height});
    } else {
        console.log('got', Date.now() - data.time, data);
        updateTexture(0, data.arr);
        //updateTexture(height, data.arr);
    }
});
*/

function clickHandler(e) {
    let x = BigInt(e.offsetX);
    let y = BigInt(e.offsetY);
    center.x += x - mid.x;
    center.y += y - mid.y;
    center.x *= scaleFac;
    center.y *= scaleFac;
    stepSize *= scaleFac;
    console.log({center, stepSize, width, height});
    w1.postMessage({center, stepSize, width, height, time:Date.now()});
}
