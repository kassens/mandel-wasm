export default function getRenderer(gl, width, height, clickHandler) {
    const program = createProgram(gl, vertexSource, fragmentSource);

    let animStepSize = 5;
    const setVertexCoords = createPositionBuffer(
        gl, gl.getAttribLocation(program, "a_position"))
    setVertexCoords(getVertices());

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
    let pong = true;
    //this is gross
    const resetAnimation = function() {
        pong = !pong;
        setTextureCoords(pong ? texturePong : texturePing);
    }
    resetAnimation();

    const copyTexture = function(y, arr, chunkHeight) {
        let img = new ImageData(arr, width, chunkHeight);
        let textureY = y + (pong ? height : 0);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, textureY, gl.RGBA, gl.UNSIGNED_BYTE, img);
        render();
    }

    function render(scale, scaleTranslation) {
        if (!scale) scale=1;
        gl.useProgram(program);
        const scaleLocation = gl.getUniformLocation(program, "u_scale");
        gl.uniform2fv(scaleLocation, [scale, scale]);
        const scaleTransLocation = gl.getUniformLocation(program, "u_scale_translation");
        gl.uniform2fv(scaleTransLocation, [scaleTranslation, scaleTranslation]);

        // Draw the rectangle.
        const primitiveType = gl.TRIANGLES;
        const offset = 0;
        const count = 12;
        gl.drawArrays(primitiveType, offset, count);
    }

    const setupTransition = function({x, y}, scaleFactor) {
        console.log(x, y, scaleFactor)
        gl.useProgram(program);
        const translationLocation = gl.getUniformLocation(program, "u_translation");
        gl.uniform2fv(translationLocation, [x, y]);
        return function(t) {
            //t varies from 0..100
            //console.log('driver', t, 1 + t/100 * (scaleFactor-1));

            if (t < 100) {
                render(1 + t/100 * (scaleFactor-1), t/100 * scaleFactor);
                return true;
            } else {
                render(scaleFactor, scaleFactor);
                resetAnimation();
                return false;
            }
        }
    }

    return {copyTexture, setupTransition};
}

function getVertices(insetCenter, scaleFactor) {
    const clipSquare = [-1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1];
    const vertices = new Float32Array(clipSquare.concat(clipSquare.map(v => v * 0.8)));
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
