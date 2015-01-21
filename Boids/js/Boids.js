// Classe BoidsController
var BoidsController = function(canvas)
{
	this.mCanvas = canvas[0];
	this.mContext = this.mCanvas.getContext("2d");
	
	this.mOptions = 
	{
		Alignment: 2,
		Cohesion: 1,
		Separation: 5,
		SeparationDistance: 20,
		MinSpeed: 1,
		MaxSpeed: 5,
		NumBoids: 50,
	};
	
	this.mBoids = new Array();
	this.mObstacles = new Array();
	
	this.mTarget = {"x" : this.mCanvas.width / 2, "y": this.mCanvas.height / 2};
	this.mMousePosition = {"x" : this.mCanvas.width / 2, "y": this.mCanvas.height / 2};
	
	this.mExecutionTime = 0;
	this.mTimeProcessing = 1;
	this.mTimerInterval = 33.3;
	this.mTimer = 0.0;
	this.mIsPlaying = false;
	this.mIsClicking = false;
	
	this.mDetectionMode = 0;
	this.mDebugMode = 0;
	
	// Initialisation des valeurs du dom par défaut
	this.init();
};

// Initialisation du module
BoidsController.prototype.init = function()
{
	// Initialisation des boids
	var numberBoids = this.mOptions.NumBoids;
	var nbModels = ModelBoids.length;
	var nbColors = Colors.length;
	var image = null, color = null;
	for(var i = 0; i < numberBoids; i++)
	{
		image = ModelBoids[Math.floor(Math.random() * nbModels)];
		color = Colors[Math.floor(Math.random() * nbColors)];
		this.mBoids.push(new Boid(
			Math.random() * this.mCanvas.width,
			Math.random() * this.mCanvas.height,
			Math.random() * Math.PI * 2,
			Math.random(this.mOptions.MaxSpeed - this.mOptions.MinSpeed) + this.mOptions.MinSpeed,
			image,
			color
		));
	}		
	
	// Création de toutes les interactions aussi bien de la souris que des sliders
	var context = this;
	this.mCanvas.addEventListener('mousemove', function(e)
	{
		var offsetX = e.offsetX;
		var offsetY = e.offsetY;
		if (!offsetX || !offsetY) 
		{
			offsetX = e.layerX - $(e.target).position().left;
			offsetY = e.layerY - $(e.target).position().top;
		}
		if(context.mIsClicking)
			context.setTarget(offsetX, offsetY);
		context.setMousePosition(offsetX, offsetY);
	});
	
	this.mCanvas.addEventListener('mousedown', function(e)
	{
		if (e.button == 0)
			context.mIsClicking = true;
		else if (e.button == 2)
			context.createObstacle(e);
	});
	
	this.mCanvas.addEventListener('mouseup', function(e)
	{
		if (e.button == 0)
			context.mIsClicking = false;
	});
	
	$("#Cohesion").slider({
		min: 0,
		max: 20, 
		value: 1,
		slide: function(event, ui) { context.updateOptions("Cohesion", ui.value); }
	});
	
	$("#Alignment").slider({
		min: 0,
		max: 5, 
		value: 2,
		slide: function(event, ui) { context.updateOptions("Alignment", ui.value); }
	});
	
	$("#Separation").slider({
		min: 0,
		max: 5, 
		value: 4,
		slide: function(event, ui) { context.updateOptions("Separation", ui.value); }
	});
	
	$("#SeparationDistance").slider({
		min: 0,
		max: 100, 
		value: 25,
		slide: function(event, ui) { context.updateOptions("SeparationDistance", ui.value); }
	});
	
	$("#NumBoids").slider({
		min: 10,
		max: 200, 
		value: 50,
		slide: function(event, ui) { context.updateOptions("NumBoids", ui.value); }
	});
	
	$("#TypeOfDetection input").change(function()
	{
		context.mDetectionMode = $('input[name=radio_dectection]:checked', "#TypeOfDetection").val();
	});
	
	$("#Debug input").change(function()
	{
		context.mDebugMode = $('input[name=radio_debug]:checked', "#Debug").val();
	});
	
	$("#checkbox_debug").change(function()
	{
		context.mDebugMode = $(this).prop('checked');
	});
};

BoidsController.prototype.createObstacle = function(e)
{
	var offsetX = e.offsetX;
	var offsetY = e.offsetY;
	if (!offsetX || !offsetY) 
	{
		offsetX = e.layerX - $(e.target).position().left;
		offsetY = e.layerY - $(e.target).position().top;
	}
	
	var obstacle = null;
	for (var i in this.mObstacles)
	{
		obstacle = this.mObstacles[i];
		if(circleIntersect(obstacle, {"x": offsetX, "y": offsetY}) )
		{
			this.mObstacles.splice(i, 1);
			return;
		}
	}
	
	if (this.mObstacles.length == 5)
		return;
	
	this.mObstacles.push({"x": offsetX, "y": offsetY, "radius": Math.floor(Math.random() * (30 - 20) + 20), "count": 0});
};

// Préparation de la frame à dessiner
BoidsController.prototype.prepareFrame = function()
{
	var start = new Date().getTime();
	this.updateClock();
	this.animateFrame();
	this.calc();
	this.updateFromObstacles();
	var end = new Date().getTime();
	this.mTimeProcessing = (end - start);
	$("#TimeProcessingValue").html(this.mTimeProcessing + "ms");
	this.mExecutionTime += this.mTimerInterval;
};

BoidsController.prototype.updateClock = function()
{
	$("#TimeExecutionValue").html(displayTime(this.mExecutionTime));
};

// Dessin à l'écran
BoidsController.prototype.animateFrame = function()
{
	var ctx = this.mContext;
	
	ctx.clearRect(0, 0, this.mCanvas.width, this.mCanvas.height);
	
	// Draw obstacles
	var obstacle = 0, size = 0;
	
	var alpha = (this.mDetectionMode == 0) ? 0.1 : 1;
	for (var i in this.mObstacles)
	{
		obstacle = this.mObstacles[i];
		ctx.beginPath();
		ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'rgba(0, 0, 255, ' + alpha + ')';
		ctx.fill();	
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'rgba(0, 0, 100, ' + alpha + ')';
		ctx.stroke();
		
		ctx.fillStyle = 'rgba(0, 0, 0, ' + alpha + ')';
		size = ctx.measureText(obstacle.count);
		ctx.fillText(obstacle.count, obstacle.x - (size.width / 2), obstacle.y + 5);
	}
	
	// Draw boids
	for (var i in this.mBoids)
	{
		if (i == 0)
			this.mBoids[i].draw(ctx, this.mDebugMode, this.mOptions.SeparationDistance);
		else
			this.mBoids[i].draw(ctx, this.mDebugMode);	
	}
	
	// Draw Target
	this.drawTarget();
	
	// Draw information
	if (!this.mDebugMode)
		return;
		
	ctx.fillStyle = 'black';
	ctx.fillText("FPS: " + Math.clamp(0, Math.floor(1000 / this.mTimeProcessing), 60), 2, 10);
};

// Démarre le module
BoidsController.prototype.start = function()
{
	if(this.mIsPlaying)
		return;
	
	this.mIsPlaying = true;	
	var context = this;
	this.mTimer = window.setInterval( function() { context.prepareFrame(); }, context.mTimerInterval);	
};

// Stoppe le module
BoidsController.prototype.stop = function()
{
	if (!this.mIsPlaying)
		return;
	
	this.mIsPlaying = false;
	window.clearInterval(this.mTimer);
};

// Calcule des nouvelles positions et orientations des boids
BoidsController.prototype.calc = function()
{
	var boid = null;
	var average = 0;
	var tx, ty;
	for (var i in this.mBoids)
	{
		boid = this.mBoids[i];
		average = boid.calc(this.mBoids);
		tx = boid.vx;
		ty = boid.vy;
		
		// Separation 
		if (average.closestBoid)
		{
			var dx = average.closestBoid.x - boid.x;
			var dy = average.closestBoid.y - boid.y;
			if (average.closestDistance < this.mOptions.SeparationDistance)
			{
				tx -= dx / average.closestDistance * this.mOptions.Separation;
				ty -= dy / average.closestDistance * this.mOptions.Separation;
			}
		}
		
		// Alignment
		tx += Math.cos(average.angle) * this.mOptions.Alignment;
		tx += Math.sin(average.angle) * this.mOptions.Alignment;
		
		// Cohesion
		if (average.count > 0)
		{
			var dx = average.x - boid.x;
			var dy = average.y - boid.y;
			var distance = Math.sqrt(dx * dx + dy *dy);
			var ndx = dx / distance;
			var ndy = dy / distance;
			tx += ndx * this.mOptions.Cohesion;
			ty += ndy * this.mOptions.Cohesion;
		}
		
		// Rotation gestion
		var dx = this.mTarget.x - boid.x;
		var dy = this.mTarget.y - boid.y;
		var distance = Math.max(Math.sqrt(dx * dx + dy * dy), 50);
		var ndx = dx / distance;
		var ndy = dy / distance;
		tx += ndx * 3;
		ty += ndy * 3;
		
		var angle = Math.atan2(ty, tx);
		var cw = (angle - boid.mAngle + Math.PI * 4) % (Math.PI * 2);
		var acw = (boid.mAngle - angle + Math.PI * 4) % (Math.PI * 2);
		var rotation = Math.abs(cw) < Math.abs(acw) ? cw : -acw;
		rotation *= 0.2;
		rotation = Math.min(Math.max(rotation, -30 * Math.PI / 180), 30 * Math.PI / 180);
		boid.mAngle += rotation;
		
		boid.updateVelocity();
		boid.updatePosition();
	}
};

BoidsController.prototype.updateFromObstacles = function()
{
	var boid, obstacle;
	if(this.mDetectionMode == 1)
	{
		for(var i in this.mBoids)
		{
			boid = this.mBoids[i];
			for(var j in this.mObstacles)
			{
				obstacle = this.mObstacles[j];
				if ( circleIntersect(obstacle, boid) )
				{
					this.mBoids.splice(i, 1);
					this.mObstacles[j].count++;
					i--;
				}
			}
		}
	}
	
	if (this.mDebugMode == 3 || this.mDetectionMode == 2)
	{
		var offset = 8, isFound = false;
		for (var i = 0; i < this.mBoids.length; i++)
		{
			isFound = false;
			offset = 8;
			this.mBoids[i].mHitPoint.x = this.mBoids[i].x + this.mBoids[i].vx * offset;
			this.mBoids[i].mHitPoint.y = this.mBoids[i].y + this.mBoids[i].vy * offset;		
			this.mBoids[i].mHitPoint.obstacleHitted = false;	
			this.mBoids[i].mHitPoint.distanceHitted = 0.0;
			while(this.mBoids[i].mHitPoint.x >= 0 && this.mBoids[i].mHitPoint.x <= this.mCanvas.width &&
				this.mBoids[i].mHitPoint.y >= 0 && this.mBoids[i].mHitPoint.y <= this.mCanvas.height)
			{
				if (this.mDetectionMode == 2)
				{
					for (var j = 0; j < this.mObstacles.length; j++)
					{
						if( circleIntersect(this.mObstacles[j], this.mBoids[i].mHitPoint) )
						{
							this.mBoids[i].mHitPoint.obstacleHitted = true;
							isFound = true;
							break;
						}
					}
				}
				
				if (isFound == true)
					break;
				this.mBoids[i].mHitPoint.x = this.mBoids[i].x + this.mBoids[i].vx * offset;
				this.mBoids[i].mHitPoint.y = this.mBoids[i].y + this.mBoids[i].vy * offset;
				offset++;
			}
			
			this.mBoids[i].mHitPoint.distanceHitted = Math.distance(this.mBoids[i], this.mBoids[i].mHitPoint);
		}
	}
	
	// Calcul du décalage
	if (this.mDetectionMode == 2)
	{
		/*
		for (var i = 0; i < this.mBoids.length; i++)
		{
			
		}
		*/
	}
};

// Définition de la position de la souris
BoidsController.prototype.setMousePosition = function(x, y)
{
	this.mMousePosition.x = x;
	this.mMousePosition.y = y;
};

// Définition du target pour le mouvement des boids
BoidsController.prototype.setTarget = function(x, y)
{
	this.mTarget.x = x;
	this.mTarget.y = y;
};

// Dessine la cible target à l'écran
BoidsController.prototype.drawTarget = function()
{
	var x = this.mMousePosition.x, y = this.mMousePosition.y;
	var ctx = this.mContext;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, 2 * Math.PI, false);
	ctx.strokeStyle = '#ff0000';
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(x, y - 1);
	ctx.lineTo(x, y - 7);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(x, y + 1);
	ctx.lineTo(x, y + 7);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(x - 1, y);
	ctx.lineTo(x - 7, y);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(x + 1, y);
	ctx.lineTo(x + 7, y);
	ctx.stroke();
	
};

// Mise à jour des options en fonction des sliders
BoidsController.prototype.updateOptions = function(option, value)
{
	if (option == "NumBoids")								// Pour le cas des boids, il faut mettre à jour dynamiquement le tableau de boids
	{
		$("#" + option + "Value").html(value);
		this.mOptions.NumBoids = value;
		var numberBoids = this.mOptions.NumBoids;
		var nbModels = ModelBoids.length;
		var nbColors = Colors.length;
		var image = null, color = null;
		while (this.mBoids.length < this.mOptions.NumBoids)
		{
			image = ModelBoids[Math.floor(Math.random() * nbModels)];
			color = Colors[Math.floor(Math.random() * nbColors)];
			this.mBoids.push(new Boid(
				Math.random() * this.mCanvas.width,
				Math.random() * this.mCanvas.height,
				Math.random() * Math.PI * 2,
				Math.random(this.mOptions.MaxSpeed - this.mOptions.MinSpeed) + this.mOptions.MinSpeed,
				image,
				color
			));
		}
		while(this.mBoids.length > this.mOptions.NumBoids)
			this.mBoids.pop();	
	}
	else
	{
		$("#" + option + "Value").html(value);
		this.mOptions[option] = value;
	}
};

// Classe Boid
var Boid = function(x, y, angle, speed, image, color)
{
	this.x = x;
	this.y = y;
	
	this.vx = 0.0;
	this.vy = 0.0;
	this.mLastVx = this.vx;
	this.mLastVy = this.vy;
	
	this.mHitPoint = {"x": this.vx * 8, "y": this.vy * 8, "obstacleHitted": false, "distanceHitted": 0.0};
	
	this.mAngle = angle;
	this.mSpeed = speed;
	
	this.mColor = color;
	this.mImageName = image;
	this.mCanvasColored = null;
	
	loadImage(this.mImageName);
};

// Mise à jour de la position
Boid.prototype.updatePosition = function()
{
	this.x += this.vx * this.mSpeed;
	this.y += this.vy * this.mSpeed;	
}

// Mise à jour de la velocité en fonction de l'angle
Boid.prototype.updateVelocity = function()
{
	this.mLastVx = this.vx;
	this.mLastVy = this.vy;
	this.vx = Math.cos(this.mAngle);
	this.vy = Math.sin(this.mAngle);
}

// Dessin du Boid
Boid.prototype.draw = function(ctx, debug, distanceCircle)
{
	// Dessin du cercle de distance
	if (distanceCircle != undefined && distanceCircle != null)
	{
		ctx.beginPath();
		ctx.arc(this.x, this.y, distanceCircle / 2, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'green';
		ctx.fill();	
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#003300';
		ctx.stroke();
	}
		
	if (this.x < 0 || this.y < 0)
		return;	
	
	// Calcul de l'angle de rotation de l'image
	var A = {"x": this.x, "y": this.y};
	var B = {"x": this.x, "y": this.y - 10};
	var C = {"x": this.x + this.vx * 8, "y": this.y + this.vy * 8};
	var D = {"x": this.x + this.mLastVx * 8, "y": this.y + this.mLastVy * 8};
	var E = {"x": this.mHitPoint.x, "y": this.mHitPoint.y};
	var ABx = B.x - A.x;
	var ABy = B.y - A.y;
	var ACx = C.x - A.x;
	var ACy = C.y - A.y;
	
	var dot = Math.dotProduct(ABx, ABy, ACx, ACy);
	var normAB = Math.sqrt(ABx * ABx + ABy * ABy);
	var normAC = Math.sqrt(ACx * ACx + ACy * ACy);
	var angleInRad = Math.acos(dot / (normAB * normAC));
	if (C.x < A.x)
		angleInRad = 2 * Math.PI - angleInRad;
	var angleInDeg = angleInRad * 180 / Math.PI;

	// Calcul du canvas à dessiner (couleur des pixels)
	var image = getImage(this.mImageName);
	if (image != null && image.isLoaded == true)
	{
		this.mCanvasColored = document.createElement('canvas');
		this.mCanvasColored.width = image.width;
		this.mCanvasColored.height = image.height;
		ctx_tmp = this.mCanvasColored.getContext("2d");
		ctx_tmp.drawImage(image, 0, 0);
	
		multiplyCanvas(this.mCanvasColored, this.mColor);
	}
	
	if (this.mCanvasColored != null && debug != 2)
	{
		ctx.save();
		ctx.translate( this.x, this.y);
		ctx.rotate( angleInRad );
		ctx.drawImage(this.mCanvasColored, -8, -8, 16, 16);
		ctx.restore();
	}
	else if( debug == 2 || (this.mCanvasColored == null) )
	{
		ctx.strokeStyle = "#ff0000";
		ctx.beginPath();
		ctx.moveTo(A.x, A.y);
		ctx.lineTo(C.x, C.y);
		ctx.lineWidth = 2;
		ctx.stroke();
		
		ctx.strokeStyle = "#110000";
		ctx.beginPath();
		ctx.moveTo(A.x, A.y);
		ctx.lineTo(D.x, D.y);
		ctx.lineWidth = 2;
		ctx.stroke();		
		
		ctx.strokeStyle = "#0000ff";
		ctx.beginPath();
		ctx.moveTo(A.x, A.y);
		ctx.lineTo(B.x, B.y);
		ctx.stroke();
		ctx.lineWidth = 2;
	}
	
	if (debug == 3)
	{	
		if (this.mHitPoint.obstacleHitted == true)
		{
			if (this.mHitPoint.distanceHitted < 60)
				ctx.strokeStyle = "#ffffff";
			else
				ctx.strokeStyle = "#ff0000";
		}
		else 
			ctx.strokeStyle = "#00ff00";
		ctx.beginPath();
		ctx.moveTo(A.x, A.y);
		ctx.lineTo(E.x, E.y);
		ctx.lineWidth = 1;
		ctx.stroke();
	}
	else if (debug == 1)
	{
		ctx.fillStyle = 'black';
		ctx.fillText(angleInDeg.toFixed(2) + "°", A.x + 10, A.y);
		ctx.fillText(Math.floor(A.x) + ":" + Math.floor(A.y), A.x + 10, A.y + 10);			
	}
};

// Calcule de la moyenne du boid par rapport aux autres
Boid.prototype.calc = function(boids)
{
	var average = {"x": 0, "y": 0, "vx": 0, "vy": 0, "closestDistance": 99999, "count": 0};
	
	var boid = null;
	for (var i in boids)
	{
		boid = boids[i];
		if (this == boid)
			continue;
		
		var dx = boid.x - this.x;
		var dy = boid.y - this.y;
		var distance = Math.sqrt(dx * dx + dy * dy);
		if (distance < average.closestDistance)
		{
			average.closestDistance = distance;
			average.closestBoid = boid;
		}
		
		var ndx = dx / distance;
		var ndy = dy / distance;

		var cosAngle = Math.dotProduct( Math.cos(this.mAngle), Math.sin(this.mAngle), ndx, ndy );
		if( (dx * dx + dy *dy) <= 2500 && cosAngle >= Math.cos(Math.PI * 270 / 360))
		{
			average.x += boid.x;
			average.y += boid.y;
			average.vx += boid.vx;
			average.vy += boid.vy;
			average.count++;
		}
	}
	
	average.x /= average.count;
	average.y /= average.count;
	average.angle = Math.atan2(average.vy, average.vx);
	return average;	
};

// Fonction générale pour calculer le produit scalaire
Math.dotProduct = function(ax, ay, bx, by)
{
	return ax * bx + ay * by;
}

Math.clamp = function(a, b, c)
{
	return Math.max(a, Math.min(b, c));
}

Math.distance = function(v1, v2)
{
	return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}

displayTime = function(milliseconds)
{
	var second = Math.floor(milliseconds / 1000) % 60;
	var minute = Math.floor(milliseconds / 60000) % 60;
	
	if (minute < 10);
		minute = "0" + minute;
	if (second < 10)
		second = "0" + second;
	
	return minute + ":" + second;
}

circleIntersect = function(circle, mousePosition)
{
	var distancePoint = Math.sqrt((circle.x - mousePosition.x) * (circle.x - mousePosition.x) + (circle.y - mousePosition.y) * (circle.y - mousePosition.y));
	return (distancePoint <= circle.radius);
}


// Tableau de modèle de boids
var ModelBoids = 
[
	"images/plane.png",
];

// Tableau de couleurs
var Colors = 
[
	{"r": 0, "g": 0, "b":255},
	{"r": 0, "g": 255, "b":0},
	{"r": 0, "g": 255, "b":255},
	{"r": 255, "g": 0, "b":0},
	{"r": 255, "g": 0, "b":255},
	{"r": 255, "g": 255, "b":0},
];

