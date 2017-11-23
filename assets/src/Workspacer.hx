package;

import js.Browser;
import js.html.*;
import js.jquery.*;
import haxe.Json;
import haxe.ds.StringMap;
import org.tamina.html.component.HTMLApplication;
import org.tamina.i18n.LocalizationManager;
import org.tamina.i18n.ITranslation;
import ws.MainBox;
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
    public var main_box: MainBox;
    public var editor_frame: EditorFrame;
    public var directories: Array<Any> = [];
    public static var highlighters: StringMap<Highlighter>;

    // Accessors

    /*
     * Progress mode determines whether progress cursor is shown
     */
    public var progress_mode(get, set): Bool;

    function get_progress_mode(): Bool
    {
        return Browser.document.body.style.cursor == "progress";
    }

    function set_progress_mode(isTrue: Bool): Bool
    {
        if (isTrue) {
            Browser.document.body.style.cursor = "progress";
        } else {
            Browser.document.body.style.cursor = null;
        }
        return isTrue;
    }

    // New method

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
        //_instance.loadComponents();
        _instance.setup();
    }

    function setup(): Void
    {
        if (Browser.document.body.id == "blueprints-workspace") {
            var json = Json.parse(new JQuery('#workspacer-json').text());
            LocalizationManager.instance.setTranslations(json.translations);
            main_box = HTMLApplication.createInstance(MainBox);
            new JQuery('form').prepend(main_box);
            main_box.setData(json);
        }
        editor_frame = HTMLApplication.createInstance(EditorFrame);
        editor_frame.visible = false;
        new JQuery('#contents').append(editor_frame);
    }

    function onPageLoad()
    {
        new JQuery('ul.actions').on('click', 'button', onTopAction);
        elements = untyped Symphony.Elements;
        elements.body_id = new JQuery(elements.body).attr('id');
        if (elements.body_id == "blueprints-workspace") {
            new JQuery(elements.wrapper).find('.split-view').hide();
            elements.notifier = new JQuery(elements.header).find('div.notifier');
            elements.form = new JQuery(elements.contents).find('form');
            elements.with_selected = new JQuery('#with-selected');
            new JQuery(main_box).on('openFile', function (event: Event, dir_path: String, filename: String) {
                editor_frame.open = true;
                editor_frame.dir_path = dir_path;
                editor_frame.edit(filename);
            });
            new JQuery(elements.form).submit(formSubmitHandler);
            disableWithSelected();
        } else if (elements.body_id == "blueprints-pages") {
            new JQuery('#wrapper').on('click', 'a.file', function (event: Event) {
                var target = cast(event.target, AnchorElement);
                editor_frame.open = true;
                editor_frame.dir_path = "pages";
                editor_frame.edit(target.dataset.href);
            });
        }
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
                main_box.cmd("split-view");
                new JQuery(elements.wrapper).find('.default-view').hide();
                new JQuery(elements.wrapper).find('.split-view').show();
            case 'close-left':
                main_box.cmd("close-left");
                new JQuery(elements.wrapper).find('.split-view').hide();
                new JQuery(elements.wrapper).find('.default-view').show();
            case 'close-right':
                main_box.cmd("close-right");
                new JQuery(elements.wrapper).find('.split-view').hide();
                new JQuery(elements.wrapper).find('.default-view').show();

        }
    }

    function formSubmitHandler(event: Event): Void
    {
        var with_selected = new JQuery(elements.with_selected).val();
        if (with_selected == "download") {
            return;
        }
        event.preventDefault();
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
            main_box.setData(data);
        })
        .fail(function (jqXHR, textStatus: String) {
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

    function serverPost(data: Dynamic, ?func_done: Dynamic, ?func_error: Dynamic): Void
    {
        data.xsrf = untyped Symphony.Utilities.getXSRF();
        data.body_id = elements.body_id;
        if (elements.body_id == 'blueprints-workspace') {
            data.dir_paths = getDirPaths();
        }
        progress_mode = true;
        JQuery.ajax({
            method: 'POST',
            url: ajax_url,
            data: data,
            dataType: 'json',
            timeout: 10000
        })
        .done(function (data: ServerReturn) {
            if (data.alert_msg != null) {
                new JQuery(elements.notifier).trigger('attach.notify', [data.alert_msg, data.alert_type]);
            }
            if (elements.body_id == 'blueprints-workspace') {
                main_box.setData(data);
            }
            if (func_done != null) {
                func_done(data);
            }
        })
        .fail(function (jqXHR: JqXHR, textStatus: String, errorThrown: String) {
            Browser.alert(errorThrown);
        })
        .always(function () {
            progress_mode = false;
        });
    }

    public static function S_getDirPaths()
    {
        return _instance.getDirPaths();
    }

    public function getDirPaths(): Array<String>
    {
        return main_box.getDirPaths();
    }

    public static function addHighlighter(abbrev: String, highlighter: Highlighter): Void
    {
        highlighters.set(abbrev, highlighter);
    }
}
