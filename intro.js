const debug = require('debug')('tipmebch');

module.exports = function createIntro({ redisClient }) {
  return async function intro(ctx, next) {
    const { updateType, update } = ctx;

    console.log(update);
    console.log(updateType);

    if (updateType === 'message') {
      const { message } = update;

      const userIsAlreadyKnown = await redisClient.existsAsync(
        `telegram.user.${message.from.id}`
      );

      if (userIsAlreadyKnown) {
        ctx.userWasAlreadyKnown = true;
        return await next();
      }

      const { username } = message.from;

      debug(`Storing user mapping for ${message.from.id} <> ${username}`);

      // TODO: Possible issue if a different username was previously attached to this user id
      await Promise.all([
        redisClient.setAsync(
          `telegram.user.${message.from.id}`,
          message.from.username
        ),
        redisClient.setAsync(`telegram.user.${username}`, message.from.id),
      ]);

      await ctx.replyWithSticker('CAADAgAD-QADYB_6CgT1j5rS_2aoAg');

      await ctx.reply(
        `I now know who @${
          message.from.username
        } is. You can try sending your tip again`
      );

      await redisClient.incrAsync('stats.intros.count');
    }

    await next();
  };
};
