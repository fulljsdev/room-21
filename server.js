const https = require('https')
const http = require('http')
const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express();

app.use(express.static(__dirname + '/public'))
const privateKey = fs.readFileSync('cert/localhost.key', 'utf8');
const certificate = fs.readFileSync('cert/localhost.cert', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate
};

app.all('*', function(require, response, next){
    if (require.secure) {
        return next();
    }
    response.redirect('https://localhost/');

});



app.get('/', (request, response)=>{
    response.sendFile(path.join(__dirname + '/index.html'));
})

const httpsServer = https.createServer(credentials, app)
const httpServer = http.createServer(app)

httpsServer.listen(443, () => {
    console.log("Listening on port 443...")
})

httpServer.listen(80, () => {
    console.log("Listening on port 80...")
})




