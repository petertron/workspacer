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
            var WS = Symphony.Extensions.Workspacer;
            var to_return = [WS.elements.dir_boxes[0].dir_path];
            if (WS.elements.dir_boxes[1].active) {
                to_return.push(WS.elements.dir_boxes[1].dir_path);
            }
            return to_return;
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
                    if (data.directories) {
                        WS.directories = data.directories;
                    }
                    if (data.files) {
                        for (var i in data.files) {
                            WS.elements.dir_boxes[i].files = data.files[i];
                        }
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

    $(document).ready(function () {
        $(Symphony.Elements.wrapper).find('.split-view').hide();
        var WS = Symphony.Extensions.Workspacer;
        WS.elements = Symphony.Elements;
        WS.body_id = $(WS.elements.body).attr('id');
        WS.elements.notifier = $(Symphony.Elements.header).find('div.notifier');
        WS.elements.form = $(WS.elements.contents).find('form');
        WS.elements.with_selected = $('#with-selected');

        WS.directories = JSON.parse($('#directories').text())

        WS.elements.dir_boxes = document.getElementsByTagName('dir-box');
        $(WS.elements.dir_boxes).on("openFile", function (event, dir_path, filename) {
            WS.editor_container.open(true);
            WS.editor_container.dir_path = dir_path;
            WS.editor_container.edit(filename);
        });
        WS.elements.dir_boxes[0].files = JSON.parse($('#files').text());

        $('ul.actions').on('click', 'button', function(event) {
            switch (event.target.name) {
                case 'split-view':
                    $('#directories-wrapper').addClass("two columns");
                    WS.elements.dir_boxes[1].dir_path = WS.elements.dir_boxes[0].dir_path;
                    WS.elements.dir_boxes[1].files = WS.elements.dir_boxes[0].files.slice(0);
                    WS.elements.dir_boxes[1].active = true;
                    $(Symphony.Elements.wrapper).find('.default-view').hide();
                    $(Symphony.Elements.wrapper).find('.split-view').show();
                    break;
                case 'close-left':
                    $('#directories-wrapper').removeClass("two columns");
                    WS.elements.dir_boxes[0].dir_path = WS.elements.dir_boxes[1].dir_path;
                    WS.elements.dir_boxes[0].files = WS.elements.dir_boxes[1].files.slice(0);
                    WS.elements.dir_boxes[1].active = false;
                    $(Symphony.Elements.wrapper).find('.split-view').hide();
                    $(Symphony.Elements.wrapper).find('.default-view').show();
                    break;
                case 'close-right':
                    $('#directories-wrapper').removeClass("two columns");
                    WS.elements.dir_boxes[1].active = false;
                    $(Symphony.Elements.wrapper).find('.split-view').hide();
                    $(Symphony.Elements.wrapper).find('.default-view').show();
                    break;
            }
        });

        disableWithSelected();

        WS.editor_container = $('editor-box')[0];

        $(window).keydown(function (event) {
            if (event.which == 27) {
                WS.editor_container.open(false);
            }
        });

        $(WS.elements.form).submit(formSubmitHandler);
    });

    function formSubmitHandler(event)
    {
        var WS = Symphony.Extensions.Workspacer;
        var with_selected = $(WS.elements.with_selected).val();
        if (with_selected == "download") {
            return;
        }
        event.preventDefault();
        //alert($(WS.elements.form).serialize());
        $.ajax({
            method: 'POST',
            url: WS.ajax_url,
            data: $(WS.elements.form).serialize(),
            dataType: 'json'
        })
            .done(function (data) {
                if (data.alert_msg) {
                    var msg = data.alert_msg + ' <a class="ignore">' + Symphony.Language.get('Clear?') + '</a>';
                    $(WS.elements.notifier).trigger('attach.notify', [msg, data.alert_type]);
                    if (data.alert_type == "error") {
                        $(window).scrollTop(0);
                    }
                }
                if (data.directories) {
                    WS.directories = data.directories;
                }
                if (data.files) {
                    if (data.files[0]) {
                        WS.elements.dir_boxes[0].files = data.files[0];

                    }
                    if (data.files[1]) {
                        WS.elements.dir_boxes[1].files = data.files[1];
                    }
                }
            })
            .fail(function (jqXHR, textStatus) {
                alert(textStatus);
                //func_error()
            });
    }

    function disableWithSelected() {
        $(Symphony.Extensions.Workspacer.elements.with_selected).prop('disabled', true).prop('selectedIndex', 0);
        $('.actions fieldset.apply').addClass('inactive');
    }
})(jQuery.noConflict());

        //WS.move_across = document.querySelector('#with-selected option[value="move"]');
        //WS.copy_across = document.querySelector('#with-selected option[value="copy"]');
        //WS.move_across.hidden = true;
        //WS.move_across.disabled = true;
        //WS.copy_across.hidden = true;
        //WS.copy_across.disabled = true;
