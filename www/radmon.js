"use strict";
const width = 800;
const height = 800;

function init() {
    const canvas = document.getElementById('viewport');
    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const program = createProgram(gl, vertexSource, fragmentSource);

    // Create a buffer to put three 2d clip space points in
    const positionBuffer = createDrawBuffer(gl, gl.getAttribLocation(program, "a_position"),
        new Float32Array([
           0, 0,
           width, 0,
           0, height,
           0, height,
           width, 0,
           width, height,
        ]));


    // provide texture coordinates for the rectangle.
    createDrawBuffer(gl, gl.getAttribLocation(program, "a_texCoord"),
        new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]));

    const texture0 = createTexture(gl, 0, gl.getUniformLocation(program, "u_image0"));
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    const emptyPx = [255,0,100,122, 0, 200, 0, 150];
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        new ImageData(Uint8ClampedArray.from(emptyPx), 1, 2));

    const texture1 = createTexture(gl, 1, gl.getUniformLocation(program, "u_image1"));
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    const emptyPx2 = [0,150,75,90, 200, 0, 100, 150, 10,10,200,100, 0,200,0,200];
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        new ImageData(Uint8ClampedArray.from(emptyPx2), 4, 1));

    // look up where the vertex data needs to go.
    const scaleLocation = gl.getUniformLocation(program, "u_scale");
    const textures = [texture0, texture1];
    const programInfo = {program, scaleLocation, textures} 

    render(gl, programInfo);
    return [gl, programInfo];
}

async function main([gl, programInfo]) {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    const buffer_address = instance.exports.IMG_BUFFER.value;
    console.log(instance.exports.memory.buffer);
    instance.exports.render_js();

    const arr = new Uint8ClampedArray(
        instance.exports.memory.buffer,
        buffer_address,
        4 * width * height,
    );
    const image = new ImageData(arr, width, height);

    window.imD = image;
    // Upload the image into the texture.
    gl.bindTexture(gl.TEXTURE_2D, programInfo.textures[0]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // is this necessary
    gl.bindTexture(gl.TEXTURE_2D, programInfo.textures[1]);
    const emptyPx2 = [0,150,75,90, 200, 0, 100, 150, 10,10,200,100, 0,200,0,200];
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        new ImageData(Uint8ClampedArray.from(emptyPx2), 4, 1));
    render(gl, programInfo);
    console.log('did tex load')
}

function render(gl, {program, scaleLocation, textures}) {
    fitCanvasSize(gl);
    console.log(program)


    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);
    gl.uniform2fv(scaleLocation, window.scaleArr);

    var u_image0Location = gl.getUniformLocation(program, "u_image0");
    var u_image1Location = gl.getUniformLocation(program, "u_image1");
    // set which texture units to render with.
    gl.uniform1i(u_image0Location, 0);  // texture unit 0
    gl.uniform1i(u_image1Location, 1);  // texture unit 1
    
    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    window.RL = resolutionLocation

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}
window.scaleArr = [1.2,1.2]


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

function createDrawBuffer(gl, location, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Turn on the position attribute
    gl.enableVertexAttribArray(location);

    // Tell the position attribute how to get data out of buffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        location, size, type, normalize, stride, offset);
    return buffer;
}

function createTexture(gl, unit, location) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
 
    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 
    return texture;
}


const vertexSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_scale;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 scaledPosition = a_position * u_scale;
   
   vec2 zeroToOne = scaledPosition / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}`;

const  fragmentSource = `
precision mediump float;

// our texture
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
   //gl_FragColor = texture2D(u_image0, v_texCoord);
   //try to set a different color for second triangle
   //gl_FragColor = vec4(0, 1.0, 1.0, 1.0);
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
   
   
}`;
main(init());
