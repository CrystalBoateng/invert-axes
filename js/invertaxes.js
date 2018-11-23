"use strict";
console.clear();
//// testing values
	// let inputString = document.getElementById("myTextArea").value
	let inputString = "1, 2, 3\n4, 5, 6\n7, 8, 9\n10,11 12";
	// let inputString = "[[1,2,3],\n	[4, 5],\n	[7, 8, 9],\n	[7, 8, 9]]";

// declare global variables
let autoDelimiter = true;
let delimiter;
let arrayNotation;

function countElements(myArray) {
	if (myArray)
		return myArray.length;
	else
		return 0;
}
function highlightFormElement(element, auto) { // INCOMPLETE
	// let domForm = document.body.form;
	// // Unhighlight every form element (**REQUIREMENT: DOM Traversal)
	// for (var i = 0; i < domForm.childNodes.length; i++) {
	// 	domForm.style.border = "2px solid #afabab";
	// 	domForm.style.boxShadow = "none";
	// 	domForm.style.color = "#afabab";
	// }
	// // highlight one form element
	// element.style.border = "2px solid white;";
	// element.style.boxShadow = "0 0 25px;";
	// element.style.color = "#fff";
}
function selectDelimiter(input) {
	if (autoDelimiter) {
		return "," // INCOMPLETE
		// // Derive the delimiter based on string entered by user.
		// // Referenced this page when looking for a string method to count instances of a substring: https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
		// let tabs = {
		// 	count: countElements(input.match(/\t/g)), // count instances of \t,
		// 	elementID: document.getElementsByTagName("form")[0],
		// 	value: '\t'
		// }
		// let commas = {
		// 	count: countElements(input.match(/,/g)), // count instances of ,
		// 	elementID: document.getElementsByTagName("form")[1],
		// 	value: ','
		// }
		// let commaSpaces = {
		// 	count: countElements(input.match(/, /g)), // count instances of , 
		// 	elementID: document.getElementsByTagName("form")[2],
		// 	value: ', '
		// }
		// // don't double-count commaSpaces
		// commas.count = commas.count - commaSpaces.count; 
		// console.log("Found the following potential delimiters:\n\t %s tab(s), %s comma(s), and %s comma(s) followed by spaces", tabs.count, commas.count, commaSpaces.count);
		// // If any delimiter is twice as common as the other two, select it.
		// let totalDelim = tabs.count + commas.count + commaSpaces.count;
		// tabs.frequency = tabs.count / totalDelim;
		// commas.frequency = commas.count / totalDelim;
		// commaSpaces.frequency = commaSpaces.count / totalDelim;

		// let potentialDelimiters = [tabs, commas, commaSpaces];
		// for (let i = 0; i < potentialDelimiters.length; i++) {
		// 	let elem = potentialDelimiters[i]
		// 	if (elem.frequency >= 0.6) {
		// 		highlightFormElement(elem, autoDelimiter); // Show user current delim
		// 		return elem.value;
		// 	}
		// }
		// // Notify the user if no delimiter had a frequency > 60%.
		// console.log("Red-Error: The delimiter could not be automatically determined. Please select a delimiter manually.");
		// return false;
	}
	else {
		// Keep the user-selected delimiter from the DOM.
		return delimiter;
	}
}
let outputString;
function resetRedErrors() {
	//INCOMPLETE Hide all (previous) red-errors.
}
function removeSmartQuotes(input) {
	// Convert smart quotes to regular quotes 
	let smartQuotes = [[/‘/g, "'"], [/’/g, "'"], [/“/g, '"'], [/”/g, '"']];
	for (let i = 0; i < smartQuotes.length; i++) {
		// Referenced this page when looking for a string method to replace multiple instances of a substring (rather than only the first instance): https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
		input = input.replace(smartQuotes[i][0], smartQuotes[i][1]);
	}
	return input;
}
function resemblesAnArray(input) {
	// Returns true if the string "input" resembles an array of arrays. Else, false.
	let bracketReturns = input.match(/\]\n|\],\n/g); // find ]\n or ],\n
	let commas = input.match(/,/g); // find ,
	let returnOpens = input.match(/\n\[|\n\s\[/g); // find \n[ or \n\s[
	// Count instances found. If none found, change count from null to 0.
	bracketReturns = countElements(bracketReturns);
	commas = countElements(commas);
	returnOpens = countElements(returnOpens);
	// Evaluate if string resembles an array.
	if (bracketReturns &&
		commas &&
		returnOpens &&
		bracketReturns > 2 &&
		commas > 4 &&
		returnOpens > 2
	) {
		console.log('Arrays detected. Found...\n\t%s instances of "],linebreak" or similar\n\t%s instances of "," or similar\n\t%s instances of "linebreak[" or similar', bracketReturns, commas, returnOpens);
		return true;
	} else {
		console.log('No arrays detected. Found only...\n\t%s instances of "],linebreak" or similar\n\t%s instances of "," or similar\n\t%s instances of "linebreak[" or similar', bracketReturns, commas, returnOpens);
		return false;
	}
}
function stringToArray(input, delim) {
	input = input.split("\n");
	for (let i = 0; i < input.length; i++) {
		input[i] = input[i].split(delim);
	}
	return input;
}
function arrayToString(input, delim, outputAsArray) {
	let stringToReturn = '';
	let rowToSave = '';
	for (let i = 0; i < input.length; i++) {
		outputAsArray ? rowToSave = '[' : rowToSave = '';
		for (let j = 0; j < input[i].length; j++) {
			if (j < input[i].length - 1) {
				rowToSave += input[i][j] + delim;
			} else {
				// don't add a delimiter after the last element of the row.
				outputAsArray ? 
					rowToSave += input[i][j] + '],' 
					: rowToSave += input[i][j];
			}
		}
		if (i < input.length - 1) {
			stringToReturn += rowToSave + "\n";
		} else {
			// don't add a line break after the last element of the row.
			stringToReturn += rowToSave;
		}
	}
	// If output should look like an array, remove the trailing comma.
	 if (outputAsArray) 
		stringToReturn = stringToReturn.slice(0,-1);
	return stringToReturn;
}
function validateRowLengths(input, avgRowLen) {
    // If any rows are not the average length, inform the user.
    let badRows = [];
    for (let i = 0; i < input.length; i++) {
        if (input[i].length != avgRowLen) {
            // add one to index because there is no line 0 in the white textarea.
			badRows.push(i + 1);
		}
    } 
    if (badRows.length > 0) {
        // Correct the row to prevent the error from propogating to other rows.
        let replacementRow = [];
        for (let i = 1; i <= avgRowLen; i++) {
            replacementRow.push('?')
        }
        for (let i = 0; i < badRows.length; i++)
            input[badRows - 1] = replacementRow;
        // Inform the user
        if (badRows.length > 1)
            console.log("Red-Error: Row(s) " + badRows + " contained an unusual number of columns. \n\tTheir values were replaced with '?'.");
        else
            console.log("Red-Error: Row " + badRows + " contained an unusual number of columns. \n\tIts values were replaced with '?'.");
    }
    return input;
}
function invertAxes() {
	resetRedErrors();
	if (inputString) {
		inputString = removeSmartQuotes(inputString);
		console.log("--input:");
		console.log(inputString);
		delimiter = selectDelimiter(inputString);
		if (!delimiter) 
			return "Unclear delimiter.";
		// Convert inputString to an array.
		let inputArray;
		arrayNotation = resemblesAnArray(inputString);
		if (arrayNotation) {
			try {
				inputArray = JSON.parse(inputString);
			}
			catch (err) {
				// console.log("Could not parse the data as an array of rows containing multiiple arrays of columns. Check the input data for possible syntax errors.");
				// console.log("Red-Error Note: Input data resembles an array, but could not be parsed as one. ");
				inputArray = stringToArray(inputString, delimiter);
			}
		} else {
			inputArray = stringToArray(inputString, delimiter);
		}

		// INCOMPLETE: verify that all rows have the same length
		// Determine the averageRowLength.
		let averageRowLength = 0;
		for (let i = 0; i < inputArray.length; i++)
			averageRowLength += inputArray[i].length;
		averageRowLength = Math.round(averageRowLength / inputArray.length);
			inputArray = validateRowLengths(inputArray, averageRowLength);

		// invert the arrays
		let outputArray = [];
		let outputRow;
		for (let i = 0; i < averageRowLength; i++) {
			outputRow = [];
			for (let j = 0; j < inputArray.length; j++) {
				outputRow.push(inputArray[j][i]);
			}
			outputArray.push(outputRow);
		}
		outputString = arrayToString(outputArray, delimiter, arrayNotation);
		return outputString;
	} else
		console.log("Red-Error there's no input content to parse.");
}

let stringForHTML = invertAxes();
console.log("--output:");
console.log(stringForHTML);