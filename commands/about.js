const { version } = require('../package.json');

module.exports = async ({ ctx, fetchRpc, userId, isPm, reply }) => {
  await ctx.replyWithSticker('CAADBAADtQEAAndCvAi2Pk-ZhRfJpgI');

  await reply(
    [
      `I'm a bot (v${version}) written by @abrkn for tipping Bitcoin (BCH) on Telegram`,
      'Try the /help command in a private message',
      `You can tip me and it'll go to the faucet once it's ready.`,
      `I'm open source: https://github.com/abrkn/tipmebch`,
      `Report bugs here: https://github.com/abrkn/tipmebch/issues`,
      `The bot is not a wallet. Your funds will be lost if there are bugs`,
    ].join('\n')
  );
};
