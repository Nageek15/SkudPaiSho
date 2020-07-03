// AI

function AI() {
	this.scoreDepth = 1;	// This can't go higher than 1... Or can it?
	this.greatScoreThreshold = new Map();
	this.greatScoreThreshold.set(2, 9);
	this.greatScoreThreshold.set(1, 18);
	this.greatScoreThreshold.set(0, 16);
	this.strategy=new Strategy(this);
}

function AI(strategy){
	this.scoreDepth = 1;	// This can't go higher than 1... Or can it?
	this.greatScoreThreshold = new Map();
	this.greatScoreThreshold.set(2, 9);
	this.greatScoreThreshold.set(1, 18);
	this.greatScoreThreshold.set(0, 16);
	this.strategy=strategy;
}

AI.prototype.rset = function(){
	this.strategy=new Strategy(this);
}

AI.prototype = Object.create(AI.prototype);

AI.prototype.getName = function() {
	return "Skud Pai Sho automatic opponent";
};

AI.prototype.getMessage = function() {
	return "Playing against the computer can help you learn how the game works. You should be able to beat the computer easily once you understand the game.<br>";
};

AI.prototype.setPlayer = function(playerName) {
	this.player = playerName;
};

/* parameters will be copies of the real thing, so you can't mess up the real game. */
AI.prototype.getMove = function(game, moveNum) {
	this.moveNum = moveNum;

	var moves = this.getPossibleMoves(game, this.player);

	var boardTiles = this.getBoardTiles(game,this.player);
	var gateTiles = this.getGateTiles(game,this.player);
	// Process moves to get the best one...
	// What makes a good move? Should I go through all moves and "score" them somehow?

	var goodMove;
	// var goodScore = 0;
	var goodScores = new Map();
	for (var moveNum = 0; moveNum < moves.length; moveNum++) {
		var move = moves[moveNum];
		// var score = this.getMoveScore(game, move, this.scoreDepth);
		// if (score > 9999 || (score > goodScore && Math.random() > 0.1)) {	// Shake it up
		// //if (score > goodScore) {
		// 	goodScore = score;
		// 	goodMove = move;
		// }
		var scores = this.getMoveScore(game, move, this.scoreDepth);
		if (scores.get(this.scoreDepth) > 9999) {
			return move;
		}
		if (Math.random() > 0.1 && this.scoreIsGood(scores, goodScores, this.scoreDepth)) {
			goodMove = move;
			goodScores = scores;
		}
	}

	if (goodMove) {
		// debug("Score: " + goodScore);
		this.ensurePlant(goodMove, game, this.player,boardTiles,gateTiles);
		return goodMove;
	}

	var randomIndex = Math.floor(Math.random() * moves.length);
	var randomMove = moves.splice(randomIndex, 1)[0];

	return randomMove;
};

AI.prototype.scoreIsGood = function(scores, goodScores, depth) {
	if (depth <= 0) {
		debug("SCORE IS GOOD")
		return true;
	}
	if (scores.get(depth) > goodScores.get(depth) || !goodScores.get(depth)) {
		return this.scoreIsGood(scores, goodScores, depth - 1);
	} else {
		return false;
	}
};

AI.prototype.getMoveScore = function(origGame, move, depth) {
	debug("Depth: " + depth);
	
	var copyGame = origGame.getCopy();
	copyGame.runNotationMove(move);

	// var multiplier = depth * depth;

	// var score = this.calculateScore(origGame, copyGame) * multiplier;
	var score = new Map();
	score.set(depth, this.calculateScore(origGame, copyGame));

	if (score > 99999) {
		return score;
	// } else if (score > this.greatScoreThreshold * multiplier) {
	} else if (score.get(depth) > this.greatScoreThreshold.get(depth)) {
		return this.getHighestScore(origGame, copyGame, score, depth);
	} else {
		return score;
	}
};

AI.prototype.getHighestScore = function(origGame, newGame, highScore, depth) {
	// magic

	if (depth <= 0) {
		return highScore;
	}

	var copyGame = newGame.getCopy();

	// Get all moves, for each move...
	var moves = this.getPossibleMoves(copyGame, this.player);
	for (var i = 0; i < moves.length; i++) {
		// var score = this.getMoveScore(copyGame, moves[i], depth - 1);
		// if (score > highScore) {
		// 	highScore = score;
		// }
		// if (highScore > 999) {
		// 	return highScore;
		// }
		var scores = this.getMoveScore(copyGame, moves[i], depth - 1);
		if (scores.get(depth - 1) > highScore) {
			highScore.set(depth - 1, scores.get(depth - 1));
		}
	}

	// Returns the highest score of all searched moves
	if (highScore[1] > 0) {
		debug("highScore: " + highScore);
	}
	return highScore;
};

AI.prototype.getPossibleMoves = function(thisGame, player) {
	var moves = [];

	if (this.moveNum === 0) {
		this.addAccentSelectionMoves(moves, thisGame, player);
	} else {
		this.addPlantMoves(moves, thisGame, player);
		this.addArrangeMoves(moves, thisGame, player);
	}

	return moves;
};

AI.prototype.addAccentSelectionMoves = function(moves, game) {
	/* Status: Random, working
	*/

	var tilePile = this.getTilePile(game);

	var availableAccents = [];

	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === ACCENT_TILE) {
			availableAccents.push(tilePile[i]);
		}
	}

	// For now, get four random accent tiles
	var chosenAccents = [];

	var length = 4;
	if (simpleCanonRules) {
		length = 2;
	}

	for (var i = 0; i < length; i++) {
		var chosenIndex = Math.floor(Math.random() * availableAccents.length);
		var randomAccentTile = availableAccents.splice(chosenIndex, 1)[0];
		chosenAccents.push(randomAccentTile.code);
	}

	var move = new SkudPaiShoNotationMove("0" + this.player.charAt(0) + "." + chosenAccents.join());
	moves.push(move);
};

AI.prototype.addPlantMoves = function(moves, game, player) {
	if (!this.isOpenGate(game)) {
		return;
	}

	var tilePile = this.getTilePile(game, player);

	// For each tile...
	for (var i = 0; i < tilePile.length; i++) {
		var tile = tilePile[i];
		if (tile.type === BASIC_FLOWER) {
			// For each basic flower
			// Get possible plant points
			var convertedMoveNum = this.moveNum * 2;
			game.revealOpenGates(player, tile, convertedMoveNum, true);
			var endPoints = this.getPossibleMovePoints(game);

			for (var j = 0; j < endPoints.length; j++) {
				notationBuilder = new SkudPaiShoNotationBuilder();
				notationBuilder.moveType = PLANTING;

				notationBuilder.plantedFlowerType = tile.code;
				notationBuilder.status = WAITING_FOR_ENDPOINT;

				var endPoint = endPoints[j];

				notationBuilder.endPoint = new NotationPoint(this.getNotation(endPoint));
				var move = notationBuilder.getNotationMove(this.moveNum, player);

				game.hidePossibleMovePoints(true);

				var isDuplicate = false;
				for (var x = 0; x < moves.length; x++) {
					if (moves[x].equals(move)) {
						isDuplicate = true;
					}
				}

				if (!isDuplicate) {
					moves.push(move);
				}
			}
		}
	}
};

AI.prototype.addArrangeMoves = function(moves, game, player) {
	var startPoints = this.getStartPoints(game, player);

	for (var i = 0; i < startPoints.length; i++) {
		var startPoint = startPoints[i];

		game.revealPossibleMovePoints(startPoint, true);

		var endPoints = this.getPossibleMovePoints(game);

		for (var j = 0; j < endPoints.length; j++) {
			notationBuilder.status = WAITING_FOR_ENDPOINT;
			notationBuilder.moveType = ARRANGING;
			notationBuilder.startPoint = new NotationPoint(this.getNotation(startPoint));

			var endPoint = endPoints[j];

			notationBuilder.endPoint = new NotationPoint(this.getNotation(endPoint));
			var move = notationBuilder.getNotationMove(this.moveNum, player);

			game.hidePossibleMovePoints(true);

			var isDuplicate = false;
			for (var x = 0; x < moves.length; x++) {
				if (moves[x].equals(move)) {
					isDuplicate = true;
				}
			}

			if (!isDuplicate) {
				moves.push(move);
			}
		}
	}
};

AI.prototype.getCurrentPlayerForGame = function(game, notation) {
	if (notation.moves.length <= 1) {
		if (notation.moves.length === 0) {
			return HOST;
		} else {
			return GUEST;
		}
	}
	if (notation.moves.length <= 2) {
		return GUEST;
	}
	var lastPlayer = notation.moves[notation.moves.length - 1].player;

	if (lastPlayer === HOST) {
		return GUEST;
	} else if (lastPlayer === GUEST) {
		return HOST;
	}
};

AI.prototype.getNotation = function(boardPoint) {
	return new RowAndColumn(boardPoint.row, boardPoint.col).notationPointString;
};

AI.prototype.getStartPoints = function(game, player) {
	var points = [];
	for (var row = 0; row < game.board.cells.length; row++) {
		for (var col = 0; col < game.board.cells[row].length; col++) {
			var startPoint = game.board.cells[row][col];
			if (startPoint.hasTile()
				&& startPoint.tile.ownerName === player
				&& startPoint.tile.type !== ACCENT_TILE
				&& !(startPoint.tile.drained || startPoint.tile.trapped)) {
				
				points.push(game.board.cells[row][col]);
			}
		}
	}
	return points;
};

AI.prototype.getPossibleMovePoints = function(game) {
	var points = [];
	for (var row = 0; row < game.board.cells.length; row++) {
		for (var col = 0; col < game.board.cells[row].length; col++) {
			if (game.board.cells[row][col].isType(POSSIBLE_MOVE)) {
				points.push(game.board.cells[row][col]);
			}
		}
	}
	return points;
};

AI.prototype.getBoardTiles = function(game,player) {
	var tiles = [];
	for (var row = 0; row < game.board.cells.length; row++) {
		for (var col = 0; col < game.board.cells[row].length; col++) {
			var startPoint = game.board.cells[row][col];
			if (startPoint.hasTile() && startPoint.tile.ownerName === player) {
				tiles.push(startPoint.tile);
			}
		}
	}
	return tiles;
}

AI.prototype.getBasicFlowerTileCode = function(game) {
	var tilePile = this.getTilePile(game);
	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === BASIC_FLOWER) {
			return tilePile[i].code;
		}
	};
};

AI.prototype.tileContainsTileCode = function(tileCode,tilePile) {
	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].code === tileCode) {
			return true;
		}
	};
	return false;
};


AI.prototype.tileContainsBasicFlower = function(tilePile) {
	for (var i = 0; i < tilePile.length; i++) {
		if (tilePile[i].type === BASIC_FLOWER) {
			return true;
		}
	}
	return false;
};

AI.prototype.getTilePile = function(game, player) {
	var tilePile = game.tileManager.hostTiles;
	if (player === GUEST) {
		tilePile = game.tileManager.guestTiles;
	}
	return tilePile;
};

AI.prototype.isOpenGate = function(game) {
	var cells = game.board.cells;
	for (var row = 0; row < cells.length; row++) {
		for (var col = 0; col < cells[row].length; col++) {
			if (cells[row][col].isOpenGate()) {
				return true;
			}
		}
	}
};

AI.prototype.getOpponent = function() {
	if (this.player === GUEST) {
		return HOST;
	}
	return GUEST;
};

AI.prototype.getNumHarmoniesForPlayer = function(game, player) {
	return game.board.harmonyManager.numHarmoniesForPlayer(player);
};

AI.prototype.getNumTilesInGardensForPlayer = function(game, player) {
	return game.board.numTilesInGardensForPlayer(player);
};

AI.prototype.getNumTilesOnBoardForPlayer = function(game, player) {
	return game.board.numTilesOnBoardForPlayer(player);
};

AI.prototype.getSurroundness = function(game, player) {
	return game.board.getSurroundness(player);
};

AI.prototype.getLongestHarmonyRingLength = function(game, player) {
	return game.board.harmonyManager.ringLengthForPlayer(player);
};

AI.prototype.getNumHamoniesCrossingCenter = function(game, player) {
	return game.board.harmonyManager.getNumCrossingCenterForPlayer(player);
};

AI.prototype.getNumHamoniesCrossingCenterButNotAlong = function(game, player) {
	return game.board.harmonyManager.getNumCrossingCenterButNotAlongForPlayer(player);
};

AI.prototype.ensurePlant = function(move, game, player,boardTiles,gateTiles) {
	this.strategy.ensurePlant(move, game, this.player,boardTiles,gateTiles);
};

AI.prototype.calculateScore = function(origGame, copyGame) {
	this.strategy.calculateScore(origGame,copyGame);
};

AI.prototype.calculatePlantScore = function(move, game, player,boardTiles,gateTiles) {
	this.strategy.calculatePlantScore(move, game, player,boardTiles,gateTiles);
};

AI.prototype.tilesHarmonizable = function(tileCode,otherTileCode,player){
	return new SkudPaiShoTile(tileCode,player).formsHarmonyWith(new SkudPaiShoTile(otherTileCode,player),false);
};

AI.prototype.getGateTiles = function(game,player) {
	var tiles = [];
	for (var row = 0; row < game.board.cells.length; row++) {
		for (var col = 0; col < game.board.cells[row].length; col++) {
			var startPoint = game.board.cells[row][col];
			if (startPoint.hasTile() && startPoint.tile.ownerName === player && startPoint.isType(GATE)) {
				tiles.push(startPoint.tile);
			}
		}
	}
	return tiles;
};

AI.prototype.getHarmonizableTilesOnField = function(tileCode,game,player){
	var boardTiles = this.getBoardTiles(game,player);
	var harmonizableTiles = [];
	for (var i = 0; i < boardTiles.length; i++) {
		if (this.tilesHarmonizable(tileCode,boardTiles[i].code)) {
			harmonizableTiles.push(boardTiles[i]);
		}
	};
	return harmonizableTiles;
};

AI.prototype.getTileCodesInPlay = function(game,player){
	boardTiles = this.getBoardTiles(game,player);
	tileCodes = [];
	for (var i = 0; i<boardTiles.length; i++){
		if (this.tileContainsTileCode(boardTiles[i].code, boardTiles)){
			var duplicate=false;
			for (var j = 0; j<tileCodes.length; j++) {
				if (tileCodes[j]===boardTiles[i].code){
					duplicate=true;
					break;
				}
			}
			if (!duplicate){
				tileCodes.push(boardTiles[i].code);
			}
		}
	}
	return tileCodes;
};
