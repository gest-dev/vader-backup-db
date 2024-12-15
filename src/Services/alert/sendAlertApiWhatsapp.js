

const { format } = require('date-fns');
var request = require('request');

exports.senAlertApiWhatsapp = async (detailMessage) => {

  try {

    // Data hora atual
    const now = new Date();
    const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');
    let bodyData = null;
    if (process.env.WHATSAPP_API_API_TYPE == 'DURVS-API') {
      bodyData = JSON.stringify({
        "project": process.env.SERVER_NAME,
        "file": detailMessage.FileName,
        "size": detailMessage.size ?? '',
        "message": detailMessage.message
      });
    } else if (process.env.WHATSAPP_API_API_TYPE == 'HUBOOT-API') {
      let messageString = `*${detailMessage.serverName}*\n*Type*: ${detailMessage.type}\n*Status*: ${detailMessage.status}\n*Message*: ${detailMessage.message}\n*File*: ${detailMessage.FileName}\n*Size*: ${detailMessage.size}\n*ETag*: ${detailMessage.ETag}\n*Location*: ${detailMessage.Location}\n*Date*: ${formattedDate}`;

      bodyData = JSON.stringify({
        "id": process.env.WHATSAPP_API_ID,
        "message": messageString,
        "group": process.env.WHATSAPP_API_GROUP
      });
    } else {
      console.error("Erro ao enviar mensagem whatsapp: WHATSAPP_API_API_TYPE não configurada");
      return;
    }


    let options = {
      'method': process.env.WHATSAPP_API_METHOD || 'POST',
      'url': process.env.WHATSAPP_API_HOST,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`
      },
      body: bodyData
    };

    const response = await new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });

  } catch (error) {
    console.error("Error Enviar mensagem whatsapp: ", error.message);
  }
}