module.exports = async ({ ctx, reply, username }) => {
  await ctx.maybeReplyFromStickerSet('claim');

  await ctx.reply(
    `You're all set! From now on @${username} does not need to \`/claim\` to receive tips`,
    { parse_mode: 'markdown' }
  );
};
