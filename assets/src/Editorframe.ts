declare var document: Document;
declare var window: Window;
declare var contentWindow;
declare var contentDocument;
declare var Symphony;

var d = document;

// Functions will be placed here by highlighter modules.
Symphony.Extensions['WorkspaceManager'] = {'highlighters': {}};


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
    PRE = document.querySelector('pre'),
    EDITOR_MENU;

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
    $(EDITOR_MAIN_PRE).focus();
}

function EDITOR_MAIN_onMouseUp(event)
{
    Textspace.registerCaretPos();
}

function EDITOR_MAIN_onKeyDown(event)
{
    var key = event.which;
    last_key_code = key;
    var char = String.fromCharCode(key);

    if (event.metaKey || event.ctrlKey) {
        switch (char.toLowerCase()) {
            case "s":
                event.preventDefault();
                $('input[name="action[save]"]').trigger('click');
                break;
            case "y":
                event.preventDefault();
                Textspace.redo();
                break;
            case "z":
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
    } else if (key == 9) {
        event.preventDefault();
        Textspace.action("InsertChar", "\t");
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
    //refreshEditorDisplay();
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
    event.preventDefault();
    Textspace.action("Cut");//, event.originalEvent.clipboardData.getData('text'));
}

function EDITOR_MAIN_onPaste(event)
{
    event.preventDefault();
    var pasted = event.originalEvent.clipboardData.getData('text');
    Textspace.action("Paste", event.originalEvent.clipboardData.getData('text'));
    //refreshEditorDisplay();
}
/*
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
    }
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
*/
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

/*
 * Set editor up..
 */
    //alert(top);
    BODY = Symphony.Elements.body;
    NOTIFIER = top.Symphony.Elements.header.querySelector('div.notifier');
    //SAVING_POPUP = $('#saving-popup');
    //replacement_actions = $(FORM).find('div[data-replacement-actions="1"]').detach();
    //if(replacement_actions.length == 0) replacement_actions = null;;

    EDITOR_LINE_NUMBERS = top.document.querySelector('#editor-line-numbers');

    PRE.onmouseup = EDITOR_MAIN_onMouseUp;
    PRE.onkeydown = EDITOR_MAIN_onKeyDown;
    PRE.onkeypress = EDITOR_MAIN_onKeyPress;
    PRE.keyup = EDITOR_MAIN_onKeyUp;
    PRE.oncut = EDITOR_MAIN_onCut;
    PRE.onpaste = EDITOR_MAIN_onPaste;

    //    .focusin(EDITOR_MAIN_onFocusIn)
    //    .focusout(EDITOR_MAIN_onFocusOut);

/*        .on('contextmenu', function(event)
        {
            return false;
        })
        .on('dragstart', function(event)
        {
            event.preventDefault();
            return false;
        })

        /*.mouseup(function(event) {
            var s = window.getSelection().getRangeAt(0);
            positionEditorCaret();
            event.stopPropagation();
        })*/
    //$(EDITOR_MAIN_PRE)
    /*
    /* range.selectNode(document.body);*/
/*
    $(EDITOR_LINE_NUMBERS)
        .mousedown(EDITOR_LINE_NUMBERS_onMouseDown);

    $(EDITOR_MENU)
        .on('openmenu', EDITOR_MENU_onMenuOpen)
        .mouseup('li', EDITOR_MENU_onItemSelect)
        .focusout(EDITOR_MENU_onFocusOut);



    $(EDITOR_MAIN.contentDocument.body)
        .attr('spellcheck', 'false')
        .append(EDITOR_MAIN_PRE)
        .mouseup(EDITOR_MAIN_onMouseUp)
        .keydown(EDITOR_MAIN_onKeyDown)
        .keypress(EDITOR_MAIN_onKeyPress)
        .keyup(EDITOR_MAIN_onKeyUp)
        .on('cut', EDITOR_MAIN_onCut)
        .on('paste', EDITOR_MAIN_onPaste);

    $(EDITOR_MAIN_PRE)
        .focusin(EDITOR_MAIN_onFocusIn)
        .focusout(EDITOR_MAIN_onFocusOut);
*/
    $(EDITOR_MAIN.contentWindow)
        .scroll(
            function(event)
            {
                $(EDITOR_LINE_NUMBERS).scrollTop(EDITOR_MAIN.contentDocument.body.scrollTop);
            }
        );
    renderText();
}

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
    var highlighters = Symphony.Extensions.WorkspaceManager.highlighters,
        highlighter,
        filename,
        ext;

    if (in_workspace) {
        filename = $(NAME_FIELD).val();
        var last_dot = filename.lastIndexOf(".");
        if (last_dot > 0) {
            ext = filename.slice(last_dot + 1);
            syntax_highlighter = Symphony.Extensions.WorkspaceManager.highlighters[ext];
        }
        else
            syntax_highlighter = null;
    }
    else {
        syntax_highlighter = highlighters.xsl;
    }
    if (syntax_highlighter) {
        // Set up CSS
        var styles = syntax_highlighter.stylesheet;
        var prefix = "." + syntax_highlighter.style_prefix;
        var css_string = "";
        for (var key in styles) {
            css_string += prefix + key + " {" + styles[key] + "} ";
        }
        $(style_element2).text(css_string);
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

    PRE.innerHTML = "";

    if (Textspace.text) {
        frag = d.createDocumentFragment();
        if (syntax_highlighter) {
            lines = syntax_highlighter.highlight(Textspace.text);
            for (var _i = 0; _i < lines.length;) {
                if (lines[_i])
                    frag.appendChild(lines[_i]);
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
                    frag.appendChild(d.createElement('br'));
            }

        }

        EDITOR_MAIN_PRE.appendChild(frag);
        num_lines = lines.length;
    }
    else {
        EDITOR_MAIN_PRE.appendChild(d.createTextNode(""));
        num_lines = 1;
    }

    // Line numbers
    //$(EDITOR_LINE_NUMBERS).height($(EDITOR_MAIN).height());
    //$(EDITOR_LINE_NUMBERS).height(EDITOR_MAIN.clientHeight);

    var l = '';
    for (var i = 1; i < num_lines; i++) {
        l += (i + "\n");
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
    var pos = Textspace.selection;
    //console.log("pos.start = " + pos.start);
    var node_start = findNodeByPos(pos.start),
        node_end;
    if (pos.end) {
        node_end = findNodeByPos(pos.end);
    } else {
        node_end = node_start;
    }
    var range = d.createRange();
    range.setStart(node_start.node, node_start.offset);
    range.setEnd(node_end.node, node_end.offset);
    var sel = EDITOR_MAIN.contentWindow.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function findNodeByPos(pos: number)
{
    if (true) {
        var iterator = EDITOR_MAIN.contentDocument.createNodeIterator(EDITOR_MAIN_PRE, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
        var node: any;
        var offset;
        while (node = iterator.nextNode()) {
            //console.log(node.nodeName);
            offset = pos;
            if (node.nodeType == 3) {
                pos -= node.length;
            } else if (node.nodeName.toLowerCase() == "br") {
                //alert(node.nodeName.toLowerCase());
                pos--;
            }
            if (pos < 0)
                break;
        }
        return {'node': node, 'offset': offset};
    }
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
