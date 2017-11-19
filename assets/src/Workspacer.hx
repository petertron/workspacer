package;

import js.Browser;
import js.html.*;
import js.jquery.*;
import haxe.Json;
import haxe.ds.StringMap;
import org.tamina.html.component.HTMLApplication;
import ws.DirectoryBox;
import ws.EditorFrame;

typedef ServerReturn = {
    var directories: Array<Any>;
    var files: Array<Any>;
    var alert_msg: String;
    var alert_type: String;
}

typedef Highlighter = {
    var stylesheet: String;
    function highlight(text: String): DocumentFragment;
}

@:expose
class Workspacer extends HTMLApplication
{
    private static var _instance: Workspacer;

    public static var ajax_url: String = untyped Symphony.Context.get('symphony') + "/extension/workspacer/ajax/manage/";
    var elements: Dynamic;
    private var dir_boxes: Array<DirectoryBox> = [];
    public var editor_frame: EditorFrame;
    public var directories: Array<Any> = [];
    public static var highlighters: StringMap<Highlighter>;

    public function new()
    {
        super();
        highlighters = new StringMap<Highlighter>();
    }

    public static function main(): Void
    {
        _instance = new Workspacer();
        _instance.loadComponents();
        _instance.setup();
        new JQuery(Browser.document).ready(_instance.onPageLoad);
    }

    public static function onReady(event)
    {
        _instance.loadComponents();
        _instance.setup();
    }

    function setup(): Void
    {
        directories = Json.parse(new JQuery('#directories').text());
        var wrapper = Browser.document.getElementById('directories-wrapper');
        dir_boxes[0] = HTMLApplication.createInstance(DirectoryBox);
        dir_boxes[0].className = "column";
        dir_boxes[0].directories = directories;
        dir_boxes[0].files = Json.parse(new JQuery('#files').text());
        wrapper.appendChild(dir_boxes[0]);
        dir_boxes[1] = HTMLApplication.createInstance(DirectoryBox);
        dir_boxes[1].className = "column";
        dir_boxes[1].directories = directories;
        dir_boxes[1].visible = false;
        wrapper.appendChild(dir_boxes[1]);

        editor_frame = HTMLApplication.createInstance(EditorFrame);
        editor_frame.visible = false;
        new JQuery('#contents').append(editor_frame);
    }

    function onPageLoad()
    {
        elements = untyped Symphony.Elements;
        new JQuery(elements.wrapper).find('.split-view').hide();
        elements.body_id = new JQuery(elements.body).attr('id');
        elements.notifier = new JQuery(elements.header).find('div.notifier');
        elements.form = new JQuery(elements.contents).find('form');
        elements.with_selected = new JQuery('#with-selected');

        new JQuery(dir_boxes).on("openFile", function (event: Event, dir_path: String, filename: String) {
            editor_frame.open = true;
            editor_frame.dir_path = dir_path;
            editor_frame.edit(filename);
        });

        new JQuery('ul.actions').on('click', 'button', onTopAction);
        new JQuery(elements.form).submit(formSubmitHandler);

        //disableWithSelected();

        new JQuery(Browser.window).keydown(function (event: Event) {
            if (event.which == 27) {
                editor_frame.open = false;
            }
        });

    }

    // Event handlers

    function onTopAction(event: Event)
    {
        var target = cast(event.target, ButtonElement);
        switch (target.name) {
            case 'split-view':
                new JQuery('#directories-wrapper').addClass("two columns");
                dir_boxes[1].dir_path = dir_boxes[0].dir_path;
                dir_boxes[1].files = dir_boxes[0].files.slice(0);
                dir_boxes[1].visible = true;
                new JQuery(elements.wrapper).find('.default-view').hide();
                new JQuery(elements.wrapper).find('.split-view').show();
            case 'close-left':
                new JQuery('#directories-wrapper').removeClass("two columns");
                dir_boxes[0].dir_path = dir_boxes[1].dir_path;
                dir_boxes[0].files = dir_boxes[1].files.slice(0);
                dir_boxes[1].visible = false;
                new JQuery(elements.wrapper).find('.split-view').hide();
                new JQuery(elements.wrapper).find('.default-view').show();
            case 'close-right':
                new JQuery('#directories-wrapper').removeClass("two columns");
                dir_boxes[1].visible = false;
                new JQuery(elements.wrapper).find('.split-view').hide();
                new JQuery(elements.wrapper).find('.default-view').show();

        }
    }

    function formSubmitHandler(event: Event)
    {
        var with_selected = new JQuery(elements.with_selected).val();
        if (with_selected == "download") {
            return;
        }
        event.preventDefault();
        //alert(new JQuery(elements.form).serialize());
        JQuery.ajax({
            method: 'POST',
            url: ajax_url,
            data: new JQuery(elements.form).serialize(),
            dataType: 'json'
        })
            .done(function (data) {
                if (data.alert_msg) {
                    var msg = untyped data.alert_msg + ' <a class="ignore">' + Symphony.Language.get('Clear?') + '</a>';
                    new JQuery(elements.notifier).trigger('attach.notify', [msg, data.alert_type]);
                    if (data.alert_type == "error") {
                        new JQuery(Browser.window).scrollTop(0);
                    }
                }
                if (data.directories != null) {
                    directories = data.directories;
                }
                if (data.files != null) {
                    if (data.files[0] != null) {
                        dir_boxes[0].files = data.files[0];

                    }
                    if (data.files[1] != null) {
                        dir_boxes[1].files = data.files[1];
                    }
                }
            })
            .fail(function (jqXHR, textStatus) {
                Browser.alert(textStatus);
                //func_error()
            });
    }

    function disableWithSelected() {
        new JQuery(elements.with_selected).prop('disabled', true).prop('selectedIndex', 0);
        new JQuery('.actions fieldset.apply').addClass('inactive');
    }
    
    public static function filePathFromParts(dir_path: String, filename: String): String
    {
        return (dir_path.length > 0 ? dir_path + "/" : "") + filename;
    }

    public static function S_serverPost(data: Dynamic, func_done: Dynamic, ?func_error: Dynamic): Void
    {
        _instance.serverPost(data, func_done, func_error);
    }

    function serverPost(data: Dynamic, func_done: Dynamic, ?func_error: Dynamic): Void
    {
        data.xsrf = untyped Symphony.Utilities.getXSRF();
        //data.body_id = WS.body_id;
        data.dir_paths = getDirPaths();
        JQuery.ajax({
            method: 'POST',
            url: ajax_url,
            data: data,
            dataType: 'json'
        })
        .done(function (data: ServerReturn) {
            if (data.alert_msg != null) {
                new JQuery(elements.notifier).trigger('attach.notify', [data.alert_msg, data.alert_type]);
            }
            if (data.directories != null) {
                directories = data.directories;
            }
            if (data.files != null) {
                dir_boxes[0].files = data.files[0];
                if (data.files[1] != null) {
                    dir_boxes[1].files = data.files[1];
                }
            }
            if (func_done != null) {
                func_done(data);
            }
        })
        .fail(function (jqXHR, textStatus) {
            Browser.alert(textStatus);
        });
    }

    public static function S_getDirPaths()
    {
        return _instance.getDirPaths();
    }

    public function getDirPaths(): Array<String>
    {
        var to_return: Array<String> = [dir_boxes[0].dir_path];
        if (dir_boxes[1].visible) {
            to_return.push(dir_boxes[1].dir_path);
        }
        Browser.alert(to_return[0] + " : " + to_return[1]);
        return to_return;
    }

    public static function addHighlighter(abbrev: String, highlighter: Highlighter): Void
    {
        highlighters.set(abbrev, highlighter);
    }
}
