const solo = require('./lib/index');

const options = {
  host: '127.0.0.1',
  port: 6379,
  ttl: 7000,
  ping: 3000,
  interval: 5000
};

solo('process1', options, (error, worker) => {
    console.log('Doing process 1');
    setTimeout(() => worker.done(), 2000);
});
