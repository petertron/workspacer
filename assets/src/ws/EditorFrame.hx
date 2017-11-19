package ws;

import js.Browser;
import js.html.*;
import js.jquery.*;
import js.Lib;
import haxe.Template;
import haxe.Json;
import org.tamina.html.component.HTMLApplication;
import org.tamina.html.component.HTMLComponent;
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
        new JQuery(this).find('header p').text(text);
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
            headerText = "Loading " + getFilePath(filename);
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
                this.headerText = "Editing " + getFilePath(current_filename);
            })
            .fail(function (jqXHR, textStatus: String) {
                this.headerText = "Failed to load " + getFilePath(potential_filename);
                Browser.console.log(textStatus);
                //Browser.window.alert(textStatus);
            });
        } else {
            this.headerText = "New file";
            this.className = "new";
            this.code_editor.setFilename(null);
            this.code_editor.setText("");
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
            var potential_filename: String = Browser.window.prompt("File name");
            if (potential_filename != null) {
                file_path = Workspacer.filePathFromParts(this.dir_path, potential_filename);
                this.headerText = "Creating file " + file_path;
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
                        this.headerText = "Editing " + Workspacer.filePathFromParts(this.dir_path, current_filename);
                        this.code_editor.setFilename(current_filename);
                    },
                    function () {
                        this.headerText = current_filename.length > 0
                            ? current_filename : "New file";
                    }
                );
            }

        case 'save':
            file_path = Workspacer.filePathFromParts(this.dir_path, current_filename);
            this.headerText = "Saving " + file_path;
            //this.code_editor.putFocus();
            Workspacer.S_serverPost(
                {
                    action: "save",
                    file_path: file_path,
                    //filename: Workspacer.current_filename,
                    filename: current_filename,
                    text: this.code_editor.getText()
                },
                function (data) {
                    this.headerText = "Editing " + Workspacer.filePathFromParts(this.dir_path, current_filename);
                    code_editor.setFilename(current_filename);
                }
            );

        }
    }

    // Skin parts

    //@skinpart("") private var _directory_list: SelectElement;

    // Templates

 /*= new Template(
'::foreach directories::
<option value="::path::"::if (path==current_dir):: selected::end::</option>
::end::'
    );
*/
    /*public var files_template: Template; = new Template(
'<thead>
    <tr>
        <th scope="col">Name</th>
        <th scope="col">Description</th>
        <th scope="col">Size</th>
        <th scope="col">Last Modified</th>
    </tr>
</thead>
<tbody>
    ::if files.length::
    ::foreach files::<tr>
        <td>
            <a class="::class::" title="::title::" data-href="::href::" tabindex="0">::name::</a>
            <label class="accessible" for="::href::">Select File &apos;::name::&apos;</label>
            <input name="sets[][items][::name::]" value="yes" type="checkbox" id="::href::"/>
        </td>
        <td>::description::</td>
        <td>::size::</td>
        <td>::mtime::</td>
    </tr>::end::
    ::else::<tr><td class="inactive" colspan="4">None found.</td></tr>
    ::end::
</tbody>'
    );
*/

    // Accessors

    /*
     * Directory _dir_path
     *
    public var dir_path(get, set): String;
    private var _dir_path: String;

    function get_dir_path(): String
    {
        return _dir_path;
    }

    function set_dir_path(value): String
    {
        return _dir_path = value;
    }

        /*directories_template  = new Template(
'::foreach directories::
<option value="::path::"::if (path==current_dir):: selected::end::>::if (title)::::title::::else::::path::::end::</option>
::end::'
        );
        var h: String = directories_template.execute({dir_num: this.dataset.dirNum, directories: directories}, this);
        this.querySelector('select').innerHTML = h;
        return directories;


        
    function loadDirData(dir_path: String)
    {
        JQuery.ajax({
            method: 'GET',
            url: untyped Symphony.Context.get('symphony') + "/extension/workspacer/ajax/manage/",
            data: {
                xsrf: untyped Symphony.Utilities.getXSRF(),
                action: "directory-data",
                dir_path: dir_path
            },
            dataType: 'json'
        })
        .done(function (data) {
            if (data.directories) {
                //Symphony.Extensions.Workspacer.directories = data.directories;
            }
            this.dir_path = dir_path;
            //files = data.files;
        })
        .fail(function (jqXHR, textStatus) {
            Browser.Browser.window.alert(textStatus);
        });
    }*/
}

