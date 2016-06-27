window.Textspace = require('./textspace.coffee')
window.Actions = require('./actions.coffee')

$ = window.parent.jQuery

Symphony = window.parent.Symphony
#Settings = Symphony.Extensions.Workspacer['settings'];
Context = Symphony.Context

# Document parts
BODY = document.body
PRE_TAG = document.querySelector('pre')

last_key_code = null
caret_moved = false

x_margin = 3
y_margin = 2
in_workspace = !($(parent.document.body).data('0') == 'template' or $(parent.document.body).hasClass('template'))

#in_workspace = ($(parent.document.body).data('0') != 'template')
new_file = null
document_modified = false
syntax_highlighter = null

editor_height = null

editor_refresh_pending = false

window.setHighlighter = (filename) ->
    if in_workspace
        if !filename
            filename = $(parent.document).find('#existing_file').val()
        last_dot = filename.lastIndexOf(".")
        if last_dot > 0
            ext = filename.slice(last_dot + 1)
            syntax_highlighter = window.Highlighters[ext]
        else
            syntax_highlighter = null

    else
        syntax_highlighter = Highlighters.xsl

    renderText()

#
# Write updated content to editor
#
rewriteEditorContents = ->
    renderText()
    setEditorSelection()
    editor_refresh_pending = false

#
# Fill editor with highlighted text..
#
renderText = ->
    #setHighlighter()
    PRE_TAG.innerHTML = ''
    if Textspace.getText()
        frag = document.createDocumentFragment()
        if syntax_highlighter
            lines = syntax_highlighter.highlight(Textspace.getText())
            for _i in [0...lines.length]
                sec = document.createElement('section')
                if lines[_i]
                    sec.appendChild(lines[_i])
                else
                    sec.appendChild(document.createTextNode(""))
                if (_i < (lines.length - 1))
                #sec.appendChild(document.createElement('br'))
                    sec.appendChild(document.createTextNode("\n"))
                else
                    sec.appendChild(document.createElement('br'))
                    #frag.appendChild(document.createTextNode("\n"))
                #else:
                    #frag.appendChild(document.createElement('br'))
                frag.appendChild(sec)
        else
            lines = Textspace.getText().split("\n")
            for _i in [0...lines.length]
                #frag.appendChild(document.createTextNode(lines[_i]))
                #if (_i < (lines.length - 1))
                #    frag.appendChild(document.createTextNode("\n"))

                sec = document.createElement('section')
                if lines[_i]
                    sec.appendChild(document.createTextNode(lines[_i]))
                else
                    sec.appendChild(document.createTextNode(""))
                if (_i < (lines.length - 1))
                #sec.appendChild(document.createElement('br'))
                    sec.appendChild(document.createTextNode("\n"))
                else
                    sec.appendChild(document.createElement('br'))
                    #frag.appendChild(document.createTextNode("\n"))
                #else:
                    #frag.appendChild(document.createElement('br'))
                frag.appendChild(sec)

        PRE_TAG.appendChild(frag)
        num_lines = lines.length
    else
        #frag = document.createElement('section')
        #frag.appendChild(document.createTextNode(""))
        #frag.appendChild
        #PRE_TAG.appendChild(frag)
        PRE_TAG.innerHTML = "<section></section><br>"
        num_lines = 1

    parent.window.displayLineNumbers(num_lines) #, $(PRE_TAG).height())
    #$(EDITOR_MAIN)
        #.css('minWidth', EDITOR_MAIN.clientWidth + 'px')
        #.css('minHeight', (editor.clientHeight - 4) + 'px')

#
# Create range.
#
createRange = (start_node, start_offset, end_node, end_offset) ->
    r = document.createRange()
    r.setStart(start_node, start_offset)
    r.setEnd(end_node, end_offset)
    return r

#
# Caret.
#
setEditorSelection = ->
    r = document.createRange()
    if (Textspace.getText())
        pos = Textspace.getSelection()
        #console.log("pos.start = " + pos.start)
        node_start = findNodeByPos(pos.start)
        node_end = null
        if (pos.end)
            node_end = findNodeByPos(pos.end)
        else
            node_end = node_start
        r.setStart(node_start.node, node_start.offset)
        r.setEnd(node_end.node, node_end.offset)
    else
        r.setStart(PRE_TAG.firstChild,0)
        r.setEnd(PRE_TAG.firstChild,0)
        node_start = findNodeByPos(0)

    sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(r)

    el = node_start.node.parentNode
    if el.nodeName.toLowerCase() != "pre"
        rect = el.getBoundingClientRect()
        o = rect.bottom - $(document.body).height()
        if o > 0
            $(window).scrollTop($(window).scrollTop() + Math.round(o))

findNodeByPos = (pos) ->
    if pos == 0
        node = PRE_TAG.firstChild
        offset = 0
    else
        iterator = document.createNodeIterator(PRE_TAG, NodeFilter.SHOW_TEXT, null, false)
        while (node = iterator.nextNode())
            #console.log(node.nodeName)
            offset = pos
            if node.nodeType == 3
                pos -= node.length
            else if node.nodeName.toLowerCase() == "br"
                #alert(node.nodeName.toLowerCase())
                pos -=1

            if node.nodeValue == "\n"
                continue
            if pos <= 0
                found = node
                break
        #if (!found) alert("Not found")
        if !found
            node = document.createTextNode("")
            PRE_TAG.appendChild(node)
            offset = 0
    #if (!found) alert("Not found")
    return {'node': node, 'offset': offset}

#
# Editor defs
#

$(BODY)
.focusin((event) ->
    $(parent.document).trigger('editor-focusin')
)
.focusout((event) ->
    $(parent.document).trigger('editor-focusout')
)

$(document)
.scroll((event) ->
    $(parent.document).trigger('editor-scrolltop', $(window).scrollTop())
)

#def BODY_onMouseUp(event) ->
#    Textspace.registerCaretPos()

$(PRE_TAG)
.mouseup((event) ->
    Textspace.registerCaretPos()
)
.keydown((event) ->
    key = event.which
    last_key_code = key
    char = String.fromCharCode(key)

    if event.metaKey or event.ctrlKey
        # left arrow
        if key == 37 and !Textspace.selection.collapsed
            Textspace.action("IndentLeft")
        else if key == 39 and !Textspace.selection.collapsed
            event.preventDefault()
            Textspace.action("IndentRight")
        else if key == 83 # "s"
            event.preventDefault()
            event.stopPropagation()
            $(parent.document).trigger('save-doc')
        else if key == 89 # "y"
            event.preventDefault()
            Textspace.redo()
        else if key == 90 # "z"
            event.preventDefault()
            Textspace.undo()
        return

    if key == 8
        event.preventDefault()
        Textspace.action("Delete")
    else if key == 9 #tab character
        event.preventDefault()
        if Settings['indentation_method'] == "spaces"
            ind_width = Settings['indentation_width']
            slices = Textspace.getEditorTextSlices()
            count = 0
            if slices.before
                string = slices.before.split("\n").pop()
                # Count characters
                for i in [0...string.length]
                    if (string[i] == "\t")
                        count = count + ind_width - (count % ind_width)
                    else
                        count++ # += 1

            spaces = ""
            for i in [0...(ind_width - (count % ind_width))]
                spaces += " "
            Textspace.action("InsertChar", spaces)

        else
            Textspace.action("InsertChar", "\t")
    else if key == 13
        event.preventDefault()
        Textspace.action("InsertLineBreak")
    else if key == 46
        event.preventDefault()
        Textspace.action("ForwardsDelete")
    #if(([8, 13, 32, 45, 46].indexOf(key) != -1) or (key >= 48 and key <= 90) or (key >= 163 and key <= 222))
)
.keypress((event) ->
    if event.metaKey or event.ctrlKey
        return

    key = event.which
    if key < 32
        return

    char = String.fromCharCode(key)

    event.preventDefault()
    Textspace.action("InsertChar", char)
)
.keyup((event) ->
    key = event.which
    if key >= 33 and key <= 40
        Textspace.registerCaretPos()
)
.on('cut', (event) ->
    Textspace.action("Cut")#, event.originalEvent.clipboardData.getData('text'))
)
.on('paste', (event) ->
    event.preventDefault()
    #pasted = event.originalEvent['clipboardData'].getData('text')
    Textspace.action("Paste", event.originalEvent['clipboardData'].getData('text'))
)

EDITOR_OUTER_onMouseDown = (event) ->
    if event.which == 3 and $(EDITOR_MENU).is(':hidden')
        event.preventDefault()
        #event.stopPropagation()
        $(EDITOR_MENU).trigger('openmenu', [event.clientX, event.clientY])
        PRE_TAG.contentEditable = null

EDITOR_MENU_onMenuOpen = (event, mouse_x, mouse_y) ->
    if $(this).is(':visible')
        event.stopPropagation()
        return

    ul = document.createElement('ul')
    li = document.createElement('li')
    legend = document.createTextNode("Undo")
#       if (Textspace.undo_stack.length > 0) {
#       li.className="active";
#       $(li).data("action", "undo")
#       legend.textContent = "Undo " + doings[$(Textspace.history).get(-1).action];
    li.appendChild(legend)
    ul.appendChild(li)
    $(this)
    .empty()
    .append(ul)
    .css('left', mouse_x)
    .css('top', mouse_y)
    .show()
    .focus()

EDITOR_MENU_onItemSelect = (event) ->
    event.preventDefault()
    target = event.target
    action = $(target).data('action')
    if action = "undo"
        Textspace.undo()
    else if action = "redo"
        Textspace.redo()

#EDITOR_MENU_onFocusOut(event)
#    $(this).hide()

#    .on('contextmenu', def(event)
#        return false;

    #.mouseup(def(event) ->
#        s = window.getSelection().getRangeAt(0)
#        positionEditorCaret()
#        event.stopPropagation()

#range.selectNode(document.body)

#$(EDITOR_MENU)
#.on('openmenu', EDITOR_MENU_onMenuOpen)
#.mouseup('li', EDITOR_MENU_onItemSelect)
#.focusout(EDITOR_MENU_onFocusOut)

    #if(!$(body).hasClass('unsaved-changes')) $(body).addClass('unsaved-changes')
    #if(!document_modified) {
    #    document_modified = true;
    #    breadcrumbs_filename.html(breadcrumbs_filename.html() + ' <small>↑</small>')


# Create highligther CSS

css_string = ""
for k, highlighter of window.Highlighters
    prefix = ".#{highlighter.style_prefix}"
    styles = highlighter.stylesheet
    for key, value of styles
        css_string += "#{prefix + key} {#{value}}\n"

document.getElementById('highlighter-styles').textContent = css_string

#Textspace.setText(window.doc_text)
#Textspace.setText(document.querySelector('pre').innerHTML)
Textspace.setText(PRE_TAG.textContent)
#alert PRE_TAG.innerHTML

w = Settings['indentation_width']
PRE_TAG.style.tabSize = w
PRE_TAG.style.MozTabSize = w
PRE_TAG.style.WebkitTabSize = Settings['indentation_width']
PRE_TAG.style.MsTabSize = Settings['indentation_width']
PRE_TAG.style.OTabSize = Settings['indentation_width']

setHighlighter()
#renderText()


$(document).on('refreshEditorDisplay', (event) ->
    if !editor_refresh_pending
        #requestAnimationFrame(rewriteEditorContents)
        setTimeout(rewriteEditorContents, 1)
        editor_refresh_pending = true
)


#    pos = $(panel.caret).position()
#    if (EDITOR_MAIN.scrollTop > pos.top)
#        EDITOR_MAIN.scrollTop = pos.top - y_margin;
#    n = pos.top + editor.selection.clientHeight - EDITOR_MAIN.clientHeight;
#    if(n > EDITOR_MAIN.scrollTop) EDITOR_MAIN.scrollTop = n + y_margin;*/

#   /*n = pos.left - x_margin;
#    if(EDITOR_MAIN.scrollLeft > n) EDITOR_MAIN.scrollLeft = n;
#    n = pos.left + x_margin + editor.selection.clientWidth - EDITOR_MAIN.clientWidth;
#    if (n > EDITOR_MAIN.scrollLeft) EDITOR_MAIN.scrollLeft = n;

window.getText = ->
    return Textspace.getText()
