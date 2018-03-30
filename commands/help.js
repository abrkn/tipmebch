module.exports = async ({ ctx, fetchRpc, userId, isPm, reply }) => {
  if (!isPm) {
    console.log({ isPm });
    await reply('The /help command only works in a private message to me.');
    return;
  }

  await reply(
    [
      '/tipbch $1.23 - Send tip',
      '/tipbch 0.0001 - Send tip (BCH)',
      '/balance - Show your balance',
      '/deposit - Show your deposit address (PM)',
      '/withdraw <address> [<bch amount>|$<usd amount>|all> - Withdraw funds',
      '/stats - Show tipping stats',
      '/help - This help',
      '/about - Information about the bot',
      '/setstickerset [name] - Set sticker set for channel (pepe or none)',
    ].join('\n')
  );
};
