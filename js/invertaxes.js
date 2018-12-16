// External dependecies: jQuery

"use strict"; console.clear();

// Event handlers 
/* (**REQUIREMENT: Capturing and handling events) */
$(document).ready(invertAxes);
// Keyboard event handlers
$("#user-input").keyup(invertAxes);
$("#delimiter_custom").change(invertAxes);
// Mouse event handlers
$("form").mouseup(manualSelectDelimiter)
$("form").keyup(manualSelectDelimiter);
$("#user-input, #invert-button, form, #load-button").mouseup(invertAxes);
$("#copy-button").click(copyToClipboard);
$("#toggle-log").click(toggleLog);


// 'Global' variables
let autoDelimiter = true; // a boolean
let delimiter; // a string
let arrayNotation; // a boolean
let logMinimized = true; // a boolean

// Receive data from user
function autoSelectDelimiter(input) {
	if (autoDelimiter) {
		// Derive the delimiter based on the string entered by user
		// Referenced this page when looking for a string method to count instances of a substring: https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
		/* (**REQUIREMENT: Creting and handling a data structure) */	
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
		showInLog(String(`Found the following potential delimiters:<br />
			<span class='indented'>${tabs.count} tab(s), ${commas.count} 
			comma(s), and ${commaSpaces.count} comma(s) followed by spaces.
			</span>`)
		);
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
				showInLog(String(`<span class='indented'>Selected 
					${commonDel[i].elementID.slice(10)} as delimiter.</span>`));
				return commonDel[i].value;
			}
		}
		// If no delimiter met that criterion, notify the user
		$("#ambiguous-delimiter").css("display","block");
		return false;
	}
	else {
		// Keep the user-selected delimiter from the DOM
		if (!delimiter)
			$("#empty-custom").css("display", "block");
		return delimiter;
	}
}
function copyToClipboard() {
	// Give the user feedback by showing the 'copied to clipboard' message
	$("#copied-to-clipboard").toggle(10, function(){ // Show the div
		$("#copied-to-clipboard").toggle(4000); // Hide the div
	});
	// Copy the text from the output box, to the user's clipboard
	// Referenced this page for information about copying to clipboard: https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
	document.getElementById("user-output").select();
	document.execCommand("copy");
}
function invertAxes() {
	resetLogsAndErrors();
	let inputString = $("#user-input").val();
	if (inputString) {
		inputString = removeSmartQuotes(inputString);
		delimiter = autoSelectDelimiter(inputString);
		if (!autoDelimiter && inputString.indexOf(delimiter) < 0)
			$("#delimiter-never-found").css("display", "block");
		// Convert inputString to an array.
		let inputArray;
		arrayNotation = resemblesAnArray(inputString);
		if (arrayNotation) {
			inputArray = stringToArray(inputString,',',true);
			showInLog("Input data was parsed as an array of rows containing multiiple arrays of columns.");
		} else
			inputArray = stringToArray(inputString, delimiter);
		// Determine the average row length
		let averageRowLength = 0;
		for (let i = 0; i < inputArray.length; i++)
			averageRowLength += inputArray[i].length;
		averageRowLength = Math.round(averageRowLength / inputArray.length);
		// Verify that all rows have the same length
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
		$("#input-is-empty").css("display","block");
		$("#user-output").val("");
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
function toggleLog() {
	$("#black-wrapper").toggleClass("bw-minimized bw-maximized");
	$("#log-wrapper").toggle(30,function(){
		if (logMinimized) {
			// Replace the maximize icon with minimize
			$('<img id="log-button" class="icon" src="images/minimize.png" alt="Log button" title="Toggle log" />').replaceAll("#log-button");
			logMinimized = false;
		} else {
			// Replace the minimize icon with maximize
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
				// don't add a delimiter after the last element of the row
				outputAsArray ?
					rowToSave += input[i][j] + '],'
					: rowToSave += input[i][j];
			}
		}
		if (i < input.length - 1) {
			stringToReturn += rowToSave + "\n";
		} else {
			// don't add a line break after the last element of the row
			stringToReturn += rowToSave;
		}
	}
	// If output should look like an array, remove the trailing comma
	 if (outputAsArray)
		stringToReturn = stringToReturn.slice(0,-1);
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
	/* (**REQUIREMENT: Form validation) */
	let bracketReturns = input.match(/\]\n|\],\n/g); // find ]\n or ],\n
	let commas = input.match(/,/g); // find ,
	let returnOpens = input.match(/\n\[|\n\s\[/g); // find \n[ or \n\s[
	// Count instances found. If none found, change count from null to 0.
	bracketReturns = countElements(bracketReturns);
	commas = countElements(commas);
	returnOpens = countElements(returnOpens);
	// Evaluate how much the string resembles an array
	if (bracketReturns &&
		commas &&
		returnOpens &&
		bracketReturns >= 2 &&
		commas >= 4 &&
		returnOpens >= 2
	) {
		showInLog(`Input data resembles a list of arrays. Found...<br />
			<span class='indented'>${bracketReturns} instances of "],linebreak" or similar</span><br />
			<span class='indented'>${commas} instances of "," or similar</span><br />
			<span class='indented'>${returnOpens} instances of "linebreak[" or similar</span>`);
		return true;
	} else {
		showInLog(`No arrays detected. Only found...<br />
			<span class='indented'>${bracketReturns} instances of "],linebreak" or similar</span><br />
			<span class='indented'>${commas} instances of "," or similar</span><br />
			<span class='indented'>${returnOpens} instances of "linebreak[" or similar</span>`);
		return false;
	}
}
function removeSmartQuotes(input) {
	// Convert smart quotes to regular quotes
	/* (**REQUIREMENT: Form validation) */
	let smartQuotes = [[/‘/g, "'"], [/’/g, "'"], [/“/g, '"'], [/”/g, '"']];
	for (let i = 0; i < smartQuotes.length; i++) {
		// Referenced this page when looking for a string method to replace multiple instances of a substring (rather than only the first instance): https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
		input = input.replace(smartQuotes[i][0], smartQuotes[i][1]);
	}
	return input;
}
function stringToArray(input, delim, brackets) {
	/* Takes a string. Returns an array of arrays. */
	input = input.split("\n");
	for (let i = 0; i < input.length; i++) {
		// Remove trailing commas
		if (input[i][input[i].length - 1] == ',')
			input[i] = input[i].slice(0,-1);
		// Removing enclosing brackets
		if (brackets)
			input[i] = input[i].slice(1,-1);
		// Split the row string into an array
		input[i] = input[i].split(delim);
	}
	return input;
}
function validateRowLengths(input, avgRowLen) {
	/* (**REQUIREMENT: Form validation) */
    // If any rows are not the average length, inform the user
    let badRows = [];
    for (let i = 0; i < input.length; i++) {
        if (input[i].length != avgRowLen) {
            // add 1 to the index because there's no line 0 in the white textarea
			badRows.push(i + 1);
		}
    }
    if (badRows.length > 0) {
        // Correct the row to prevent the error from propogating to other rows
        let replacementRow = [];
        for (let i = 1; i <= avgRowLen; i++)
            replacementRow.push('?')
        for (let i = 0; i < badRows.length; i++) {
            input[badRows - 1] = replacementRow;
        }
        // Inform the user
        $("#unusual-number-of-columns").html(
        	"The following rows contain an unusual number of columns: "
        	+ badRows);
        $("#unusual-number-of-columns").css("display", "block");
        if (badRows.length > 1)
            showInLog(`Rows ${badRows} contained an unusual number of columns.<br />
            	<span class='indented'>Their values were replaced with '?'.</span>`);
        else
            showInLog(`Row ${badRows} contained an unusual number of columns.<br />
            	<span class='indented'>Its values were replaced with '?'.</span>`);
    }
    return input;
}

// Provide feedback to user
function highlightFormElement(elementID, auto) {
	// Unhighlight every form element 
	/* (**REQUIREMENT: DOM Traversal) */
	let domForm = document.body.children[0].children[2].children[1].children[0];
	for (let i = 0; i < domForm.childNodes.length; i++) {
		let domNode = domForm.childNodes[i];
		$(domNode).removeClass("selected-delimiter-auto");
		$(domNode).removeClass("selected-delimiter-manual");
	}
	// highlight one form element
	if (auto)
		$("#"+elementID).addClass("selected-delimiter-auto");
	else
		$("#"+elementID).addClass("selected-delimiter-manual");
}
function showInLog(text) {
	$("#log").html( `${$("#log").html()} <br /> ${text}` );
}
function resetLogsAndErrors() {
	$("#log").html("");
	$(".red-error").css("display","none");
}

