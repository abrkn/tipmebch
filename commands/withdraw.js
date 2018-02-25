const numeral = require('numeral');
const { n } = require('../utils');
const { formatBchWithUsd, parseBchOrUsdAmount } = require('../apis');

module.exports = async ({ message, reply, params, tipping, isPm }) => {
  if (!isPm) {
    await reply('That command only works in a private message to me.');
    return;
  }

  if (params.length !== 2) {
    throw new Error('Invalid number of params');
  }

  const [address, amountRaw] = params;

  const theirAmount = await parseBchOrUsdAmount(amountRaw);

  if (!theirAmount) {
    throw new Error(`Invalid amount: ${amountRaw}`);
  }

  try {
    const { amount: actualAmount, txid } = await tipping.withdraw(
      message.author.id,
      address,
      theirAmount
    );
    const amountText = await formatBchWithUsd(actualAmount);
    const url = `https://explorer.bitcoin.com/bch/tx/${txid}`;

    await reply(`You withdrew ${amountText} to \`${address}\`! See ${url}`);
  } catch (e) {
    await reply(`something crashed: ${e.message}`);
    throw e;
  }
};
