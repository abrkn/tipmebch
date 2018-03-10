const debug = require('debug')('tipmebch');

module.exports = ({ timeout = 60 * 60 } = {}) => {
  let timer;

  const createTimer = () => {
    if (timer) {
      clearTimeout(timer);
    }

    debug('Restarting zombie timer');

    timer = setInterval(() => {
      throw new Error(`No updates received in ${timeout} seconds`);
    }, timeout * 1000);
  };

  createTimer();

  return (ctx, next) => {
    createTimer();
    next();
  };
};
