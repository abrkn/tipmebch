const assert = require('assert');
const { formatBchWithUsd, transfer } = require('../apis');
const debug = require('debug')('tipmebch');

module.exports = async ({
  ctx,
  fetchRpc,
  userId,
  isPm,
  reply,
  redisClient,
  username,
  params,
  lockBitcoind,
}) => {
  if (params.length !== 1) {
    await reply(
      `I don't understand this command. I expected "/reverse <identifier>"`
    );
    return;
  }

  const [unclaimedId] = params;

  assert(unclaimedId.match(/^[a-z0-9_-]+$/i), `Bad id. ${unclaimedId}`);

  const unclaimed = await redisClient
    .getAsync(`telegram.unclaimed.${unclaimedId}`)
    .then(JSON.parse);

  if (!unclaimed) {
    debug(`Can't find claim with id ${unclaimedId}`);
    return await reply('Claim not found');
  }

  debug('Unclaimed, %O', unclaimed);

  const {
    senderUserId,
    chatId,
    bchAmount,
    receiverUsername,
    senderUsername,
  } = unclaimed;

  if (senderUserId !== ctx.from.id) {
    debug(
      `Unclaimed sender, ${senderUserId}, not same as message sender, ${
        ctx.from.id
      }`
    );
    return await reply('Claim not found');
  }

  await redisClient
    .multi()
    .del(`telegram.unclaimed.${unclaimedId}`)
    .lrem(`telegram.unclaimed.received:${username}`, 0, unclaimedId)
    .execAsync();

  if (!unclaimed) {
    debug(`Can't find claim with id ${unclaimedId}`);
    return await reply('Claim not found');
  }

  // TODO: Tip counter does not decrease

  const actualAmount = await transfer(
    `telegram-unclaimed-${unclaimedId}`,
    senderUserId.toString(),
    bchAmount,
    {
      fetchRpc,
      lockBitcoind,
      redisClient,
    }
  );

  const amountText = await formatBchWithUsd(actualAmount);

  try {
    await ctx.telegram.sendMessage(
      chatId,
      `@${senderUsername} has reversed a ${amountText} tip meant for @${receiverUsername}`
    );
  } catch (error) {
    console.warn(
      `WARN: Failed to tell user about their reversal:\n${error.message}`
    );
  }
};
