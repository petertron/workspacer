Textspace = window.Textspace

class TextAction
    #def constructor: ->
    #    @updatable = 'update' in self

    getName: ->
        results = /function (.{1,})\\\(/.exec((this).constructor.toString())
        return if (results and results.length > 1) then results[1] else ""

    isUpdatable: ->
        return "update" in this

#
# Insert a character
#
exports.InsertChar = class InsertChar extends TextAction
    title = "insert"

    constructor: (char) ->
        replaced = Textspace.replaceSelection(char)
        @position = replaced.position
        @old_text = replaced.text
        @new_text = char
        Textspace.setSelection(@position + @new_text.length)

    update: (char) ->
        Textspace.textInsert(@position + @new_text.length , char)
        @new_text += char
        Textspace.setSelection(@position + @new_text.length)

    undo: ->
        Textspace.textReplace({'start': @position, 'end': @position + @new_text.length}, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textReplace({'start': @position, 'end': @position + @old_text.length}, @new_text)
        Textspace.setSelection(@position + @new_text.length)


#
# Insert a newline character
#
exports.InsertLineBreak = class InsertLineBreak extends TextAction
    title = "insert line break"

    constructor: ->
        replaced = Textspace.replaceSelection("\n")
        @position = replaced.position
        @old_text = replaced.text
        Textspace.setSelection(@position + 1)

    undo: ->
        Textspace.textReplace({'start': @position, 'end': @position + 1}, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textReplace({'start': @position, 'end': @position + @old_text.length}, "\n")
        Textspace.setSelection(@position + 1)

#
# Backspace
#
exports.Delete = class Delete extends TextAction
    title = "delete"

    constructor: ->
        slices = Textspace.getEditorTextSlices()
        if slices.selected
            @old_text = slices.selected
        else
            if !slices.before
                throw null
            @old_text = slices.before.slice(-1)
            #slices.before = slices.before.slice(0, slices.before.length - 1)
            slices.before = slices.before.slice(0, -1)
            #console.log("Log: " + @old_text.charCodeAt(0))

        Textspace.setText(slices.before + slices.after)
        @position = slices.before.length
        """sel = Textspace.selection
        if sel.collapsed):
        if sel.start == 0)
        raise null
        sel.end = sel.start
        sel.start--
        Textspace.selection.start = sel.start
        }
        @position = sel.start
        @old_text = Textspace.textRemove(sel)"""
        Textspace.setSelection(@position)

    update: ->
        if @position == 0
            throw null
        @position -= 1
        @old_text = Textspace.textRemove({'start': @position, 'end': @position + 1}) + @old_text
        Textspace.setSelection(@position)

    undo: ->
        Textspace.textInsert(@position, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textRemove({'start': @position, 'end': @position + @old_text.length})
        Textspace.setSelection(@position)

#
# Forwards delete
#
exports.ForwardsDelete = class ForwardsDelete extends TextAction
    title = "forwards delete"

    constructor: ->
        sel = Textspace.getSelection()
        if sel.collapsed
            if sel.start == Textspace.getText().length
                throw null
            sel.end = sel.start + 1
        @position = sel.start
        @old_text = Textspace.textRemove(sel)
        Textspace.setSelection(@position)

    update: ->
        if Textspace.getSelection().start == Textspace.getText().length
            throw null
        @old_text += Textspace.textRemove({'start': @position, 'end': @position + 1})
        Textspace.setSelection(@position)

    undo: ->
        Textspace.textInsert(@position, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textRemove({'start': @position, 'end': @position + @old_text.length})
        Textspace.setSelection(@position)

#
# Cut selected text
#
exports.Cut = class Cut extends TextAction
    title = "cut"

    constructor: ->
        pos = Textspace.getSelection()
        @position = pos.start
        @old_text = Textspace.textRemove(pos)
        Textspace.setSelection(pos.start, null)

    undo: ->
        Textspace.textInsert(@position, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textRemove({'start': @position, 'end': @position + @old_text.length})
        Textspace.setSelection(@position)

#
# Paste
#
exports.Paste = class Paste extends TextAction
    title = "paste"

    #position: number
    #old_text: string
    #new_text: string

    constructor: (new_text) ->
        replaced = Textspace.replaceSelection(new_text)
        @position = replaced.position
        @old_text = replaced.text
        @new_text = new_text
        Textspace.setSelection(@position + @new_text.length)

    undo: ->
        Textspace.textReplace({'start': @position, 'end': @position + @new_text.length}, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textReplace({'start': @position, 'end': @position + @old_text.length}, @new_text)
        Textspace.setSelection(@position + @new_text.length)

#
# Block indent right
#
exports.IndentRight = class IndentRight extends TextAction
    title = "indent right"

    #position: number
    #private old_text: string
    #private new_text: string

    constructor: ->
        break_pos = 0
        pos = Textspace.selection
        @position = pos.start
        slices = Textspace.getEditorTextSlices()
        if slices.before
            break_pos = slices.before.lastIndexOf("\n") + 1
        if break_pos < slices.before.length
            slices.selected = slices.before.slice(break_pos) + slices.selected
            slices.before = slices.before.slice(0, break_pos)
        if slices.selected.slice(-1) != "\n"
            break_pos = slices.after.indexOf("\n")
        if break_pos != -1
            slices.selected += slices.after.slice(0, break_pos)
            slices.after = slices.after.slice(break_pos)
            @old_text = slices.selected
        # Do the shifting.
        selection_split = slices.selected.split("\n")
        #indentation_pos
        for i in selection_split
            #indentation_pos = getIndentation(selection_split[i])
            selection_split[i] = "    " + selection_split[i]
            #Settings.indentation_width

            slices.selected = selection_split.join("\n")
            Textspace.text = slices.before + slices.selected + slices.after
            Textspace.selection.end = null

    undo: ->
        Textspace.textInsert(@position, @old_text)
        Textspace.setSelection(@position + @old_text.length)

    redo: ->
        Textspace.textRemove({'start': @position, 'end': @position + @old_text.length})
        Textspace.setSelection(@position)
