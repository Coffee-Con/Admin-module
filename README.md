# Admin module

## How to use

### Create and edit [.env](.env) file:

> SMTP For testing: https://ethereal.email/

PORT= HTML port  
BASEHOST= Server host/domain  
COMPANY_HOST=  

SMTP_HOST = SMTP host  
SMTP_PORT = SMTP port  
ACCOUNT= E-mail address  
PASS= E-mail pass  

DBHost= Database host  
DBPort= Database port  
DBUser= Database user  
DBName= Database name(default CMOP)  
DBPassword= Your database password  

### SSL Certificate

Run via terminal and put the file into [ssl](./ssl/) folder:  
openssl genrsa -out key.pem 2048  
openssl req -new -key key.pem -out csr.pem  
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem  

### Install mysql8.0

> Install [MySQL](https://dev.mysql.com/downloads/mysql/). It is recommended to [install using docker](https://gist.github.com/eric-do/b8cb9a901287f5f100f6f4541074a59f).

Run [mysql.sql](https://github.com/Coffee-Con/Database/blob/main/mysql.sql) file.

### Install Ollama

> Install [Ollama](https://ollama.com/)

### Run via terminal:

> Install [node.js v22.9.0](https://nodejs.org/en/download/package-manager)  

npm install  
npm start
