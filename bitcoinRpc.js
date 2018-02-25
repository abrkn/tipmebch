const assert = require('assert');
const superagent = require('superagent');
const Redlock = require('redlock');

const createBitcoinRpc = ({ redisClient, say, bitcoindUrl }) => {
  assert(redisClient, 'redisClient is required');
  assert(bitcoindUrl, 'bitcoindUrl is required');

  const redlock = new Redlock([redisClient]);
  const lockBitcoind = () =>
    redlock.lock(`locks.bitcoind.${bitcoindUrl}.lock`, 10e3);

  let fetchRpcCounter = 1;

  const fetchRpc = (method, params) =>
    superagent
      .post(bitcoindUrl)
      .send({ id: (++fetchRpcCounter).toString(), method, params })
      .then(_ => {
        const { result, error } = _.body;
        if (error) {
          throw new Error(error);
        }
        return result;
      });

  return {
    fetchRpc,
    lockBitcoind,
  };
};

module.exports = createBitcoinRpc;
