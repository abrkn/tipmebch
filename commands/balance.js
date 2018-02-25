const { formatConfirmedAndUnconfirmedBalances } = require('../apis');
const { getBalanceForUser, bchToUsd } = require('../apis');
const { n } = require('../utils');

const { BALANCE_STICKERS } = process.env;

const balanceStickers = BALANCE_STICKERS.split(/,/g)
  .reduce((prev, pair) => {
    const [level, stickerId] = pair.split(/:/g);
    return [...prev, { level: +level, stickerId }];
  }, [])
  .reverse();

module.exports = async ({ ctx, userId, fetchRpc }) => {
  const confirmed = await getBalanceForUser(userId, { fetchRpc });

  const unconfirmed = await getBalanceForUser(userId, {
    minConf: 0,
    fetchRpc,
  });

  const asText = await formatConfirmedAndUnconfirmedBalances(
    confirmed,
    unconfirmed
  );

  const asUsd = await bchToUsd(
    n(confirmed)
      .plus(unconfirmed)
      .toNumber()
  );

  const { stickerId } = balanceStickers.find(_ => asUsd >= _.level);

  await ctx.reply(`Balance: ${asText}`, { parse_mode: 'markdown' });
  await ctx.replyWithSticker(stickerId);
};
