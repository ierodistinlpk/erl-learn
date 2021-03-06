/*
 * demo.js
 * 
 * Copyright 2010 Webismymind SPRL
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

// create our editable grid
// helper method to display a message
function displayMessage(text, style) { 
	_$("message").innerHTML = "<p class='" + (style || "ok") + "'>" + text + "</p>"; 
} 

// this will be used to render our table headers
function InfoHeaderRenderer(message) { 
	this.message = message; 
	this.infoImage = new Image();
	this.infoImage.src = "images/information.png";
};
InfoHeaderRenderer.prototype = new CellRenderer();
InfoHeaderRenderer.prototype.render = function(cell, value) 
{
	if (value) {
		// here we don't use cell.innerHTML = "..." in order not to break the sorting header that has been created for us (cf. option enableSort: true)
		var link = document.createElement("a");
		link.href = "javascript:alert('" + this.message + "');";
		link.appendChild(this.infoImage);
		cell.appendChild(document.createTextNode("\u00a0\u00a0"));
		cell.appendChild(link);
	}
};

// this function will initialize our editable grid
function initializeGrid(gr) 
{
  //with (EditableGrid) {
    
    // use a special header renderer to show an info icon for some columns
    gr.setHeaderRenderer("first", new InfoHeaderRenderer("The age must be an integer between 16 and 99"));
    gr.setHeaderRenderer("second", new InfoHeaderRenderer("The height is given in meters"));
    
    // the list of allowed countries depend on the selected continent
    gr.setEnumProvider("first", new EnumProvider( null
     /* {getOptionValues: function(grid, column, rowIndex){
	//return {"be" : "Belgique", "fr" : "France", "uk" : "Great-Britain", "nl": "Nederland"};
	return null
      } }*/
    ));
    
    // use a flag image to render the selected country
 /*   gr.setCellRenderer("first", new CellRenderer({
        render: function(cell, value) { cell.innerHTML = value ? "<img src='images/flags/be.png' alt='" +'ehu' + "'/>" : ""; }
      })); */
    
    // use autocomplete on firstname
 //   gr.setCellEditor("first", new AutocompleteCellEditor({
 //     suggestions: ['Mark', 'Paul', 'Jackie', 'Greg', 'Matthew', 'Anthony', 'Claude', 'Louis', 'Marcello', 'Bernard', 'Betrand', 'Jessica', 'Patrick', 'Robert', 'John', 'Jack', 'Duke', 'Denise', 'Antoine', 'Coby', 'Rana', 'Jasmine', 'André', 'Martin', 'Amédé', 'Wanthus']
 //   }));
    
/*    
    // register the function that will handle model changes
    modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
      displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
      if (this.getColumnName(columnIndex) == "continent") this.setValueAt(rowIndex, this.getColumnIndex("country"), ""); // if we changed the continent, reset the country
    };
    
    rowSelected = function(oldRowIndex, newRowIndex) {
      if (oldRowIndex < 0) displayMessage("Selected row '" + this.getRowId(newRowIndex) + "'");
      else displayMessage("Selected row has changed from '" + this.getRowId(oldRowIndex) + "' to '" + this.getRowId(newRowIndex) + "'");
    };
    
    // render for the action column
    setCellRenderer("action", new CellRenderer({render: function(cell, value) {
      // this action will remove the row, so first find the ID of the row containing this cell 
      var rowId = editableGrid.getRowId(cell.rowIndex);
      cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to delete this person ? ')) editableGrid.removeRow('" + rowId + "');\" style=\"cursor:pointer\"" +
	"<img src=\"images/delete.png\" border=\"0\" alt=\"delete\" title=\"delete\"/></a>";
    }})); 
    */
    // render the grid (parameters will be ignored if we have attached to an existing HTML table)
  gr.renderGrid(null,null,null);	
 // }
}


function onloadHTML() 
{
  var editableGrid = new EditableGrid("DemoGrid", {
    enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
    editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
    editorzoneid: "edition" // will be used only if editmode is set to "fixed"
  });
  

  // we attach our grid to an existing table: we give for each column a name and a type
  editableGrid.attachToHTMLTable(_$('htmlgrid'), 
				 [ new Column({ name: "first", datatype: "string(24)" }),
				   new Column({ name: "second", datatype: "string" })]);
  
  displayMessage("Grid attached to HTML table: " + editableGrid.getRowCount() + " row(s)"); 
  // editableGrid.renderGrid(null,null,null);
  initializeGrid(editableGrid);
}
