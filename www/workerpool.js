export default function(workerFile, count) {
    let workQueue = [];
    let workers = [];
    let check = () => checkQueue(workQueue, workers);
    const free = worker => {
        workers.push(worker);
        check();
    }
    for (var i=0; i< count; i++) {
        makeWorker(workerFile, free);
    }
    return function(params) {
        const promise = new Promise((resolve, reject) => {
            workQueue.push({resolve, reject, params});
        });
        check();
        return promise;
    }
}

function checkQueue(q, workers) {
    if (!q.length || !workers.length) return;
    let {params, resolve, reject} = q.shift(); //order matters for work, use queue behavior
    let work = workers.pop(); //order doesn't matter for workers
    work(params, resolve, reject);
    checkQueue(q, workers);
}

function makeWorker(workerFile, free) {
    const worker = new Worker(workerFile);
    let resolver = null;
    let t = null;
    const work = function(params, resolve, reject) {
        t = Date.now();
        // no queuing
        if (resolver != null) reject();
        resolver = resolve;
        worker.postMessage(params);
    }
    worker.onmessage = function(event) {
        if (t == null ) {
            //this must be called by the worker when it initializes
            if (event.data != "READY") throw new Error("Worker inialization error.");
        } else {
            console.log('worker took', Date.now() - t);
            const resolve = resolver;
            resolver = null;
            t = null;
            resolve(event.data);
        }
        free(work);
    }

}

