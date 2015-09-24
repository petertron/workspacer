module Actions
{
    export class Base
    {
        getName()
        {
            var results = /function (.{1,})\(/.exec((this).constructor.toString());
            return (results && results.length > 1) ? results[1] : "";
        }

        isUpdatable()
        {
            return 'update' in this;
        }
    }

    /*
     * Insert a character
     */
    export class InsertChar extends Base
    {
        title = "insert";

        private position: number;
        private old_text: string;
        private new_text: string;

        constructor(char: string)
        {
            super();
            var replaced = Textspace.replaceSelection(char);
            this.position = replaced.position;
            this.old_text = replaced.text;
            this.new_text = char;
            Textspace.setSelection(this.position + 1);
        }

        update(char: string)
        {
            Textspace.textInsert(this.position + this.new_text.length , char);
            this.new_text += char;
            Textspace.setSelection(this.position + this.new_text.length);
        }

        undo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + this.new_text.length}, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + this.old_text.length}, this.new_text);
            Textspace.setSelection(this.position + this.new_text.length);
        }
    }

    /*
     * Insert a newline character
     */
    export class InsertLineBreak extends Base
    {
        title = "insert line break";

        private position: number;
        private old_text: string;

        constructor()
        {
            super();
            var replaced = Textspace.replaceSelection("\n");
            this.position = replaced.position;
            this.old_text = replaced.text;
            Textspace.setSelection(this.position + 1);
        }

        undo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + 1}, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + this.old_text.length}, "\n");
            Textspace.setSelection(this.position + 1);
        }
    }

    /*
     * Backspace
     */
    export class Delete extends Base
    {
        title = "delete";

        position: number;
        old_text: string;

        constructor()
        {
            super();
            var slices = Textspace.getEditorTextSlices();
            if (slices.selected) {
                this.old_text = slices.selected;
            } else {
                if (!slices.before)
                    throw null;
                this.old_text = slices.before.slice(-1);
                //slices.before = slices.before.slice(0, slices.before.length - 1);
                slices.before = slices.before.slice(0, -1);
                //console.log("Log: " + this.old_text.charCodeAt(0));
            }
            Textspace.text = slices.before + slices.after;
            this.position = slices.before.length;
            /*var sel = Textspace.selection;
            if (sel.collapsed) {
                if (sel.start == 0)
                    throw null;
                sel.end = sel.start;
                sel.start--;
                Textspace.selection.start = sel.start;
            }
            this.position = sel.start;
            this.old_text = Textspace.textRemove(sel);*/
            Textspace.setSelection(this.position);
        }

        update()
        {
            if (this.position == 0)
                throw null;
            this.position--;
            this.old_text = Textspace.textRemove({'start': this.position, 'end': this.position + 1}) + this.old_text;
            Textspace.setSelection(this.position);
        }

        undo()
        {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textRemove({'start': this.position, 'end': this.position + this.old_text.length});
            Textspace.setSelection(this.position);
        }
    }

    /*
     * Forwards delete
     */
    export class ForwardsDelete extends Base
    {
        title = "forwards delete";

        position: number;
        old_text: string;

        constructor()
        {
            super();
            var sel = Textspace.selection;
            if (sel.collapsed) {
                if (sel.start == Textspace.text.length)
                    throw null;
                sel.end = sel.start + 1;
            }
            this.position = sel.start;
            this.old_text = Textspace.textRemove(sel);
            Textspace.setSelection(this.position);
        }

        update()
        {
            if (Textspace.selection.start == Textspace.text.length)
                throw null;
            this.old_text += Textspace.textRemove({'start': this.position, 'end': this.position + 1});
            Textspace.setSelection(this.position);
        }

        undo()
        {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textRemove({'start': this.position, 'end': this.position + this.old_text.length});
            Textspace.setSelection(this.position);
        }
    }

    /*
     * Cut selected text
     */
    export class Cut extends Base
    {
        title = "cut";

        position: number;
        old_text: string;

        constructor()
        {
            super();
            var pos = Textspace.selection;
            this.position = pos.start;
            this.old_text = Textspace.textRemove(pos);
            Textspace.selection.end = null;
        }

        undo()
        {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textRemove({'start': this.position, 'end': this.position + this.old_text.length});
            Textspace.setSelection(this.position);
        }
    }

    /*
     * Paste
     */
    export class Paste extends Base
    {
        title = "paste";

        position: number;
        old_text: string;
        new_text: string;

        constructor(new_text)
        {
            super();
            var replaced = Textspace.replaceSelection(new_text);
            this.position = replaced.position;
            this.old_text = replaced.text;
            this.new_text = new_text;
            Textspace.setSelection(this.position + this.new_text.length);
        }

        undo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + this.new_text.length}, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textReplace({'start': this.position, 'end': this.position + this.old_text.length}, this.new_text);
            Textspace.setSelection(this.position + this.new_text.length);
        }
    }

    /*
     * Block indent right
     */
    export class IndentRight extends Base
    {
        title = "indent right";

        position: number;
        private old_text: string;
        private new_text: string;

        constructor()
        {
            super();
            var break_pos;
            var pos = Textspace.selection;
            this.position = pos.start;
            var slices = Textspace.getEditorTextSlices();
            if (slices.before) {
                break_pos = slices.before.lastIndexOf("\n") + 1;
                if (break_pos < slices.before.length) {
                    slices.selected = slices.before.slice(break_pos) + slices.selected;
                    slices.before = slices.before.slice(0, break_pos);
                }
            }
            if (slices.selected.slice(-1) !== "\n") {
                break_pos = slices.after.indexOf("\n");
                if (break_pos != -1) {
                    slices.selected += slices.after.slice(0, break_pos);
                    slices.after = slices.after.slice(break_pos);
                }
            }
            this.old_text = slices.selected;
            // Do the shifting.
            var selection_split = slices.selected.split("\n");
            var indentation_pos;
            for (var i in selection_split) {
                //indentation_pos = getIndentation(selection_split[i]);
                selection_split[i] = "    " + selection_split[i];
                //Settings.indentation_width;
            }
            slices.selected = selection_split.join("\n");
            Textspace.text = slices.before + slices.selected + slices.after;
            Textspace.selection.end = null;
        }

        undo()
        {
            Textspace.textInsert(this.position, this.old_text);
            Textspace.setSelection(this.position + this.old_text.length);
        }

        redo()
        {
            Textspace.textRemove({'start': this.position, 'end': this.position + this.old_text.length});
            Textspace.setSelection(this.position);
        }
    }

}