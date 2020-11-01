"use strict";
const width = 200;
const height = width;

function init() {
    const canvas = document.getElementById('viewport');
    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));
    const program = createProgram(gl, vertexSource, fragmentSource);

    // Create a buffer to put three 2d clip space points in
    const setPosition = createPositionBuffer(gl, gl.getAttribLocation(program, "a_position"));

    const render = (() => { return function render() {
        fitCanvasSize(gl);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        console.log(program)

        setPosition( new Float32Array([
               -0.9, -0.9,
               0, -1,
               -0.8, 0,
                
               0, 0,
               0, 1,
               1, 0,
               ]));
        /*
        setPosition( new Float32Array([
               10, 20,
               width, 0,
               0, height,
               width, 100,
               100, height,
               width-5, height-10]));
        */

        // lookup uniforms

        // Clear the canvas
        //gl.clearColor(0, 0, 100, 0);
        //gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
        const scaleLocation = gl.getUniformLocation(program, "u_scale");
        gl.uniform2fv(scaleLocation, window.scaleArr);

    // color shit
    //gl.bindBuffer(gl.ARRAY_BUFFER, pickBuffer);
    //gl.enableVertexAttribArray(pickLocation);
    //console.log(pickLocation)
    //gl.vertexAttribPointer(pickLocation, 1, gl.BYTE, false, 0, 0);
        

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
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

uniform vec2 u_resolution;
uniform vec2 u_scale;

varying vec2 v_texCoord;

void main() {
   gl_Position = vec4(a_position, 0, 1);
}`;

const  fragmentSource = `
precision mediump float;

void main() {
   //gl_FragColor = texture2D(u_image0, v_texCoord);
   //try to set a different color for second triangle
   gl_FragColor = vec4(0, 1.0, 1.0, 1.0);
   //vec4 color0 = texture2D(u_image0, v_texCoord);
   //vec4 color1 = texture2D(u_image1, v_texCoord);
   //gl_FragColor = color0 * color1;
   
   
}`;
init();
