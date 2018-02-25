const assert = require('assert');
const { formatConfirmedAndUnconfirmedBalances } = require('../apis');
const { getBalanceForUser } = require('../apis');

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

  await ctx.reply(`Balance: ${asText}`, { parse_mode: 'markdown' });
};
