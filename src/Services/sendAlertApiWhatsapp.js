

const { format } = require('date-fns');
var request = require('request');

exports.senAlertApiWhatsapp = async (detailMessage) => {

  try {

    // Data hora atual
    const now = new Date();
    const formattedDate = format(now, 'dd-MM-yyyy HH:mm:ss');


    let options = {
      'method': process.env.WHATSAPP_API_METHOD || 'POST',
      'url': process.env.WHATSAPP_API_HOST,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`
      },
      body: JSON.stringify({
        "project": process.env.SERVER_NAME,
        "file": detailMessage.FileName,
        "size": detailMessage.size ?? '',
        "message": detailMessage.message
      })
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