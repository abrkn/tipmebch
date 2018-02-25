const debug = require('debug')('tipmebch');

module.exports = async ({ ctx, redisClient, reply, username }) => {
  debug(`Storing user mapping for ${ctx.message.from.id} <> ${username}`);

  const userIsAlreadyKnown = await redisClient.existsAsync(
    `telegram.user.${ctx.message.from.id}`
  );

  if (userIsAlreadyKnown) {
    await reply(`I already know who you are, @${username}`);
    return;
  }

  // TODO: Possible issue if a different username was previously attached to this user id
  await Promise.all([
    redisClient.setAsync(
      `telegram.user.${ctx.message.from.id}`,
      ctx.message.from.username
    ),
    redisClient.setAsync(`telegram.user.${username}`, ctx.message.from.id),
  ]);

  await ctx.replyWithSticker('CAADAgAD-QADYB_6CgT1j5rS_2aoAg');

  await ctx.reply(
    `I now know who @${
      ctx.message.from.username
    } is. You can try sending your tip again`
  );

  await redisClient.incrAsync('stats.intros.count');
};
