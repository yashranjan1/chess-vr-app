

setTimeout(() =>{
    const winCam = document.getElementById('win-cam')
    if(!navigator.userAgent.match(/Windows/i)) {

        winCam.removeAttribute('raycaster')
        winCam.removeAttribute('move-tool')
        winCam.removeAttribute('geometry')
    }
}, 100)

AFRAME.registerComponent('move-tool-2', {
    dependencies: ['raycaster'],
    init: function(){
        document.getElementById('rook-two')._position = '11'
        document.getElementById('rook-three')._position = '41'
        this.selectedPiece2
        this.selectedPiece3
        this.slideTwoBoard = [
            [0, 0, 0],
            [0, document.getElementById('rook-two'), 0],
            [0, 0, 0]
        ]
        this.slideThreeBoard = [
            [0, 0, 0],
            [0, document.getElementById('rook-three'), document.getElementById('pawn-three')],
            [0, 0, 0]
        ]
        this.moves= []
        this.moves2 = []
        this.currentSlide = 1
        this.slideHolder = {1: document.getElementById('slide-one'), 2: document.getElementById('slide-two'), 3: document.getElementById('slide-three'), 4: document.getElementById('slide-four')}
        document.addEventListener('triggerdown', (evt) => {
            if (this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('next')) {
                this.removeSlide(this.currentSlide)
                if(this.currentSlide < 4)this.currentSlide++
                else if (this.currentSlide == 4) location.replace('/game')
                this.addSlide(this.currentSlide)
                
                this.selectedPiece2 = null
                this.selectedPiece3 = null
                
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight', '')
                })
                
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight', '')
                })
            }
            if (this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('back')) {
                this.removeSlide(this.currentSlide)
                if(this.currentSlide > 1) this.currentSlide--
                this.addSlide(this.currentSlide)
                this.selectedPiece2 = null
                this.selectedPiece3 = null
                
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight', '')
                })
                
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight', '')
                })
            }
            if (this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('skip')) {
                location.replace('/game')
            }
            if (this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('chess-piece')) this.movePiece()
            if (this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('tile-piece')) this.movePiece()
        })
        document.addEventListener('click', (evt) => {
            if (evt.which == 1 &&  this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('next')) {
                this.removeSlide(this.currentSlide)
                if(this.currentSlide < 4)this.currentSlide++
                else if (this.currentSlide == 4) location.replace('/game')
                this.addSlide(this.currentSlide)
                
                this.selectedPiece2 = null
                this.selectedPiece3 = null
                
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight', '')
                })
                
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight', '')
                })
            }
            if (evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('back')) {
                this.removeSlide(this.currentSlide)
                if(this.currentSlide > 1) this.currentSlide--
                this.addSlide(this.currentSlide)
                this.selectedPiece2 = null
                this.selectedPiece3 = null
                
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight', '')
                })
                
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight', '')
                })
            }
            if (evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('skip')) {
                location.replace('/game')
            }
            if (evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('chess-piece')) this.movePiece()
            if (evt.which == 1 && this.el.components.raycaster.intersectedEls[0] && this.el.components.raycaster.intersectedEls[0].classList.contains('tile-piece')) this.movePiece()
        })
    }, 
    removeSlide: function(){
        this.slideHolder[this.currentSlide].object3D.position.x = 10000000
    }, 
    addSlide: function(){
        this.slideHolder[this.currentSlide].object3D.position.x = 0
    },
    movePiece: function(){
        if((!this.selectedPiece2 && !this.selectedPiece3) && this.el.components.raycaster.intersectedEls[0].classList.contains('chess-piece')) {
            if (this.el.components.raycaster.intersectedEls[0].getAttribute('id') === 'rook-two'){
                    
                this.selectedPiece2 = this.el.components.raycaster.intersectedEls[0]

                // sound entity 
                const selectSound = document.querySelector('*[sound="src: #select"]')

                // play select sound 
                selectSound.components.sound.playSound()

                let selPieceId = this.selectedPiece2._position

                this.moves = this.findMoves(parseInt(selPieceId[0]), parseInt(selPieceId[1]))
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).setAttribute('moves-highlight', '')
                })
            }
            else if (this.el.components.raycaster.intersectedEls[0].getAttribute('id') === 'rook-three'){
                    
                this.selectedPiece3 = this.el.components.raycaster.intersectedEls[0]

                // sound entity 
                const selectSound = document.querySelector('*[sound="src: #select"]')

                // play select sound 
                selectSound.components.sound.playSound()

                let selPieceId = this.selectedPiece3._position

                this.moves2 = this.findMoves(parseInt(selPieceId[0])-3, parseInt(selPieceId[1]))
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0] + 3}${move[1]}`).setAttribute('moves-highlight', '')
                })
                
            }
        }
        else if((this.selectedPiece3 || this.selectedPiece2) && this.el.components.raycaster.intersectedEls[0].hasAttribute('moves-highlight')) {
            
            if ( this.el.components.raycaster.intersectedEls[0].parentNode.parentNode.getAttribute('id') === 'slide-two'){
                this.selectedPiece2.object3D.position.copy( this.el.components.raycaster.intersectedEls[0].object3D.position)
                let targetTile = this.el.components.raycaster.intersectedEls[0].getAttribute('id')
                // sound entity 
                const placeSound = document.querySelector('*[sound="src: #place"]')

                // play place sound 
                placeSound.components.sound.playSound()

                this.slideTwoBoard = [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ]
                this.slideTwoBoard[parseInt(targetTile[0])][parseInt(targetTile[1])] = this.selectedPiece2
                this.selectedPiece2._position = targetTile
                
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight')
                })
                this.selectedPiece2 = null
            }
            else if (this.el.components.raycaster.intersectedEls[0].parentNode.parentNode.getAttribute('id') === 'slide-three'){
                console.log('here')
                this.selectedPiece3.object3D.position.copy( this.el.components.raycaster.intersectedEls[0].object3D.position)
                let targetTile = this.el.components.raycaster.intersectedEls[0].getAttribute('id')
                // sound entity 
                const placeSound = document.querySelector('*[sound="src: #place"]')

                // play place sound 
                placeSound.components.sound.playSound()

                this.slideThreeBoard = [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ]
                this.slideThreeBoard[parseInt(targetTile[0]-3)][parseInt(targetTile[1])] = this.selectedPiece3
                this.selectedPiece3._position = targetTile
                if(parseInt(targetTile[0]) == 5 && parseInt(targetTile[1]) == 1){
                    document.getElementById('pawn-three').object3D.position.copy(document.getElementById('cap-zone').object3D.position)
                    document.getElementById('pawn-three').object3D.position.y += 0.5   
                    document.querySelector('#slide-three > :first-child').setAttribute("value","Nice! Now lets try capturing. \n \n Move your rook so that its over the pawn. \n Keep in mind that you will have to click the square under the target to capture \n \n Good Job!")
                    
                }
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight')
                })
                this.selectedPiece3 = null

            }

        }
        else if((this.selectedPiece2 || this.selectedPiece3) && !this.el.components.raycaster.intersectedEls[0].hasAttribute('moves-highlight')) {
            
            if ( this.el.components.raycaster.intersectedEls[0].getAttribute('id') === 'rook-two'){
                this.selectedPiece2 = null
                this.moves.forEach((move) => {
                    document.getElementById(`${move[0]}${move[1]}`).removeAttribute('moves-highlight')
                })
                // sound entity 
                const deselectSound = document.querySelector('*[sound="src: #deselect"]')

                // play deselect sound 
                deselectSound.components.sound.playSound()
            }
            
            
            if ( this.el.components.raycaster.intersectedEls[0].getAttribute('id') === 'rook-three'){
                this.selectedPiece3 = null
                this.moves2.forEach((move) => {
                    document.getElementById(`${move[0]+3}${move[1]}`).removeAttribute('moves-highlight')
                })
                // sound entity 
                const deselectSound = document.querySelector('*[sound="src: #deselect"]')

                // play deselect sound 
                deselectSound.components.sound.playSound()
            }
        }
    },
    findMoves: function(x, y){
        let returnList = []
        const possibleMoves = ['up', 'down', 'left', 'right']
        
        possibleMoves.forEach((move)=>{
            let continueVar = true
            let newX = x
            let newY = y
            while(continueVar){
                if (move === 'up'){
                    if(newX + 1 < 3){
                        returnList.push([newX+1, newY])
                        newX++
                    }
                    else {
                        continueVar = false
                    }
                }
                else if (move === 'down'){
                    if(newX - 1 > -1){
                        returnList.push([newX-1, newY])
                        newX--
                    }
                    else {
                        continueVar = false
                    }
                }
                else if (move === 'left'){
                    if(newY - 1 > -1){
                        returnList.push([newX, newY -1])
                        newY--
                    }
                    else {
                        continueVar = false
                    }
                }
                else if (move === 'right'){
                    if(newY + 1 < 3){
                        returnList.push([newX, newY + 1])
                        newY++
                    }
                    else {
                        continueVar = false
                    }
                }
            }
        })
        return returnList
    },
    
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