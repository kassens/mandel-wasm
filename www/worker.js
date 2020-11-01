async function init() {
    const { instance } = await WebAssembly.instantiateStreaming(
        fetch("../target/wasm32-unknown-unknown/release/mandel_wasm.wasm")
    );

    onmessage = function (e) {
        let chunk = e.data;
        console.log('run', chunk);
        let {step_size, x, y, cols, rows} = chunk;

        const buffer_address = instance.exports.IMG_BUFFER.value;
        console.log('call js')
        instance.exports.render_js(step_size, x, y, cols, 140);
        console.log('did call js')

        const arr = new Uint8ClampedArray(
            instance.exports.memory.buffer,
            buffer_address,
            4 * cols * rows,
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
