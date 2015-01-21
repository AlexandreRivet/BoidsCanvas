$(document).ready(function()
{
	// Survol de la souris sur un helper
	$(".helper").mouseover(function(e)
	{
		var helper_id = e.target.id;
		var position = $("#" + helper_id).position();
		var id = helper_id + "_img";
		$("#" + id).css("top", position.top - (145 / 2));
		$("#" + id).css("left", position.left - 225);
		$("#" + id).show();		
	});
	// Quitte la zone du helper
	$(".helper").mouseleave(function(e)
	{
		var id = e.target.id + "_img";
		$("#" + id).hide();
	});
});