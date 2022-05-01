const fs = require('fs')
const Job = require('runjob')

const __HANDLING__ = {
    $HANDLING: '$HANDLING',
    handshake: '%R&$/()=?PO=IUHZGT/()=?OIHUZGT/()=?OPÜIJHUZGT/()=?PÒIJHUZ/()=?IOHUZI)=OIJHUI)=OPIJHU'
}

const __WAITING__ = {
    $WAITING: '$WAITING',
    handshake: '/()$UZG/()=?OIJHUI)=?`POIJHGZUI()=?PÒKIJHU()A=?OIPJHU)=E?POIJHUGZT/()AdtrE%&ZTR%4678'
}

global._fsQueued = {
    queues: {
        // filePath: [[operationType, callback, path, ?data], ...]
    },
    states: {

    }
}

const fsq = {
    readFile (path, cb) {
        if (!global._fsQueued.queues[path]) {
            global._fsQueued.queues[path] = []
        }

        global._fsQueued.queues[path].push(['readFile', cb, path])
    },

    writeFile (path, data, cb) {
        if (!global._fsQueued.queues[path]) {
            global._fsQueued.queues[path] = []
        }

        global._fsQueued.queues[path].push(['writeFile', cb, path, data])
    },

    promises: {
        readFile (path) {
            if (!global._fsQueued.queues[path]) {
                global._fsQueued.queues[path] = []
            }

            return new Promise((resolve, reject) => {
                global._fsQueued.queues[path].push(['readFile', (err, _data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(_data)
                    }
                }, path])
            })
        },

        writeFile (path, data) {
            if (!global._fsQueued.queues[path]) {
                global._fsQueued.queues[path] = []
            }

            return new Promise((resolve, reject) => {
                global._fsQueued.queues[path].push(['writeFile', (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve()
                    }
                }, path, data])
            })
        }
    }
}

function handleQueue (__path) {
    if (!global._fsQueued.queues[__path]) {
        global._fsQueued.queues[__path] = []
    }

    if (!global._fsQueued.states[__path]) {
        global._fsQueued.states[__path] = __WAITING__
    }

    if (global._fsQueued.states[__path] === __HANDLING__) {
        // Already handling this path
        // WAIT UNTIL IT IS FINISHED
        // AND THEN HANDLE IT AGAIN

        // Wait until the path is finished
        let _i = setInterval(function () {
            if (global._fsQueued.states[__path] !== __HANDLING__) {
                handleQueue(__path)
                clearInterval(_i)
            }
        }, 300)
    } else {
        // Handle queue
        global._fsQueued.states[__path] = __HANDLING__

        // Get the runjob queue
        const rjqueue = geRunjobQueue()[__path]

        // Start the queue
        rjqueue.handle().then(() => {
            // Finished
            global._fsQueued.states[__path] = __WAITING__
        }).catch((err) => {
            // Error
            global._fsQueued.states[__path] = __WAITING__
            console.error(err)
        })
    }
}

function geRunjobQueue () {
    let rjqueues = {}

    // for every path of the queue
    for (let path in global._fsQueued.queues) {
        // Get all operations for this path
        const operations = global._fsQueued.queues[path]

        // Create A Queue for this path
        rjqueues[path] = new Job.Queue()

        // For every operation
        for (let i = 0; i < operations.length; i++) {
            // Create a job for this operation
            const job = new Job(async function () {
                // Get the operation
                const operation = operations[i]

                // Get the operation type
                const operationType = operation[0]

                // Get the callback
                const callback = operation[1]

                // Get the path
                const path = operation[2]

                // Get the data
                const data = operation[3]

                if (operationType === 'readFile') {
                    // Read the file
                    try {
                        const _data = await fs.promises.readFile(path)
                        callback(null, _data)
                    } catch (err) {
                        callback(err, null)
                    }
                } else if (operationType === 'writeFile') {
                    // Write the file
                    try {
                        await fs.promises.writeFile(path, data)
                        callback(null)
                    } catch (err) {
                        callback(err)
                    }
                } else {
                    throw new Error('Unknown operation type: ' + operationType)
                }
            })

            // Add the job to the queue
            rjqueues[path].add(job)
        }
    }

    return rjqueues
}

fsq.queued = fsq

module.exports = fsq