var solo = require("./lib/solo");

var options = {
    host     : '127.0.0.1',
    port     : 6379,
    ttl      : 7000,
    ping     : 3000,
    interval : 5000
};

solo("worker1", options, function(error, solo) {
    console.log("Doing work 1");

    setTimeout(function finishWork() {
        solo.done();
    }, 2000);
});