const redis = require('redis');
const redislock = require('redislock');

/**
 * @param id               {string}   A string that will identify this worker.
 * @param options          {object}   An object containing the configuration options.
 * @param options.port     {number}   The port where the redis server is located.
 * @param options.host     {string}   The host where the redis server is located.
 * @param options.interval {number}   The interval (in ms) to restart a work after one has finished (default: 0).
 * @param options.ttl      {number}   The timeout (in ms) to expire the lock (default: 1000).
 * @param options.ping     {number}   The interval (in ms) when pings occurs for inactive workers (default: 1000).
 * @param options.prefix   {number}   The prefix to store keys in redis (default: 'solo').
 * @param worker           {function} The function that will execute this worker when is running.
 * @returns                {Function} Solo
 * @constructor
 */
const solo = (id, options, worker) => {
  let ttl;
  let interval;
  let ping;
  let lock;
  let redisKey;

  /**
   * Init a Solo instance.
   * @returns {boolean}
   * @private
   */
  function __init() {
    // Handle options and worker
    if (isFunction(options)) {
      worker = options;
      options = {};
    } else {
      options = options || {};
    }

    // Set default options
    const prefix = (options.prefix !== undefined) ? options.prefix : 'solo';
    const port = (options.port !== undefined) ? options.port : 6379;
    const host = (options.host !== undefined) ? options.host : '127.0.0.1';
    const redisClient = redis.createClient(port, host);

    interval = (options.interval !== undefined) ? options.interval : 0;
    ttl = (options.ttl !== undefined) ? options.ttl : 1000;
    ping = (options.ping !== undefined) ? options.ping : 1000;
    lock = redislock.createLock(redisClient, {timeout: ttl, retries: 0, delay: ping});
    redisKey = `${prefix}:${id}`;

    // Validating worker
    if (!isFunction(worker)) return false;

    // Process finishing handlers (to prevent id gets stuck).
    process.on('SIGTERM', handleDead);
    process.on('SIGINT', handleDead);

    // Start process
    start();
  }

  /**
   * Attempts to start a Solo worker.
   */
  function start() {
    lock.acquire(redisKey)
      .then(() => {
        const touch = (cb) => lock.extend(ttl, cb);
        const extend = (time, cb) => lock.extend(time, cb);
        const done = () => {
          lock.extend(interval, (error) => {
            setTimeout(() => {
              lock.release(start);
            }, interval);
          });
        };

        const soloOptions = {touch, extend, done};
        worker(undefined, soloOptions);
      })
      .catch(() => setTimeout(start, ping));
  }

  /**
   * Release lock before process end (to avoid locking).
   */
  function handleDead() {
    if (!lock) return process.exit(0);
    lock.release(() => process.exit(0));
  }

  __init();
};

const isFunction = (fn) => {
  return fn && ({}).toString.call(fn) === '[object Function]';
};

module.exports = solo;
