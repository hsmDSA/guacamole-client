
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is guacamole-common-js.
 *
 * The Initial Developer of the Original Code is
 * Michael Jumper.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Guacamole namespace
var Guacamole = Guacamole || {};

/**
 * Dynamic on-screen keyboard. Given the URL to an XML keyboard layout file,
 * this object will download and use the XML to construct a clickable on-screen
 * keyboard with its own key events.
 * 
 * @constructor
 * @param {String} url The URL of an XML keyboard layout file.
 */
Guacamole.OnScreenKeyboard = function(url) {

    // For each child of element, call handler defined in next
    function parseChildren(element, next) {

        var children = root.childNodes;
        for (var i=0; i<children.length; i++) {

            // Get child node and corresponding handler
            var child = children[i];
            var handler = next[child.tagName];

            // Call handler if defined
            if (handler)
                handler(child);

            // Throw exception if no handler
            else
                throw new Exception(
                      "Unexpected " + child.tagName
                    + " within " + element.tagName
                );

        }

    }

    // Create keyboard
    var keyboard = document.createElement("div");
    keyboard.className = "keyboard";

    // Retrieve keyboard XML
    var xmlhttprequest = new XMLHttpRequest();
    xmlhttprequest.open("GET", url, false);
    xmlhttprequest.send(null);

    var xml = xmlhttprequest.responseXML;

    if (xml) {

        function parse_row(e) {
            
            var row = document.createElement("div");
            row.className = "row";

            parseChildren(e, {
                
                "column": function(e) {
                    row.appendChild(parse_column(e));
                },
                
                "gap": function parse_gap(e) {

                    // Get attributes
                    var gap_size = e.attributes["size"];

                    // Create element
                    var gap = document.createElement("div");
                    gap.className = "gap";
                    gap.textContent = " ";

                    if (gap_size)
                        gap.style.width = gap.style.height =
                            parseFloat(gap_size.value) + "em";

                },
                
                "key": function parse_key(e) {
                    
                    // Get attributes
                    var key_size = e.attributes["size"];

                    parseChildren(e, {
                        "cap": function cap(e) {

                            // Get attributes
                            var required = e.attributes["if"];
                            var modifier = e.attributes["modifier"];
                            var keysym   = e.attributes["keysym"];
                            var sticky   = e.attributes["sticky"];
                            

                        }
                    });

                }
                
            });

            return row;

        }

        function parse_column(e) {
            
            var col = document.createElement("div");
            col.className = "col";

            var align = col.attributes["align"];

            if (align)
                col.style.textAlign = align.value;

            // Columns can only contain rows
            parseChildren(e, {
                "row": function(e) {
                    col.appendChild(parse_row(e));
                }
            });

            return col;

        }


        // Parse document
        parseChildren(xml.documentElement, {
            
            "keyboard": function parse_keyboard(e) {
                
                // Get attributes
                var keyboard_size = e.attributes["size"];
                
                parseChildren(e, {
                    
                    "row": function(e) {
                        keyboard.appendChild(parse_row(e));
                    },
                    
                    "column": function(e) {
                        keyboard.appendChild(parse_column(e));
                    }
                    
                });

            } // end keyboard
                
        });

    }

    // Do not allow selection or mouse movement to propagate/register.
    keyboard.onselectstart =
    keyboard.onmousemove   =
    keyboard.onmouseup     =
    keyboard.onmousedown   =
    function(e) {
        e.stopPropagation();
        return false;
    };


    this.onkeypressed  = null;
    this.onkeyreleased = null;

    this.getElement = function() {
        return keyboard;
    };

};

Guacamole.OnScreenKeyboard.Key = function() {

    /**
     * Width of the key, relative to the size of the keyboard.
     */
    this.size = 1;

    /**
     * Whether this key is currently pressed.
     */
    this.pressed = false;

    /**
     * An associative map of all caps by modifier.
     */
    this.caps = {};

}

Guacamole.OnScreenKeyboard.Cap = function(text, keycode, modifier) {
    
    /**
     * Modifier represented by this keycap
     */
    this.modifier = 0;
    
    /**
     * The text to be displayed within this keycap
     */
    this.text = text;

    /**
     * The keycode this cap sends when its associated key is pressed/released
     */
    this.keycode = keycode;

    // Set modifier if provided
    if (modifier) this.modifier = modifier;
    
}
