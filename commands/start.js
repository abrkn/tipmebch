module.exports = async ({ ctx, fetchRpc, userId, isPm, reply }) => {
  if (!isPm) {
    console.log({ isPm });
    await reply('The /start command only works in a private message to me.');
    return;
  }

  await reply(
    `I'm a bot that lets you tip anyone on Telegram. Invite me to your group and tip someone! See /help for more`
  );
};
