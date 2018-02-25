const debug = require('debug')('tipmebch');

module.exports = async ({ ctx, redisClient }) => {
  debug(
    `Storing user mapping for ${ctx.message.from.id} <> ${
      ctx.message.from.username
    }`
  );

  // TODO: Possible issue if a different username was previously attached to this user id
  await Promise.all([
    redisClient.setAsync(
      `telegram.user.${ctx.message.from.id}`,
      ctx.message.from.username
    ),
    redisClient.setAsync(
      `telegram.user.${ctx.message.from.username}`,
      ctx.message.from.id
    ),
  ]);

  await ctx.replyWithSticker('CAADAgAD-QADYB_6CgT1j5rS_2aoAg');
};
