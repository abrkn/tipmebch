module.exports = async ({ reply, redisClient, ctx }) => {
  const [
    tippedBch,
    tippedUsd,
    tippedCount,
    withdrawnBch,
    withdrawnUsd,
    withdrawnCount,
    introCount,
  ] = await Promise.all([
    redisClient.getAsync('stats.tipped.bch'),
    redisClient.getAsync('stats.tipped.usd'),
    redisClient.getAsync('stats.tipped.count'),
    redisClient.getAsync('stats.withdrawn.bch'),
    redisClient.getAsync('stats.withdrawn.usd'),
    redisClient.getAsync('stats.withdrawn.count'),
    redisClient.getAsync('stats.intros.count'),
  ]);

  await ctx.maybeReplyFromStickerSet('stats');

  await reply(
    [
      `${introCount || 0} have introduced themselves to me`,
      `Users have tipped ${tippedCount || 0} times, totaling ${tippedBch ||
        0} BCH ($${tippedUsd || 0})`,
      `${withdrawnBch || 0} BCH ($${withdrawnUsd ||
        0}) has been sent out in ${withdrawnCount || 0} withdraws`,
    ].join('\n')
  );
};
