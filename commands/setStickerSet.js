const stickers = require('../stickers');

module.exports = async ({
  ctx,
  fetchRpc,
  userId,
  redisClient,
  isAdmin,
  params,
  reply,
  username,
}) => {
  if (!isAdmin) {
    return reply(`Sorry, @${username}, but you're not an admin in this chat.`);
  }

  const knownSets = Object.keys(stickers);

  const [setName] = params;

  if (!setName) {
    return reply(
      `I don't understand. Try this: /setstickerset <${knownSets.join('|')}>`
    );
  }

  if (!knownSets.includes(setName)) {
    return reply(
      `I don't know that set. Try this: /setstickerset <${knownSets.join('|')}>`
    );
  }

  await redisClient.set(
    `telegram.chat.settings:${ctx.chat.id}.sticker_set`,
    setName
  );

  await reply(
    `Alright, @${username}, this chat will now use the sticker set ${setName}`
  );
};
