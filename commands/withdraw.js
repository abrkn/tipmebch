const { formatBchWithUsd, parseBchOrUsdAmount, withdraw } = require('../apis');
const { BalanceWouldBecomeNegativeError } = require('../errors');

module.exports = async ({
  message,
  reply,
  params,
  tipping,
  isPm,
  userId,
  fetchRpc,
  lockBitcoind,
  ctx,
}) => {
  if (!isPm) {
    await reply('That command only works in a private message to me.');
    return;
  }

  if (params.length !== 2) {
    await reply(`I don't understand that. /withdraw <address> <bch amount>`);
    return;
  }

  const [address, amountRaw] = params;

  const theirAmount = await parseBchOrUsdAmount(amountRaw);

  if (!theirAmount) {
    await reply(
      `I don't understand that amount. Tell me the amount of BCH. /withdraw <address> <0.0001>`
    );
    return;
  }

  try {
    const { amount: actualAmount, txid } = await withdraw(
      userId,
      address,
      theirAmount,
      { fetchRpc, lockBitcoind }
    );
    const amountText = await formatBchWithUsd(actualAmount);
    const url = `https://explorer.bitcoin.com/bch/tx/${txid}`;

    await reply(`You withdrew ${amountText}: ${url}`);
  } catch (e) {
    if (e instanceof BalanceWouldBecomeNegativeError) {
      await ctx.replyWithSticker('CAADBAADrgADd0K8CJy9v19cUUIoAg');
      await ctx.reply(`Your balance would become negative...`);
    } else {
      throw e;
    }
  }
};
