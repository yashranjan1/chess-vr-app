// imports
const { WebSocketServer } = require('ws');
const https = require('https');
const express = require('express');
const bodyParser= require('body-parser');
const fs = require('fs');

// certificate ssl
var privateKey  = fs.readFileSync('./SSL Certificate/key.pem');
var certificate = fs.readFileSync('./SSL Certificate/cert.pem');

var credentials = {key: privateKey, cert: certificate};

// make an express system
var app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.json());
app.use(express.static(__dirname + String.raw`/public`))

// initialising the http server and the WebSocket server.
const server = https.createServer(credentials, app);
const wss = new WebSocketServer({ server });
server.listen(3000, () => {
    console.log(`WebSocket server is running on port https://localhost:3000`);  
    console.log(`main game is on https://localhost:3000/game`);  
});

const clients = new Map();
  
app.get('/game', (req, res) =>{
    res.sendFile(__dirname + String.raw`\public\index1.html`)
})

app.get('/', (req, res) =>{
    res.sendFile(__dirname + String.raw`\public\intro.html`)
})

// list of moves
let moves = []

// this var is for the setting of colors
let white = false
let black = false
let turn = 'white'
let check = false
let checkedSide = ''
let whiteDraw = false
let blackDraw = false


// when a client connects
wss.on('connection', (ws) => {


    // assign user unique id
    const id = create_uuidv4();
    let color;
    let position;
    let rotation;
    if (white == false){
        color = 'white'
        white = true
        position = '0 3 -3'
        rotation = '0 0 0'
    }
    else if (black == false) {
        color = 'black'
        black = true
        position = '0 3 -16'
        rotation = '0 180 0'
    }
    else{
        position = '10 7 -9.5'
        rotation = '0 90 0'
    }
    const metadata = {id, color, position, rotation}

    // store connection in map
    clients.set(ws, metadata);
    console.log(`${clients.get(ws).id} joined`)

    ws.on('message', (received) => {
        const data = JSON.parse(received)
        
        // send position rotation if loaded
        if(data === 'loaded') {
            ws.send(JSON.stringify({header: 'init', cameraPos: position, cameraRot: rotation, cameraColor: color}))
            moves.forEach((move)=>{
                let returnPacket = { header: 'move', move: move, color: clients.get(ws).color, turnVar: turn }
                if(move === moves[moves.length - 1]) returnPacket.lastUpdate = true

                if (move[0] === 'promote'){
                    returnPacket = { header: 'promote', currentType: move[1], newType: move[2], turnVar: turn}
                }
                broadcast(returnPacket, clients.get(ws).id, true)
            })
            if (blackDraw || whiteDraw){
                const drawColor = blackDraw ? 'black' : 'white'
                let drawPacket = { header: 'draw', color: drawColor }
                broadcast(drawPacket, clients.get(ws).id, true)
            }
        }
        else if(data.header === 'move') {
            if(!data.castle && !data.promotionMove){
                if (turn === 'white') turn = 'black'
                else turn = 'white'
            }
            let move = [data.pieceMoved, data.targetTile, clients.get(ws).color]
            moves.push(move)
            let returnPacket = { header: 'move', move: move, turnVar:turn, lastUpdate : true }
            if (data.castle)  {
                returnPacket.preventHighlight = true
                broadcast(returnPacket, clients.get(ws).id, true)
            }
            broadcast(returnPacket, clients.get(ws).id)
        }
        
        else if(data.header === 'check') {
            check = true
            checkedSide = data.sideUnderCheck
            let checkPacket = { header:'check' }
            broadcast(checkPacket, clients.get(ws).id, true)
            broadcast(checkPacket, clients.get(ws).id)
        }
        else if(data.header === 'uncheck'){
            check = false 
            checkedSide = ''
            let uncheckPacket = { header: 'uncheck' }
            broadcast(uncheckPacket, clients.get(ws).id, true)
            broadcast(uncheckPacket, clients.get(ws).id)
        }
        else if(data.header === 'checkmate'){
            check = true 
            checkedSide = data.sideUnderCheck
            let winningSide = checkedSide == 'white' ? 'Black' : 'White'
            let checkMatePacket = { header: 'checkmate', color: winningSide }
            broadcast(checkMatePacket, clients.get(ws).id, true)
            broadcast(checkMatePacket, clients.get(ws).id)
        }
        else if(data.header === 'stalemate'){
            let returnPacket = { header: 'stalemate' }
            broadcast(returnPacket, clients.get(ws).id)
        }
        else if(data.header === 'draw'){    
            if (clients.get(ws).color === 'white') whiteDraw = true
            if (clients.get(ws).color === 'black') blackDraw = true
            if (whiteDraw && blackDraw) {
                whiteDraw = false
                blackDraw = false
                moves = []
                turn = 'white'
                let drawPacket = { header: 'drawAccepted', color: clients.get(ws).color }
                broadcast(drawPacket, clients.get(ws).id)
                broadcast(drawPacket, clients.get(ws).id, true)

            }
            else {
                let drawPacket = { header: 'draw', color: clients.get(ws).color }
                broadcast(drawPacket, clients.get(ws).id)
                broadcast(drawPacket, clients.get(ws).id, true)
            }
        }
        else if (data.header === 'location'){
            broadcast(data, clients.get(ws).id)
        }
        else if (data.header === 'promote'){
            if (turn === 'white') turn = 'black'
            else turn = 'white'
            moves.push(['promote', data.currType, data.newType])
            let returnPacket = { header: 'promote', currentType: data.currType, newType: data.newType, turnVar: turn}
            broadcast(returnPacket, clients.get(ws).id)
            broadcast(returnPacket, clients.get(ws).id, true)
        }
    })
    
    // if a client disconnects delete him
    ws.on("close", () => {
        if (clients.get(ws).color === 'white') white = false
        else if (clients.get(ws).color === 'black') black = false
        clients.delete(ws);
    });
});

function create_uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function broadcast(message, id, selfSend = false){
    for (const client of clients.keys()) {
        if (selfSend && clients.get(client).id == id) {
            client.send(JSON.stringify(message))
        }
        else if (!selfSend && clients.get(client).id != id){
            client.send(JSON.stringify(message))
        }
    }
}

