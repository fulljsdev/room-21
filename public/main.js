const webSocket = new WebSocket("wss://localhost:443")
let username = null
let actButton = document.getElementById('act')
let connectBtn = document.getElementById('connecbtn')
let newUserName = document.getElementById('namein')
let localStream = null
let peerConn = null

function start() {

    actButton.style.display = 'block'
    connectBtn.style.display = 'none'
    username = newUserName.value

    webSocket.onmessage = (event) => {
        handleSignallingData(JSON.parse(event.data))
    }

    function handleSignallingData(data) {
        switch (data.type) {
            case "answer":
                peerConn.setRemoteDescription(data.answer)
                break
            case "candidate":
                peerConn.addIceCandidate(data.candidate)
        }
    }



    function sendUsername() {
        sendData({
            type: "store_user"
        })
        setTimeout(startCall, 1000)
    }

    setTimeout(sendUsername, 500)


    function sendData(data) {
        data.username = username
        webSocket.send(JSON.stringify(data))
    }


    function startCall() {

        navigator.getUserMedia({
            video: {
                frameRate: 24,
                width: {
                    min: 480, ideal: 720, max: 1280
                },
                aspectRatio: 1.33333,
                facingMode: 'user',
            },
            audio: true
        }, (stream) => {
            localStream = stream
            document.getElementById("local-video").srcObject = localStream

            let configuration = {
                iceServers: [
                    {
                        "urls": ["stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302"]
                    }
                ]
            }

            peerConn = new RTCPeerConnection(configuration)
            peerConn.addStream(localStream)

            peerConn.onaddstream = (e) => {
                document.getElementById("remote-video")
                    .srcObject = e.stream
                console.log('connected')
            }

            peerConn.onicecandidate = ((e) => {
                if (e.candidate == null)
                    return
                sendData({
                    type: "store_candidate",
                    candidate: e.candidate
                })
            })

            createAndSendOffer()
        }, (error) => {
            console.log(error)
        })
    }

    function createAndSendOffer() {
        peerConn.createOffer((offer) => {
            sendData({
                type: "store_offer",
                offer: offer
            })

            peerConn.setLocalDescription(offer)
        }, (error) => {
            console.log(error)
        })
    }

    sendUsername()
}


function join() {
    actButton.style.display = 'block'
    connectBtn.style.display = 'none'
    username = newUserName.value
    webSocket.onmessage = (event) => {
        handleSignallingData(JSON.parse(event.data))
    }

    function handleSignallingData(data) {
        switch (data.type) {
            case "offer":
                peerConn.setRemoteDescription(data.offer)
                createAndSendAnswer()
                break
            case "candidate":
                peerConn.addIceCandidate(data.candidate)
        }
    }

    function createAndSendAnswer () {
        peerConn.createAnswer((answer) => {
            peerConn.setLocalDescription(answer)
            sendData({
                type: "send_answer",
                answer: answer
            })
        }, error => {
            console.log(error)
        })
    }

    function sendData(data) {
        data.username = username
        webSocket.send(JSON.stringify(data))
    }


    function joinCall() {
        navigator.getUserMedia({
            video: {
                frameRate: 24,
                width: {
                    min: 480, ideal: 720, max: 1280
                },
                aspectRatio: 1.33333,
                facingMode: 'user',
            },
            audio: true
        }, (stream) => {
            localStream = stream
            document.getElementById("local-video").srcObject = localStream

            let configuration = {
                iceServers: [
                    {
                        "urls": ["stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302"]
                    }
                ]
            }

            peerConn = new RTCPeerConnection(configuration)
            peerConn.addStream(localStream)

            peerConn.onaddstream = (e) => {
                document.getElementById("remote-video")
                    .srcObject = e.stream
            }

            peerConn.onicecandidate = ((e) => {
                if (e.candidate == null)
                    return

                sendData({
                    type: "send_candidate",
                    candidate: e.candidate
                })
            })

            sendData({
                type: "join_call"
            })

        }, (error) => {
            console.log(error)
        })
    }
    joinCall()
}


let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}
