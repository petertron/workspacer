/*global jQuery, xtag, Symphony, CodeEditor, window */
/*jslint browser: true, devel: true, plusplus: true */

xtag.register('editor-box', {
    dir_path: "",
    filename: "",
    lifecycle: {
        created: function () {
            var super_this = this;
            this.code_editor = new CodeEditor(Symphony.Extensions.Workspacer.editor_settings);
            jQuery(this.code_editor.editor).on('save', function (event) {
                jQuery(super_this).find('button[accesskey="s"]').trigger('click');
            });
            jQuery(this.code_editor.editor).insertAfter(jQuery(this).find('header'));
        }
    },
    methods: {
        open: function (value) {
            if (value === true) {
                // Open editor.
                window.getSelection().removeAllRanges();
                this.style.display = "block";
                jQuery('#mask').show();
            } else {
                this.style.display = "none";
                jQuery('#mask').hide();
            }
        },
        headerText: function (text) {
            jQuery(this).find('header p').text(text);
        },
        edit: function (filename) {
            var super_this = this;
            if (filename) {
                // Edit existing file.
                this.setFooterContent("1");
                var file_path = (this.dir_path ? this.dir_path + "/" : "") + filename;
                this.headerText("Loading " + file_path);
                this.className = "edit";
                this.code_editor.setText("");
                jQuery.ajax({
                    method: 'GET',
                    url: Symphony.Extensions.Workspacer.ajax_url,
                    data: {action: "load", file_path: file_path},
                    dataType: 'json'
                })
                    .done(function (data) {
                        Symphony.Extensions.Workspacer.current_filename = filename;
                        super_this.code_editor.setFilename(file_path);
                        super_this.code_editor.setText(data.text);
                        super_this.headerText("Editing " + file_path);
                    })
                    .fail(function (jqXHR, textStatus) {
                        super_this.headerText("Failed to load " + file_path);
                        window.alert(textStatus);
                    });
            } else {
                this.setFooterContent("0");
                this.headerText("New file");
                this.className = "new";
                this.code_editor.setFilename(null);
                this.code_editor.setText("");
            }
        },
        setFooterContent: function (template_num) {
            var template_element = jQuery(this).find('#editor-container-footer-' + template_num)[0];
            if (!template_element) {
                return;
            }
            var footer_element = jQuery(this).find('footer')[0];
            if (template_element.content) {
                jQuery(footer_element).empty();
                footer_element.appendChild(document.importNode(template_element.content, true));
            }
        }
    },
    events: {
        'click:delegate(button)': function (event) {
            var WS = Symphony.Extensions.Workspacer;
            var super_this = event.currentTarget;
            var file_path;
            switch (this.name) {
            case 'close':
                super_this.open(false);
                break;
            case 'create':
                var potential_filename = window.prompt("File name");
                if (potential_filename) {
                    file_path = WS.filePathFromParts(super_this.dir_path, potential_filename);
                    super_this.headerText("Creating file " + file_path);
                    WS.serverPost(
                        {
                            action: "create",
                            file_path: file_path,
                            text: super_this.code_editor.getText()
                        },
                        function (data) {
                            if (!data.alert) {
                                WS.current_filename = potential_filename;
                                super_this.filename = potential_filename;
                            }
                            super_this.className = "edit";
                            super_this.headerText("Editing " + WS.filePathFromParts(super_this.dir_path, WS.current_filename));
                            super_this.code_editor.setFilename(WS.current_filename);
                            super_this.setFooterContent("1");
                        },
                        function () {
                            super_this.headerText(WS.current_filename || "New file");
                        }
                    );
                }
                break;
            case 'save':
                file_path = WS.filePathFromParts(super_this.dir_path, WS.current_filename);
                super_this.headerText("Saving " + file_path);
                //this.code_editor.editor.putFocus();
                WS.serverPost(
                    {
                        action: "save",
                        file_path: file_path,
                        filename: WS.current_filename,
                        text: super_this.code_editor.getText()
                    },
                    function (data) {
                        super_this.headerText("Editing " + WS.filePathFromParts(super_this.dir_path, WS.current_filename));
                        super_this.code_editor.setFilename(WS.current_filename);
                    }
                );
                break;
            }
        }
    }
});
