# Solo
Solo is a JavaScript library that runs a single thread of a worker across multiple NodeJS instances, with the warranty that only one process will be active at a given moment. This is useful for works when concurrency is an issue.

Locking is implemented with Redis, usign [redislock](https://github.com/manuelmhtr/redislock) library.

## Install

For NodeJS, use npm:

```
npm install --save solo-worker
```

## Use

Load Solo and start it with 3 parameters:

|  parameter  |  type  |  description  |
|-------------|--------|---------------|
|`id`         |string  |A string to identify this worker. It's warrantied that only 1 worker of the same `id` will be running at any time.|
|`options`    |object  |An object to specify the configuration options for the worker.|
|`worker`     |function|The function that will act as the worker.|

Options available are:

|  option  |  type  |  description  |
|----------|--------|---------------|
|`host`    |string  |The host where the redis server is located.|
|`port`    |number  |The port where the redis server is located.|
|`interval`|number  |The interval (in ms) to restart a work after one has finished (default: 0).|
|`ttl`     |number  |The timeout (in ms) to expire the lock (default: 1000).|
|`ping`    |number  |The interval (in ms) when pings occurs for inactive workers (default: 1000).|
|`prefix`  |number  |The prefix to store keys in redis (default: "solo").|

when `worker` function is executed, a callback is passed with 2 parameters: `error` and `solo`; this last one is an object with functions to interact with the library. It has the following methods:

#### solo.touch(callback)

Restarts the `ttl` of the worker which is running.

#### solo.extend(time, callback)

Extend the time of expiration of the current worker by `time` given in milliseconds.

#### solo.done(callback)

It must be called to end the current work and trigger the `interval` the let other work starts latter.


## Example


```
var Solo = require("./lib/solo");

var options = {
    host     : '127.0.0.1',
    port     : 6379,
    ttl      : 7000,
    ping     : 3000,
    interval : 5000
};

Solo("worker1", options, function(error, solo) {
    console.log("Doing work 1");

    setTimeout(function finishWork() {
        solo.done();
    }, 2000);
});
```


## License

The MIT License (MIT)

Copyright (c) 2015 VoxFeed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
