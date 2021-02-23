const https = require('https')
const http = require('http')
const express = require('express')
const fs = require('fs')
const path = require('path')
const Socket = require("websocket").server

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


const webSocket = new Socket({ httpServer: httpsServer })
let users = []


function findUser(username) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].username == username)
            return users[i]
    }
}

webSocket.on('request', (req) => {
    const connection = req.accept()


    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)
        const user = findUser(data.username)
        switch(data.type) {
            case "store_user":

                if (user != null) {
                    return
                }

                const newUser = {
                    conn: connection,
                    username: data.username
                }
                users.push(newUser)
                console.log(newUser.username)
                break
            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer
                break

            case "store_candidate":
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []

                user.candidates.push(data.candidate)
                break
            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)

                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })

                break
        }
    })

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})
