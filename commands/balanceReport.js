const {
  formatBchWithUsd,
  formatConfirmedAndUnconfirmedBalances,
  getBalanceForUser,
  getBalanceForAccount,
} = require('../apis');
const { formatBch, formatUsd, n } = require('../utils');

module.exports = async ({
  recipient,
  message,
  reply,
  params,
  tipping,
  isPm,
  isStaff,
  client,
  fetchRpc,
  botUserId,
}) => {
  if (!isPm) {
    await reply('This command is only available as a DM.');
    return;
  }

  if (!isStaff) {
    console.warn('Author is not admin');
    return;
  }

  const printBotBalance = async () => {
    const confirmed = await getBalanceForUser(botUserId, { fetchRpc });
    const unconfirmed = await getBalanceForUser(botUserId, {
      minConf: 0,
      fetchRpc,
    });
    const balanceText = await formatConfirmedAndUnconfirmedBalances(
      confirmed,
      unconfirmed
    );
    await reply(`Bot User Balance: ${balanceText}`);
  };

  const printWalletBalance = async () => {
    const confirmed = await getBalanceForAccount('*', { fetchRpc });
    const unconfirmed = await getBalanceForAccount('*', {
      minConf: 0,
      fetchRpc,
    });
    const balanceText = await formatConfirmedAndUnconfirmedBalances(
      confirmed,
      unconfirmed
    );
    await reply(`Wallet Balance: ${balanceText}`);
  };

  await printBotBalance();
  await printWalletBalance();
};
