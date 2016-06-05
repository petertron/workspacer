(function($) {

    var xsrf_token;

    var $contents,
        templated_areas;

    var buttons = {
        'directories': {},
        'files': {},
        'uploads': {}
    }
    var	$create_upload,
        $add_files_true_button;

    File.prototype.request = null;
    File.prototype.status = "Inactive";
    File.prototype.transferred = 0;
    File.prototype.start = function(){
        var self = this;
        self.status = 'Queued';
        var fd = new FormData();
        fd.append('uploaded_file', this);
        fd.append("ajax", "1");
        fd.append("xsrf", xsrf_token);
        this.request = $.ajax({
            'contentType': false,
            //'contentType': 'multipart/form-data',
            'type': 'POST',
            'url': document.URL,
            'data': fd,
            'processData': false,
            'dataType': 'json',
            'xhr': function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    $(xhr.upload).on('progress', function(event) {
                        self.transferred = event.loaded;
                        self.status = event.loaded + " bytes transferred";
                        applyTemplates(upload_data);
                    });
                }
                return xhr;
            },
            'error': function(xhr, msg) {
                alert (msg);
            },
            'success': function(data) {
                upload_data.deleteByName(self.name);
                data['uploads'] = upload_data.uploads;
                applyTemplates(data);
                $('#files').html(data.html);
                $(buttons.uploads.upload).attr('disabled', 'disabled');
                $(buttons.uploads.cancel).attr('disabled', 'disabled');
            }
        });
    }

    var upload_queue_visible = false;

    var upload_data = {
        'uploads': [],
        'add': function(files) {
            for (var i in files) {
                if (typeof(files[i]) == 'object' && !this.findByName(files[i].name)) {
                    this.uploads.push(files[i]);
                }
            }
        },
        'findByName': function(name) {
            for (var i in this.uploads) {
                if (this.uploads[i].name == name) return this.uploads[i];
            }
            return false;
        },
        'deleteByName': function(name) {
            for (var i in this.uploads){
                if (this.uploads[i].name == name){
                    this.uploads.splice(i, 1);
                    break;
                }
            }
        }
    }

    function applyTemplates(data)
    {
        $(templated_areas).each(function() {
            if (data[$(this).data('data')]) {
                $(this).empty().append($('#' + $(this).attr('data-tmpl')).tmpl(data));
            }
        });
    }

    $(document).ready(function() {
        xsrf_token = $('input[name="xsrf"]').val();

        templated_areas = $('[data-tmpl|="tmpl"]');
        $contents = $('#contents:first');

        var button_tags = $('button[type="button"]');
        $(button_tags).each(function() {
            var name_parts = this.name.split(".");
            try {
                buttons[name_parts[1]][name_parts[0]] = this;
            }
            catch (error) {}
        });

        $add_files_true_button = $('input[name="add-files-true-button"]:first');
        $create_upload = $('#create-upload');

        $('button[name="show.create_upload"]').click(function(event){
            //if(!upload_queue_visible){
            if(($create_upload).css('display') == 'none'){
                $create_upload.slideDown(280);
                upload_queue_visible = true;
                applyTemplates(upload_data);
                $(event.target).text('Hide Create/Upload');
                $add_files_true_button.parent()
                    .delay(20)
                    .width(buttons.uploads.add_files.clientWidth + 3)
                    .height(buttons.uploads.add_files.clientHeight + 3);
            }
            else {
                $create_upload.slideUp(280);
                upload_queue_visible = false;
                $(event.target).text('Show Create/Upload');
            }
        });

        $('textarea[name="directory_names"]')
            .on('keyup', function(event) {
                $(this)
                    .parent()
                    .find('button')
                    .attr('disabled', this.value ? false : 'disabled');
            });

        $add_files_true_button.change(function(event) {
            $(buttons.uploads.upload).attr('disabled', false);
            var files = event.target.files;
            upload_data.add(files);
            applyTemplates(upload_data);
            $(buttons.uploads.upload).attr('disabled', false);
        });

        $contents.click(function(event){
            var target = event.target;
            if (!(target.tagName == 'BUTTON' && target.type == 'button')) return;
            var which_button = target.name.split(".");
            var command = which_button[0],
                namespace = which_button[1];
            if (namespace == 'directories') {
                switch(command) {
                    case 'create':
                        var parts = ($('textarea[name="directory_names"]').val()).split("\n");
                        var names = [];
                        for(var i in parts) {
                            var name = parts[i].trim();
                            if(name != '') names.push(name);
                        }
                        $.ajax({
                            'type': 'POST',
                            'data': {
                                'ajax': 'index',
                                'xsrf': xsrf_token,
                                'action': 'create-dir',
                                'fields': {'names': names}
                            },
                            'dataType': 'json',
                            'error': function(xhr, msg){
                                alert(msg);
                            },
                            'success': function(data){
                                $('#files').html(data.html);
                                applyTemplates(data);
                                $('textarea[name="directory_names"]')
                                    .val('')
                                    .trigger('keyup');
                            }
                        });
                        break;
                    case 'clear':
                        $('textarea[name="directory_names"]')
                            .val('')
                            .trigger('keyup')
                            .focus();
                        break;
                }
            }
            else if (namespace == 'uploads') {
                var local_buttons = buttons.uploads;
                switch(command) {
                    case 'upload':
                        for(var i in upload_data.uploads){
                            upload_data.uploads[i].start();
                        }
                        $(buttons.uploads.cancel).attr('disabled', false);
                        break;
                    case 'cancel':
                        for(i in upload_data.uploads){
                            try{
                                upload_data.uploads[i].request.abort();
                            }
                            catch(error){}
                        }
                        upload_data.uploads = [];
                        applyTemplates(upload_data);
                        $(buttons.uploads.upload).attr('disabled', 'disabled');
                        $(buttons.uploads.cancel).attr('disabled', 'disabled');
                        break;
                }
            }
        });

        $('#contents form')
            .on('submit', function(event) {
                var self = this;
                var selected = $(self).find('option:selected')[0];
                if (selected.getAttribute('value') == '') {
                    event.preventDefault();
                    return;
                }
                if (selected.getAttribute('value') == 'delete') {
                    event.preventDefault();
                    // Remove any selected files in upload queue
                    var checked = $('#create-upload tbody input[type="checkbox"]:checked');
                    $(checked).each(function(i) {
                        if ((upload_data.findByName(this.name)).status == 'Inactive') {
                            upload_data.deleteByName(this.name);
                        }
                    });
                    applyTemplates(upload_data);
                    // Remove selected directories or files
                    $.ajax({
                        'type': 'POST',
                        'url': document.URL,
                        'data': $(self).serialize() + '&ajax=index',
                        'dataType': 'json',
                        'error': function(xhr, msg) {
                            alert(msg);
                        },
                        'success': function(data) {
                            $('#files').html(data.html);
                            $('#with-selected').prop('disabled', true).prop('selectedIndex', 0);
                            $('.actions fieldset.apply').addClass('inactive');
                            applyTemplates(data);
                        }
                    });
                }
            });
    });

})(window.jQuery);
//})(jQuery.noConflict());