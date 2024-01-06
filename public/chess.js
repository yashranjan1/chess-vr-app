// Pieces and their default positions
var whitePawn = {color:'white', type: 'Pawn',defaultPositions:['A2','B2','C2','D2','E2','F2','G2','H2']}
var whiteRook = {color:'white', type: 'Rook',defaultPositions:['A1','H1']}
var whiteKnight = {color:'white', type: 'Knight',defaultPositions:['B1','G1']}
var whiteBishop = {color:'white', type: 'Bishop',defaultPositions:['C1','F1']}
var whiteKing = {color:'white', type: 'King',defaultPositions:['E1']}
var whiteQueen = {color:'white', type: 'Queen',defaultPositions:['D1']}
var blackPawn = {color:'black', type: 'Pawn',defaultPositions:['A7','B7','C7','D7','E7','F7','G7','H7']}
var blackRook = {color:'black', type: 'Rook',defaultPositions:['A8','H8']}
var blackKnight = {color:'black', type: 'Knight',defaultPositions:['B8','G8']}
var blackBishop = {color:'black', type: 'Bishop',defaultPositions:['C8','F8']}
var blackKing = {color:'black', type: 'King',defaultPositions:['E8']}
var blackQueen = {color:'black', type: 'Queen',defaultPositions:['D8']}

export var pieces = [whitePawn, whiteRook, whiteKnight, whiteBishop, whiteKing, whiteQueen, blackPawn, blackRook, blackKnight, blackBishop, blackKing, blackQueen]


export var chessBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
]

window.j = chessBoard



// function to find the legal moves in for a piece
export function findLegalMoves(x, y, board){
    var color
    // set color
    if (board[x][y].classList.contains('black')) color = 'black'
    else color = 'white'
   
    // set type 
    if (board[x][y].classList.contains('Pawn')) return findLegalMovesPawn(color, x, y, board)
    if (board[x][y].classList.contains('Rook')) return findLegalMovesRook(color, x, y, board)
    if (board[x][y].classList.contains('Bishop')) return findLegalMovesBishop(color, x, y, board)
    if (board[x][y].classList.contains('Queen')) return findLegalMovesQueen(color, x, y, board)
    if (board[x][y].classList.contains('Knight')) return findLegalMovesKnight(color, x, y, board)
    if (board[x][y].classList.contains('King')) return findLegalMovesKing(color, x, y, board)
}

// function to find the legal moves for a pawn
function findLegalMovesPawn(color, x, y, board){
    let returnList = []
    let enpassantLeft = true
    let enpassantRight = true
    if(color == 'white'){
        if(x == 1 && board[x+2][y] == 0 && board[x+1][y] == 0) {
            returnList.push([x+2, y])
        }
        if(x < 7 && board[x+1][y] == 0){
            returnList.push([x+1, y])
        }
        if(y < 7 && board[x+1][y+1] != 0 && board[x+1][y+1].classList.contains('black')){
            returnList.push([x+1, y+1])
            enpassantLeft = false
        }
        if(y > 0 && board[x+1][y-1] != 0 && board[x+1][y-1].classList.contains('black')){
            returnList.push([x+1, y-1])
            enpassantRight = false
        }
        if(y > 0 && board[x][y-1] != 0 && board[x][y-1].matches('.Pawn.en-passantable') && enpassantRight) returnList.push([x+1, y-1, 'enpassant'])
        if(y < 7 && board[x][y+1] != 0 && board[x][y+1].matches('.Pawn.en-passantable') && enpassantLeft) returnList.push([x+1, y+1, 'enpassant'])
    }
    else{
        if(x == 6 && board[x-2][y] == 0 && board[x-1][y] == 0) {
            returnList.push([x-2, y])
        }
        if(x > 0 && board[x-1][y] == 0){
            returnList.push([x-1, y])
        }
        if(y < 7 && board[x-1][y+1] != 0 && board[x-1][y+1].classList.contains('white')){
            returnList.push([x-1, y+1])
            enpassantLeft = false
        }
        if(y > 0 && board[x-1][y-1] != 0 && board[x-1][y-1].classList.contains('white')){
            returnList.push([x-1, y-1])
            enpassantRight = false
        }
        if(y > 0 && board[x][y-1] != 0 && board[x][y-1].matches('.Pawn.en-passantable') && enpassantRight) returnList.push([x-1, y-1, 'enpassant'])
        if(y < 7 && board[x][y+1] != 0 && board[x][y+1].matches('.Pawn.en-passantable') && enpassantLeft) returnList.push([x-1, y+1, 'enpassant'])
    }
    return returnList
}

export function doesMoveCauseCheck(color, current_x, current_y, move_x, move_y){
    let target
    const simulatedBoard = j.map(subArr => Array.from(subArr))
    simulatedBoard[move_x][move_y] = simulatedBoard[current_x][current_y]
    simulatedBoard[current_x][current_y] = 0
    if (color === 'white') target = 'black'
    else if (color === 'black') target = 'white'
    let king
    let king_x = 0
    let king_y = 0
    for (var row of simulatedBoard){
        king_y = 0
        for (var piece of row){
            if (piece != 0 && piece.matches(`.${color}.King`)) {
                king = piece
                break;
            }
            king_y++
        }
        if (king) break
        king_x++
    }
    if (isPositionMarkedBy(target, king_x, king_y, simulatedBoard)) return true
    else return false
}

function findLegalMovesRook(color, x, y, board){
    let returnList = []
    let directions = ['up', 'down', 'left', 'right']
    directions.forEach((direction) => {
        let xAdd = 0
        let yAdd = 0
        let continueCondition = true
        switch (direction){
            case 'up':
                xAdd = 1
                break;
            case 'down':
                xAdd = -1
                break;
            case 'left':
                yAdd = 1
                break;
            case 'right':
                yAdd = -1
                break;
        }
        let currentx = x
        let currenty = y
        while(continueCondition){
            currentx += xAdd
            currenty += yAdd


            var inBounds = (currentx <= 7) && (currentx >= 0) && (currenty <= 7) && (currenty >= 0)
            if (inBounds && board[currentx][currenty] == 0) returnList.push([currentx, currenty])
            else if(inBounds && board[currentx][currenty].classList.contains(color)) continueCondition = false
            else if(inBounds && !board[currentx][currenty].classList.contains(color)) {
                returnList.push([currentx, currenty])
                continueCondition = false
            }
            else if(!inBounds)continueCondition = false
        }
    })
    return returnList
}

function findLegalMovesBishop(color, x, y, board){
    let returnList = []
    let directions = ['upleft', 'downright', 'downleft', 'upright']
    directions.forEach((direction) => {
        let xAdd = 0
        let yAdd = 0
        let continueCondition = true
        switch (direction){
            case 'upleft':
                xAdd = -1
                yAdd = 1
                break;
            case 'downright':
                xAdd = 1
                yAdd = -1
                break;
            case 'downleft':
                xAdd = -1
                yAdd = -1
                break;
            case 'upright':
                xAdd = 1
                yAdd = 1
                break;
        }
        let currentx = x
        let currenty = y
        while(continueCondition){
            currentx += xAdd
            currenty += yAdd

            var inBounds = (currentx <= 7) && (currentx >= 0) && (currenty <= 7) && (currenty >= 0)
            if (inBounds && board[currentx][currenty] == 0) returnList.push([currentx, currenty])
            else if(inBounds && board[currentx][currenty].classList.contains(color)) continueCondition = false
            else if(inBounds && !board[currentx][currenty].classList.contains(color)) {
                returnList.push([currentx, currenty])
                continueCondition = false
            }
            else if(!inBounds)continueCondition = false
        }
    })
    return returnList
}

function findLegalMovesQueen(color, x, y, board){
    return findLegalMovesBishop(color, x, y, board).concat(findLegalMovesRook(color, x, y, board))
}

function findLegalMovesKnight(color, x, y, board){
    let returnList = []
    let possibleMoves = [
        [x+1, y+2], [x+2, y+1],
        [x+2, y-1], [x+1, y-2],
        [x-1, y-2], [x-2, y-1],
        [x-2, y+1], [x-1, y+2]
    ]
    possibleMoves.forEach((move) => {
        let inBounds = (move[0] <= 7) && (move[1] <= 7) && (move[0] >= 0) && (move[1] >= 0)
        if (inBounds){
            if (board[move[0]][move[1]] == 0 || !board[move[0]][move[1]].classList.contains(color)) returnList.push(move)
        }
    })
    return returnList
}

function findLegalMovesKing(color, x, y, board){
    let returnList = []
    let possibleMoves = [
        [x+1, y], [x-1, y],
        [x, y+1], [x, y-1],
        [x+1, y+1], [x+1, y-1],
        [x-1, y+1], [x-1, y-1]
    ]
    possibleMoves.forEach((move) => {
        let inBounds = (move[0] <= 7) && (move[1] <= 7) && (move[0] >= 0) && (move[1] >= 0)
        if (inBounds){
            if (board[move[0]][move[1]] == 0 || !board[move[0]][move[1]].classList.contains(color)) returnList.push(move)
        }
    })
    let targetColor = color === 'white' ? 'black' : 'white'
    const movedCastlingConditionLeft = !board[x][y].classList.contains('moved') && board[x][0] != 0 && !board[x][0].classList.contains('moved') 
    const movedCastlingConditionRight = !board[x][y].classList.contains('moved') &&  board[x][7] != 0 && !board[x][7].classList.contains('moved') 
    if (movedCastlingConditionLeft && board[x][1] == 0 && board[x][2] == 0 && board[x][3] == 0) returnList.push([x, y-2, 'castle'])
    if (movedCastlingConditionRight && board[x][5] == 0 && board[x][6] == 0) returnList.push([x, y+2, 'castle'])
    return returnList
}

// first check if there is a pawn that can attack that spot, then check if other pieces can attack that spot
export function isPositionMarkedBy(color, x, y, board){
    for (var row of board){
        for (var piece of row){
            if(piece != 0 && piece.classList.contains(color)){

                var currentPos = piece._position
                var piece_x, piece_y
                [piece_x, piece_y] = positionToIndex(currentPos)
                // is it Pawn of the correct color
                const condition1 = piece.matches(`.${color}.Pawn`) 
                // does it target the x, y position for white 
                const condition2 = (piece_x + 1 == x && piece_y + 1 == y)
                const condition3 = (piece_x + 1 == x && piece_y - 1 == y)
                const condition4 = color === 'white'

                // does it target the x, y position for black
                const condition5 = (piece_x - 1 == x && piece_y + 1 == y)
                const condition6 = (piece_x - 1 == x && piece_y - 1 == y)
                const condition7 = color === 'black'

                // logic that checks for a mark
                if (condition1 && condition4 && (condition2 || condition3)) return true
                else if (condition1 && condition7 && (condition5 || condition6)) return true
                else if (!condition1 && isPositionInPotentialMoves(findLegalMoves(piece_x, piece_y, board), [x, y])) return true
            }   
        }
    }
    return false
}

function isPositionInPotentialMoves(moves, position){
    var movesStringified = JSON.stringify(position);
  
    var isInPotentialMoves = moves.some(function(el){
      return JSON.stringify(el) === movesStringified;
    });
    return isInPotentialMoves;
}

export function positionToIndex(position){
    let positionLookup = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7 }
    var x = position[1] - 1
    var y = positionLookup[position[0]]
    return [x, y]
}

export function isColorCheckMated(color){
    for (var row of chessBoard){
        for (var piece of row){
            if (piece != 0 && piece.classList.contains(color)){
                
                var currentPos = piece._position
                var x, y
                [x, y] = positionToIndex(currentPos)
                var moves = findLegalMoves(x,y, chessBoard)
                for (var move of moves){
                    if(!doesMoveCauseCheck(color, x, y, move[0], move[1])) return false
                }
            }
        }
    }
    return true
}


export function isStaleMate(color){
    // Select all pieces of a certain color
    var pieces = document.querySelectorAll(`.${color}`)

    // iterate over them
    for (var piece of pieces){
        // find the position of a piece in terms of the alphanumeric name, for example "A1"
        var currentPos = piece._position
        var x, y
        // convert it to a numerical index
        [x, y] = positionToIndex(currentPos)

        // find the legal moves of the color some of these moves might cause a check on 
        // the allied king so remember to filter the moves
        var currentLegalMoves = findLegalMoves(x,y, chessBoard)
        // iterate over the legal moves
        for (var move of currentLegalMoves){
            // if the move does not cause the allied king to be checked
            // it is legal and hence there is no stalemate
            if(!doesMoveCauseCheck(color, x, y, move[0], move[1])) return false
        }
    }
    // if there are no legal moves left and its not a checkmate it must be a 
    // stalemate
    return true
}
