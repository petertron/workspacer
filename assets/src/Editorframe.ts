/// <reference path="jquery.d.ts"/>
/// <reference path="Textspace.ts"/>
/// <reference path="Actions.ts"/>

declare var document: Document;
declare var window: Window;
//declare var Symphony;
declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;
declare var Highlighters;
declare var Settings;

var d = document;
var jQuery: JQueryStatic = window.parent['jQuery'];
var $ = jQuery;

// Functions will be placed here by highlighter modules.
var Symphony = window.parent['Symphony'];
//var Settings = Symphony.Extensions.Workspacer['settings'];
var Context = Symphony['Context'];
// Functions for highlighter modules.

// Document parts
var BODY = document.body,
    //PRE_TAG = document.querySelector('pre'),
    PRE_TAG,
    NOTIFIER,
    CONTEXT,
    SUBHEADING,
    CONTENTS,
    FORM,
    NAME_FIELD,
    SAVING_POPUP;
    PRE_TAG = document.getElementsByTagName('pre')[0];

// Editor parts
var EDITOR_OUTER,
    EDITOR_LINE_NUMBERS,
    EDITOR_MAIN,
    BODY_HIGHLIGHTER_STYLES,
    EDITOR_MENU,
    EDITOR_RESIZE_HANDLE;

var replacement_actions = null;

var workspace_url,
    editor_url,
    directory_url;

var last_key_code,
    caret_moved;

var gutter_width = 34;
var x_margin = 3,
    y_margin = 2;

var in_workspace;
var new_file,
    document_modified = false,
    syntax_highlighter;

var style_element1 = document.createElement('style');
style_element1.type = "text/css";
var style_element2 = document.createElement('style');
style_element2.type = "text/css";

var ajax_submit;
var editor_height = 580;

var editor_refresh_pending = false;

var editor_resize = {
    'height': 580,
    'mouse_down': false,
    'pointer_y': null
};


/**
 * Editor functions
 */

function EDITOR_OUTER_onMouseDown(event)
{
    if (event.which == 3 && $(EDITOR_MENU).is(':hidden')) {
        event.preventDefault();
        //event.stopPropagation();
        $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY]);
        PRE_TAG.contentEditable = null;
    }
}

function BODY_onFocusIn(event)
{
    if (!($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).addClass('focus');
        //positionEditorCaret();
    }
}

function BODY_onFocusOut(event)
{
    if (($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).removeClass('focus');
        PRE_TAG.contentEditable = "true";
        //positionEditorCaret();
    }
}

function BODY_onMouseUp(event)
{
    Textspace.registerCaretPos();
}

$(PRE_TAG).keydown(function(event)
{
    var key = event.which;
    //alert (key);
    last_key_code = key;
    var char = String.fromCharCode(key);
    //alert (char);

    if (event.metaKey || event.ctrlKey) {
        //switch (char.toLowerCase()) {
        switch (key) {
/*            case 37; // left arrow
                if (!Textspace.selection.collapsed) {
                    Textspace.action("IndentRight");
                }
                break;*/
            case 39: // right arrow
                if (!Textspace.selection.collapsed) {
                    event.preventDefault();
                    Textspace.action("IndentRight");
                }
                break;
            case 83: // "s"
                event.preventDefault();
                $('input[name="action[save]"]').trigger('click');
                break;
            case 89: // "y"
                event.preventDefault();
                Textspace.redo();
                break;
            case 90: // "z"
                event.preventDefault();
                Textspace.undo();
                //refreshEditorDisplay()
                break;
        }

        return;
    }

    if (key == 8) {
        event.preventDefault();
        Textspace.action("Delete");
    } else if (key == 9) { // tab character
        event.preventDefault();
        if (Settings['indentation_method'] == "spaces") {
            var ind_width = Settings['indentation_width'];
            var slices = Textspace.getEditorTextSlices();
            if (slices.before) {
                var string = slices.before.split("\n").pop();
                // Count characters
                var count = 0;
                for (var i = 0; i < string.length; i++) {
                    if (string[i] == "\t") {
                        count = count + ind_width - (count % ind_width);
                    } else {
                        count++;
                    }
                }
            }
            for (var i = 0; i < ind_width - (count % ind_width); i++) {
                Textspace.action("InsertChar", " ");
            }
        } else {
            Textspace.action("InsertChar", "\t");
        }
    } else if (key == 13) {
        event.preventDefault();
        Textspace.action("InsertLineBreak");
    } else if (key == 46) {
        event.preventDefault();
        Textspace.action("ForwardsDelete");
    }
    //if(([8, 13, 32, 45, 46].indexOf(key) != -1) || (key >= 48 && key <= 90) || (key >= 163 && key <= 222))
});

$(PRE_TAG).keypress(function(event)
{
    if (event.metaKey || event.ctrlKey)
        return;

    var key = event.which;
    if (key < 32)
        return;

    var char = String.fromCharCode(key);

    event.preventDefault();
    Textspace.action("InsertChar", char);
});

$(PRE_TAG).keyup(function(event)
{
    var key = event.which;
    if (key >= 33 && key <= 40) {
        Textspace.registerCaretPos();
    }
});

$(PRE_TAG).on('cut', function(event)
{
    //event.preventDefault();
    Textspace.action("Delete");//, event.originalEvent.clipboardData.getData('text'));
});

$(PRE_TAG).on('paste', function(event)
{
    event.preventDefault();
    //var pasted = event.originalEvent['clipboardData'].getData('text');
    Textspace.action("Paste", event.originalEvent['clipboardData'].getData('text'));
});

function EDITOR_MENU_onMenuOpen(event, mouse_x, mouse_y)
{
    if ($(this).is(':visible')) {
        event.stopPropagation();
        return;
    }
    var ul = d.createElement('ul');
    var li = d.createElement('li');
    var legend = d.createTextNode("Undo");
/*      if (Textspace.undo_stack.length > 0) {
        li.className="active";
        $(li).data("action", "undo");
        legend.textContent = "Undo " + doings[$(Textspace.history).get(-1).action];
    }*/
    li.appendChild(legend);
    ul.appendChild(li);
    $(this)
        .empty()
        .append(ul)
        .css('left', mouse_x)
        .css('top', mouse_y)
        .show()
        .focus();
}
/*
function EDITOR_MENU_onItemSelect(event)
{
    event.preventDefault();
    var target = event.target;
    switch ($(target).data('action')) {
        case "undo":
            Textspace.undo();
            break;
        case "redo":
            Textspace.redo();
            break;
    }
}
*/
function EDITOR_MENU_onFocusOut(event)
{
    $(this).hide();
}
/*
function saveDocument(event)
{
    event.preventDefault();
    event.stopPropagation();

    if($(NAME_FIELD).val() == '')
        return;
    //$(SAVING_POPUP).show();
    $.ajax({
        'type': 'POST',
        'url': Context.get('symphony') + '/extension/workspacer/ajax/'
            + Context.get('env')['0'] + '/',
        //'data': $(FORM).serialize() + "&action%5Bsave%5D=1&ajax=1",
        'data': {
            'xsrf': $('input[name="xsrf"]').val(),
            'ajax': '1',
            'action[save]': '1',
            'fields[existing_file]': $('#existing_file').val(),
            'fields[dir_path]': $('#dir_path').val(),
            'fields[dir_path_encoded]': $('#dir_path_encoded').val(),
            'fields[name]': $('input[name="fields[name]"]').val(),
            'fields[body]': Textspace.text
        },
        'dataType': 'json',
        'error': function(xhr, msg, error){
            //$('#saving-popup').hide();
            alert(error + " - " + msg);
        },
        'success': function(data){
            //$(SAVING_POPUP).hide();
            if (data.new_filename) {
                $('input[name="fields[existing_file]"]').val(data.new_filename);
                $(SUBHEADING).text(data.new_filename);
                //history.replaceState({'a': 'b'}, '', directory_url + data.new_filename_encoded + '/');
                history.replaceState(
                    {'a': 'b'}, '',
                    Symphony.Context.get('symphony') + '/workspace/editor/' + data.new_path_encoded
                );
            }
            /*if (replacement_actions) {
                $(FORM).find('div.actions').replaceWith(replacement_actions);
                replacement_actions = null;
            }
            $(NOTIFIER).trigger('attach.notify', [data.alert_msg, data.alert_type]);
            setHighlighter();
            if ($('#form-actions').hasClass('new')) {
                $('#form-actions')
                .removeClass('new')
                .addClass('edit');
            }
            // *** if (data.alert_type == 'error') window.scrollTop = 0;
        }
    });
}
*/
/*
 * Set editor up..
 */
//if (window.getSelection() == undefined) return;

//BODY = Symphony.Elements.body;
//SAVING_POPUP = $('#saving-popup');
/*    replacement_actions = $(FORM).find('div[data-replacement-actions="1"]').detach();
if (replacement_actions.length == 0) replacement_actions = null;;
*/
//in_workspace = $(BODY).is('#extension-workspace_manager_b-view');
/*in_workspace = ($(BODY).hasClass('template') == false);
if (in_workspace) {
    directory_url = Context.get('symphony')
    + Context.get('env')['page-namespace'] + '/' + $(FORM).find('input[name="fields[dir_path_encoded]"]').attr('value');
}
Textspace.text = $('#text').text();
*/
//    EDITOR_OUTER = $('#editor')[0];
//    EDITOR_LINE_NUMBERS = $('#editor-line-numbers')[0];
/*
$(BODY)
    .mouseup(function(event)
    {
        editor_resize.mouse_down = false;
    })
    .mouseleave(function(event)
    {
        editor_resize.mouse_down = false;
    });
*/
/*    $('#editor-label')
    .click(function(event) {
        EDITOR_MAIN.focus();
    });

$(EDITOR_OUTER)
    .css('height', editor_resize.height + 'px')
    //.focusin(EDITOR_OUTER_onFocusIn)
    //.focusout(EDITOR_OUTER_onFocusOut)
    .mousedown(EDITOR_OUTER_onMouseDown)
    .mouseup(function(event)
    {
        PRE_TAG.contentEditable = "true";
    })
    .on('contextmenu', function(event)
    {
        return false;
    })
*/
    /*.mouseup(function(event) {
        var s = window.getSelection().getRangeAt(0);
        positionEditorCaret();
        event.stopPropagation();
    })*/
/*
/* range.selectNode(document.body);*/

/*
$(EDITOR_MENU)
    .on('openmenu', EDITOR_MENU_onMenuOpen)
    .mouseup('li', EDITOR_MENU_onItemSelect)
    .focusout(EDITOR_MENU_onFocusOut);

    //if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes');
    /*if(!document_modified) {
        document_modified = true;
        breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>');
    }*/


/*document.querySelector('#form-actions input.new').click(saveDocument);
$('#form-actions input.edit')
    .click(saveDocument);
/*        .click(function(event) {
        if ((<HTMLInputElement> event.target).name == 'action[save]') ajax_submit = true;
        if ((<HTMLInputElement> event.target).name == 'action[delete]') ajax_submit = false;
    })
    //.submit(saveDocument);*/

// Create highligther CSS

var css_string = "";
//alert(Highlighters.length);
for (var type in Highlighters) {
    var highlighter = Highlighters[type];
    var prefix = "." + highlighter.style_prefix;
    var styles = highlighter.stylesheet;
    for (var key in styles) {
        css_string += prefix + key + " {" + styles[key] + "} ";
    }
    css_string += "\n";
}
document.getElementById('highlighter-styles').textContent = css_string;

Textspace.text = window['doc_text'];

//$(PRE_TAG).attr('style', $(EDITOR_LINE_NUMBERS).attr('style'));

//$(style_element1).text('html {height: 100%;} body{height: 100%; margin: 0; overflow: scroll;} pre {display: inline-block; min-width: 100%; white-space: pre; background-color: white; min-height: 100%; margin: 0; padding: 3px 3px 0 37px; box-sizing: border-box; -moz-box-sizing: border-box; outline: none; -moz-tab-size: 4; -webkit-tab-size: 4; -ms-tab-size: 4; cursor: text;}');
//BODY_HIGHLIGHTER_STYLES = $(BODY).find('#highlighter-styles');
//setHighlighter();
/*
window.onscroll =
        function(event)
        {
            //$(EDITOR_LINE_NUMBERS).scrollTop($(document).scrollTop());
        }

*/
var w = Settings['indentation_width'];
PRE_TAG.style.tabSize = w;
PRE_TAG.style.MozTabSize = w;
PRE_TAG.style.WebkitTabSize = Settings['indentation_width'];
PRE_TAG.style.MsTabSize = Settings['indentation_width'];
PRE_TAG.style.OTabSize = Settings['indentation_width'];

/*$(PRE_TAG)
    .focusin(BODY_onFocusIn)
    .focusout(BODY_onFocusOut);
*/
renderText();


/*
 * Create range.
 */
function createRange(start_node, start_offset, end_node, end_offset) {
    var range = d.createRange();
    range.setStart(start_node, start_offset);
    range.setEnd(end_node, end_offset);
    return range;
}

function setHighlighter()
{
    var filename, ext;

    var in_workspace = false;
    if (in_workspace) {
        //filename = $(NAME_FIELD).val();
        filename = "zart.xsl";
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = Highlighters.xsl;
    }
}

function refreshEditorDisplay()
{
    if (!editor_refresh_pending)
    {
        //requestAnimationFrame(rewriteEditorContents);
        setTimeout(rewriteEditorContents, 1)
        editor_refresh_pending = true;
    }
}

/*
 * Write updated content to editor
 */
function rewriteEditorContents()
{
    renderText();
    setEditorSelection();
    editor_refresh_pending = false;
}

/*
 * Fill editor with highlighted text..
 */

function renderText()
{
    var frag, lines, num_lines;

    PRE_TAG.innerHTML = '';
var syntax_highlighter = Highlighters['xsl'];
    if (Textspace.text) {
        frag = d.createDocumentFragment();
        if (syntax_highlighter) {
            lines = syntax_highlighter.highlight(Textspace.text);
            for (var _i = 0; _i < lines.length;) {
                if (lines[_i])
                    frag.appendChild(lines[_i]);
                else
                    frag.appendChild(d.createTextNode(""));
                if (++_i < lines.length)
                    //frag.appendChild(d.createElement('br'));
                    frag.appendChild(d.createTextNode("\n"));
            }
        }
        else {
            lines = Textspace.text.split("\n");
            for (var _i = 0; _i < lines.length;) {
                frag.appendChild(d.createTextNode(lines[_i]));
                if (++_i < lines.length)
                    frag.appendChild(d.createTextNode("\n"));
            }

        }

        PRE_TAG.appendChild(frag);
        num_lines = lines.length;
    }
    else {
        frag = d.createElement('span');
        frag.appendChild(d.createTextNode(""));
        PRE_TAG.appendChild(frag);
        num_lines = 1;
    }

    parent.displayLineNumbers(num_lines, $(PRE_TAG).height());
    // Line numbers
    //$(EDITOR_LINE_NUMBERS).height($(EDITOR_MAIN).height());
    //$(EDITOR_LINE_NUMBERS).height(EDITOR_MAIN.clientHeight);

    //$(EDITOR_OUTER)
        //.width(panel.editor.clientWidth);
        //.css('width', panel.editor.clientWidth + 'px')
    //$(EDITOR_MAIN)
        //.css('minWidth', EDITOR_MAIN.clientWidth + 'px')
        //.css('minHeight', (editor.clientHeight - 4) + 'px');
    /*$(PRE_TAG)
        .css('minWidth', (EDITOR_MAIN.clientWidth - 42) + 'px')
        .css('minHeight', (EDITOR_MAIN.clientHeight - 4) + 'px');*/
}

/*
 * Caret.
 */
function setEditorSelection()
{
    var range = d.createRange();
    if (Textspace.text) {
        var pos = Textspace.selection;
        //console.log("pos.start = " + pos.start);
        var node_start = findNodeByPos(pos.start),
            node_end;
        if (pos.end) {
            node_end = findNodeByPos(pos.end);
        } else {
            node_end = node_start;
        }
        range.setStart(node_start.node, node_start.offset);
        range.setEnd(node_end.node, node_end.offset);
    } else {
        range.setStart(PRE_TAG.firstChild,0);
        range.setEnd(PRE_TAG.firstChild,0);
    }
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function findNodeByPos(pos: number)
{
    var node: any, offset;
    var found: any;

    /*if (pos == 0) {
        node = PRE_TAG.firstChild;
        offset = 0;
    } else {*/
        var iterator = document.createNodeIterator(PRE_TAG, NodeFilter.SHOW_TEXT, null, false);
        while (node = iterator.nextNode()) {
            //console.log(node.nodeName);
            offset = pos;
            //if (node.nodeType == 3) {
            pos -= node.length;
            /*} else if (node.nodeName.toLowerCase() == "br") {
                //alert(node.nodeName.toLowerCase());
                pos--;
            }*/
            if (node.nodeValue == "\n") continue;
            if (pos <= 0) {
                found = node;
                break;
            }
        }
        //if (!found) alert("Not found");
        if (!found) {
            node = d.createTextNode("");
            PRE_TAG.appendChild(node);
            offset = 0;
        }
    //}
    //if (!found) alert("Not found");
    return {'node': node, 'offset': offset};
}
    /*var pos = $(panel.caret).position();
    if (EDITOR_MAIN.scrollTop > pos.top)
        EDITOR_MAIN.scrollTop = pos.top - y_margin;
    var n = pos.top + editor.selection.clientHeight - EDITOR_MAIN.clientHeight;
    if(n > EDITOR_MAIN.scrollTop) EDITOR_MAIN.scrollTop = n + y_margin;*/

    /*n = pos.left - x_margin;
    if(EDITOR_MAIN.scrollLeft > n) EDITOR_MAIN.scrollLeft = n;
    n = pos.left + x_margin + editor.selection.clientWidth - EDITOR_MAIN.clientWidth + gutter_width;
    if(n > EDITOR_MAIN.scrollLeft) EDITOR_MAIN.scrollLeft = n;
}*/
