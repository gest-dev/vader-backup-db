# VaderBackupDB

## BOT para Backup de MongoDB e MariaDB/MySQL

Este aplicativo permite realizar backups automáticos de bancos de dados MongoDB e MariaDB/MySQL, utilizando tanto ferramentas externas (como `mongoexport` e `mysqldump`) quanto APIs de banco de dados.

### Pré-requisitos

- **Node.js** versão 16 ou superior.
- **Dependências para backup via shell**:
    - `mysqldump` para backups do MariaDB/MySQL.
    - `mongoexport` para backups do MongoDB.

### Instalação das Ferramentas de Backup

1. **Instalação do `mysqldump` (MariaDB/MySQL)**:
   Se você ainda não tem o `mysqldump` instalado, pode instalá-lo da seguinte maneira:

   - **Debian/Ubuntu**:
     ```bash
     sudo apt-get install mariadb-client
     ```

2. **Instalação do `mongoexport` (MongoDB)**:
   Para fazer backup de bancos de dados MongoDB via shell, você precisará instalar o `mongoexport`:

   - **Debian/Ubuntu**:
     ```bash
     sudo apt-get install mongodb-database-tools
     ```

### Instalação do Projeto

1. Clone este repositório:

   ```bash
   git clone https://github.com/gest-dev/vader-backup-db.git
   ```

2. Acesse o diretório do projeto:

   ```bash
   cd vader-backup-db
   ```

3. Instale as dependências do Node.js:

   ```bash
   npm install
   ```

### Configuração do Backup

- As variáveis de ambiente para controle do backup são:
  - `DB_ACCESS_DUMP`: Define se o backup será feito via **shell** (`mongoexport`/`mysqldump`) ou via **aplicação** (usando APIs). Valores possíveis:
    - `shell`: Usa ferramentas externas (`mysqldump` ou `mongoexport`).
    - `application`: Faz o backup diretamente pelo Node.js.

### Executar o Aplicativo

Após configurar e instalar as dependências, você pode executar o aplicativo com:

```bash
node app.js
```
