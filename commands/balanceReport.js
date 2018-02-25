const {
  formatBchWithUsd,
  formatConfirmedAndUnconfirmedBalances,
} = require('../apis');
const { formatBch, formatUsd, n } = require('../utils');

module.exports = async ({
  recipient,
  message,
  reply,
  params,
  tipping,
  isDm,
  authorIsStaff,
  client,
}) => {
  if (!isDm) {
    await reply('This command is only available as a DM.');
    return;
  }

  if (!authorIsStaff) {
    console.warn('Author is not staff');
    return;
  }

  const printBotBalance = async () => {
    const botUserId = client.user.id;
    const confirmed = await tipping.getBalanceForUser(botUserId);
    const unconfirmed = await tipping.getBalanceForUser(botUserId, {
      minConf: 0,
    });
    const balanceText = await formatConfirmedAndUnconfirmedBalances(
      confirmed,
      unconfirmed
    );
    await reply(`Bot User Balance: ${balanceText}`);
  };

  const printWalletBalance = async () => {
    const confirmed = await tipping.getBalanceForAccount('*');
    const unconfirmed = await tipping.getBalanceForAccount('*', { minConf: 0 });
    const balanceText = await formatConfirmedAndUnconfirmedBalances(
      confirmed,
      unconfirmed
    );
    await reply(`Wallet Balance: ${balanceText}`);
  };

  await printBotBalance();
  await printWalletBalance();
};
