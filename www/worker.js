let chunk = null;

async function init() {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    onmessage = function (e) {
        let {width, height} = e.data;
        console.log('run', width, height);

        const buffer_address = instance.exports.IMG_BUFFER.value;
        instance.exports.render_js();

        const arr = new Uint8ClampedArray(
            instance.exports.memory.buffer,
            buffer_address,
            4 * width * height,
        );

        let rChunk = chunk;
        chunk = null;
        console.log('fe', arr.length, arr)
        postMessage({...rChunk, arr}, [arr.buffer]);
        console.log('af', arr.length, arr)
    }

    postMessage("READY");
}

init();
