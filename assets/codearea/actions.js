export class Insert
{
    constructor(editor, title, cumulative = true)
    {
        this.editor = editor;
        this.title = title
        let sel_range = editor.getSelectionRange();
        this.old_text = sel_range.toString();
        if (this.old_text) {
            sel_range.deleteContents();
        }
        this.new_text = '';
        this.cumulative = cumulative;
        this.position = editor.getCharPosFromRangeStart(editor.getCurrentSelectionRange());
    }

    addText(text)
    {
        let editor = this.editor;
        this.new_text += text;
        //let sel = this.editor.getSelection();
        let sel_range = this.editor.getSelectionRange();
        let start_node = sel_range.startContainer;
        let start_offset = sel_range.startOffset;
            //console.log(start_offset + ', ' + start_node.nodeValue);
        if (start_node.nodeType == 3) {
            /*let tc = start_node.textContent;
            let ntc = tc.substr(0, start_offset) + text + tc.substr(start_offset);
            start_node.textContent = ntc;*/
            start_node.insertData(start_offset, text);
        } else {
            //console.log(start_node);
            start_node.appendChild(new Text(text));
        }
        editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
        editor.timeoutStart();
    }

    static perform(editor, new_text = null, title = 'insert', cumulative_allowed = true)
    {
        if (!new_text) return false;
        let instance = null;
        if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
            let last_item = editor.undoStackLastItem;
            if (last_item instanceof Insert && last_item.cumulative) {
                instance = last_item;
            }
        }
        if (!instance) {
            instance = new Insert(editor, title, cumulative_allowed);
            editor.undoStackPush(instance);
        }
        instance.addText(new_text);
        editor.updateEditArea();
    }

    undo()
    {
        this.editor.replaceText(this.position, this.new_text.length, this.old_text);
        let end = this.old_text ? this.position + this.old_text.length : null;
        this.editor.setEditorRender([{start: this.position, end: end}]);
    }

    redo()
    {
        this.editor.replaceText(this.position, 0, this.new_text);
        this.editor.setEditorRender([{start: this.position + this.new_text.length, end: null}]);
    }
}

export class Delete
{
    constructor (editor, title, cumulative = true)
    {
        this.editor = editor;
        this.title = title;
        this.removed_text = '';
        this.cumulative = cumulative;
    }

    static perform(editor, title = 'delete', cumulative_allowed = true)
    {
        let selection = editor.getSelection();
        if (selection.getRangeAt(0).collapsed) {
            selection.modify('extend', 'backward', 'character');
            if (selection.toString().length == 0) {
                return;
            }
        } else {
            cumulative_allowed = false;
        }
        let instance = null;
        if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
            let last_item = editor.undoStackLastItem;
            if (last_item instanceof Delete && last_item.cumulative) {
                instance = last_item;
            }
        }
        if (!instance) {
            instance = new Delete(editor, title, cumulative_allowed);
            editor.undoStackPush(instance);
        }
        instance.doIt();
        editor.timeoutStart();
        editor.setEditorRender([{start: instance.position, end: null}]);
        return true;
    }

    doIt()
    {
        let selection = this.editor.getSelection();
        this.removed_text = selection.toString() + this.removed_text;
        selection.deleteFromDocument();
        this.position = this.editor.getRangeBeforeSelection().toString().length;
    }

    undo()
    {
        this.editor.replaceText(this.position, 0, this.removed_text);
        this.editor.setEditorRender([{start: this.position + this.removed_text.length, end: null}]);
    }

    redo()
    {
        this.editor.replaceText(this.position, this.removed_text.length, "");
        this.editor.setEditorRender([{start: this.position, end: null}]);
    }
}

export class ForwardDelete
{
    constructor (editor, title, cumulative = true)
    {
        this.editor = editor;
        this.title = title;
        this.removed_text = '';
        this.cumulative = cumulative;
    }

    static perform(editor, title = 'delete', cumulative_allowed = true)
    {
        let selection = editor.getSelection();
        if (selection.getRangeAt(0).collapsed) {
            selection.modify('extend', 'forward', 'character');
            if (selection.toString().length == 0) {
                return;
            }
        } else {
            cumulative_allowed = false;
        }
        let instance = null;
        if (cumulative_allowed && !editor.timeoutExpired && editor.undoStackHasItems) {
            let last_item = editor.undoStackLastItem;
            if (last_item instanceof ForwardDelete && last_item.cumulative) {
                instance = last_item;
            }
        }
        if (!instance) {
            instance = new ForwardDelete(editor, title, cumulative_allowed);
            editor.undoStackPush(instance);
        }
        instance.doIt();
        editor.timeoutStart();
        editor.setEditorRender([{start: instance.position, end: null}]);
        return true;
    }

    doIt()
    {
        let selection = this.editor.getSelection();
        this.removed_text += selection.toString();
        selection.deleteFromDocument();
        this.position = this.editor.getRangeBeforeSelection().toString().length;
    }

    undo()
    {
        this.editor.replaceText(this.position, 0, this.removed_text);
        this.editor.setEditorRender([{start: this.position, end: null}]);
    }

    redo()
    {
        this.editor.replaceText(this.position, this.removed_text.length, "");
        this.editor.setEditorRender([{start: this.position + this.removed_text.length, end: null}]);
    }
}

export class Cut
{
    constructor (editor, title)
    {
        this.editor = editor;
        this.title = title;
        this.removed_text = '';
    }

    static perform(editor, title = 'cut')
    {
        let selection = editor.getSelection();
        if (selection.getRangeAt(0).collapsed) {
            return false;
        }
        let instance = new Cut(editor, title);
        editor.undoStackPush(instance);
        instance.doIt();
        editor.setEditorRender([{start: instance.position, end: null}]);
        return true;
    }

    doIt()
    {
        let selection = this.editor.getSelection();
        this.removed_text = selection.toString() + this.removed_text;
        selection.deleteFromDocument();
        this.position = this.editor.getRangeBeforeSelection().toString().length;
    }

    undo()
    {
        this.editor.replaceText(this.position, 0, this.removed_text);
        this.editor.setEditorRender(
            [{start: this.position + this.removed_text.length, end: null}]
        );
    }

    redo()
    {
        this.editor.replaceText(this.position, this.removed_text.length, "");
        this.editor.setEditorRender([{start: this.position, end: null}]);
    }
}