var redis = require('redis');
var redislock = require('redislock');

/**
 * Solo is a JavaScript library that runs a single thread of a worker across multiple NodeJS instances, with the warranty that only
 * one process will be active at a given moment. This is useful for works when concurrency is an issue.
 *
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
var solo = function(id, options, worker) {
  var port;
  var host;
  var ttl;
  var interval;
  var ping;
  var prefix;
  var redisClient;
  var lock;
  var redisKey;

  /**
   * Init a Solo instance.
   * @returns {boolean}
   * @private
   */
  function __init() {
    // Handle options and worker
    if (options && ({}).toString.call(options) === '[object Function]') {
      worker = options;
      options = {};
    } else {
      options = options || {};
    }

    // Set default options
    port = (options.port !== undefined) ? options.port : 6379;
    host = (options.host !== undefined) ? options.host : '127.0.0.1';
    interval = (options.interval !== undefined) ? options.interval : 0;
    ttl = (options.ttl !== undefined) ? options.ttl : 1000;
    ping = (options.ping !== undefined) ? options.ping : 1000;
    prefix = (options.prefix !== undefined) ? options.prefix : 'solo';
    redisClient = redis.createClient(port, host);
    lock = redislock.createLock(redisClient, {timeout: ttl, retries: 0, delay: ping});
    redisKey = '' + prefix + ':' + id;

    // Validating worker
    if (worker && ({}).toString.call(worker) !== '[object Function]') {
      return false;
    }

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
    lock.acquire(redisKey).then(function(error) {
      if (!error) {
        var soloOptions = {
          touch: function extend(callback) {
            lock.extend(ttl, callback);
          },
          extend: function extend(time, callback) {
            lock.extend(time, callback);
          },
          done: function workerFinished() {
            lock.extend(interval, function(error) {
              setTimeout(function restart() {
                lock.release(start);
              }, interval);
            });
          }
        };
        worker(undefined, soloOptions);
      } else {
        // No lock yet, attempt latter
        setTimeout(start, ping);
      }
    });
  }

  /**
   * Release lock before process end (to avoid locking).
   */
  function handleDead() {
    if (lock) {
      lock.release(function() {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }

  __init();
};

module.exports = solo;
