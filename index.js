const bluebird = require('bluebird');
const assert = require('assert');
const Telegraf = require('telegraf');
const createBitcoinRpc = require('./bitcoinRpc');
const commands = require('./commands');
const { each } = require('lodash');
const redis = require('redis');
const debug = require('debug')('tipmebch');
const { printErrorAndExit } = require('panik');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const {
  BITCOIND_URL,
  TELEGRAM_BOT_TOKEN,
  REDIS_URL = 'redis://localhost/10',
  NODE_ENV,
  ADMIN_USER_ID,
} = process.env;

assert(REDIS_URL, 'REDIS_URL');
assert(BITCOIND_URL, 'BITCOIND_URL');
assert(TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN');

const redisClient = redis.createClient(REDIS_URL);

const botUserId = TELEGRAM_BOT_TOKEN.split(/:/)[0];

const { fetchRpc, lockBitcoind } = createBitcoinRpc({
  bitcoindUrl: BITCOIND_URL,
  redisClient,
});

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

each(commands, (handler, name) => {
  debug(`Registering command, ${name}`);

  bot.command(name, ctx =>
    handler({
      ctx,
      fetchRpc,
      lockBitcoind,
      userId: ctx.from.id.toString(),
      botUserId,
      username: ctx.from.username,
      isPm: ctx.chat.id > 0,
      isAdmin: ctx.from.id === +ADMIN_USER_ID,
      reply: _ => ctx.reply(_, { parse_mode: 'markdown' }),
      params:
        console.log(ctx.message) ||
        ctx.message.text
          .split(' ')
          .slice(1)
          .filter(_ => _.length),
      redisClient,
    }).catch(error => {
      console.error(`Unhandled error when processing message`);
      console.error(ctx.message);
      console.error(error.stack);
      ctx.reply(`Something crashed and I'm not sure why. Sorry!`);
      if (NODE_ENV !== 'production') {
        ctx.reply(error.stack);
      }
    })
  );
});

bot.on('text', ctx => {
  debug(
    `Storing user mapping for ${ctx.message.from.id} <> ${
      ctx.message.from.username
    }`
  );

  // TODO: Possible issue if a different username was previously attached to this user id
  Promise.all([
    redisClient.setAsync(
      `telegram.user.${ctx.message.from.id}`,
      ctx.message.from.username
    ),
    redisClient.setAsync(
      `telegram.user.${ctx.message.from.username}`,
      ctx.message.from.id
    ),
  ]).catch(printErrorAndExit);
});

bot.startPolling();
