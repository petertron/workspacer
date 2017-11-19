package ws;

import js.Browser;
import js.html.*;
import js.jquery.*;
import haxe.Template;
import org.tamina.html.component.HTMLComponent;

@:expose
@view('ws/DirectoryBox.html')
class DirectoryBox extends HTMLComponent
{
    // Skin parts

    @skinpart("") private var _directory_list: SelectElement;
    @skinpart("") private var _file_list: TableElement;

    // Templates

    var directories_template: Template; /*= new Template(
'::foreach directories::
<option value="::path::"::if (path==current_dir):: selected::end::</option>
::end::'
    );
*/
    public var files_template: Template;/* = new Template(
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
    // Variables

    public var directories: Array<Any> = [];

    // New instance

    public function new()
    {
        super();
    }

    // Accessors

    /*
     * Directory path
     */
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

    /*
     * Directories array
     */
    /*public var directories(null, set): Array<Any>;

    public function set_directories(directories: Array<Any>): Array<Any>
    {
        return directories;
    }
*/
    /*
     * Files array
     */
    public var files(get, set): Array<Dynamic>;
    private var _files: Array<Dynamic>;

    function get_files() {
        return _files;
    }

    public function set_files(files: Array<Dynamic>): Array<Dynamic>
    {
        Template.globals.current_dir = dir_path;
        directories_template  = new Template(
'::foreach directories::
<option value="::path::"::if (path==current_dir):: selected::end::>::if (title)::::title::::else::::path::::end::</option>
::end::'
        );
        var h: String = directories_template.execute({dir_num: this.dataset.dirNum, directories: directories}, this);
        this.querySelector('select').innerHTML = h;

        files_template = new Template(
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
            <input name="sets[::set_num::][items][::name::]" value="yes" type="checkbox" id="::href::"/>
        </td>
        <td>::description::</td>
        <td>::size::</td>
        <td>::mtime::</td>
    </tr>::end::
    ::else::<tr><td class="inactive" colspan="4">None found.</td></tr>
    ::end::
</tbody>'
    );
        _files = files;
        deselect();
        Template.globals.set_num = this.getAttribute('dir-num');
        var h: String = files_template.execute({set_num: this.dataset.dirNum, files: files}, this);
        this.querySelector('table').innerHTML = h;
        return _files;
    }

    // Lifecycle

    override public function createdCallback(): Void
    {
        dir_path = "";
        this.innerHTML = getView();
    }

    override public function attachedCallback(): Void
    {
        _directory_list = cast(this.querySelector('select'), SelectElement);
        _file_list = cast(this.querySelector('table'), TableElement);
        new JQuery(this).on('click', 'button', onButtonClick);
        new JQuery(this).on('change', 'select', onSelectChange);
        new JQuery(this).on('click', 'a.dir', onDirectoryAnchorClick);
        new JQuery(this).on('keypress', 'a.dir', onDirectoryAnchorKeyPress);
        new JQuery(this).on('click', 'a.file', onFileAnchorClick);
        new JQuery(this).on('keypress', 'a.file', onFileAnchorKeyPress);
    }

    // Methods

    function render() {
        /*var template = new JQuery.templates("#template_table");
        new JQuery(this).html(template.render({
            directories: this.directories,
            dir_num: this.dataset.dirNum,
            dir_path: this.dir_path,
            files: this.files
        }));*/
    }
        
    function hideAddBox()
    {
        new JQuery(this).find('div.add-box').hide();
    }

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
                //directories = data.directories;
            }
            this.dir_path = dir_path;
            files = data.files;
        })
        .fail(function (jqXHR, textStatus) {
            Browser.window.alert(textStatus);
        });
    }

    function deselect()
    {
        new JQuery(this).find('.selected').removeClass('selected').trigger('deselect.selectable');
    }

    function triggerOpenFile(event: Event)
    {
        var target = cast(event.target, AnchorElement);
        var filename = target.dataset.href;
        new JQuery(this).trigger("openFile", [dir_path, filename]);
    }

    function filePathFromParts(dir_path, filename) {
        return (dir_path ? dir_path + "/" : "") + filename;
    }

    // Events

    function onButtonClick(event: MouseEvent) {
        var action = cast(event.target, ButtonElement).name;
        switch (action) {
            case "new":
                new JQuery(this).find('.add-box').slideToggle(120);
            case "new_file":
                hideAddBox();
                //var dir_path = this.dir_path;
                new JQuery(this).trigger("openFile", [dir_path, null]);
            case "new_dirs":
                hideAddBox();
                new JQuery(this).find('.add-dirs-box').slideDown(120);
            case "create_dirs":
                new JQuery(this).find('.add-dirs-box').slideUp(120);
                var v = new JQuery(this).find('textarea').val();
                /*Symphony.Extensions.Workspacer.serverPost({
                    action: "create_dirs",
                    dir_path: this.dir_path,
                    items: v.split("\n")
                });*/
            case "cancel_dirs":
                new JQuery(this).find('.add-dirs-box').slideUp(120);
        }
    }

    function onSelectChange(event): Void
    {
        var target = cast(event.target, SelectElement);
        loadDirData(target.value);
    }

    function onDirectoryAnchorClick(event: Event): Void
    {
        loadDirectory(event);
    }

    function onDirectoryAnchorKeyPress(event: Event): Void
    {
        if (event.which == 13) {
            loadDirectory(event);
        }
    }

    function loadDirectory(event: Event): Void
    {
        var target = cast(event.target, AnchorElement);
        var new_dir_path = (dir_path.length > 0 ? dir_path + "/" : "") + target.dataset.href;
        loadDirData(new_dir_path);
    }

    function onFileAnchorClick(event: Event)
    {
        triggerOpenFile(event);
    }

    function onFileAnchorKeyPress(event: Event)
    {
        if (event.keyCode == 13) {
            triggerOpenFile(event);
        }
    }
}

