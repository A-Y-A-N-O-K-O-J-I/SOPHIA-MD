class TicTacToe {
    constructor(playerX = 'X', playerO = 'O') {
        this.playerX = playerX;
        this.playerO = playerO;
        this._currentTurn = false; // false for playerX, true for playerO
        this._x = 0; // Player X's moves in binary
        this._o = 0; // Player O's moves in binary
        this.turns = 0; // Count of turns taken
    }

    // Bitwise representation of the current board state
    get board() {
        return this._x | this._o;
    }

    // Get the current player's symbol
    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX;
    }

    // Get the opponent's symbol
    get enemyTurn() {
        return this._currentTurn ? this.playerX : this.playerO;
    }

    // Check for a win condition in the current state
    static check(state) {
        for (let combo of [7, 56, 73, 84, 146, 273, 292, 448]) // Winning combinations
            if ((state & combo) === combo) return true; // Return true if there's a win
        return false; // No win condition met
    }

    // Convert x and y positions to a binary representation for the board
    static toBinary(x = 0, y = 0) {
        if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error('invalid position');
        return 1 << x + (3 * y); // Calculate the position as a binary number
    }

    /**
     * Handle a player's turn.
     * 
     * @param {number} player - 0 for X, 1 for O
     * @param {number} x - x coordinate (0-2) or the index (0-8)
     * @param {number} [y] - y coordinate (0-2), if using x,y format
     * 
     * @returns {-3|-2|-1|0|1} - Result of the turn
     */
    turn(player = 0, x = 0, y) {
        if (this.board === 511) return -3; // Game over, board full
        let pos = 0;

        // Check if position is given in (x,y) or single index
        if (y == null) {
            if (x < 0 || x > 8) return -1; // Invalid position
            pos = 1 << x; // Set position in the binary representation
        } else {
            if (x < 0 || x > 2 || y < 0 || y > 2) return -1; // Invalid position
            pos = TicTacToe.toBinary(x, y); // Calculate binary for (x,y)
        }

        // Check if it's the player's turn
        if (this._currentTurn ^ player) return -2; // Not the player's turn
        if (this.board & pos) return 0; // Position already occupied

        // Update the board for the current player
        this[this._currentTurn ? '_o' : '_x'] |= pos;
        this._currentTurn = !this._currentTurn; // Switch turns
        this.turns++;
        return 1; // Success
    }

    // Render the current state of the board
    static render(boardX = 0, boardO = 0) {
        let x = parseInt(boardX.toString(2), 4); // Convert X's moves to binary
        let y = parseInt(boardO.toString(2), 4) * 2; // Convert O's moves to binary
        return [...(x + y).toString(4).padStart(9, '0')] // Render as a 9-character string
            .reverse()
            .map((value, index) => (value == 1 ? 'X' : value == 2 ? 'O' : index + 1)); // Map values to board symbols
    }

    // Instance method to render the board
    render() {
        return TicTacToe.render(this._x, this._o);
    }

    // Check for the winner
    get winner() {
        const xWin = TicTacToe.check(this._x);
        const oWin = TicTacToe.check(this._o);
        return xWin ? this.playerX : oWin ? this.playerO : false; // Return the winner or false if none
    }
}

// Export the TicTacToe class for use in other modules
module.exports = TicTacToe;
