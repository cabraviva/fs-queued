const Job = require('runjob')
const fs = require('fs')
const fsq = require('./fs-queued')

// ERROR
const chain = new Job.Chain()
chain.add(new Job(function () {
    fs.writeFile(__dirname + '/test.txt', 'Hello World', function (err) {})
}))
chain.add(new Job(function () {
    fs.readFile(__dirname + '/test.txt', function (err, data) {
        console.log(data.toString('utf-8'))
    })
}))
chain.add(new Job(function () {
    fs.writeFile(__dirname + '/test.txt', 'Hello W_rld', function (err) {})
}))

chain.handle()

setTimeout(() => {}, 5000)

// QUEUED
const chain = new Job.Chain()
chain.add(new Job(function () {
    fsq.writeFile(__dirname + '/test.txt', 'Hello World', function (err) {})
}))
chain.add(new Job(function () {
    fsq.readFile(__dirname + '/test.txt', function (err, data) {
        console.log(data.toString('utf-8'))
    })
}))
chain.add(new Job(function () {
    fsq.writeFile(__dirname + '/test.txt', 'Hello W_rld', function (err) {})
}))

chain.handle()