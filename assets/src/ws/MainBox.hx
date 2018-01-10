package ws;

import js.Browser;
import js.html.*;
import js.jquery.*;
import symhaxe.html.component.SHApplication;
import symhaxe.html.component.SHComponent;
import ws.DirectoryBox;

@view('ws/MainBox.html')
class MainBox extends SHComponent
{
    public var dir_boxes: Array<DirectoryBox> = [];
    var directories: Array<Dynamic>;

    public function new()
    {
        super();
    }

    public override function createdCallback()
    {
        super.createdCallback();
        dir_boxes = [];
        dir_boxes[0] = SHApplication.createInstance(DirectoryBox);
        dir_boxes[0].setAttribute('dir-num', "0");
        this.appendChild(dir_boxes[0]);
        dir_boxes[1] = SHApplication.createInstance(DirectoryBox);
        dir_boxes[1].setAttribute('dir-num', "1");
        dir_boxes[1].visible = false;
        this.appendChild(dir_boxes[1]);
    }

    public override function attachedCallback()
    {
        new JQuery(dir_boxes).on("openFile", function (event: Event, dir_path: String, filename: String) {
            new JQuery(this).trigger("openFile", [dir_path, filename]);
        });
    }

    public function cmd(command: String): Void
    {
        switch (command) {
            case "split-view":
                //this.className = "two columns";
                this.className = "double";
                dir_boxes[1].dir_path = dir_boxes[0].dir_path;
                dir_boxes[1].files = dir_boxes[0].files.slice(0);
                dir_boxes[1].visible = true;
            case 'close-left':
                this.className = null;
                dir_boxes[0].dir_path = dir_boxes[1].dir_path;
                dir_boxes[0].files = dir_boxes[1].files.slice(0);
                dir_boxes[1].visible = false;
            case 'close-right':
                this.className = null;
                dir_boxes[1].visible = false;
        }
    }

    public function getDirPaths(): Array<String>
    {
        var to_return: Array<String> = [dir_boxes[0].dir_path];
        if (dir_boxes[1].visible) {
            to_return.push(dir_boxes[1].dir_path);
        }
        return to_return;
    }

    public function setData(data: Dynamic)
    {
        if (data.directories != null) {
            directories = data.directories;
            dir_boxes[0].directories = directories;
            dir_boxes[1].directories = directories;
        }
        if (data.files != null) {
            dir_boxes[0].files = data.files[0];
            if (data.files[1] != null) {
                dir_boxes[1].files = data.files[1];
            }
        }
    }
}


