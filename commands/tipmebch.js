module.exports = async ({ ctx, redisClient, reply, username }) => {
  if (!ctx.userWasAlreadyKnown) {
    return;
  }

  await reply(`I already know who you are, @${username}`);
};
