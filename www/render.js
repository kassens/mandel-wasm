export default function getRenderer(gl, width, height, clickHandler) {
    const program = createProgram(gl, vertexSource, fragmentSource);

    let animStepSize = 5;
    const setVertexCoords = createPositionBuffer(gl, gl.getAttribLocation(program, "a_position"))
    setVertexCoords(getVertices(0, 0, 1));

    const texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        new ImageData(new Uint8ClampedArray(2*width*height*4), width, height*2));

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  

    gl.viewport(0, 0, width, height);

    const setTextureCoords = createPositionBuffer(gl, gl.getAttribLocation(program, "a_tex"));
    const topSquare    = [0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.0, 0.5, 1.0, 0.0, 1.0, 0.5];
    const bottomSquare = topSquare.map((v, n) => v + n%2 * 0.5);
    const texturePing = new Float32Array(topSquare.concat(bottomSquare));
    const texturePong = new Float32Array(bottomSquare.concat(topSquare));
    let ping = true;
    const getTextureOffset = _ => ping ? height : 0;
    setTextureCoords(texturePing);
    const blank = new ImageData(new Uint8ClampedArray(width*height*4), width, height);
    const swapTextures = function() {
        ping = !ping;
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, getTextureOffset(), gl.RGBA, gl.UNSIGNED_BYTE, blank);
        setTextureCoords(ping ? texturePing : texturePong );
    }

    const copyTexture = function(y, arr, chunkHeight) {
        let img = new ImageData(arr, width, chunkHeight);
        let textureY = y + getTextureOffset();
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, textureY, gl.RGBA, gl.UNSIGNED_BYTE, img);
        draw();
    }

    gl.useProgram(program);
    const scaleLocation = gl.getUniformLocation(program, "u_scale");
    const scaleTLocation = gl.getUniformLocation(program, "u_scale_translation");
    function updateScale(scale, scaleTranslation) {
        gl.uniform2fv(scaleLocation, [scale, scale]);
        gl.uniform2fv(scaleTLocation, [scaleTranslation, scaleTranslation]);
        draw();
    }
    updateScale(1,0);

    function draw() {
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 12;
        gl.drawArrays(primitiveType, offset, count);
    }

    const translationLocation = gl.getUniformLocation(program, "u_translation");
    const setupTransition = function({x, y}, scaleFactor) {
        gl.uniform2fv(translationLocation, [x, y]);
        swapTextures();
        setVertexCoords(getVertices(-x, -y, scaleFactor));
        updateScale(1,0);
        return function(t) {
            //t varies from 0..100
            if (t < 100) {
                updateScale(1 + t/100 * (scaleFactor-1), t/100 * scaleFactor);
                return true;
            } else {
                updateScale(scaleFactor, scaleFactor);
                return false;
            }
        }
    }

    return {copyTexture, setupTransition};
}

const backRectangle = [-1, 1,   1, 1,   -1, -1,   -1, -1,   1, 1,   1, -1];
function getVertices(x, y, scaleFactor) {
    //OpenGL clip space top left is (-1,1) and bottom right is (1,-1)
    const h = 1/scaleFactor;
    const frontRectangle = 
        [x-h, y+h,   x+h, y+h,   x-h, y-h,   x-h, y-h,   x+h, y+h,   x+h, y-h];
    const vertices = new Float32Array(backRectangle.concat(frontRectangle));
    return vertices;
}

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
uniform vec2 u_translation;
uniform vec2 u_scale_translation;

varying vec2 v_texCoord;

void main() {
    vec2 adjustedPosition = a_position * u_scale + u_translation * u_scale_translation;
    gl_Position = vec4(adjustedPosition, 0, 1);
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
/*
    let teal = new Uint8ClampedArray(width*height*4).fill(255);
    for (var i=0; i< teal.length; i+=4) {
        teal[i] = 0;
    }
    let tealImg = new ImageData(teal, width, height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, tealImg);
*/
