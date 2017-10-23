/*global jQuery, Symphony, window, document, alert */
/*jslint browser: true, devel: true, plusplus: true */

(function ($) {
    "use strict";

    // Global variables
    Symphony.Extensions['Workspacer'] = {
        ajax_url: Symphony.Context.get('symphony') + "/extension/workspacer/ajax/manage/",
        elements: {},
        view_mode: "0",
        current_filename: null,
        editor_settings: JSON.parse($('#editor-settings').text()),
        getDirPaths: function () {
            /*var WS = Symphony.Extensions.Workspacer;
            var to_return = [WS.elements.dir_boxes[0].dir_path];
            if (WS.elements.dir_boxes[1].active) {
                to_return.push(WS.elements.dir_boxes[1].dir_path);
            }
            return to_return;*/
            return null;
        },
        filePathFromParts: function (dir_path, filename) {
            return (dir_path ? dir_path + "/" : "") + filename;
        },
        serverPost: function (data, func_done, func_error) {
            var WS = Symphony.Extensions.Workspacer;
            data.xsrf = Symphony.Utilities.getXSRF();
            data.body_id = WS.body_id;
            data.dir_paths = WS.getDirPaths();
            $.ajax({
                method: 'POST',
                url: WS.ajax_url,
                data: data,
                dataType: 'json'
            })
                .done(function (data) {
                    if (data.alert_msg) {
                        $(WS.elements.notifier).trigger('attach.notify', [data.alert_msg, data.alert_type]);
                    }
                    if (func_done) {
                        func_done(data);
                    }
                })
                .fail(function (jqXHR, textStatus) {
                    alert(textStatus);
                }); 
        }
    };

    var WS = Symphony.Extensions.Workspacer;

    $(document).ready(function () {
        WS.elements = Symphony.Elements;
        //WS.body_id = $(WS.elements.body).attr('id');
        //WS.elements.notifier = $(Symphony.Elements.header).find('div.notifier');
        
        $(WS.elements.wrapper).on('click', 'a.file', openFileHandler);

        WS.editor_container = $('editor-box')[0];
        WS.editor_container.dir_path = "pages";

        $(window).keydown(function (event) {
            if (event.which == 27) {
                WS.editor_container.open(false);
            }
        });

    });

    function openFileHandler(event) {
        WS.editor_container.open(true);
        WS.editor_container.edit(event.target.dataset.href);
    }

})(jQuery.noConflict());

        //WS.move_across = document.querySelector('#with-selected option[value="move"]');
        //WS.copy_across = document.querySelector('#with-selected option[value="copy"]');
        //WS.move_across.hidden = true;
        //WS.move_across.disabled = true;
        //WS.copy_across.hidden = true;
        //WS.copy_across.disabled = true;
