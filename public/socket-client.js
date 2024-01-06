import { isStaleMate, chessBoard, positionToIndex } from "./chess.js";

const ws = new WebSocket(`wss:///${window.location.href.replace(/^http(s?):\/\//i, "")}/ws`);

export let lastMove
const rig = document.getElementById('rig')
const camera = document.getElementById('camera')
let playerBoxes = {}


async function connectToServer() {
    return new Promise((resolve, reject) => {
        console.log('About to connect')
        const timer = setInterval(() => {
            if(ws.readyState === 1) {
                clearInterval(timer)
                console.log('servers up')
                ws.send(JSON.stringify('loaded'))
                ws.addEventListener('message', receive)
            }
        }, 10);
    });
}

// function for recieving stuff
function receive(recieved){
    const data = JSON.parse(recieved.data)
    const scene = document.querySelector('a-scene')
    const winCam = document.getElementById('win-cam')
    const rightHand = document.getElementById('right-hand')
    const leftHand = document.getElementById('left-hand')
    // if it is the initial message
    if (data.header === 'init'){
        console.log(data)
        if(!navigator.userAgent.match(/Windows/i) && !navigator.userAgent.match(/Macintosh/i)) {
            winCam.removeAttribute('raycaster')
            winCam.removeAttribute('move-tool')
            winCam.removeAttribute('geometry')
            var gymbal = document.getElementById('box-gymbal')
            gymbal.remove()
            var newGymbal = document.createElement('a-entity')
            newGymbal.setAttribute('id', 'box-gymbal')
            newGymbal.setAttribute('gymbal-box','left-hand')
            rightHand.appendChild(newGymbal)
        }
        if (!data.cameraColor) document.getElementById('reset-button').remove()
        rig.setAttribute('position', data.cameraPos)
        rig.setAttribute('rotation', data.cameraRot)
        // camera.components['look-controls'].pitchObject.rotation.set((Math.PI * Number(data.cameraRot.split(' ')[0])) / 180, 0 ,0);
        // camera.components['look-controls'].yawObject.rotation.set(0, (Math.PI * Number(data.cameraRot.split(' ')[1])) / 180 ,0);
        document.querySelector('*[move-tool]').components['move-tool'].color = data.cameraColor
        if (data.cameraColor === 'white') document.querySelector('*[move-tool]').components['move-tool'].turn = true
        else document.querySelector('*[move-tool]').components['move-tool'].turn = false 
    }
    // if its a move packet
    else if (data.header === 'move') {
        var possiblePieces = document.querySelectorAll(`.${data.move[2]}`)
        let correctPiece
        possiblePieces.forEach((piece)=>{
            if(piece._position === data.move[0]) correctPiece = piece
        })
        //check for en passant
        if (correctPiece.classList.contains('Pawn') && Math.abs(parseInt(data.move[1][1]) - parseInt(correctPiece._position[1])) == 2) correctPiece.classList.add('en-passantable')

        let targetTile = document.getElementById(data.move[1])

        targetTile.object3D.getWorldPosition(correctPiece.object3D.position)

        correctPiece.components['current-tile'].changePosition(data.move[1])

        // sound entity 
        const placeSound = targetTile.querySelector('*[sound="src: #place"]')

        // play place sound
        placeSound.components.sound.playSound()

        // change the position on the chessboard array 
        let chessPieceComponent = document.querySelector('*[chess-pieces=""]').components['chess-pieces']
        var capturedPiece = chessPieceComponent.updateChessBoard(data.move[0], data.move[1])

        // if a piece has been captured, move it 
        if(capturedPiece) capturedPiece.setAttribute('captured','')

        // if it my turn now set my turn to true
        if (data.turnVar == document.querySelector("*[move-tool]").components['move-tool'].color) document.querySelector("*[move-tool]").components['move-tool'].turn = true
        else document.querySelector("*[move-tool]").components['move-tool'].turn = false
        let colorForTurn
        
        if(document.querySelector("*[move-tool]").components['move-tool'].turn){
            if(document.querySelector("*[move-tool]").components['move-tool'].color == 'white') colorForTurn = 'White'
            else colorForTurn = 'Black'
        }
        else{
            if(document.querySelector("*[move-tool]").components['move-tool'].color == 'white') colorForTurn = 'Black'
            else colorForTurn = 'White'
        }
        
        let turnText = document.querySelectorAll('.turn-text')
        
        turnText.forEach((label)=>{
            label.setAttribute('value',`${colorForTurn}'s Turn`)
            label.setAttribute('color', colorForTurn)
        })
        if(!data.preventHighlight) lastMove = data.move.slice(0,2)
        
        const moveTool = document.querySelector('*[move-tool]').components['move-tool']
        if (data.lastUpdate && data.turnVar == document.querySelector("*[move-tool]").components['move-tool'].color) {
            moveTool.lastUpdateFunc()
        }
        if(isStaleMate(document.querySelector("*[move-tool]").components['move-tool'].color) && document.querySelector('*[move-tool]').components['move-tool'].check) {
            var checkText = document.querySelectorAll('.check-text')
            checkText.forEach((textBox) => {
                textBox.setAttribute('value', `Stalemate, Game Over`)
                textBox.object3D.visible = true
            })
            sendStalemate()
        }
        
    }
    else if (data.header === 'check'){
        var checkText = document.querySelectorAll('.check-text')
        document.querySelector('*[move-tool]').components['move-tool'].check = true
        checkText.forEach((textBox) => {
            textBox.setAttribute('value', `Check`)
            textBox.object3D.visible = true
        })
    }
    else if (data.header === 'uncheck'){
        document.querySelector('*[move-tool]').components['move-tool'].check = false
        var checkText = document.querySelectorAll('.check-text')
        checkText.forEach((textBox) => {
            textBox.object3D.visible = false
        })
    }
    else if (data.header === 'checkmate'){
        document.querySelector('*[move-tool]').components['move-tool'].check = true
        var checkText = document.querySelectorAll('.check-text')
        checkText.forEach((textBox) => {
            textBox.setAttribute('value', `${data.color} wins by Checkmate`)
            textBox.object3D.visible = true
            textBox.setAttribute('color', `${data.color}`)
        })
        
    }
    else if (data.header === 'stalemate'){
        var checkText = document.querySelectorAll('.check-text')
        document.querySelector('*[move-tool]').components['move-tool'].check = true
        checkText.forEach((textBox) => {
            textBox.setAttribute('value', `Stalemate, Game Over`)
            textBox.object3D.visible = true
        })
    }
    else if (data.header === 'draw'){
        const drawTextBox = document.querySelectorAll('.draw-text')
        drawTextBox.forEach((drawText) => {
            if(data.color === document.querySelector('*[move-tool]').components['move-tool'].color)drawText.setAttribute('value','Requesting Draw')
            else drawText.setAttribute('value','Draw Requested')

        })
    }
    else if (data.header === 'drawAccepted'){
        const drawTextBox = document.querySelectorAll('.draw-text')
        drawTextBox.forEach((drawText) => {
            drawText.setAttribute('value','Draw Accepted')
            setTimeout(() => {
                drawText.setAttribute('value','Draw/Reset')
            }, 5000)
        })
        if (document.querySelector("*[move-tool]").components['move-tool'].color === 'white') document.querySelector("*[move-tool]").components['move-tool'].turn = true
        if (document.querySelector("*[move-tool]").components['move-tool'].color === 'black') document.querySelector("*[move-tool]").components['move-tool'].turn = false
        let turnText = document.querySelectorAll('.turn-text')
        
        turnText.forEach((label)=>{
            label.setAttribute('value',`White's Turn`)
            label.setAttribute('color', 'white')
        })
        document.querySelector('*[chess-pieces]').components['chess-pieces'].resetBoard()

        var checkText = document.querySelectorAll('.check-text')
        
        checkText.forEach((textBox) => {
            textBox.object3D.visible = false
        })
    }
    else if (data.header === 'location'){
        if (playerBoxes[data.col]){
            playerBoxes[data.col].object3D.position.copy(data.pos)
            playerBoxes[data.col].object3D.rotation.copy(data.rot)
        }
        else {
            const box = document.createElement('a-box')
            box.setAttribute('color', data.col)
            box.object3D.position.copy(data.pos)
            box.object3D.rotation.copy(data.rot)
            playerBoxes[data.col] = box
            scene.appendChild(box)
            
        }
    }
    else if (data.header === 'promote'){
        let correctPiece
        chessBoard.forEach((row)=>{
            row.forEach((piece) => {
                if(piece._position === data.currentType) correctPiece = piece
            })
        })
        let color 
        if (correctPiece.classList.contains('black')) color = 'black'
        else color = 'white'
        let newPiece = document.createElement('a-entity')
        newPiece.setAttribute('scale', '0.2 0.2 0.2')
        newPiece.classList.add(color)
        newPiece.classList.add('chess-piece-obj')
        newPiece.setAttribute('current-tile', data.currentType)
        newPiece._position = data.currentType
        if(data.newType === 'queenUp') {
            newPiece.classList.add('Queen')
            newPiece.setAttribute('gltf-model', `#queen-${color}`)
        }
        else if(data.newType === 'knightUp') {
            newPiece.classList.add('Knight')
            newPiece.setAttribute('gltf-model', `#knight-${color}`)
        }
        else if(data.newType === 'bishopUp') {
            newPiece.classList.add('Bishop')
            newPiece.setAttribute('gltf-model', `#bishop-${color}`)
        }
        else if(data.newType === 'rookUp') {
            newPiece.classList.add('Rook')
            newPiece.setAttribute('gltf-model', `#rook-${color}`)
        }
        if (color === 'black') newPiece.setAttribute('rotation', '0 180 0')
        correctPiece.object3D.getWorldPosition(newPiece.object3D.position)
        scene.appendChild(newPiece)
        correctPiece.remove()
        correctPiece = newPiece

        var [x, y] = positionToIndex(data.currentType)
        chessBoard[x][y] = newPiece
        
        if(document.querySelector('*[promotion-menu]')) document.querySelector('*[promotion-menu]').remove()

        if (data.turnVar == document.querySelector("*[move-tool]").components['move-tool'].color) document.querySelector("*[move-tool]").components['move-tool'].turn = true
        else document.querySelector("*[move-tool]").components['move-tool'].turn = false
        let colorForTurn
        
        if(document.querySelector("*[move-tool]").components['move-tool'].turn){
            if(document.querySelector("*[move-tool]").components['move-tool'].color == 'white') colorForTurn = 'White'
            else colorForTurn = 'Black'
        }
        else{
            if(document.querySelector("*[move-tool]").components['move-tool'].color == 'white') colorForTurn = 'Black'
            else colorForTurn = 'White'
        }
        
        let turnText = document.querySelectorAll('.turn-text')
        
        turnText.forEach((label)=>{
            label.setAttribute('value',`${colorForTurn}'s Turn`)
            label.setAttribute('color', colorForTurn)
        })
    }
}

export function sendMove(piece, tile, isCastle, isPromotionMove){
    let data = { header: 'move', pieceMoved: piece, targetTile:tile, castle: isCastle, promotionMove: isPromotionMove}
    ws.send(JSON.stringify(data))
}

export function sendCheck(color){
    let data = { header: 'check', sideUnderCheck: color }
    ws.send(JSON.stringify(data))
}

export function sendUncheck(){
    let data = { header: 'uncheck' }
    ws.send(JSON.stringify(data))
}
export function sendCheckMate(color){
    let data = { header: 'checkmate', sideUnderCheck: color }
    ws.send(JSON.stringify(data))
}
function sendStalemate(){
    let data = { header: 'stalemate' }
    ws.send(JSON.stringify(data))
}
export function requestDraw(){
    let data = { header: 'draw' }
    ws.send(JSON.stringify(data))
}
export function sendLocation(position, rotation, color){
    let data = { header: 'location',  pos: position, rot: rotation, col: color }
    ws.send(JSON.stringify(data))
}
export function promote(currentType, promoType){
    let data = { header: 'promote',  currType: currentType, newType: promoType }
    ws.send(JSON.stringify(data))
}
document.querySelector('a-scene').addEventListener('loaded', ()=>{
    connectToServer()
})