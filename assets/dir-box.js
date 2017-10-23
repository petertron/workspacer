/*global jQuery, xtag, Symphony, CodeEditor, window */
/*jslint browser: true, devel: true, plusplus: true */

xtag.register('dir-box', {
    content: '<fieldset class="dir-controls"><select name="sets[][dir_path]"></select><button type="button" name="new" class="button add">+</button></fieldset><div class="dir-controls add-box">' +
        '<button class="button" type="button" name="new_file">New file</button>' +
        '<button class="button" type="button" name="new_dirs">New directories</button>' +
    '</div>' +
        '<div class="dir-controls add-dirs-box" style="display: none">' +
        '<label>New Directories<i>Put each name on a separate line</i><textarea name="dir_names"></textarea></label>' +
        '<button class="button" type="button" name="create_dirs">Create</button>' +
        '<button class="button" type="button" name="cancel_dirs">Cancel</button>' +
    '</div><table class="selectable" data-interactive="interactive"></table>',
    lifecycle: {
        created: function () {
            this.active = (this.getAttribute('active') === 'true') ? true : false;
            this.dir_path = "";
        }
    },
    accessors: {
        active: {
            get: function () {
                return this._active;
            },
            set: function (value) {
                this._active = value;
                if (value === true) {
                    this.style.display = "block";
                } else {
                    this.style.display = "none";
                }
            }
        },
        dir_path: {
            get: function () {
                return this._dir_path;
            },
            set: function (value) {
                this._dir_path = value;
            }
        },
        files: {
            get: function () {
                return this._files;
            },
            set: function (value) {
                if (typeof value === 'object') {
                    this._files = value;
                    this.deselect();
                    var template = jQuery.templates("#template_select");
                    jQuery(this).find('select').html(template.render({
                        dir_num: this.dataset.dirNum,
                        dir_path: this.dir_path,
                        directories: Symphony.Extensions.Workspacer.directories
                    }));
                    template = jQuery.templates("#template_table");
                    jQuery(this).find('table').html(template.render({dir_num: this.dataset.dirNum, files: value}));
                }
            }
        }
    },
    methods: {
        render: function () {
            var template = jQuery.templates("#template_table");
            jQuery(this).html(template.render({
                directories: this.directories,
                dir_num: this.dataset.dirNum,
                dir_path: this.dir_path,
                files: this.files
            }));
        },
        hideAddBox: function () {
            jQuery(this).find('div.add-box').hide();
        },
        loadDirData: function (dir_path) {
            var super_this = this;
            jQuery.ajax({
                method: 'GET',
                url: Symphony.Extensions.Workspacer.ajax_url,
                data: {
                    xsrf: Symphony.Utilities.getXSRF(),
                    action: "directory-data",
                    dir_path: dir_path
                },
                dataType: 'json'
            })
                .done(function (data) {
                    if (data.directories) {
                        Symphony.Extensions.Workspacer.directories = data.directories;
                    }
                    super_this.dir_path = dir_path;
                    super_this.files = data.files;
                })
                .fail(function (jqXHR, textStatus) {
                    window.alert(textStatus);
                });
        },
        deselect: function () {
            jQuery(this).find('.selected').removeClass('selected').trigger('deselect.selectable');
        },
        triggerOpenFile: function (event) {
            var dir_path = event.currentTarget.dir_path;
            var filename = event.target.dataset.href;
            jQuery(event.currentTarget).trigger("openFile", [dir_path, filename]);
        },
        filePathFromParts: function (dir_path, filename) {
            return (dir_path ? dir_path + "/" : "") + filename;
        }
    },
    events: {
        'click:delegate(button)': function (event) {
            var super_this = event.currentTarget;
            var action = event.target.name;
            switch (action) {
                case "new":
                    jQuery(super_this).find('.add-box').slideToggle(120);
                    break;
                case "new_file":
                    super_this.hideAddBox();
                    var dir_path = super_this.dir_path;
                    jQuery(super_this).trigger("openFile", [dir_path, null]);
                    break;
                case "new_dirs":
                    super_this.hideAddBox();
                    jQuery(super_this).find('.add-dirs-box').slideDown(120);
                    break;
                case "create_dirs":
                    jQuery(super_this).find('.add-dirs-box').slideUp(120);
                    var v = jQuery(super_this).find('textarea').val();
                    Symphony.Extensions.Workspacer.serverPost({
                        action: "create_dirs",
                        dir_path: super_this.dir_path,
                        items: v.split("\n")
                    });
                    break;
                case "cancel_dirs":
                    jQuery(super_this).find('.add-dirs-box').slideUp(120);
                    break;
            }
        },
        'change:delegate(select)': function (event) {
            event.currentTarget.loadDirData(event.target.value);
        },
        'click:delegate(a.dir)': function (event) {
            var dir_path = (event.currentTarget.dir_path ? event.currentTarget.dir_path + "/" : "") + event.target.dataset.href;
            event.currentTarget.loadDirData(dir_path);
        },
        'click:delegate(a.file)': function (event) {
            event.currentTarget.triggerOpenFile(event);
        },
        'keydown:delegate(a.file)': function (event) {
            if (event.keyCode == 13) {
                event.currentTarget.triggerOpenFile(event);
            }
        }
    }
});
