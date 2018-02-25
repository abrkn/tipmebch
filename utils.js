const assert = require('assert');
const bch = require('bitcoincashjs');
const numeral = require('numeral');
const qr = require('qr-image');
const BigNumber = require('bignumber.js');

const THREE_TICKS = '```';

exports.formatNumber = (value, format) => numeral(value).format(format);

const printError = (...args) => console.error(...args);
exports.printError = printError;

exports.formatBch = _ =>
  `${numeral(_.toString()).format('0,0[.00000000]')} BCH`;

exports.formatUsd = _ => {
  if (+_ < 0.01) {
    return '< $0.01';
  }

  return `$` + numeral(_.toString()).format('0,0.00');
};

exports.swallowError = e => {
  printError(e.stack);
  return 'Error';
};

exports.randomIntFromInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

exports.createQrCode = text =>
  new Promise((resolve, reject) => {
    resolve(qr.imageSync(text, { size: 7 }));
  });

const n = (..._) => new BigNumber(..._);

const isValidTelegramUserIdFormat = _ => {
  console.log(_);
  return typeof _ === 'string' && _.match(/^[0-9]+$/);
};

exports.isValidTelegramUserIdFormat = isValidTelegramUserIdFormat;

exports.extractUserDiscordIdFromTag = _ => {
  const match = _.match(/^<@!?([0-9]+)>$/);
  if (!match) {
    return null;
  }
  return match[1];
};

const BITCOIN_BASE58_ADDRESS_REGEX = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

exports.internalBchAddressToStandard = (address, withPrefix = false) => {
  assert(address.match(BITCOIN_BASE58_ADDRESS_REGEX));

  const bchAddress = new bch.Address(address);
  return bchAddress.toString(bch.Address.CashAddrFormat);
};

exports.bchAddressToInternal = address => {
  if (address.match(BITCOIN_BASE58_ADDRESS_REGEX)) {
    return address;
  }

  const bchAddress = bch.Address.fromString(
    address,
    'livenet',
    'pubkeyhash',
    bch.Address.CashAddrFormat
  );
  return bchAddress.toString(bch.Address.LegacyFormat);
};

const getUserAccount = id => `telegram-${id}`;

const hasTooManyDecimalsForSats = (value, decimals) =>
  !n(n(value).toFixed(8)).eq(n(value));

exports.getAddressForUser = async (userId, { fetchRpc }) => {
  console.log('wat', userId, typeof userId);
  assert(isValidTelegramUserIdFormat(userId));
  return await fetchRpc('getaccountaddress', [getUserAccount(userId)]);
};

Object.assign(exports, {
  THREE_TICKS,
  hasTooManyDecimalsForSats,
  n,
});

exports.getUserAccount = getUserAccount;
