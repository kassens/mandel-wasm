"use strict";
const width = 200;
const height = width;

function init() {
    const canvas = document.getElementById('viewport');
    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const program = createProgram(gl, vertexSource, fragmentSource);

    // Create a buffer to put three 2d clip space points in
    const setPosition = createPositionBuffer(gl, gl.getAttribLocation(program, "a_position"));
    setPosition( new Float32Array([
           -0.9, 0.9,
           0.9, 0.9,
           -0.9, -0.9,
            
           -0.9, -0.9,
           0.9, 0.9,
           0.9, -0.9,

           -0.7, 0.7,
           0.7, 0.7,
           -0.7, -0.7,
            
           -0.7, -0.7,
           0.7, 0.7,
           0.7, -0.7,
           ]));

    const setTex = createPositionBuffer(gl, gl.getAttribLocation(program, "a_tex"));

    const texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    

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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        new ImageData(Uint8ClampedArray.from(colors), 2, 4));

    const texPos = new Float32Array([
        0,0,
        1,0,
        0,0.5,
 
        0,0.5,
        1,0,
        1,0.5,

        0,0.5,
        1,0.5,
        0,1,

        0,1,
        1,0.5,
        1,1,
    ]);
    setTex(texPos);

    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  
    
    
    
    const render = (() => { return function render() {
        fitCanvasSize(gl);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        console.log(program)

        // Clear the canvas
        //gl.clearColor(0, 0, 100, 0);
        //gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        const scaleLocation = gl.getUniformLocation(program, "u_scale");
        gl.uniform2fv(scaleLocation, window.scaleArr);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 12;
        gl.drawArrays(primitiveType, offset, count);
    }})();
    window.render = render;
    render();
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
    console.log('loc', location, buffer)
    return function (data) {
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
}

const vertexSource = `
attribute vec2 a_position;
attribute vec2 a_tex;

uniform vec2 u_resolution;
uniform vec2 u_scale;

varying vec2 v_texCoord;

void main() {
   gl_Position = vec4(a_position, 0, 1);
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
init();
