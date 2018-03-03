const debug = require('debug')('tipmebch');
const { formatBchWithUsd, transfer } = require('./apis');

module.exports = function createIntro({
  redisClient,
  fetchRpc,
  lockBitcoind,
  ctx,
}) {
  const claim = async ({ unclaimed, message, ctx }) => {
    const {
      bitcoinAccountId,
      chatId,
      bchAmount,
      receiverUsername,
      senderUsername,
    } = unclaimed;

    debug('Unclaimed %O', unclaimed);

    await transfer(bitcoinAccountId, message.from.id.toString(), bchAmount, {
      fetchRpc,
      lockBitcoind,
      redisClient,
    });

    const amountText = await formatBchWithUsd(bchAmount);

    try {
      await ctx.telegram.sendMessage(
        chatId,
        `@${receiverUsername} has claimed a ${amountText} tip from @${senderUsername}`
      );
    } catch (error) {
      console.warn(
        `WARN: Failed to tell user about their claim:\n${error.message}`
      );
    }
  };

  return async function intro(ctx, next) {
    const { updateType, update } = ctx;

    if (updateType !== 'message') {
      return;
    }
    const { message } = update;

    const userIsAlreadyKnown = await redisClient.existsAsync(
      `telegram.user.${message.from.id}`
    );

    debug(
      'User %s (%s) is already known? %s',
      message.from.id,
      message.from.username,
      userIsAlreadyKnown
    );

    if (userIsAlreadyKnown) {
      ctx.userWasAlreadyKnown = true;
      return await next();
    }

    const { username } = message.from;

    if (!username) {
      const redisKey = `telegram.told.need.username:${message.from.id}`;

      if (await redisClient.existsAsync(redisKey)) {
        return;
      }

      await ctx.reply(
        `${
          ctx.from.first_name
        }, you need to set a username in your Telegram Settings`
      );

      await redisClient.setAsync(redisKey, +new Date());

      return;
    }

    debug(`Storing user mapping for ${message.from.id} <> ${username}`);

    // TODO: Possible issue if a different username was previously attached to this user id
    await Promise.all([
      redisClient.setAsync(
        `telegram.user.${message.from.id}`,
        message.from.username
      ),
      redisClient.setAsync(`telegram.user.${username}`, message.from.id),
    ]);

    const unclaimedIdsKey = `telegram.unclaimed.received:${username}`;

    debug('Unclaimed ids key, %s', unclaimedIdsKey);

    const unclaimeds = await redisClient
      .multi()
      .lrange(unclaimedIdsKey, 0, -1)
      .del(unclaimedIdsKey)
      .execAsync()
      .then(_ => _[0] || [])
      .then(
        unclaimedIds =>
          console.log({ unclaimedIds }) ||
          Promise.all(
            unclaimedIds.map(unclaimedId =>
              redisClient
                .multi()
                .get(`telegram.unclaimed.${unclaimedId}`)
                .del(`telegram.unclaimed.${unclaimedId}`)
                .execAsync()
                .then(_ => _[0])
            )
          )
      );

    debug('Unclaimeds %O', unclaimeds);
    debug(`Found %s unclaimeds`, unclaimeds.length);

    if (!unclaimeds) {
      return await next();
    }

    await Promise.all(
      unclaimeds.map(_ => JSON.parse(_)).map(unclaimed =>
        claim({
          unclaimed,
          ctx,
          message,
        })
      )
    );

    await redisClient.incrAsync('stats.intros.count');

    await next();
  };
};
