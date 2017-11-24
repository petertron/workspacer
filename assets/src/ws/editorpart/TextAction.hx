package ws.editorpart;

import org.tamina.i18n.LocalizationManager;
import org.tamina.i18n.ITranslation;

using Type;

class TextAction
{
    public var title: String;
    var editor: CodeEditor;

    public function new(editor, title)
    {
        this.editor = editor;
        //this.title = title;
        this.title = LocalizationManager.instance.getString(title);
    }
    
    public function getName(): String
    {
        var class_name = Type.getClassName(Type.getClass(this));
        return class_name.substr(class_name.lastIndexOf(".") + 1);
    }

    public function test(class_name: String): Bool
    {
        //Type.getClassName(Type.getClass(item);
        return this.getName() == class_name;
    }
    
    public function undo() {}
    
    public function redo() {}
}

