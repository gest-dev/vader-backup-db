
const { Telegraf } = require('telegraf')

exports.senMessageTelegran = async (detailMessage) => {

  try {
    const bot = new Telegraf(process.env.BOT_TOKEN)
    // Data hora atual
    const now = new Date();
    const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');

    // Criar a mensagem com quebra de linha
    const message = `
*ServerName*: ${detailMessage.serverName}
*Type*: ${detailMessage.type}
*Status*: ${detailMessage.status}
*Message*: ${detailMessage.message}
*Date*: ${formattedDate}
`;

    // Enviar a mensagem
    await bot.telegram.sendMessage(process.env.BOT_CHATID, message);

  }
  catch (error) {
    console.error("Error Enviar mensagem telegran: ", error);
  }
}