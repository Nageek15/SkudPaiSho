// SkudAIv2 extends AI

function SkudAIv2() {
	AI.call(this,new KStrategy(this)); // < - super constructor
}

SkudAIv2.prototype = Object.create(AI.prototype); // < - links prototypes

SkudAIv2.prototype.getName = function() {
	return "Keegan's Skud AI";
};

SkudAIv2.prototype.getMessage = function() {
	var stance=this.strategy.stance;
	var stanceString="unknown";
	if (stance===0){
		stanceString="defensive"
	} else if (stance===1){
		stanceString="neutral"
	} else if (stance===2){
		stanceString="offensive"
	}
	return "Keegan's Experimental AI. Her stance is " + stanceString + ".<br>";
};

SkudAIv2.prototype.rset = function(){
	this.strategy=new KStrategy(this);
}

SkudAIv2.prototype.setPlayer = function(playerName) {
	this.player = playerName;
};

/* parameters will be copies of the real thing, so you can't mess up the real game. */
SkudAIv2.prototype.getMove = function(game, moveNum) {
	this.moveNum = moveNum;

	var moves = this.getPossibleMoves(game, this.player);

	// Process moves to get the best one...
	// What makes a good move? Should I go through all moves and "score" them somehow? 
	//Yeah! I think that sounds like a good idea for this hard coded version.

	var randomIndex = Math.floor(Math.random() * moves.length);
	var bestMove=moves.splice(randomIndex, 1)[0];
	var highestScore=0;
	var boardTiles = this.getBoardTiles(game,this.player);
	var gateTiles = this.getGateTiles(game,this.player);
	//var goodScores = new Map();
	for (var moveNum = 0; moveNum < moves.length; moveNum++) {
		var move = moves[moveNum];
		if (move.moveType===PLANTING){
			var score = this.calculatePlantScore(move, game, this.player,boardTiles,gateTiles);
			if (score > 9999) {
				return move;
			}
			//may shake it up in the future with randomness. Also may create a chance for moves with a score equal to the highest score to become the best move
			if (score>highestScore) {
				bestMove = move;
				bestScore = score;
			}
		} else {
			var scores = this.getMoveScore(game, move, this.scoreDepth);
			if (scores.get(this.scoreDepth) > 9999) {
				return move;
			}
			//may shake it up in the future with randomness. Also may create a chance for moves with a score equal to the highest score to become the best move
			if (scores.getMoveScore>highestScore) {
				bestMove = move;
				bestScore = scores.getMoveScore;
			}
		}
	}

	/*if (goodMove) {
		// debug("Score: " + goodScore);
		
		return goodMove;
	}*/

	

	//return randomMove;
	
	this.ensurePlant(bestMove, game, this.player,boardTiles,gateTiles);
	return bestMove;
};








