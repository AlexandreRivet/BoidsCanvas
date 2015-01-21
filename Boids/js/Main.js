var BOIDSCONTROLLER = null;
$(document).ready(function()
{
	BOIDSCONTROLLER = new BoidsController($("#canvas"));
	BOIDSCONTROLLER.start();
	
	$("#button_pause").click(function(e)
	{
		BOIDSCONTROLLER.stop();
	});
	$("#button_play").click(function(e)
	{
		BOIDSCONTROLLER.start();
	});	
});