const { exec } = require('child_process');

function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${description}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        //console.error(`Erro: ${stderr}`);
        reject(error);
      }
      //console.log(`Resultado: ${stdout}`);
      console.log(`Resultado: ok`);
      resolve(stdout);
    });
  });
}
exports.execCommand = execCommand;
