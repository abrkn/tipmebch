const assert = require('assert');
const { formatBchWithUsd } = require('../apis');
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
    .multi()
    .get(`telegram.unclaimed.${unclaimedId}`)
    .del(`telegram.unclaimed.${unclaimedId}`)
    .execAsync()
    .then(_ => console.log(_) || (_[0] && JSON.parse(_[0])));

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

  // Remove from receiver list of recipient
  await redisClient.lremAsync(
    `telegram.unclaimed.received:${username}`,
    0,
    unclaimedId
  );

  // TODO: Tip counter does not decrease

  const amountText = await formatBchWithUsd(bchAmount);

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
