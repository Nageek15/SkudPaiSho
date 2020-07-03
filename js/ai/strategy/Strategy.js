//Strategy Template

/**
*
*
* @param AI this.observer
*/
function Strategy(observer){
	this.observer=observer;
}

Strategy.prototype.calculateScore = function(origGame, copyGame) {
	// Simple move scoring...
	var score = 0;

	// var copyGame = origGame.getCopy();
	// copyGame.runNotationMove(move);

	// Check for win! Win is good!
	if (copyGame.board.winners.includes(this.observer.player) || origGame.board.winners.includes(this.observer.player)) {
		return 9999999;
	}

	var opponent = this.observer.getOpponent();

	// Check number of my harmonies, increase is good.
	var before = this.observer.getNumHarmoniesForPlayer(origGame, this.observer.player);
	var after = this.observer.getNumHarmoniesForPlayer(copyGame, this.observer.player);

	var moreHarmonies = after > before;
	if (after > before) {
		score += 20;
	} else if (after < before) {
		score -= 20;
	}

	// Harmonies that cross the center are better!
	before = this.observer.getNumHamoniesCrossingCenter(origGame, this.observer.player);
	after = this.observer.getNumHamoniesCrossingCenter(copyGame, this.observer.player);

	if (after > before) {
		score += 50;
	} else if (after < before) {
		score -= 20;
	}

	// Check number of opponent harmonies, decrease is good
	before = this.observer.getNumHarmoniesForPlayer(origGame, opponent);
	after = this.observer.getNumHarmoniesForPlayer(copyGame, opponent);

	var opponentLessHarmonies = after < before;
	if (after < before) {
		score += 3;
	} else if (after > before) {
		score -= 7;
	}

	// Check tiles in red/white gardens, increase is good
	before = this.observer.getNumTilesInGardensForPlayer(origGame, this.observer.player);
	after = this.observer.getNumTilesInGardensForPlayer(copyGame, this.observer.player);

	var moreHomeTiles = after > before;
	if (after > before) {
		score += 10;
	} else if (after < before) {
		score -= 10;
	}

	// If opponent has less tiles, that is good
	before = this.observer.getNumTilesOnBoardForPlayer(origGame, opponent);
	after = this.observer.getNumTilesOnBoardForPlayer(copyGame, opponent);

	var opponentLessTiles = after < before;
	if (after < before) {
		score += 8;
	}

	// Tiles on left/right/top/bottom of center
	// "Surroundness" - we want to maintain it
	// before = this.observer.getSurroundness(origGame, this.observer.player);
	var surroundness = this.observer.getSurroundness(copyGame, this.observer.player);
	before = this.observer.getSurroundness(origGame, this.observer.player);

	var maxSurroundness = surroundness > 3;
	if (surroundness > before) {
		score += surroundness;
	}

	// Harmony ring length is good if we do it right
	if (surroundness > 3) {
		before = this.observer.getLongestHarmonyRingLength(origGame, this.observer.player);
		if (before < 5) {
			after = this.observer.getLongestHarmonyRingLength(copyGame, this.observer.player);

			if (after > before) {
				score += 5;
			} else if (after < before) {
				score -= 2;
			}
		} else {
			score += 5;
		}
	}

	// Plant tile that can harmonize with tile on board? Good
	// TODO
	before = this.observer.getNumTilesOnBoardForPlayer(origGame, this.observer.player);
	after = this.observer.getNumTilesOnBoardForPlayer(copyGame, this.observer.player);

	if (after > before) {
		score += 5;
	}

	// return score / ((this.observer.scoreDepth - depth) + 1);
	return score;
};

Strategy.prototype.ensurePlant = function(move, game, player,boardTiles,gateTiles) {
	if (move.moveType !== ARRANGING) {
		return;
	}

	if (move.bonusTileCode) {
		return;
	}

	var moves = [];
	this.observer.addPlantMoves(moves, game, player);

	var randomIndex = Math.floor(Math.random() * moves.length);
	var randomMove = moves.splice(randomIndex, 1)[0];

	if (!randomMove) {
		return;
	}

	move.bonusTileCode = randomMove.plantedFlowerType;

	game.revealOpenGates(player, null, 5, true);
	var endPoints = this.observer.getPossibleMovePoints(game);

	randomIndex = Math.floor(Math.random() * endPoints.length);
	var randomEndPoint = endPoints.splice(randomIndex, 1)[0];

	move.bonusEndPoint = "(" + this.observer.getNotation(randomEndPoint) + ")";
	move.fullMoveText += "+" + move.bonusTileCode + move.bonusEndPoint;
};

Strategy.prototype.getBestMove = function(game, moveNum,moves){
	var randomIndex = Math.floor(Math.random() * moves.length);
	var bestMove=moves.splice(randomIndex, 1)[0];
	var highestScore=0;
	var boardTiles = this.observer.getBoardTiles(game,this.observer.player);
	var gateTiles = this.observer.getGateTiles(game,this.observer.player);
	//var goodScores = new Map();
	for (var moveNum = 0; moveNum < moves.length; moveNum++) {
		var move = moves[moveNum];
		if (move.moveType===PLANTING){
			var score = this.observer.calculatePlantScore(move, game, player,boardTiles,gateTiles);
			if (score > 9999) {
				return move;
			}
			//may shake it up in the future with randomness. Also may create a chance for moves with a score equal to the highest score to become the best move
			if (score>highestScore) {
				bestMove = move;
				bestScore = score;
			}
		} else {
			var scores = this.observer.getMoveScore(game, move, this.observer.scoreDepth);
			if (scores.get(this.observer.scoreDepth) > 9999) {
				return move;
			}
			//may shake it up in the future with randomness. Also may create a chance for moves with a score equal to the highest score to become the best move
			if (scores.getMoveScore>highestScore) {
				bestMove = move;
				bestScore = scores.getMoveScore;
			}
		}
	}
};

Strategy.prototype.calculatePlantScore = function(move,game,player,boardTiles,gateTiles){
	if (move.moveType!==PLANTING){
		return 0;
	}
	if (boardTiles.length>1){
		var factor=6;
		var tileCodes=this.observer.getTileCodesInPlay(game,player);
		if (tileCodes.length===2){
			if (this.observer.tilesHarmonizable(tileCodes[0],tileCodes[1],player) && boardTiles.length < 4){
				
				factor+=4;
			}
		} else if (tileCodes.length===1){
			if (this.observer.tilesHarmonizable(tileCodes[0],move.plantedFlowerType,player)){
				factor+=6;
				debug("Harmonizable tile found");
			}
		}
		if (boardTiles.length>6){
			factor-=3
		}
		factor-=gateTiles.length*2;
		return this.observer.getHarmonizableTilesOnField(move.plantedFlowerType,game,player).length*factor;
	} else if (boardTiles.length==1){
		var tileCodes=this.observer.getTileCodesInPlay(game,player);
		//we want 2 tiles on the board that harmonize
		if (this.observer.tilesHarmonizable(tileCodes[0],move.plantedFlowerType,player)){
			return 100;
		} else {
			return 0;
		};
	} else {
		//no tiles are on the field so... for one thing planting type moves are the only type possible and we don't need to bother with getting the number of harmonizable tiles on the field because there aren't any.
		//all planting moves in this.observer state have equal point values (well, unless it's trying to use the wheel of harmony strategy but we're not quite there yet)
		return 1;
	}
};