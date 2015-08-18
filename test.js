var solo = require("./lib/solo");

var options = {
    host     : '127.0.0.1',
    port     : 6379,
    ttl      : 7000,
    ping     : 3000,
    interval : 5000
};

solo("worker1", options, function(error, worker) {
    console.log("Doing work 1");

    setTimeout(function finishWork() {
        worker.done();
    }, 2000);
});