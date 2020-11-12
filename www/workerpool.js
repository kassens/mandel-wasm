export default async function(count, width, height, copyTexture) {
    let workers = await Promise.all(Array(count).fill(null).map(makeWorker));
    return async function(frameInfo, textureNum) {
        const {x, y, stepSize} = frameInfo;
        const available = workers.length;
        if (!available) throw new Error("No workers available");
        const chunkHeight = height/available;
        const getChunkOffset = n => chunkHeight * n;
        let buffers = await Promise.all(workers.map(
                (work, n) => work(x, y + BigInt(getChunkOffset(n)), width, chunkHeight, stepSize)));
        let offset = textureNum * height;
        buffers.forEach(
            (data, n) => copyTexture(offset + getChunkOffset(n), data.arr, chunkHeight));
        return frameInfo;
    }
}

function makeWorker() {
    const worker = new Worker("./worker.js");
    return new Promise((resolveWorker, rejectWorker) => {
        let resolver = null;
        let t = null;
        worker.onmessage = function(event) {
            if (event.data == "READY") {
                resolveWorker(function(x, y, width, height, stepSize) {
                    t = Date.now();
                    return new Promise((resolve, reject) => {
                        // no queuing
                        if (resolver != null) reject();
                        resolver = resolve;
                        worker.postMessage({x, y, width, height, stepSize});
                    });
                });
            } else {
                console.log('worker took', Date.now() - t);
                const resolve = resolver;
                resolver = null;
                t = null;
                resolve(event.data);
            }
        }
    });
}

