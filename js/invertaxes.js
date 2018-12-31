// Dependecies: jQuery
"use strict";
console.clear();

(function($) { // Custom jQuery plugins
	$.fn.showInLog = function (text) {
		this.each(function () {
			$(this).html($("#log").html() + '<br />' + text);
		});
		return this;
	}
})(jQuery);

$(document).ready(function(){
	// 'Global' variables
	let autoDelimiter = true; // a boolean
	let delimiter; // a string
	let arrayNotation; // a boolean
	let logMinimized = true; // a boolean

	invertAxes();
	// Keyboard event handlers
	$("#user-input").keyup(invertAxes);
	$("#delimiter_custom").change(invertAxes);
	$("#user-input, #delimiter_custom").keydown(function(event) {
		// Prevent the 'tab' key from tabbing to the next field
		if (event.which == 9 || event.keyCode == 9) { // if 'tab' key was pressed
			// get caret position or selection
			let start = this.selectionStart;
			let end = this.selectionEnd;
			let $this = $(this);
			// set textarea value to: text before caret + tab + text after caret
			$this.val($this.val().substring(0, start)
				+ "\t"
				+ $this.val().substring(end));
			// put the caret back in the correct position
			this.selectionStart = this.selectionEnd = start + 1;
			// prevent the focus lose
			return false;
		}
	});
	// Mouse event handlers
	$("form").mouseup(manualSelectDelimiter)
	$("form").keyup(manualSelectDelimiter);
	$("#user-input, #invert-button, form, #load-button").mouseup(invertAxes);
	$("#copy-button").click(copyToClipboard);
	$("#toggle-log").click(toggleLog);
	$("#save-button").click(save);
	$("#load-button").click(load);

	// Receive data from user
	function autoSelectDelimiter(input) {
		if (autoDelimiter) {
			// Derive the delimiter based on the string entered by user
			let tabs = {
				count: countElements(input.match(/\t/g)), // count instances of \t,
				elementID: 'delimiter_tabs',
				value: '\t'
			}
			let commas = {
				count: countElements(input.match(/,/g)), // count instances of ,
				elementID: 'delimiter_commas',
				value: ','
			}
			let commaSpaces = {
				count: countElements(input.match(/, /g)), // count instances of ,
				elementID: 'delimiter_commaSpaces',
				value: ', '
			}
			// avoid double-counting commaSpaces
			commas.count = commas.count - commaSpaces.count;
			$("#log").showInLog(String(`Found the following potential delimiters:<br />
				<span class='indented'>${tabs.count} tab(s), ${commas.count}
				comma(s), and ${commaSpaces.count} comma(s) followed by spaces.
				</span>`));
			// If any delimiter is ~twice as common as the others, select it
			let totalDelim = tabs.count + commas.count + commaSpaces.count;
			tabs.ratio = tabs.count / totalDelim;
			commas.ratio = commas.count / totalDelim;
			commaSpaces.ratio = commaSpaces.count / totalDelim;
			let commonDel = [tabs, commas, commaSpaces];
			for (let i = 0; i < commonDel.length; i++) {
				if (commonDel[i].ratio >= 0.6) {
					// Show user which delimiter was selected
					highlightFormElement(commonDel[i].elementID, autoDelimiter);
					$("#log").showInLog(String(`<span class='indented'>Selected
						${commonDel[i].elementID.slice(10)} as delimiter.</span>`));
					return commonDel[i].value;
				}
			}
			// If no delimiter met that criterion, notify the user
			$("#ambiguous-delimiter").css("display", "block");
			return false;
		} else {
			// Keep the delimiter which the user manually selected
			// Or, if they didn't select one, show an error
			if (!delimiter)
				$("#empty-custom").css("display", "block");
			return delimiter;
		}
	}
	function copyToClipboard() {
		// Provide feedback to user, by showing the 'copied to clipboard' message
		$("#copied-to-clipboard").toggle(10, function() { // Show the div
			$("#copied-to-clipboard").toggle(4000); // Hide the div
		});
		// Copy the text from the output box, into the user's clipboard
		document.getElementById("user-output").select();
		document.execCommand("copy");
	}
	function invertAxes(log) {
		resetLogsAndErrors(log);
		let inputString = $("#user-input").val();
		if (inputString) {
			inputString = removeSmartQuotes(inputString);
			delimiter = autoSelectDelimiter(inputString);
			if (!autoDelimiter && inputString.indexOf(delimiter) < 0)
				$("#delimiter-never-found").css("display", "block");
			// Convert inputString into an array.
			let inputArray;
			arrayNotation = resemblesAnArray(inputString);
			if (arrayNotation) {
				inputArray = stringToArray(inputString, ',', true);
				$("#log").showInLog("Input data was parsed as an array of rows containing multiiple arrays of columns.");
			} else
				inputArray = stringToArray(inputString, delimiter);
			// Deduce the average row length
			let averageRowLength = 0;
			for (let i = 0; i < inputArray.length; i++)
				averageRowLength += inputArray[i].length;
			averageRowLength = Math.round(averageRowLength / inputArray.length);
			// Verify that all rows have that same length
			inputArray = validateRowLengths(inputArray, averageRowLength);
			// Invert the arrays
			let outputArray = [];
			let outputRow;
			for (let i = 0; i < averageRowLength; i++) {
				outputRow = [];
				for (let j = 0; j < inputArray.length; j++) {
					outputRow.push(inputArray[j][i]);
				}
				outputArray.push(outputRow);
			}
			let outputString = arrayToString(outputArray, delimiter, arrayNotation);
			$("#user-output").val(outputString);
		} else {
			$("#input-is-empty").css("display", "block");
			$("#user-output").val("");
		}
	}
	function load() {
		try {
			let storedData = JSON.parse(localStorage.getItem("invertAxes"));
			$("#user-input").val(storedData.inputData);
			resetLogsAndErrors(false); // clear the log
			$("#log").showInLog(`Input data loaded.`);
			invertAxes(true);
		}
		catch (err) {
			alert("No saved data was found.")
		}
	}
	function manualSelectDelimiter(event) {
		autoDelimiter = false;
		let buttonId = String(event.target.id);
		highlightFormElement(buttonId, autoDelimiter)
		switch (buttonId) {
			case 'delimiter_tabs':
				delimiter = "\t";
				break;
			case 'delimiter_commas':
				delimiter = ",";
				break;
			case 'delimiter_commaSpaces':
				delimiter = ", ";
				break;
			case 'delimiter_custom':
				delimiter = $('#delimiter_custom').val();
				break;
		}
	}
	function save() {
		localStorage.setItem("invertAxes", JSON.stringify({
			inputData: $("#user-input").val()
		}));
		$("#log").showInLog(`Input data saved.`);
	}
	function toggleLog() {
		$("#black-wrapper").toggleClass("bw-minimized bw-maximized");
		$("#log-wrapper").toggle(30, function() {
			if (logMinimized) {
				// Replace the maximize icon with the minimize icon
				$('<img id="log-button" class="icon" src="images/minimize.png" alt="Log button" title="Toggle log" />').replaceAll("#log-button");
				logMinimized = false;
			} else {
				// Replace the minimize icon with the maximize icon
				$('<img id="log-button" class="icon" src="images/maximize.png" alt="Log button" title="Toggle log" />').replaceAll("#log-button");
				logMinimized = true;
			}
		})
	}

	// Data validation and cleanup
	function arrayToString(input, delim, outputAsArray) {
		let stringToReturn = '';
		let rowToSave = '';
		for (let i = 0; i < input.length; i++) {
			rowToSave = outputAsArray ? '[' : '';
			for (let j = 0; j < input[i].length; j++) {
				if (j < input[i].length - 1) {
					rowToSave += input[i][j] + delim;
				} else {
					// After the last element of the row, don't add a delimiter 
					rowToSave += outputAsArray ?
						input[i][j] + '],' :
						input[i][j];
				}
			}
			if (i < input.length - 1) {
				stringToReturn += rowToSave + "\n";
			} else {
				// After the last element of the row, don't add a line break
				stringToReturn += rowToSave;
			}
		}
		// If output needs to look like an array, remove the trailing comma
		if (outputAsArray)
			stringToReturn = stringToReturn.slice(0, -1);
		return stringToReturn;
	}
	function countElements(myArray) {
		if (myArray)
			return myArray.length;
		else
			return 0;
	}
	function resemblesAnArray(input) {
		// Returns true if the string "input" resembles an array of arrays. Else, false.
		let bracketReturns = input.match(/\]\n|\],\n/g); // find ]\n or ],\n
		let commas = input.match(/,/g); // find ,
		let returnOpens = input.match(/\n\[|\n\s\[/g); // find \n[ or \n\s[
		// Count instances found. If none found, change the count from null to 0.
		bracketReturns = countElements(bracketReturns);
		commas = countElements(commas);
		returnOpens = countElements(returnOpens);
		// Evaluate how closely the string resembles an array
		if (bracketReturns &&
			commas &&
			returnOpens &&
			bracketReturns >= 2 &&
			commas >= 4 &&
			returnOpens >= 2
		) {
			$("#log").showInLog(`Input data resembles a list of arrays. Found...<br />
				<span class='indented'>${bracketReturns} instances of "],linebreak" or similar</span><br />
				<span class='indented'>${commas} instances of "," or similar</span><br />
				<span class='indented'>${returnOpens} instances of "linebreak[" or similar</span>`);
			return true;
		} else {
			$("#log").showInLog(`No arrays detected. Only found...<br />
				<span class='indented'>${bracketReturns} instances of "],linebreak" or similar</span><br />
				<span class='indented'>${commas} instances of "," or similar</span><br />
				<span class='indented'>${returnOpens} instances of "linebreak[" or similar</span>`);
			return false;
		}
	}
	function removeSmartQuotes(input) {
		// Convert smart quotes to regular quotes
		let smartQuotes = [
			[/‘/g, "'"],
			[/’/g, "'"],
			[/“/g, '"'],
			[/”/g, '"']
		];
		for (let i = 0; i < smartQuotes.length; i++)
			input = input.replace(smartQuotes[i][0], smartQuotes[i][1]);
		return input;
	}
	function stringToArray(input, delim, brackets) {
		// Takes a string. Returns an array of arrays.
		input = input.split("\n");
		let output = [];
		for (let i = 0; i < input.length; i++) {
			// Remove trailing commas
			if (input[i][input[i].length - 1] == ',')
				input[i] = input[i].slice(0, -1);
			// Removing enclosing brackets
			if (brackets)
				input[i] = input[i].slice(1, -1);
			// Split the row string into an array
			if (input[i]) // Omit empty lines
				output.push(input[i].split(delim)); 
		}
		return output;
	}
	function validateRowLengths(input, avgRowLen) {
		// If any rows are not the average length, inform the user
		let badRows = [];
		for (let i = 0; i < input.length; i++) {
			if (input[i].length != avgRowLen) {
				// add 1 to the index because there's no line 0 in the white textarea
				badRows.push(i + 1);
			}
		}
		if (badRows.length > 0) {
			// Fill out the row to prevent the error from propogating to other rows
			let replacementRow = [];
			for (let i = 1; i <= avgRowLen; i++)
				replacementRow.push('?')
			for (let i = 0; i < badRows.length; i++) {
				input[badRows - 1] = replacementRow;
			}
			// Inform the user
			$("#unusual-number-of-columns").html(
				"The following rows contain an unusual number of columns: " +
				badRows);
			$("#unusual-number-of-columns").css("display", "block");
			if (badRows.length > 1)
				$("#log").showInLog(`Rows ${badRows} contained an unusual number of columns.<br />
					<span class='indented'>Their values were replaced with '?'.</span>`);
			else
				$("#log").showInLog(`Row ${badRows} contained an unusual number of columns.<br />
					<span class='indented'>Its values were replaced with '?'.</span>`);
		}
		return input;
	}

	// Provide feedback to user
	function highlightFormElement(elementID, auto) {
		// Unhighlight every form element
		let domForm = document.body.children[0].children[2].children[1].children[0];
		for (let i = 0; i < domForm.childNodes.length; i++) {
			let domNode = domForm.childNodes[i];
			$(domNode).removeClass("selected-delimiter-auto");
			$(domNode).removeClass("selected-delimiter-manual");
		}
		// Highlight one form element
		if (auto)
			$("#" + elementID).addClass("selected-delimiter-auto");
		else
			$("#" + elementID).addClass("selected-delimiter-manual");
	}
	function resetLogsAndErrors(keepLog) {
		if (keepLog != true)
			$("#log").html("");
		$(".red-error").css("display", "none");
	}
});
