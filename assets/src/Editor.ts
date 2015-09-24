/// <reference path="jquery.d.ts"/>
/// <reference path="Textspace.ts"/>
/// <reference path="Actions.ts"/>

declare var document: Document;
declare var window: Window;
declare var contentWindow;
declare var contentDocument;
declare var Symphony;
declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;

var d = document;

// Functions will be placed here by highlighter modules.
//Symphony.Extensions['Workspacer'] = {'highlighters': {}};

var settings = Symphony.Extensions.Workspacer['settings'];
var Settings = settings;

// Functions for highlighter modules.

$.fn.appendText = function(text)
{
    this.each(function() {
        $(this).append(d.createTextNode(text));
    });
};

$.fn.appendSpan = function(class_name, text)
{
    this.each(function() {
        var span = d.createElement('span');
        span.className = class_name;
        span.appendChild(d.createTextNode(text));
        $(this).append(span);
    });
};

// Document parts
var BODY,
    NOTIFIER,
    CONTEXT,
    SUBHEADING,
    CONTENTS,
    FORM,
    NAME_FIELD,
    SAVING_POPUP;

// Editor parts
var EDITOR_OUTER,
    EDITOR_LINE_NUMBERS,
    EDITOR_MAIN,
    EDITOR_MAIN_HIGHLIGHTER_STYLES,
    EDITOR_MAIN_PRE,
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
        EDITOR_MAIN_PRE.contentEditable = false;
    }
}

function EDITOR_MAIN_onFocusIn(event)
{
    if (!($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).addClass('focus');
        //positionEditorCaret();
    }
}

function EDITOR_MAIN_onFocusOut(event)
{
    if (($(EDITOR_OUTER).hasClass('focus'))) {
        $(EDITOR_OUTER).removeClass('focus');
        EDITOR_MAIN_PRE.contentEditable = "true";
        //positionEditorCaret();
    }
}

function EDITOR_LINE_NUMBERS_onMouseDown(event)
{
    event.preventDefault();
    EDITOR_MAIN.focus();
}

function EDITOR_MAIN_onMouseUp(event)
{
    Textspace.registerCaretPos();
}

function EDITOR_MAIN_onKeyDown(event)
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
        if (settings['indentation_method'] == "spaces") {
            var ind_width = settings['indentation_width'];
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
}

function EDITOR_MAIN_onKeyPress(event)
{
    if (event.metaKey || event.ctrlKey)
        return;

    var key = event.which;
    if (key < 32)
        return;

    var char = String.fromCharCode(key);

    event.preventDefault();
    Textspace.action("InsertChar", char);
}

function EDITOR_MAIN_onKeyUp(event)
{
    var key = event.which;
    if (key >= 33 && key <= 40) {
        Textspace.registerCaretPos();
    }
}

function EDITOR_MAIN_onCut(event)
{
    //event.preventDefault();
    Textspace.action("Delete");//, event.originalEvent.clipboardData.getData('text'));
}

function EDITOR_MAIN_onPaste(event)
{
    event.preventDefault();
    var pasted = event.originalEvent.clipboardData.getData('text');
    Textspace.action("Paste", event.originalEvent.clipboardData.getData('text'));
}

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

function EDITOR_MENU_onFocusOut(event)
{
    $(this).hide();
}

function saveDocument(event)
{
    event.preventDefault();
    event.stopPropagation();

    if($(NAME_FIELD).val() == '')
        return;
    //$(SAVING_POPUP).show();
    $.ajax({
        'type': 'POST',
        'url': Symphony.Context.get('symphony') + '/extension/workspacer/ajax/'
            + Symphony.Context.get('env')['0'] + '/',
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
            }*/
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

/*
 * Set editor up..
 */
$().ready(function()
{
    //if (window.getSelection() == undefined) return;

    //$('#editor-main').ready(editorMainReady);

    BODY = Symphony.Elements.body;
    NOTIFIER = $(Symphony.Elements.header).find('div.notifier');
    SUBHEADING = $('#symphony-subheading');
    CONTENTS = Symphony.Elements.contents;
    FORM = (CONTENTS).find('form');
    NAME_FIELD = $(FORM).find('input[name="fields[name]"]');
    SAVING_POPUP = $('#saving-popup');
/*    replacement_actions = $(FORM).find('div[data-replacement-actions="1"]').detach();
    if (replacement_actions.length == 0) replacement_actions = null;;
*/
    //in_workspace = $(BODY).is('#extension-workspace_manager_b-view');
    in_workspace = ($(BODY).hasClass('template') == false);
    if (in_workspace) {
        directory_url = Symphony.Context.get('symphony')
        + Symphony.Context.get('env')['page-namespace'] + '/' + $(FORM).find('input[name="fields[dir_path_encoded]"]').attr('value');
    }
    Textspace.text = $('#text').text();

    EDITOR_OUTER = $('#editor')[0];
    EDITOR_LINE_NUMBERS = $('#editor-line-numbers')[0];
    //EDITOR_MENU = $('#editor-menu')[0];
    EDITOR_RESIZE_HANDLE = $('#editor-resize-handle')[0];

    EDITOR_MAIN = $('#editor-main')[0];

    $(BODY)
        .mouseup(function(event)
        {
            editor_resize.mouse_down = false;
        })
        .mouseleave(function(event)
        {
            editor_resize.mouse_down = false;
        });

    $('#editor-label')
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
            EDITOR_MAIN_PRE.contentEditable = "true";
        })
        .on('contextmenu', function(event)
        {
            return false;
        })

        /*.mouseup(function(event) {
            var s = window.getSelection().getRangeAt(0);
            positionEditorCaret();
            event.stopPropagation();
        })*/
    /*
    /* range.selectNode(document.body);*/

    $(EDITOR_LINE_NUMBERS)
        .mousedown(EDITOR_LINE_NUMBERS_onMouseDown);

    $(EDITOR_MENU)
        .on('openmenu', EDITOR_MENU_onMenuOpen)
        .mouseup('li', EDITOR_MENU_onItemSelect)
        .focusout(EDITOR_MENU_onFocusOut);

    $(EDITOR_RESIZE_HANDLE)
        .mousedown(
            function(event)
            {
                editor_resize.mouse_down = true;
                editor_resize.pointer_y = event.pageY;
            }
        )
        .mousemove(
            function(event)
            {
                if (editor_resize.mouse_down == false) return;
                                    //alert(editor_resize.pointer_y);
                editor_resize.height += event.pageY - editor_resize.pointer_y;
                editor_resize.pointer_y = event.pageY;
                EDITOR_OUTER.style.height = editor_resize.height + 'px';
                EDITOR_LINE_NUMBERS.style.height = EDITOR_MAIN.clientHeight + 'px';
            }
        )
        .mouseleave(
            function(event)
            {
                editor_resize.mouse_down = false;
            }
        );

        //if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes');
        /*if(!document_modified) {
            document_modified = true;
            breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>');
        }*/

    $(NAME_FIELD).keydown(function(event) {
        if (event.which == 13) ajax_submit = true;
        event.stopPropagation();
    });

    $('#form-actions input.new')
        .click(saveDocument);
    $('#form-actions input.edit')
        .click(saveDocument);
/*        .click(function(event) {
            if ((<HTMLInputElement> event.target).name == 'action[save]') ajax_submit = true;
            if ((<HTMLInputElement> event.target).name == 'action[delete]') ajax_submit = false;
        })
        //.submit(saveDocument);*/
});

/*
 * Iframe ready
 */
$(document).on("editor-main-ready", function(event)
{
    Textspace.text = $('#text').text();

    //$(EDITOR_MAIN_PRE).attr('style', $(EDITOR_LINE_NUMBERS).attr('style'));

    //$(style_element1).text('html {height: 100%;} body{height: 100%; margin: 0; overflow: scroll;} pre {display: inline-block; min-width: 100%; white-space: pre; background-color: white; min-height: 100%; margin: 0; padding: 3px 3px 0 37px; box-sizing: border-box; -moz-box-sizing: border-box; outline: none; -moz-tab-size: 4; -webkit-tab-size: 4; -ms-tab-size: 4; cursor: text;}');
    EDITOR_MAIN_HIGHLIGHTER_STYLES = $(EDITOR_MAIN.contentDocument.head).find('#highlighter-styles');
    setHighlighter();

    $(EDITOR_MAIN.contentWindow)
        .scroll(
            function(event)
            {
                $(EDITOR_LINE_NUMBERS).scrollTop($(EDITOR_MAIN.contentDocument).scrollTop());
            }
        );

    $(EDITOR_MAIN.contentDocument.body)
        .mouseup(EDITOR_MAIN_onMouseUp)
        .keydown(EDITOR_MAIN_onKeyDown)
        .keypress(EDITOR_MAIN_onKeyPress)
        .keyup(EDITOR_MAIN_onKeyUp)
        .on('cut', EDITOR_MAIN_onCut)
        .on('paste', EDITOR_MAIN_onPaste)
        .on('dragstart', function(event)
        {
            event.preventDefault();
            return false;
        });

    EDITOR_MAIN_PRE = $(EDITOR_MAIN.contentDocument).find('pre')[0];

    EDITOR_MAIN_PRE.style.tabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.MozTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.WebkitTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.MsTabSize = settings['indentation_width'];
    EDITOR_MAIN_PRE.style.OTabSize = settings['indentation_width'];

    $(EDITOR_MAIN_PRE)
        .focusin(EDITOR_MAIN_onFocusIn)
        .focusout(EDITOR_MAIN_onFocusOut);

    renderText();
});

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

    if (in_workspace) {
        filename = $(NAME_FIELD).val();
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Symphony.Extensions.Workspacer.highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = Symphony.Extensions.Workspacer.highlighters.xsl;
    }

    if (syntax_highlighter) {
        // Set up CSS
        var styles = syntax_highlighter.stylesheet;
        var prefix = "." + syntax_highlighter.style_prefix;
        var css_string = "";
        for (var key in styles) {
            css_string += prefix + key + " {" + styles[key] + "} ";
        }
        $(EDITOR_MAIN_HIGHLIGHTER_STYLES).text(css_string);
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

    $(EDITOR_MAIN_PRE).empty();

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

        EDITOR_MAIN_PRE.appendChild(frag);
        num_lines = lines.length;
    }
    else {
        frag = d.createElement('span');
        frag.appendChild(d.createTextNode(""));
        EDITOR_MAIN_PRE.appendChild(frag);
        num_lines = 1;
    }

    // Line numbers
    //$(EDITOR_LINE_NUMBERS).height($(EDITOR_MAIN).height());
    //$(EDITOR_LINE_NUMBERS).height(EDITOR_MAIN.clientHeight);

    var l = '';
    for (var i = 0; i < num_lines; i++) {
        l += ((i + 1) + "\n");
    }
    $(EDITOR_LINE_NUMBERS)
        .html(l + '<br>')
        .css('height', EDITOR_MAIN.contentDocument.body.clientHeight + 'px');

    //$(EDITOR_OUTER)
        //.width(panel.editor.clientWidth);
        //.css('width', panel.editor.clientWidth + 'px')
    //$(EDITOR_MAIN)
        //.css('minWidth', EDITOR_MAIN.clientWidth + 'px')
        //.css('minHeight', (editor.clientHeight - 4) + 'px');
    /*$(EDITOR_MAIN_PRE)
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
        range.setStart(EDITOR_MAIN_PRE.firstChild,0);
        range.setEnd(EDITOR_MAIN_PRE.firstChild,0);
    }
    var sel = EDITOR_MAIN.contentWindow.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function findNodeByPos(pos: number)
{
    var node: any, offset;
    var found: any;

    /*if (pos == 0) {
        node = EDITOR_MAIN_PRE.firstChild;
        offset = 0;
    } else {*/
        var iterator = EDITOR_MAIN.contentDocument.createNodeIterator(EDITOR_MAIN_PRE, NodeFilter.SHOW_TEXT, null, false);
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
            EDITOR_MAIN_PRE.appendChild(node);
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
