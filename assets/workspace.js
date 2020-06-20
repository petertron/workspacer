(function($, Symphony) {

    var Forms = document.forms;

    var Form,
        Directory,
        TR_none_found,
        MoveCopyDeleteBox,
        RenameBox,
        NewDirectoriesBox,
        UploadForm,
        HiddenFileInput,
        EditorForm,
        CodeArea;

    Symphony.View.add('/blueprints/workspace/', function ()
    {
        TR_none_found = document.querySelector('tbody tr');
        TR_none_found.parentNode.removeChild(TR_none_found);

        Form = document.forms.mainForm;

        Form.directorySelector._history = {
            stack: [''],
            pointer: 0,
            pointerPending: null,
            valueToPush: null
        };

        for (let element of document.querySelectorAll('.directory-selector')) {
            element.setValue = directorySelectorSetValue;
        }

        Form.directorySelector.goTo = contextDirectorySelectorGoTo;
        Form.directorySelector.onchange = directoryChangeHandler;
        Form.onsubmit = mainFormSubmit;


        document.getElementById('context').onclick = topButtonClickHandler;

        Directory = Form.querySelector('table');
        Directory._body = Directory.querySelector('tbody');
        Directory._rows = [];
        Directory._new_rows = [];
        Directory.addFile = directoryAddFile;
        Directory.update = directoryBodyUpdate;
        Directory.findFile = directoryFindFile;
        Directory._body.addEventListener('click', directoryBodyClickHandler, {capture: true});

        let files = JSON.parse(document.scripts.workspaceFiles.textContent);
        for (let file of files) {
            let link_target = file.link_target ? file.link_target : null;
            Directory.addFile(
                file.dir, file.name, file.what, file.type, link_target, file.size, file.perms,
                file.mtime, file.mdate
            );
        }
        Directory.update();
        fillDirectorySelectors();


        // Move/copy/delete box.

        MoveCopyDeleteBox = document.getElementById('MoveCopyDeleteBox');
        MoveCopyDeleteBox.setAction = moveCopyBoxSetAction;
        MoveCopyDeleteBox.addEventListener('click', function (event) {
            if (event.target instanceof HTMLButtonElement && event.target.type == 'button') {
                this.close();
            }
        });

        // Rename box
        RenameBox = document.getElementById('RenameBox');
        RenameBox.addEventListener('click', function (event) {
            if (event.target instanceof HTMLButtonElement && event.target.type == 'button') {
                this.close();
            }
        });


        // New directories box.

        NewDirectoriesBox = document.getElementById('NewDirectoriesBox');
        NewDirectoriesBox.display = newDirectoriesBoxOpen;
        NewDirectoriesBox.addEventListener('click', newDirectoriesBoxOnClick)
        NewDirectoriesBox
            .querySelector('form').addEventListener('submit', newDirectoriesFormSubmit);


        // Upload box.

        UploadForm = document.forms.UploadForm;
        UploadForm.open = uploadFormOpen;
        UploadForm.addEventListener('click', uploadFormOnClick);
        UploadForm.addEventListener('change', uploadFormOnChange);
        HiddenFileInput = UploadForm.querySelector('input[type="file"]');


        // Editor box.

        EditorForm = document.forms.EditorForm;
        EditorForm._dialog = EditorForm.closest('dialog');
        EditorForm._status = EditorForm.querySelector('.status-line');
        $(EditorForm._status).symphonyNotify();
        EditorForm.getVal = getValue;
        EditorForm.setVal = setValue;
        EditorForm.open = editorFormOpen;
        EditorForm.setView = editorFormSetView;
        EditorForm.setStatus = editorFormSetStatus;
        EditorForm.loadFile = editorFormLoadFile;
        EditorForm.addEventListener('click', editorFormClickHandler);
        EditorForm.onsubmit = editorFormOnSubmit;


        CodeArea = document.querySelector('code-area');
        CodeArea.addEventListener('save', editorFormSaveEvent.bind(EditorForm));

    });


    /**
    * Make GET request to server.
    *
    * @param string url
    * @param object search_params
    */
    function fetchData(url, search_params)
    {
        const controller = new AbortController();
        const { signal } = controller;

        let url_obj = requestUrlObject(url, search_params);
        const fetchParams = {
            headers: {'X-Requested-With': 'Workspacer Fetch'},
            signal
        };

        let promise = fetch(url_obj, fetchParams).then(response => response.json());

        return [promise, controller.abort.bind(controller)];
    };

    function requestUrlObject(url, search_params)
    {
        let url_obj = new URL(url);
        if (search_params && typeof search_params == 'object') {
            for (let key in search_params) {
                url_obj.searchParams.append(key, search_params[key]);
            }
        }
        return url_obj;
    }

    /**
     * Set operation to 'move', 'copy', or 'delete'.
     *
     * @param string mode
     *   Mode name.
     */
    function moveCopyBoxSetAction(action)
    {
        if (this.dataset[action] == undefined)
            return;

        this.querySelector('h1 span').textContent = this.dataset[action];
        this.querySelector('div.selector-box').hidden = (action == 'delete');
    }


    /**
    * Fill directory selectors with a list of directories.
    *
    * @param object data
    */
    function fillDirectorySelectors()
    {
        let dir_current = Form.directorySelector.value;
        let directories = Directory._rows.filter(tr => tr.dataset.what == '+');
        if (directories.length == 0) return;
        let dir_list = [], path;
        for (let tr of directories) {
            let ds = tr.dataset;
            let path = ds.dir ? ds.dir + '/' + ds.name : ds.name;
            dir_list.push(path);
        }
        dir_list = dir_list.sort();

        let frag = document.createDocumentFragment();
        let option = document.createElement('option');
        option.setAttribute('value', '');
        option.setAttribute('selected', 'selected');
        option.textContent = 'Workspace root';
        frag.appendChild(option);
        for (let item of dir_list) {
            //let path = (item['dir'] ? item['dir'] + '/' : '') + item['name'];
            option = document.createElement('option');
            option.setAttribute('value', item);
            option.textContent = item;
            frag.appendChild(option);
        }
        let selects = document.querySelectorAll('select.directory-selector');
        for (let select of selects) {
            select.innerHTML = null;
            select.appendChild(frag.cloneNode(true));
            selectBoxSetValue(select, dir_current);
        }
        frag = null;
    }

    /**
     * Add new file to directory table.
     *
     * @param object tr
     *  TableRow element containing;
     */
    function directoryAddFile(dir, name, what, type = '-', link_target, size, perms, mtime, mdate)
    {
        let tr = Directory.findFile(dir, name);
        if (!tr) {
            tr = document.createElement('tr');
        }
        let ds = tr.dataset;
        ds.dir = dir;
        ds.name = name;
        ds.what = what;
        ds.type = type;
        if (link_target) {
            ds.link_target = link_target;
        }
        ds.size = size;
        ds.perms = perms;
        ds.mtime = mtime;
        ds.mdate = mdate;
        this._new_rows.push(tr);
    }

    /**
     * Re-render directory body if neccessary.
     */
    function directoryBodyUpdate(rerender = false)
    {
        let current_dir = Form.directorySelector.value;
        if (this._new_rows.length > 0) {
            for (let tr of this._new_rows) {
                this._rows.push(tr);
                rerender = (tr.dataset.dir == current_dir) ? true : rerender;
            }
            this._new_rows.length = 0;
        }
        if (rerender) {
            let rows = this._rows.filter((tr) => {
                return tr.dataset.dir == current_dir;
            });
            this._body.innerHTML = null;
            if (rows.length > 0) {
                rows.sort(function (a, b) {
                    return a.dataset.name < b.dataset.name ? -1 : (a.dataset.name == b.dataset.name ? 0 : 1);
                });
                for (let tr of rows) {
                    renderTR(tr);
                    this._body.appendChild(tr);
                }
            } else {
                this._body.appendChild(TR_none_found);
            }
        }
    }


    /*
     * Find file.
     */
    function directoryFindFile(dir, filename)
    {
        let found = this._rows.filter(tr => tr.dataset.dir == dir && tr.dataset.name == filename);
        return (found.length > 0) ? found[0] : null;
    }


    function contextDirectorySelectorGoTo(where)
    {
        if (typeof where !== 'string' || where.length == 0) {
            return false;
        }
        if (where == '-') {
            if (this._history.pointer == 0) {
                return false;
            } else {
                this._history.pointer--;
                this.setValue(this._history.stack[this._history.pointer]);
            }
        } else if (where == '+') {
            if (this._history.pointer == this._history.stack.length - 1) {
                return false;
            } else {
                this._history.pointer++;
                this.setValue(this._history.stack[this._history.pointer]);
            }
        } else if (where[0] == '=') {
            let dir = where.slice(1);
            this.setValue(dir);
            this._history.stack.length = this._history.pointer + 1;
            this._history.stack.push(dir);
        } else {
            return false;
        }
        Directory.update(true);
    }


    // Event handlers.

    /**
     * Change handler for directory selector in context area.
     *
     * @param object event
     *   Event data.
     */
    function directoryChangeHandler(event)
    {
        let new_directory = this.value;
        this._history.stack.length = this._history.pointer + 1;
        this._history.stack.push(new_directory);
        this._history.pointer = this._history.stack.length - 1;
        Directory.update(true);
    }


    /**
    * Click handler for buttons in context area.
    *
    * @param object event
    *   Event data.
    */
    function topButtonClickHandler(event)
    {
        if (event.target instanceof HTMLButtonElement) {
            let button = event.target;
            switch (button.name) {
                case 'parent-directory':
                    let current_dir = Form.directorySelector.value;
                    if (current_dir !== '') {
                        let slash_pos = current_dir.lastIndexOf('/');
                        if (slash_pos > 0) {
                            parent_dir = current_dir.substr(0, slash_pos);
                        } else {
                            parent_dir = '';
                        }
                        Form.directorySelector.goTo('=' + parent_dir);
                    }
                    break;
                case 'history-backwards':
                    Form.directorySelector.goTo('-');
                    break;
                case 'history-forwards':
                    Form.directorySelector.goTo('+');
                    break;
                case 'newFile':
                    EditorForm.open(Form.directorySelector.value);
                    break;
                case 'newDirectories':
                    NewDirectoriesBox.display();
                    break;
                case 'upload':
                    UploadForm.open();
                    break;

            }
        }
    }

    /**
     *
     * @param string dir
     *   Directory path.
     */
    function directorySelectorSetValue(dir) {
        if (dir) {
            this.value = dir;
        } else {
            this.selectedIndex = 0;
        }
    };

    function selectBoxSetValue(select_element, value)
    {
        if (value) {
            select_element.value = value;
        } else {
            select_element.selectedIndex = 0;
        }
    }

    /**
     * Render table row
     */
    function renderTR(tr)
    {
        let ds = tr.dataset;
        let what = ds.what;
        let is_dir = (what == '+') ? true : false;
        let clickable = (is_dir || what == '=') ? true : false;
        let template_name = 'tmpl-table-row';
        if (tr.classList.contains('inactive')) {
            template_name += '-inactive';
        } else {
            let name_html;
            if (ds.link_target !== undefined) {
                name_html = `<em>${ds.name}</em> → `;
                if (clickable) {
                    name_html += `<a class="${is_dir ? 'dir linked' : 'file linked'}">~/${ds.link_target}</a>`;
                } else {
                    if (ds.link_target == '') {
                        name_html += '<span class="inactive">void</span>';
                    } else {
                        name_html += ds.link_target;
                    }
                }
            } else {
                if (clickable) {
                    name_html = `<a class="${is_dir ? 'dir' : 'file'}">${ds.name}</a>`;
                    //name_html = `<a class="${class_name}">${ds.name}</a>`;
                } else {
                    name_html = ds.name;
                }
            }
            ds.anchor = name_html;
        }
        let row_template = document.getElementById(template_name).textContent;
        html = row_template.replace(/\{(\w+)\}/g, match => ds[match.slice(1, match.length - 1)]);
        tr.innerHTML = html;
    }


    /**
     * Click handler for directory body.
     *
     * @param object event
     *   Event data.
     */
    function directoryBodyClickHandler(event)
    {
        event.preventDefault();
        if (event.target instanceof HTMLAnchorElement) {
            let anchor = event.target;
            let tr = anchor.closest('tr');
            let dir_current = Form.directorySelector.value;
            let dir, filename;
            if (anchor.classList.contains('file')) {
                if (anchor.classList.contains('linked')) {
                    [dir, filename] = filePathSplit(tr.dataset.link_target);
                } else {
                    dir = dir_current;
                    filename = tr.dataset.name;
                }
                EditorForm.open(dir, filename);
            } else if (anchor.classList.contains('dir')) {
                let new_dir;
                if (anchor.classList.contains('linked')) {
                    new_dir = tr.dataset.link_target;
                } else {
                    new_dir = filePathJoin(dir_current, tr.dataset.name);
                    //Form.directorySelector.goTo('=' + (dir_current ? dir_current + '/' : '') + anchor.textContent);
                }
                Form.directorySelector.goTo('=' + new_dir);
            }
        }
    }


    /**
     * Submit handler for main form.
     *
     * @param object event
     *   Event data.
     */
    function mainFormSubmit(event)
    {
        event.preventDefault();
        let action = this['with-selected'].value;

        if (!MoveCopyDeleteBox.open && !RenameBox.open) {
            switch (action) {
                case 'move':
                case 'copy':
                case 'delete':
                    MoveCopyDeleteBox.setAction(action);
                    MoveCopyDeleteBox.showModal();
                    break;
                case 'rename':
                    RenameBox.querySelector('input').value = null;
                    RenameBox.showModal();
                    break;
            }
        } else {
            if (MoveCopyDeleteBox.open) {
                MoveCopyDeleteBox.close();
            }
            if (RenameBox.open) {
                RenameBox.close();
            }

            if (action == 'move' || action == 'copy') {
                if (this['dest-dir'].value == this['source-dir'].value) return;
            }

            let form_data = new FormData(Form);
            form_data.set('action', 'apply');
            let selected = this.querySelectorAll('tr.selected');

            if (action == 'move' || action == 'delete' || action == 'rename') {
                for (let tr of selected) {
                    tr.classList.remove('selected');
                    tr.classList.add('inactive');
                    renderTR(tr);
                }
            }

            let tr, tr_new;
            fetch(Symphony.Context.get('symphony') + '/extension/workspacer/ajax/manage/', {
                method: 'POST',
                body: form_data,
            })
            .then(response => response.json())
            .then(data => {
                if (data.files) {
                    let move_delete = (data.action == 'move' || data.action == 'delete');
                    let move_copy = (data.action == 'move' || data.action == 'copy');
                    let rename = (data.action == 'rename');
                    for (let [filename, done] of Object.entries(data.files)) {
                        tr = Directory._rows.filter(tr => tr.dataset.dir == data.source_dir && tr.dataset.name == filename)[0];
                        if (!tr) continue;
                        if (move_copy && done) {
                            let ds = tr.dataset;
                            Directory.addFile(data.dest_dir, ds.name, ds.what, ds.type, null, ds.size, ds.perms, ds.mtime, ds.mdate);
                        }
                        if (move_delete) {
                            if (done) {
                                // Remove TR from array.
                                let index = Directory._rows.indexOf(tr);
                                Directory._rows.splice(index, 1);
                                Directory._body.removeChild(tr);
                                tr = null;
                            } else {
                                tr.classList.remove('inactive');
                                renderTR(tr);
                            }
                        }
                        if (rename) {
                            if (done) {
                                tr.dataset.name = done;
                                tr.classList.remove('inactive');
                                renderTR(tr);
                            }
                        }
                    }
                    Directory.update(true);
                    fillDirectorySelectors();
                }
            })
            .catch(function (error) {
                console.error('Error:', error);
            });
        }
    }


    // New directories box.

    function newDirectoriesBoxOpen()
    {
        this.querySelector('input[name="items[0]"]').value = null;
        this.querySelector('div.extra-directories').innerHTML = null;
        this.showModal();
    }


    // New directories box click handler;

    function newDirectoriesBoxOnClick(event)
    {
        let clicked = event.target;
        let extra_inputs = this.querySelector('div.extra-directories');
        if (clicked instanceof HTMLButtonElement) {
            switch (clicked.name) {
                case 'add':
                    extra_inputs
                        .appendChild(this.querySelector('template').content.cloneNode(true));
                    numberInputElements(extra_inputs);
                    extra_inputs.querySelector('input').focus();
                    break;
                case 'close':
                    this.close();
                    break;
            }
        } else if (clicked instanceof HTMLAnchorElement) {
            extra_inputs.removeChild(clicked.closest('label'));
            numberInputElements(extra_inputs);
        }
    }


    function newDirectoriesFormSubmit(event)
    {
        event.preventDefault();
        let form_data = new FormData(this);
        form_data.set('dest_dir', Form.directorySelector.value);
        fetch(Symphony.Context.get('symphony') + '/extension/workspacer/ajax/directories/', {
            method: 'POST',
            body: form_data
        })
        .then(response => response.json())
        .then(data => {
            let dest_dir = data.dest_dir;
            for (let item of Object.values(data.created)) {
                Directory.addFile(
                    dest_dir, item.name, item.what, item.type, null, item.size, item.perms, item.mtime, item.mdate
                );
            }
            NewDirectoriesBox.close();
            Directory.update();
            fillDirectorySelectors();
        });
    }


    function numberInputElements(parent_element)
    {
        let inputs = parent_element.querySelectorAll('input');
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].setAttribute('name', `items[${i + 1}]`);
        }
    }


    // Upload box events.

    function uploadFormOpen()
    {
        this.querySelector('tbody').innerHTML = null;
        this._dialog = this.closest('dialog');
        this._dialog.showModal();
        document.activeElement.blur();
    }

    function uploadFormOnClick(event)
    {
        let clicked = event.target;
        let tbody = this.querySelector('tbody');
        let rows;
        if (clicked instanceof HTMLButtonElement) {
            switch (clicked.name) {
                case 'add':
                    HiddenFileInput.click();
                    break;
                case 'close':
                    this._dialog.close();
                    break;
                case 'uploadAll':
                    rows = tbody.querySelectorAll('tr[data-mode="pre-active"]');
                    for (let tr of rows) {
                        uploadFile(tr);
                    }
                    break;
                case 'removeAll':
                    rows = tbody.querySelectorAll('tr[data-mode="pre-active"]');
                    for (let tr of rows) {
                        tbody.removeChild(tr);
                    }
                    break;
            }
        } else if (clicked instanceof HTMLAnchorElement) {
            let tr = clicked.closest('tr');
            switch (clicked.dataset.name) {
                case 'remove':
                    tbody.removeChild(tr);
                    break;
                case 'upload':
                    uploadFile(tr);
                    break;
            }
        }
    }

    function uploadFormOnChange(event)
    {
        if (event.target == HiddenFileInput) {
            let files = event.target.files;
            let tbody = this.querySelector('tbody');
            //tbody.innerHTML = null;
            let row_template = document.getElementById('tmpl-upload-table-row').textContent;
            for (let file of files) {
                let filename = file.name;
                if (!tbody.querySelector(`tr[data-name="${filename}"]`)) {
                    // Add file to upload list.
                    //upload_list.set(filename, file);
                    let tr = document.createElement('tr');
                    tr.file = file;
                    tr.dataset.name = filename;
                    tr.dataset.mode = 'pre-active';
                    tr.innerHTML = row_template.replace(/\{(\w+)\}/g, match => file[match.slice(1, match.length - 1)]);
                    tbody.appendChild(tr);
                }
            }
            this['removeAll'].disabled = false;
            this['uploadAll'].disabled = false;
        }
    }


    function uploadProgress(event)
    {
        let size = parseInt(this.querySelector('td.size').textContent);
        let percent = Math.round(event.loaded / size * 100);
        percent = percent > 100 ? 100 : percent;
        this.querySelector('td.xfered').textContent = percent;
    }

    function uploadDone(event)
    {
        this.dataset.mode = 'pre-active';
    }

    function xhrOnStateChange()
    {
        let xhr = this.xhr;
        if (xhr.readyState === XMLHttpRequest.DONE) {
            let status = xhr.status;
            if (status >= 200 && status < 400) {
                // The request has been completed successfully
                let data = JSON.parse(xhr.responseText);
                Directory.addFile(data.dir, data.name, data.what, data.type, null, data.size,
                    data.perms, data.mtime, data.mdate);
                Directory.update();
            } else {
                // There has been an error with the request!
                alert("There has been an error.");
            }
        }
    }

    function uploadFile(tr)
    {
        let xhr = new XMLHttpRequest();
        let form_data = new FormData();
        form_data.set('xsrf', Symphony.Utilities.getXSRF());
        form_data.set('uploaded_file', tr.file);
        form_data.set('dest_dir', Form.directorySelector.value);
        let up = xhr.upload;
        xhr.onreadystatechange = xhrOnStateChange.bind(tr);
        up.onloadstart = uploadProgress.bind(tr); // e.type, e.loaded
        up.onprogress = uploadProgress.bind(tr);
        up.onloadend = uploadProgress.bind(tr);
        up.onload = uploadDone.bind(tr);
        //up.onabort = uploadAbort;
        //up.onerror = uploadError;
        //up.ontimeout = uploadTimeout;
        up.ontimeout = uploadDone.bind(tr);

        tr.xhr = xhr;
        xhr.open(
            'POST',
            Symphony.Context.get('symphony') + '/extension/workspacer/ajax/upload/',
            true
        );
        xhr.send(form_data);
        tr.dataset.mode = 'active';
    }


    // Editor box.

    function editorFormOpen(dir = '', filename = '')
    {
        this.setVal('fields[directory-last]', dir);
        this.setVal('fields[directory]', dir);
        this.setVal('fields[filename-last]', filename);
        this.setVal('fields[filename]', filename);
        this.setVal('fields[contents]', null);

        this.setView('main');
        this._dialog.showModal();
        if (filename) {
            this.loadFile(dir, filename);
        } else {
            this.setStatus('New file');
        }
        this['fields[contents]'].focus();
    }


    function editorFormSetStatus(text, type = 'protected')
    {
        $(this._status).find('div').empty();
        $(this._status).trigger('attach.notify', [text, type]);
    }


    function editorFormSetView(view)
    {
        let filename_last = this.getVal('fields[filename-last]');
        if (view == 'main') {
            this.fs_saveAs.hidden = true;
            this.fs_editor.hidden = false;
            if (filename_last) {
                this.fs_bottomButtonsNew.hidden = true;
                this.fs_bottomButtonsEdit.hidden = false;
            } else {
                this.fs_bottomButtonsNew.hidden = false;
                this.fs_bottomButtonsEdit.hidden = true;
            }
        } else if (view == 'save-as') {
            this.fs_editor.hidden = true;
            this.fs_bottomButtonsNew.hidden = true;
            this.fs_bottomButtonsEdit.hidden = true;
            this.fs_saveAs.hidden = false;
            this['fields[filename]'].focus();
            this['fields[filename]'].select();
        }
        let heading = this.querySelector('h1');
        //let filename = this.getVal('fields[filename-last]');
        if (filename_last) {
            let file_path = filePathJoin(this.getVal('fields[directory-last]'), filename_last);
            heading.innerHTML = `Edit File <span>${file_path}</span>`;
        } else {
            heading.textContent = 'New File';
        }
    }


    /**
    * Load file.
    *
    * @param object event
    *   Event data.
    */
    function editorFormLoadFile(dir, filename)
    {
        this.setStatus('Loading');
        let url_obj = requestUrlObject(
            this.action, {file_path: filePathJoin(dir, filename)}
        );
        fetch(url_obj, {method: 'GET'})
        .then(response => response.json())
        .then(data => {
            CodeArea.filename = filename;
            this.setVal('fields[directory-last]', dir);
            this.setVal('fields[filename-last]', filename);
            this.setVal('fields[directory]', dir);
            this.setVal('fields[filename]', filename);
            this.setVal('fields[contents]', data.text);
            this.setStatus('File loaded', 'success');
            //CodeArea.enabled = true;
        })
        .catch(function (error) {
            console.log(error);
            //alert("Err: " + error.name + ', ' + error.message);
        })
    }

    function editorFormClickHandler(event)
    {
        if (event.target.nodeName == 'BUTTON') {
            let button = event.target;
            switch (button.name) {
                case 'close':
                    this._dialog.close();
                    break;
                case 'pre-action[create]':
                case 'pre-action[save-as]':
                    this.setView('save-as');
                    this['fields[filename]'].focus();
                    this['fields[filename]'].select();
                    break;
                case 'cancel-action[save-as]':
                    this.setView('main');
                    this.setVal('fields[directory]', this.getVal('fields[directory-last]'));
                    this.setVal('fields[filename]', this.getVal('fields[filename-last]'));
                    break;
            }
        }
    }

    function editorFormOnSubmit(event)
    {
        event.preventDefault();
        let action;
        let active_element = document.activeElement;
        if (active_element instanceof HTMLButtonElement && active_element.type == 'submit') {
            action = active_element.name;
        } else if (active_element.name == 'fields[filename]' ) {
            action = 'action[save-as]';
        } else {
            action = 'action[save]';
        }
        let form_data = new FormData(this);
        form_data.set('fields[contents]', this.getVal('fields[contents]'));
        form_data.set(action, 'yes');
        //form_data.append('body_id', document.body.id);
        this.setStatus('Saving');
        if (action == 'action[save-as]') {
            this.setView('main');
        }
        this['fields[contents]'].focus();
        this.setStatus('Saving');
        fetch(EditorForm.action, {
            method: 'POST',
            body: form_data
        })
        .then(response => response.json())
        .then(data => {
            if (data.alert) {
                this.setStatus(data.alert.message, data.alert.type);
            }
            data = data.file;
            this.setVal(['fields[filename-last]'], data.name);
            this.setVal(['fields[directory-last]'], data.dir);
            this.setView('main'); // Necessary if filename changes.
            let tr = Directory.findFile(data.dir, data.name);
            if (tr) {
                let ds = tr.dataset;
                ds.dir = data.dir;
                ds.name = data.name;
                ds.what = data.what
                ds.type = data.type;
                ds.size = data.size;
                ds.perms = data.perms;
                ds.mdate = data.mdate;
                renderTR(tr);
            } else {
                Directory.addFile(data.dir, data.name, data.what, data.type, null, data.size, data.perms, data.mtime, data.mdate);
                Directory.update();
            }
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
    };


    function editorFormSaveEvent()
    {
        if (this.fs_bottomButtonsEdit.hidden) {
            this.setView('save-as');
        } else {
            this.dispatchEvent(new Event('submit'));
        }
    }


    function serialize(form_element)
    {
        let elements_to_submit = [];
        let submit_buttons = [];
        for (let element of form_element.elements) {
            if (element.nodeName == 'FIELDSET') {
                continue;
            }
            if (element.type == 'button' || (element.type == 'checkbox' && !element.checked)) {
                continue;
            }
            if (element.type == 'submit') {
                submit_buttons.push(element);
                continue;
            }
            elements_to_submit.push(element);
        }
        if (submit_buttons.length > 0) {
            let index = submit_buttons.indexOf(document.activeElement);
            index = (index == -1) ? 0 : index;
            elements_to_submit.push(submit_buttons[index]);
        }
        return elements_to_submit.map(element =>`${encodeURIComponent(element.name)}=${encodeURIComponent(element.value)}`).join('&');
    }

    function message(text, error_flag)
    {
        if (error_flag) {
            message_line.classlist.add('error');
        } else {
            message_line.classlist.remove('error');
        }
        message_line.textContent(text);
    }

    function encodeAngleBrackets(string)
    {
        return string.replace('<', '&lt;').replace('>', '&gt;');
    }

    function filePathJoin(dir, filename)
    {
        return dir ? dir + '/' + filename : filename;
    }

    function filePathSplit(file_path)
    {
        //if (!file_path) return;
        let return_val = ['', ''];
        let last_slash_pos = file_path.lastIndexOf('/');
        if (last_slash_pos > -1) {
            return_val[0] = file_path.slice(0, last_slash_pos);
            if (last_slash_pos < file_path.length - 1) {
                return_val[1] = file_path.slice(last_slash_pos + 1);
            }
        } else {
            return_val[1] = file_path;
        }
        return return_val;
    }

    function cloneObject(obj)
    {
        let obj_clone = {};
        for ([name, value] of Object.entries(obj)) {
            obj_clone[name] = value;
        }
        return obj_clone;
    }

    function getValue(name)
    {
        return this[name].value;
    }

    function setValue(name, value)
    {
        this[name].value = value;
    }

})(window.jQuery, window.Symphony);

