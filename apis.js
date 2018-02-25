const {
  isValidTelegramUserIdFormat,
  getUserAccount,
  bchAddressToInternal,
} = require('./utils');

const { BalanceWouldBecomeNegativeError } = require('./errors');

const assert = require('assert');
const superagent = require('superagent');
const pMemoize = require('p-memoize');
const {
  n,
  formatBch,
  formatUsd,
  hasTooManyDecimalsForSats,
} = require('./utils');

const MIN_WITHDRAW_AMOUNT = 0.0001;

const fetchCoinmarketcap = async coin => {
  const { body } = await superagent(
    'https://api.coinmarketcap.com/v1/ticker/?limit=10'
  );
  const [item] = body.filter(_ => _.id === coin);
  assert(item, `${coin} not found`);
  return item;
};

const memFetchCoinmarketcap = pMemoize(fetchCoinmarketcap, { maxAge: 10e3 });

exports.fetchBchAddressBalance = async address => {
  const { body } = await superagent(
    `https://blockdozer.com/insight-api/addr/${address}/?noTxList=1`
  );
  const { balance } = body;
  return balance;
};

const bchToUsd = async amount => {
  const usdRate = (await memFetchCoinmarketcap('bitcoin-cash')).price_usd;

  const asUsd = n(amount)
    .times(usdRate)
    .toNumber();

  return asUsd;
};

const usdToBch = async amount => {
  const usdRate = (await memFetchCoinmarketcap('bitcoin-cash')).price_usd;

  return Math.round(parseFloat(n(amount).div(usdRate)), 8);
};

const formatBchWithUsd = async amount => {
  const amountAsUsd = await bchToUsd(amount);

  return `${formatBch(amount)} (${formatUsd(amountAsUsd)})`;
};

exports.formatConfirmedAndUnconfirmedBalances = async (
  confirmed,
  withUnconfirmed
) => {
  const pending = n(withUnconfirmed)
    .minus(confirmed)
    .toNumber();

  const confirmedText = await formatBchWithUsd(confirmed);

  const parts = [confirmedText];

  if (pending > 0) {
    const formatted = await formatBchWithUsd(pending);
    parts.push(`. Pending deposits: ${formatted}`);
  }

  return parts.join('');
};

exports.parseBchOrUsdAmount = async value => {
  assert.equal(typeof value, 'string');

  const match = value.match(/^(\$?)([0-9\.]+)$/);

  if (!match) {
    return null;
  }

  const [, symbol, amount] = match;

  let bchAmount;

  if (symbol === '$') {
    bchAmount = await usdToBch(amount);
  } else {
    bchAmount = +amount;
  }

  if (n(bchAmount).decimalPlaces() > 8) {
    throw new Error(`Too many decimals in ${bchAmount}`);
  }

  return bchAmount;
};

const getBalanceForAccount = async (accountId, { fetchRpc, minConf } = {}) => {
  return await fetchRpc('getbalance', [
    accountId,
    ...(minConf !== undefined ? [minConf] : []),
  ]);
};

const getBalanceForUser = (userId, { minConf, fetchRpc } = {}) => {
  assert(
    isValidTelegramUserIdFormat(userId),
    `Invalid user id format, ${userId}`
  );

  return getBalanceForAccount(getUserAccount(userId), { minConf, fetchRpc });
};

const transfer = async (
  fromUserId,
  toUserId,
  amount,
  { fetchRpc, lockBitcoind }
) => {
  assert.equal(typeof toUserId, 'string');
  assert.equal(typeof fromUserId, 'string');
  assert.notEqual(fromUserId, toUserId, 'Cannot send to self');

  const lock = await lockBitcoind();

  try {
    const amountN = n(amount);

    assert(!hasTooManyDecimalsForSats(amountN), 'Too many decimals');
    assert(amountN.isFinite(), 'Not finite');
    assert(amountN.gt(0), 'Less than or equal to zero');

    const prevBalance = n(
      await fetchRpc('getbalance', [getUserAccount(fromUserId)])
    );

    const nextBalance = prevBalance.minus(amountN);

    if (nextBalance.lt(0)) {
      throw new BalanceWouldBecomeNegativeError(
        'Balance would become negative'
      );
    }

    const moved = await fetchRpc('move', [
      getUserAccount(fromUserId),
      getUserAccount(toUserId),
      amountN.toFixed(8),
    ]);
    assert.equal(moved, true, 'Could not move funds');

    return amountN.toFixed(8);
  } finally {
    await lock.unlock();
  }
};

const withdraw = async (
  fromUserId,
  address,
  amount,
  { fetchRpc, lockBitcoind }
) => {
  assert(isValidTelegramUserIdFormat(fromUserId));
  assert.equal(typeof address, 'string');

  const lock = await lockBitcoind();

  try {
    const amountN = n(amount);

    assert(!hasTooManyDecimalsForSats(amountN), 'Too many decimals');
    assert(amountN.isFinite(), 'Not finite');
    assert(amountN.gt(0), 'Less than or equal to zero');
    assert(
      amountN.gte(MIN_WITHDRAW_AMOUNT),
      `Amount less than minimum  of ${MIN_WITHDRAW_AMOUNT}`
    );

    const prevBalance = n(
      await fetchRpc('getbalance', [getUserAccount(fromUserId)])
    );
    const nextBalance = prevBalance.minus(amountN);

    if (nextBalance.lt(0)) {
      throw new BalanceWouldBecomeNegativeError(
        'Balance would become negative'
      );
    }

    const txid = await fetchRpc('sendfrom', [
      getUserAccount(fromUserId),
      bchAddressToInternal(address),
      amountN.toFixed(8),
    ]);
    assert(txid, 'Could not withdraw funds');

    return { amount: amountN.toFixed(8), txid };
  } finally {
    await lock.unlock();
  }
};

exports.fetchCoinmarketcap = fetchCoinmarketcap;
exports.bchToUsd = bchToUsd;
exports.formatBchWithUsd = formatBchWithUsd;
exports.getBalanceForAccount = getBalanceForAccount;
exports.getBalanceForUser = getBalanceForUser;

Object.assign(exports, { transfer, withdraw });
