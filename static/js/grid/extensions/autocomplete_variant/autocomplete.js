/*
 * editable_select_editor.js
 * 
 * This file is part of EditableGrid.
 * 
 * EditableGrid is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or 
 * any later version.
 * 
 * EditableGrid is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with EditableGrid. If not, see http://www.gnu.org/licenses.
 * 
 */

/**
 * Autocomplete cell editor
 * 
 * Text field editor with autocomplete capabilities.
 * Uses the "autocomplete" jQuery plugin.
 * 
 * @constructor Accepts an option object containing the following properties: 
 * - suggestions: array of possible values
 * - width: integer (default=300)
 * - fieldSize: integer (default=auto-adapt)
 * - maxLength: integer (default=255)
 * 
 * @class Class to edit a cell with an autocomplete HTML text input
 * @author Original idea by Jasper Visser, integrated by Webismymind 
 */

function AutocompleteCellEditor(config) 
{
	// default options
	this.width = 300; 
	this.suggestions = [("no suggestions")];
	
	// erase defaults with given options
	this.init(config); 
};

// inherits TextCellEditor functionalities
AutocompleteCellEditor.prototype = new TextCellEditor();

// redefine displayEditor to setup autocomplete
AutocompleteCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// disable default blur event handling wich interfer when clicking on a suggestion in the autocomplete
	htmlInput.onblur = null;

	// setup autocomplete
	$(htmlInput).autocomplete({ 
		lookup: this.suggestions, 
		width: this.width,
		
		// apply value when it has been selected either with a click or with ENTER
		onSelect: function() {
			htmlInput.celleditor.applyEditing(htmlInput.element, htmlInput.value); 
		} 
	});
};