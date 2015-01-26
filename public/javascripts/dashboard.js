function bindElement(elementName, $element) {
	$element.text("N/A");

	$(document).on('data:'+elementName, function(event, dataValue) {
		$element.text(dataValue);
	});
}

function findBindElements() {
	$('*[data-field]').each(function(i,element) {
		bindElement($(element).attr("data-field"), $(element));
	});
}

$(document).ready(function() {
	findBindElements();
});
