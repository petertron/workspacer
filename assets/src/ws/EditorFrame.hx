package ws;

import js.Browser;
import js.html.*;
import js.jquery.*;
import js.Lib;
import haxe.Template;
import haxe.Json;
import org.tamina.html.component.HTMLApplication;
import org.tamina.html.component.HTMLComponent;
import org.tamina.i18n.LocalizationManager;
import org.tamina.i18n.ITranslation;
import Workspacer;
import ws.CodeEditor;

@:expose
@view('ws/EditorFrame.html')
class EditorFrame extends HTMLComponent
{
    // Variables

    public var dir_path: String;
    public var current_filename: String;
    private var potential_filename: String;
    public var code_editor: CodeEditor;

    // Lifecycle

    override public function attachedCallback()
    {
        code_editor = HTMLApplication.createInstance(CodeEditor);
        var settings = Json.parse(new JQuery('#editor-settings').text());
        var value: Dynamic;
        for (name in Reflect.fields(settings)) {
            value = Reflect.field(settings, name);
            if (value != null) {
                code_editor.setAttribute(name, value);
            }
        }
        new JQuery(code_editor).on('save', function (event: Event) {
            new JQuery(this).find('button[accesskey="s"]').trigger('click');
        });
        new JQuery(code_editor).insertAfter(new JQuery(this).find('header'));
        new JQuery(this).on('click', 'button', onButtonClick);
    }

    // New instance

    public function new()
    {
        super();
    }

    // Accessors

    /*
     * Open/close
     */
    public var open(never, set): Bool;

    function set_open(isTrue: Bool): Bool
    {
        if (isTrue) {
            // Open editor.
            Browser.window.getSelection().removeAllRanges();
            this.visible = true;
            new JQuery('#mask').show();
            code_editor.reset();
        } else {
            // Close editor.
            this.visible = false;
            new JQuery('#mask').hide();
        }
        return isTrue;
    }

    /*
     * Header text
     */
    public var headerText(never, set): String;
    
    function set_headerText(text: String): String
    {
        new JQuery(this).find('header p').text(translateContent(text));
        return text;
    }

    // Methods

    function getFilePath(filename: String): String
    {
        return (dir_path.length > 0 ? dir_path + "/" : "") + filename;
    }

    /*
     * Edit
     */
    public function edit(?filename: String): Void
    {
        if (filename != null) {
            // Edit existing file.
            potential_filename = filename;
            headerText = '{{t_loading}} ${getFilePath(filename)}';
            this.className = "edit";
            code_editor.setText("");
            JQuery.ajax({
                method: 'GET',
                url: Workspacer.ajax_url,
                data: {action: "load", file_path: getFilePath(filename)},
                dataType: 'json'
            })
            .done(function (data) {
                current_filename = potential_filename;
                this.code_editor.setFilename(current_filename);
                this.code_editor.setText(data.text);
                this.headerText = '{{t_editing}} ${getFilePath(current_filename)}';
            })
            .fail(function (jqXHR, textStatus: String) {
                this.headerText = '{{t_failed_to_load}} ' + getFilePath(potential_filename);
                Browser.console.log(textStatus);
            });
        } else {
            this.headerText = '{{t_new_file}}';
            this.className = "new";
            this.code_editor.reset();
            this.code_editor.setFilename(null);
        }
    }

    function onButtonClick(event: Event)
    {
        var target = cast(event.target, ButtonElement);
        var file_path;
        switch (target.name) {
        case 'close':
            this.open = false;

        case 'create':
            var potential_filename: String = Browser.window.prompt(getTranslation('t_file_name'));
            if (potential_filename != null) {
                file_path = Workspacer.filePathFromParts(this.dir_path, potential_filename);
                this.headerText = '{{t_creating_file}} $file_path';
                Workspacer.S_serverPost(
                    {
                        action: "create",
                        file_path: file_path,
                        text: this.code_editor.getText()
                    },
                    function (data) {
                        if (data.alert_msg == null) {
                            current_filename = potential_filename;
                        }
                        this.className = "edit";
                        this.headerText = '{{t_editing}} ' + Workspacer.filePathFromParts(this.dir_path, current_filename);
                        this.code_editor.setFilename(current_filename);
                    },
                    function () {
                        this.headerText = current_filename.length > 0
                            ? current_filename : '{{t_new_file}}';
                    }
                );
            }

        case 'save':
            file_path = Workspacer.filePathFromParts(this.dir_path, current_filename);
            this.headerText = '{{t_saving}} $file_path';
            //this.code_editor.putFocus();
            Workspacer.S_serverPost(
                {
                    action: "save",
                    file_path: file_path,
                    filename: current_filename,
                    text: this.code_editor.getText()
                },
                function (data: Dynamic) {
                    this.headerText = '{{t_editing}} ' + Workspacer.filePathFromParts(this.dir_path, current_filename);
                    code_editor.setFilename(current_filename);
                }
            );

        }
    }

    function getTranslation(key: String): String
    {
        return LocalizationManager.instance.getString(key);
    }
}
