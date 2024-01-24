
const { Telegraf } = require('telegraf')
const { format } = require('date-fns');

exports.senMessageTelegran = async (detailMessage) => {

  try {
    const bot = new Telegraf(process.env.BOT_TOKEN)
    // Data hora atual
    const now = new Date();
    const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');

    // Criar a mensagem com quebra de linha
    const message = `
**ServerName: **${detailMessage.serverName}**
**SendType:** Backup ${detailMessage.sendType}
**FileName:** ${detailMessage?.FileName}
**size:** ${detailMessage?.size}
**Date:** ${formattedDate}
**Message:** ${detailMessage.message}
`;


    // Enviar a mensagem com formatação Markdown
    await bot.telegram.sendMessage(process.env.BOT_CHATID, message, { parse_mode: 'Markdown' });

  }
  catch (error) {
    console.error("Error Enviar mensagem telegran: ", error);
  }
}