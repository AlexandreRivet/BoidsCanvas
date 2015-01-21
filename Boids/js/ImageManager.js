var IMAGES = new Array();

// Fonction qui charge une image
loadImage = function(filename)
{
	if (imageAlreadyLoaded(filename))
		return;
	
	var image = new Image();
	image.isLoaded = false;
	image.filename = filename;
	image.crossOrigin = "Anonymous";
	image.onload = function()
	{
		image.isLoaded = true;
	}
	image.src = filename;
	IMAGES.push(image);
}

// Fonction qui check l'existence d'une image
imageAlreadyLoaded = function(filename)
{
	for (var i = 0; i < IMAGES.length; i++)
		if (IMAGES[i].filename == filename)
			return true;
	return false;
}

// Fonction qui récupère une image
getImage = function(filename)
{
	for (var i = 0; i < IMAGES.length; i++)
		if (IMAGES[i].filename == filename)
			return IMAGES[i];
	return null;
}

// Fonction qui permet de multiplier un canvas par une couleur
multiplyCanvas = function(canvas, color)
{
	var ctx = canvas.getContext("2d");
	var datas = ctx.getImageData(0, 0, canvas.width, canvas.height);		// Récupération des données de pixels
	var c = datas.data;
	for (var i = 0; i < c.length; i+=4)
	{
		c[i] *= color.r;
		c[i+1] *= color.g;
		c[i+2] *= color.b;
	}
	ctx.putImageData(datas, 0, 0);											// Affecation des données de pixels
}