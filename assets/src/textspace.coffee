# textspace.coffee

$ = window.parent.jQuery

exports.PRE_TAG = document.querySelector('pre')

exports.selection = {'start': null, 'end': null, 'collapsed': null}
exports.caret_positioned = false

exports.undo_stack = []
exports.redo_stack = []

exports.getSelection = ->
    return @selection

_text = ""

exports.getText = ->
    return @_text

exports.setText = (text) ->
    @_text = text

#
# Perform a named action
#
exports.action = (action_name, new_text) ->
    try
        @selection = @getSelectionPoints()
        #alert("Sstart: " + @selection.start)
        action_class = Actions[action_name]

        last_item = null
        add_to_stack = true

        if @undo_stack.length > 0 and !@caret_positioned
            last_item = @undo_stack[@undo_stack.length - 1]
            if (last_item.isUpdatable() and last_item.getName() == action_name)
                last_item.update(new_text)
                add_to_stack = false

        if add_to_stack
            @undo_stack.push(new action_class(new_text))
            @redo_stack = []

        @caret_positioned = false
        $(document).trigger('refreshEditorDisplay')

    catch error
        if error
            alert(error.name + " : " + error.message)
        #else
        #    alert("Can't do!")

#
# Undo last action
#
exports.undo = ->
    if @undo_stack.length > 0
        last_item = @undo_stack.pop()
        @redo_stack.push(last_item)
        last_item.undo()
        $(document).trigger('refreshEditorDisplay')

#
# Redo last undo
#
exports.redo = ->
    if @redo_stack.length > 0
        last_item = @redo_stack.pop()
        @undo_stack.push(last_item)
        last_item.redo()
        $(document).trigger('refreshEditorDisplay')

exports.setSelection = (start, end) ->
    end = if (end == undefined) then start else end
    @selection = {'start': start, 'end': end, 'collapsed': (start == end)}

exports.selectionCollapsed = ->
    return (@selection.start == @selection.end)

exports.textInsert = (pos, new_text) ->
    @_text = @_text.slice(0, pos) + new_text + @_text.slice(pos)

exports.textRemove = (pos) ->
    removed = @_text.slice(pos.start, pos.end)
    @_text = @_text.slice(0, pos.start) + @_text.slice(pos.end)
    return removed

exports.textReplace = (pos, new_text) ->
    @_text = @_text.slice(0, pos.start) + new_text + @_text.slice(pos.end)

exports.replaceSelection = (new_text) ->
    slices = @getEditorTextSlices()
    @_text = slices.before + new_text + slices.after
    return {'position': slices.before.length, 'text': slices.selected}

exports.registerCaretPos = ->
    @selection = @getSelectionPoints()
    @caret_positioned = true

exports.getSelectionPoints = ->
    sel = window.getSelection()
    s0 = sel.getRangeAt(0)
    start_node = s0.startContainer
    start_offset = s0.startOffset
    return {
        'start': @caretPosFromNode(start_node, start_offset),
        'end': @caretPosFromNode(s0.endContainer, s0.endOffset),
        'collapsed': s0.collapsed
    }

exports.caretPosFromNode = (node, offset) ->
    r = document.createRange()
    r.setStart(@PRE_TAG, 0)
    r.setEnd(node, offset)
    div = document.createElement('div')
    div.appendChild(r.cloneContents())
    return $(div).find('br').length + $(div).text().length

exports.getEditorTextSlices = ->
    sel = window.getSelection().getRangeAt(0)
    r = document.createRange()
    slices = {
        'before': "",
        'selected': "",
        'after': ""
    }
    r.setStart(@PRE_TAG, 0)
    r.setEnd(sel.startContainer, sel.startOffset)
    slices.before = @getTextFromRange(r)
    if !sel.collapsed
        r.setStart(sel.startContainer, sel.startOffset)
        r.setEnd(sel.endContainer, sel.endOffset)
        slices.selected = @getTextFromRange(r)

    r.setStart(sel.endContainer, sel.endOffset)
    r.setEnd(@PRE_TAG, @PRE_TAG.childNodes.length)
    #r.setEnd(@PRE_TAG.lastChild, @PRE_TAG.lastChild.length)
    slices.after = @getTextFromRange(r)
    return slices

exports.getTextFromRange = (range) ->
    return range.toString()

"""
@getTextFromRange(range) ->
    div = document.createElement('div')
    div.appendChild(range.cloneContents())
    #breaks = div.getElementsByTagName('br')
    #for JS('var i = breaks.length; i > 0; i--') ->
    #    div.replaceChild(document.createTextNode("\n"), breaks[i - 1])
    return div.textContent
"""