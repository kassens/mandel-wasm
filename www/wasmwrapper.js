async function init() {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    onmessage = function (e) {
        let chunk = e.data;
        let {x, y, stepSize, width, height} = chunk;

        const buffer_address = instance.exports.IMG_BUFFER.value;
        instance.exports.render_js(
            BigInt(stepSize), BigInt(x), width, BigInt(y), height);

        const asArray = new Uint8ClampedArray(
            instance.exports.memory.buffer,
            buffer_address,
            4 * width * height,
        );

        let arr = asArray.slice();
        postMessage({...chunk, arr}, [arr.buffer]);
        delete arr;
    }

    postMessage("READY");
}

init();
