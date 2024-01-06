import { chessBoard, pieces, findLegalMoves, isPositionMarkedBy, doesMoveCauseCheck, positionToIndex, isColorCheckMated } from "./chess.js";
import { sendMove, lastMove, sendCheck, sendUncheck, sendCheckMate, requestDraw, sendLocation, promote } from "./socket-client.js";

// Current turn 
// Show highlights on both sides


AFRAME.registerComponent('chess-board', {
    init: function() {
        this.x = 0
        this.z = 0
        this.counter = 0
        this.col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        for(let i = 0; i < chessBoard.length; i++){
            for(let j = 0; j < chessBoard[i].length; j++){
                
                // create a tile and set its position
                this.plane = document.createElement('a-plane')
                this.plane.object3D.position.x = this.x
                this.plane.object3D.position.z = this.z
                this.plane.object3D.rotation.x = -Math.PI / 2

                // increment counter for color
                this.counter++

                // assign it a color
                if (this.counter % 2 == 1){
                    this.plane.setAttribute('color','#51361a')
                    this.plane._color = '#51361a'
                }
                else {
                    this.plane.setAttribute('color','white')
                    this.plane._color = 'white'
                }

                // give it an id
                this.plane.setAttribute('id', this.col[j] + String(i+1))

                // give it the tile-obj class for interaction with the raycaster
                this.plane.classList.add('tile-obj')        

                // add the sound elements 
                this.plane.innerHTML = `
                    <a-entity sound="src: #select"></a-entity>
                    <a-entity sound="src: #deselect"></a-entity>
                    <a-entity sound="src: #place"></a-entity>
                `

                // add it to the scene
                this.el.appendChild(this.plane)

                // increase the x per column
                this.x++
            }
            // increase the z per row and reset x and increment counter for alternating the color for every row
            this.x = 0
            this.z--
            this.counter++
            
        }
        this.box = document.createElement('a-box')
        this.box.setAttribute('scale','9 1 9')
        this.box.setAttribute('position','3.5 -0.55 -3.5')
        this.box.setAttribute('color', '#2e1818')
        this.el.appendChild(this.box)
    } 
})

AFRAME.registerComponent('chess-pieces', {
    init: function(){
        // for each piece
        this.pieceArr = []
        pieces.forEach((piece) => {
            // create a model holder
            let pieceModel = document.createElement('a-entity')

            // dictionary adding stuff to the chessBoard array 
            this.positionLookup = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7 }

            // instantiate the variable that holds the id of the model
            this.model;

            // instantiate a Y rotation variable
            this.yRotation = 0

            // assign the holder a model depending on the color and the kind of piece
            if (piece.color === 'white'){

                // no rotation for whites
                this.yRotation = 0

                // assign the id of the model to the model variable
                switch (piece.type){
                    case 'Pawn':
                        this.model = '#pawn-white'
                        break;
                    case 'Rook':
                        this.model = '#rook-white'
                        break;
                    case 'Knight':
                        this.model = '#knight-white'
                        break;
                    case 'Bishop':
                        this.model = '#bishop-white'
                        break;
                    case 'King':
                        this.model = '#king-white'
                        break;
                    case 'Queen':
                        this.model = '#queen-white'
                        break;
                }
            }
            else{

                // give the model a 180 degree rotation for black pieces
                this.yRotation = Math.PI

                // assign the id of the model to the model variable
                switch (piece.type){
                    case 'Pawn':
                        this.model = '#pawn-black'
                        break;
                    case 'Rook':
                        this.model = '#rook-black'
                        break;
                    case 'Knight':
                        this.model = '#knight-black'
                        break;
                    case 'Bishop':
                        this.model = '#bishop-black'
                        break;
                    case 'King':
                        this.model = '#king-black'
                        break;
                    case 'Queen':
                        this.model = '#queen-black'
                        break;
                }
            }

            // gives an array of the ID's of the default positions
            var positions = piece.defaultPositions

            // creates a var that holds the world position of the tiles
            var tileWorldPos = new THREE.Vector3()

            // for each of the default position of the given pieces
            positions.forEach((position) => {

                // clone the piece model node for multiple pawns, knights, etc
                const clonePiece = pieceModel.cloneNode(true)

                // give it its Y rotation if any
                clonePiece.object3D.rotation.y = this.yRotation 

                // give it a color and a type for identification while capturing 
                clonePiece.classList.add(piece.color)
                clonePiece.classList.add(piece.type)
                clonePiece._color = piece.color
                clonePiece._type = piece.type

                // assign the gltf model
                clonePiece.setAttribute('gltf-model', this.model)

                // give it a scale to make it smaller
                clonePiece.setAttribute('scale', '0.2 0.2 0.2')

                // find the world position of the required tile and assign it to the var that is responsible for holding it
                const tile = document.getElementById(position)
                tile.object3D.getWorldPosition(tileWorldPos)

                // give the cloned piece the world position of the tile
                clonePiece.object3D.position.copy(tileWorldPos)

                // give it the chess-piece-obj class to interact with it
                clonePiece.classList.add('chess-piece-obj')

                // give the piece a position attribute
                clonePiece.setAttribute('current-tile', position)

                // default pos
                clonePiece._defaultPosition = position
                this.pieceArr.push(clonePiece)

                // append the cloned piece to the scene
                this.el.append(clonePiece)

                // add the piece to the chessboard with the positions
                var x = parseInt(position[1]) - 1
                var y = this.positionLookup[position[0]]
                chessBoard[x][y] = clonePiece
            })
        })
    },
    updateChessBoard: function(initPos, newPos){
        // updates the chess board array
        const x1 = parseInt(newPos[1]) - 1
        const y1 = this.positionLookup[newPos[0]]
        const x2 = parseInt(initPos[1]) - 1
        const y2 = this.positionLookup[initPos[0]]
        
        
        var capturePiece = null

        if (chessBoard[x1][y1]) capturePiece = chessBoard[x1][y1]

        chessBoard[x1][y1] = chessBoard[x2][y2]
        chessBoard[x2][y2] = 0

        return capturePiece

    },
    resetBoard: function(){
        for (var x = 0; x < 8; x++){
            for (var y = 0; y < 8; y++){
                chessBoard[x][y] = 0
            }
        }
        this.pieceArr.forEach( (piece) => {
            piece._position = piece._defaultPosition
            piece.removeAttribute('captured')
            document.getElementById(piece._defaultPosition).object3D.getWorldPosition(piece.object3D.position)
            piece.classList.remove('moved')
            piece.classList.add('chess-piece-obj')
            piece.classList.add(piece._color)
            piece.classList.add(piece._type)
            var x, y
            [x, y] = positionToIndex(piece._defaultPosition)
            chessBoard[x][y] = piece
        })
        document.querySelectorAll('.tile-obj').forEach((tile)=>{
            tile.removeAttribute('highlight')
            tile.removeAttribute('moves-highlight')
            tile.removeAttribute('hover-highlight')
        })
    }
})

// component responsible for the moving of pieces
AFRAME.registerComponent('move-tool', {
    schema: {
        type: 'string',
        default: ''
    },
    dependencies: ['raycaster'],
    init: function() {
        // the piece to be moved and current tile is none by default
        this.selectedPiece = null
        this.currentTile = null
        this.color
        this.turn
        this.rightHand = document.getElementById('right-hand')
        this.turnText = document.querySelectorAll('.turn-text')
        this.check = false
        this.toPromote

        // lookups for position
        this.positionLookup = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7 }
        this.reversePositionLookup = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H' }
        
        document.addEventListener('triggerdown', (evt) => {
            // if there has been a trigger run the move piece method on an interactible object
            if( this.el.components.raycaster.intersectedEls[0] && this.turn && (this.el.components.raycaster.intersectedEls[0].classList.contains(this.color) || this.el.components.raycaster.intersectedEls[0].classList.contains('tile-obj'))) this.movePiece()
            else if( this.color && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('reset') ) requestDraw()
            else if( this.color && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('clickable') ) {
                promote(this.toPromote._position, this.el.components.raycaster.intersectedEls[0].getAttribute('id'))
                this.toPromote = 0
                console.log('sent')
            }
        })

        document.addEventListener('click', (evt) => {
            // if there has been a left click run the move piece method on an interactible object
            if( this.color && evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.turn && (this.el.components.raycaster.intersectedEls[0].classList.contains(this.color) || this.el.components.raycaster.intersectedEls[0].classList.contains('tile-obj'))) this.movePiece()
            else if( this.color && evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('reset') ) requestDraw()
            else if( this.color && evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('clickable') ) {
                promote(this.toPromote._position, this.el.components.raycaster.intersectedEls[0].getAttribute('id'))
                this.toPromote = 0
                console.log('sent')
            }
        })

        
    },
    movePiece: function(){
        // if there is no piece selected and objects are intersecting with the raycaster and the first object to intersect with the raycaster is a chess-piece-obj
        if(this.selectedPiece == null && this.el.components.raycaster.intersectedEls[0].classList.contains('chess-piece-obj')) {
            // set a selected piece and highlight the tile its on
            this.selectedPiece =  this.el.components.raycaster.intersectedEls[0]
            this.currentTile = document.getElementById(this.selectedPiece._position)
            this.currentTile.setAttribute('highlight','')

            // sound entity 
            const selectSound = this.currentTile.querySelector('*[sound="src: #select"]')

            // play select sound 
            selectSound.components.sound.playSound()

            // find the legal moves
            var currentPos = this.selectedPiece._position
            var x, y
            [x, y] = positionToIndex(currentPos)
            this.currentLegalMoves = findLegalMoves(x,y, chessBoard)
            const otherColor = this.color === 'white' ? 'black' : 'white'
            
            // highlight legal moves
            this.currentLegalMoves.forEach((move) => {
                if(!doesMoveCauseCheck(this.color, x, y, move[0], move[1])){
                    if(move[2] && move[2] === 'castle' && !isPositionMarkedBy(otherColor, x, y, chessBoard)){
                        if((move[1] < y && !isPositionMarkedBy(otherColor, x, y-1, chessBoard)) || (move[1] > y && !isPositionMarkedBy(otherColor, x, y+1, chessBoard))){
                            var tileForMoveID = this.reversePositionLookup[move[1]] + String(move[0]+1)
                            var tileForMove = document.getElementById(tileForMoveID)
                            tileForMove.setAttribute('moves-highlight', '')
                        }
                    }
                    else if(move[2] && move[2] === 'enpassant'){
                        var tileForMoveID = this.reversePositionLookup[move[1]] + String(move[0]+1)
                        var tileForMove = document.getElementById(tileForMoveID)
                        tileForMove.setAttribute('moves-highlight', '')
                        tileForMove.classList.add('enpassant')
                    }
                    else if (!move[2]){
                        var tileForMoveID = this.reversePositionLookup[move[1]] + String(move[0]+1)
                        var tileForMove = document.getElementById(tileForMoveID)
                        tileForMove.setAttribute('moves-highlight', '')
                    }
                }
            })

        }
        // if there is a piece that is selected and the first object to intersect with the raycaster is a tile-obj and its not the same as the tile its on 
        else if (this.selectedPiece != null && this.el.components.raycaster.intersectedEls[0].hasAttribute('moves-highlight') && this.el.components.raycaster.intersectedEls[0].classList.contains('tile-obj') && this.el.components.raycaster.intersectedEls[0] != this.currentTile) {
            
            let isPromotionMove = false
            // shift the piece to the target tile
            this.el.components.raycaster.intersectedEls[0].object3D.getWorldPosition(this.selectedPiece.object3D.position)

            // id of the target tile
            var targetTileId = this.el.components.raycaster.intersectedEls[0].getAttribute('id')
            
            
            // send the move to the server
            if ((this.selectedPiece.matches('.white.Pawn') && targetTileId[1] === '8') || (this.selectedPiece.matches('.black.Pawn') && targetTileId[1] === '1')) {
                isPromotionMove = true
                var promotionMenu = document.createElement('a-entity')
                promotionMenu.setAttribute('promotion-menu','')
                if (this.color === 'white') promotionMenu.setAttribute('position', '5 2 -9.5')
                else promotionMenu.setAttribute('position', '-5 2 -9.5')
                promotionMenu.setAttribute('rotation', '0 -45 0')
                document.querySelector('a-scene').appendChild(promotionMenu)
                this.toPromote = this.selectedPiece
            }
            sendMove(this.selectedPiece._position, targetTileId, false , isPromotionMove)
            if(this.selectedPiece.matches('.King.white') && targetTileId === 'G1' && !this.selectedPiece.classList.contains('moved')) sendMove('H1', 'F1', true)
            else if (this.selectedPiece.matches('.King.black') && targetTileId === 'G8' && !this.selectedPiece.classList.contains('moved')) sendMove('H8', 'F8', true)
            else if (this.selectedPiece.matches('.King.white') && targetTileId === 'C1' && !this.selectedPiece.classList.contains('moved')) sendMove('A1', 'D1', true)
            else if (this.selectedPiece.matches('.King.black') && targetTileId === 'C8' && !this.selectedPiece.classList.contains('moved')) sendMove('A8', 'D8', true)
            else if (this.el.components.raycaster.intersectedEls[0].classList.contains('enpassant')) {
                if (this.color === 'white') {
                    sendMove(targetTileId, `${targetTileId[0]}${parseInt(targetTileId[1])-1}`, true)
                    sendMove(`${targetTileId[0]}${parseInt(targetTileId[1])-1}`, targetTileId, true)
                }
                else {
                    sendMove(targetTileId, `${targetTileId[0]}${parseInt(targetTileId[1])+1}`, true)
                    sendMove(`${targetTileId[0]}${parseInt(targetTileId[1])+1}`, targetTileId, true)
                }
            }
            
            // change the current tile attibute and assign the moved class to selected piece
            this.selectedPiece.components['current-tile'].changePosition(targetTileId)
            if(!this.selectedPiece.classList.contains('moved')) this.selectedPiece.classList.add('moved')
            
            // remove the selection
            this.selectedPiece = null 

            // sound entity 
            const placeSound = this.currentTile.querySelector('*[sound="src: #place"]')

            // play place sound
            placeSound.components.sound.playSound()

            // change the position on the chessboard array
            this.chessPieceComponent = document.querySelector('*[chess-pieces=""]').components['chess-pieces']
            var capturedPiece = this.chessPieceComponent.updateChessBoard(this.currentTile.getAttribute('id'), targetTileId)

            // if a piece has been captured, move it 
            if(capturedPiece) capturedPiece.setAttribute('captured','')

            // remove the highlight and the current tile and opponents move
            this.currentTile.components['highlight'].remove()
            this.currentTile.removeAttribute('highlight')
            this.currentTile = null
            this.turn = false
            let colorForTurn
            if (this.color == 'white') colorForTurn = 'Black'
            else colorForTurn = 'White'
            
            this.turnText.forEach((label)=>{
                label.setAttribute('value',`${colorForTurn}'s Turn`)
                label.setAttribute('color', colorForTurn)
            })
            if(lastMove){
                lastMove.forEach((tile)=>{
                    document.getElementById(tile).removeAttribute('highlight')
                })
            }
            
            // remove the potential moves
            this.currentLegalMoves.forEach((move) => {
                var tileForMoveID = this.reversePositionLookup[move[1]] + String(move[0]+1)
                var tileForMove = document.getElementById(tileForMoveID)
                tileForMove.removeAttribute('moves-highlight')
            })

            if(this.check) sendUncheck()

            
            // check for a check
            let target
            if (this.color === 'white') target = 'black'
            else if (this.color === 'black') target = 'white'
            const targetKing = document.querySelector(`.${target}.King `)
            var currentPos = targetKing._position
            var king_x, king_y
            [king_x, king_y] = positionToIndex(currentPos)
            var checkText = document.querySelectorAll('.check-text')
            if (isPositionMarkedBy(this.color, king_x, king_y, chessBoard)) {
                console.log('check')
                this.check = true
                if (isColorCheckMated(target)){
                    sendCheckMate(target)
                }
                else{
                    sendCheck(target)
                }
            }
            // remove any enpassants 
            var pawnsEnPassant = document.querySelectorAll('.en-passantable')
            pawnsEnPassant.forEach((pawn) => {
                pawn.classList.remove('en-passantable')
            })
        }
        else if (this.selectedPiece != null && (!this.el.components.raycaster.intersectedEls[0].classList.contains('tile-obj') || this.el.components.raycaster.intersectedEls[0] == this.currentTile)){
            // sound entity 
            const deselectSound = this.currentTile.querySelector('*[sound="src: #deselect"]')

            // play deselect sound
            deselectSound.components.sound.playSound()

            // remove the selected Piece, highlight, and the current tile
            this.selectedPiece = null
            this.currentTile.components['highlight'].remove()
            this.currentTile.removeAttribute('highlight')
            this.currentTile = null

            // remove the potential moves
            this.currentLegalMoves.forEach((move) => {
                var tileForMoveID = this.reversePositionLookup[move[1]] + String(move[0]+1)
                var tileForMove = document.getElementById(tileForMoveID)
                tileForMove.removeAttribute('moves-highlight')
            })
        }
    },
    lastUpdateFunc: function(){
        lastMove.forEach((tile)=>{
            document.getElementById(tile).setAttribute('highlight','')
        })
    }
})

// a component that keeps track of the tile a piece is on and updates the game state
AFRAME.registerComponent('current-tile', {
    schema: {
        type: 'string'
    },
    init: function(){
        this.el._position = this.data
    },
    changePosition: function(change){
        this.el._position = change
    }
})


// a component that hightlights a selected tile to give the user feedback about what he's moving
AFRAME.registerComponent('highlight',{
    schema:{
        type: 'string',
        default: ''
    },
    init: function(){
        this.el.setAttribute('color', 'yellow')
    },
    remove: function(){
        this.el.setAttribute('color', this.el._color)
    }
})

AFRAME.registerComponent('moves-highlight',{
    schema:{
        type: 'string',
        default: ''
    },
    init: function(){
        this.plane = document.createElement('a-plane')
        this.plane.setAttribute('color','green')
        this.plane.object3D.position.z += 0.005
        this.el.appendChild(this.plane)
    },
    remove: function(){
        this.plane.remove()
    }
})

AFRAME.registerComponent('hover-highlight',{
    schema:{
        type: 'string',
        default: ''
    },
    init: function(){
        this.plane = document.createElement('a-plane')
        this.plane.setAttribute('color','yellow')
        this.plane.object3D.position.z += 0.005
        this.el.appendChild(this.plane)
    },
    remove: function(){
        this.plane.remove()
    }
})

AFRAME.registerComponent('captured', {
    init: function(){
        this.captureZone = document.getElementById('captureZone')
        document.querySelector('*[capture-zone]').components['capture-zone'].addPiece(this.el)
        this.el.classList = ''
    }
})

AFRAME.registerComponent('capture-zone',{
    init: function(){
        this.blackPiecesCaptured = document.createElement('a-box')
        this.blackPiecesCaptured.setAttribute('scale', '3 1 9')
        this.blackPiecesCaptured.setAttribute('position', '7 -3 -9.5')
        this.whitePiecesCaptured = document.createElement('a-box')
        this.whitePiecesCaptured.setAttribute('scale', '3 1 9')
        this.whitePiecesCaptured.setAttribute('position', '-7 -3 -9.5')
        this.whitePiecesCaptured.setAttribute('color', 'black')
        this.el.appendChild(this.whitePiecesCaptured)
        this.el.appendChild(this.blackPiecesCaptured)
        this.emptySpotForPieceWhite = {x: -0.5, y: 0.5, z:-3.5}
        this.emptySpotForPieceBlack = {x: -0.5, y: 0.5, z:-3.5}
    },
    addPiece: function(piece){
        if (piece.classList.contains('black')){
            this.blackPiecesCaptured.object3D.getWorldPosition(piece.object3D.position)
            piece.object3D.position.x += this.emptySpotForPieceBlack.x
            piece.object3D.position.y += this.emptySpotForPieceBlack.y
            piece.object3D.position.z += this.emptySpotForPieceBlack.z
            if (this.emptySpotForPieceBlack.z < 3.5) this.emptySpotForPieceBlack.z++
            else {
                this.emptySpotForPieceBlack.z = -3.5
                this.emptySpotForPieceBlack.x += 1
            }
        } 
        else {
            this.whitePiecesCaptured.object3D.getWorldPosition(piece.object3D.position)
            piece.object3D.position.x += this.emptySpotForPieceWhite.x
            piece.object3D.position.y += this.emptySpotForPieceWhite.y
            piece.object3D.position.z += this.emptySpotForPieceWhite.z
            if (this.emptySpotForPieceWhite.z < 3.5) this.emptySpotForPieceWhite.z++
            else {
                this.emptySpotForPieceWhite.z = -3.5
                this.emptySpotForPieceWhite.x += 1
            }
        }
        piece.object3D.rotation.y -= 90 
    }
})


AFRAME.registerComponent('gymbal-box', {
    init: function() {
        this.tractorBeam = document.querySelector('*[move-tool]')
        this.position
    },
    tick: function(){
            if(this.el && this.el.parentNode && this.el.parentNode.components && this.el.parentNode.components.raycaster){
                this.raycaster = this.tractorBeam.components.raycaster
                this.tick = this.tickA
                window.r = this.raycaster
            }
    },
    tickA: function(){
        const intersection = this.raycaster.intersections[0]
        if (intersection){
            if (this.position && this.position != document.getElementById(this.tractorBeam.components.raycaster.intersectedEls[0]._position)) this.position.removeAttribute('hover-highlight')
            if (this.tractorBeam.components.raycaster.intersectedEls[0]._position != null && this.tractorBeam.components.raycaster.intersectedEls[0].classList.contains(this.tractorBeam.components['move-tool'].color)) {
                this.position = document.getElementById(this.tractorBeam.components.raycaster.intersectedEls[0]._position) 
                this.position.setAttribute('hover-highlight','')
            }
        }
        else {
            if(this.position ) this.position.removeAttribute('hover-highlight')
        }
    }
})


AFRAME.registerComponent('send-location', {
    init: function(){
        this.num = 0
        this._vector3 = new THREE.Vector3()
    },
    tick: function(){
        if (document.querySelector('*[move-tool]').components['move-tool'].color){
            this.el.object3D.getWorldPosition(this._vector3)
            sendLocation(this._vector3, this.el.object3D.rotation, document.querySelector('*[move-tool]').components['move-tool'].color)
        }
    }
})

AFRAME.registerComponent('promotion-menu', {
    init: function(){
        // Queen button 
        this.queen = document.createElement('a-box')
        this.queen.object3D.position.y = 2.2
        this.queen.setAttribute('width', 3)
        this.queen.setAttribute('opacity', 0.3)
        this.queen.classList.add('clickable')
        this.queen.setAttribute('id', 'queenUp')
        this.queenText1 = document.createElement('a-text')
        this.queenText1.setAttribute('value','Queen')
        this.queenText1.setAttribute('scale', '2 2 2')
        this.queenText1.setAttribute('align', 'center')
        this.queenText2 = document.createElement('a-text')
        this.queenText2.setAttribute('value','Queen')
        this.queenText2.setAttribute('scale', '2 2 2')
        this.queenText2.setAttribute('align', 'center')
        this.queenText2.setAttribute('rotation', '0 180 0')
        this.queen.appendChild(this.queenText1)
        this.queen.appendChild(this.queenText2)

        // Knight button
        this.knight = document.createElement('a-box')
        this.knight.object3D.position.y = 1.1
        this.knight.setAttribute('width', 3)
        this.knight.setAttribute('opacity', 0.3)
        this.knight.classList.add('clickable')
        this.knight.setAttribute('id', 'knightUp')
        this.knightText1 = document.createElement('a-text')
        this.knightText1.setAttribute('value','Knight')
        this.knightText1.setAttribute('scale', '2 2 2')
        this.knightText1.setAttribute('align', 'center')
        this.knightText2 = document.createElement('a-text')
        this.knightText2.setAttribute('value','Knight')
        this.knightText2.setAttribute('scale', '2 2 2')
        this.knightText2.setAttribute('align', 'center')
        this.knightText2.setAttribute('rotation', '0 180 0')
        this.knight.appendChild(this.knightText1)
        this.knight.appendChild(this.knightText2)

        // Bishop button
        this.bishop = document.createElement('a-box')
        this.bishop.object3D.position.y = 0
        this.bishop.setAttribute('width', 3)
        this.bishop.setAttribute('opacity', 0.3)
        this.bishop.classList.add('clickable')
        this.bishop.setAttribute('id', 'bishopUp')
        this.bishopText1 = document.createElement('a-text')
        this.bishopText1.setAttribute('value','Bishop')
        this.bishopText1.setAttribute('scale', '2 2 2')
        this.bishopText1.setAttribute('align', 'center')
        this.bishopText2 = document.createElement('a-text')
        this.bishopText2.setAttribute('value','Bishop')
        this.bishopText2.setAttribute('scale', '2 2 2')
        this.bishopText2.setAttribute('align', 'center')
        this.bishopText2.setAttribute('rotation', '0 180 0')
        this.bishop.appendChild(this.bishopText1)
        this.bishop.appendChild(this.bishopText2)

        // Rook button
        this.rook = document.createElement('a-box')
        this.rook.object3D.position.y = -1.1
        this.rook.setAttribute('width', 3)
        this.rook.setAttribute('opacity', 0.3)
        this.rook.classList.add('clickable')
        this.rook.setAttribute('id', 'rookUp')
        this.rookText1 = document.createElement('a-text')
        this.rookText1.setAttribute('value','Rook')
        this.rookText1.setAttribute('scale', '2 2 2')
        this.rookText1.setAttribute('align', 'center')
        this.rookText2 = document.createElement('a-text')
        this.rookText2.setAttribute('value','Rook')
        this.rookText2.setAttribute('scale', '2 2 2')
        this.rookText2.setAttribute('align', 'center')
        this.rookText2.setAttribute('rotation', '0 180 0')
        this.rook.appendChild(this.rookText1)
        this.rook.appendChild(this.rookText2)

        // Heading text
        this.headText1 = document.createElement('a-text')
        this.headText1.setAttribute('value','What do you want to promote your pawn to?')
        this.headText1.setAttribute('scale', '2 2 2')
        this.headText1.object3D.position.y = 3
        this.headText1.setAttribute('align', 'center')
        this.headText2 = document.createElement('a-text')
        this.headText2.setAttribute('value','What do you want to promote your pawn to?')
        this.headText2.setAttribute('scale', '2 2 2')
        this.headText2.object3D.position.y = 3
        this.headText2.setAttribute('align', 'center')
        this.headText2.setAttribute('rotation', '0 180 0')

        // add to el
        this.el.appendChild(this.queen)
        this.el.appendChild(this.knight)
        this.el.appendChild(this.bishop)
        this.el.appendChild(this.rook)
        this.el.appendChild(this.headText1)
        this.el.appendChild(this.headText2)
    }
})

AFRAME.registerComponent('fat-line', {
  
    init() {
      this.ray = document.createElement('a-cylinder')
      this.ray.setAttribute('radius', 0.1)
      this.ray.setAttribute('height', 1)
      this.ray.setAttribute('color', 'red')
      this.el.appendChild(this.ray)
    },
    
    tick: (function () {
      const down = new THREE.Vector3(0, -1, 0)
      const direction = new THREE.Vector3()
  
      return function () {
        const line = this.el.components.line
        if (!line) return
  
        const start = line.data.start
        const end = line.data.end
        
        direction.subVectors(end, start)
        const length = direction.length()
        direction.normalize()
  
        const ray = this.ray.object3D
  
        ray.position.addVectors(start, end)
        ray.position.multiplyScalar(0.5)
        ray.quaternion.setFromUnitVectors(down, direction)
        ray.scale.set(1, length, 1)
      };
    })()
  });
  