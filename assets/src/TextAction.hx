using Type;

class TextAction
{
    var editor: CodeEditor;
    var title: String;

    public function new(editor, title)
    {
        this.editor = editor;
        this.title = title;
    }
    
    public function getName(): String
    {
        return Type.getClassName(Type.getClass(this));
    }

    public function test(class_name: String): Bool
    {
        //Type.getClassName(Type.getClass(item);
        return this.getName() == class_name;
    }
    
    public function undo() {}
    
    public function redo() {}
}

