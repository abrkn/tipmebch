const { n } = require('../utils');
const {
  fetchCoinmarketcap,
  formatBchWithUsd,
  transfer,
  bchToUsd,
} = require('../apis');
const { BalanceWouldBecomeNegativeError } = require('../errors');

module.exports = async ({
  ctx,
  params,
  username,
  reply,
  redisClient,
  userId,
  fetchRpc,
  lockBitcoind,
}) => {
  if (params.length !== 2) {
    await reply(
      `I don't understand this command. I expected "/tipbch 0.01 @username" or "/tipbch $1 @username"`
    );
    await ctx.replyWithSticker('CAADAgADmQADYB_6Ci92NR8hZLUFAg');
    return;
  }

  const [amountRaw, toUserRaw] = params;

  const toUserMatch = toUserRaw.match(/^@([a-z0-9_]+)$/i);

  if (!toUserMatch) {
    console.warn(`Invalid username format for ${toUserRaw}`);
    await reply(
      `That username format is invalid. I'm expecting /tipbch $1 @SomeUserName`
    );
    await ctx.replyWithSticker('CAADAgADmQADYB_6Ci92NR8hZLUFAg');
    return;
  }

  const toUsername = toUserMatch[1];

  const toUserId = await redisClient.getAsync(`telegram.user.${toUsername}`);

  if (!toUserId) {
    await reply(
      `I've never seen @${toUsername} before. Have them write /tipmebch here. I know this is annoying and a fix will be ready in a few days.`
    );
    return;
  }

  const amountMatch = amountRaw.match(/^(\$?)([0-9\.]+)$/);

  if (!amountMatch) {
    await reply(
      `I don't understand the amount. I expected "/tipbch 0.01 @username" or "/tipbch $1 @username"`
    );
    await ctx.replyWithSticker('CAADAgADmQADYB_6Ci92NR8hZLUFAg');
    return;
  }

  const [, theirSymbol, theirAmount] = amountMatch;

  let bchAmount;

  const usdRate = (await fetchCoinmarketcap('bitcoin-cash')).price_usd;

  if (theirSymbol === '$') {
    bchAmount = n(theirAmount)
      .div(usdRate)
      .toFixed(8);
  } else {
    bchAmount = theirAmount;
  }

  let actualAmount;

  try {
    actualAmount = await transfer(userId, toUserId, bchAmount, {
      fetchRpc,
      lockBitcoind,
    });
  } catch (e) {
    if (e instanceof BalanceWouldBecomeNegativeError) {
      await ctx.replyWithSticker('CAADBAADrgADd0K8CJy9v19cUUIoAg');
      await ctx.reply(`Your balance would become negative...`);
      return;
    } else {
      throw e;
    }
  }

  const amountText = await formatBchWithUsd(actualAmount);
  await reply(`You tipped ${amountText} to ${toUserRaw}!`);

  const usdAmount = await bchToUsd(actualAmount);

  await Promise.all([
    redisClient.incrbyfloatAsync('stats.tipped.bch', actualAmount),
    redisClient.incrbyfloatAsync('stats.tipped.usd', usdAmount),
    redisClient.incrAsync('stats.tipped.count'),
  ]);
};
