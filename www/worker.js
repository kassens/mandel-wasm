async function init() {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    console.log('fet',"../target/wasm32-unknown-unknown/release/mandel_wasm.wasm");
    onmessage = function (e) {
        let chunk = e.data;
        let {width, height} = chunk;
        console.log('run', width, height);

        const buffer_address = instance.exports.IMG_BUFFER.value;
        instance.exports.render_js();

        const arr = new Uint8ClampedArray(
            instance.exports.memory.buffer,
            buffer_address,
            4 * width * height,
        );

        console.log('fe', arr.length, arr)
        postMessage({...chunk, arr}, [arr.buffer]);
        console.log('af', arr.length, arr)
    }

    postMessage("READY");
}

console.log('wini')
init();
console.log('fini')
