(function($, Symphony) {

    var EditorBox,
        CodeArea;

    Symphony.View.add('/blueprints/pages/:action:/:id:/:status:', function (action, id, status)
    {
        if (action == 'edit') {
            $('button[name="edit-template"]').click(function (event) {
                EditorBox.display('pages', event.target.dataset.href);
            });
        } else {
            $('table').on('click', 'a.file', function (event) {
                EditorBox.display('pages', event.target.dataset.href);
            });
        }
        // Editor box.
        EditorBox = document.getElementById('EditorBox');
        EditorBox._form = EditorBox.querySelector('form');
        EditorBox.getVal = getValue;
        EditorBox.setVal = setValue;
        EditorBox.display = editorBoxOpen;
        EditorBox.setStatus = editorBoxSetStatus;
        EditorBox.loadFile = editorBoxLoadFile;
        EditorBox.addEventListener('click', editorBoxClickHandler);
        EditorBox._form.onsubmit = editorFormOnSubmit;

        CodeArea = document.querySelector('code-area');
        CodeArea.addEventListener('save', editorFormSaveEvent.bind(EditorBox._form));

    });


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


    // Editor box.

    function editorBoxOpen(dir, filename = '')
    {
        if (!filename) return;
        this._notice = this.querySelector('.notice');
        this.querySelector('h1 span').textContent = filename;
        this.setVal('fields[directory]', dir);
        this.setVal('fields[filename]', filename);
        this.setVal('fields[contents]', null);

        this.showModal();
        this.loadFile(dir, filename);
        this._form['fields[contents]'].focus();
    }


    function editorBoxSetStatus(text, type)
    {
        let notice = this._notice;
        notice.textContent = text;
        let notice_types = ['doing', 'success', 'error'];
        for (let notice_type of notice_types) {
            if (notice_type == type) {
                if (!notice.classList.contains(notice_type)) {
                    notice.classList.add(notice_type);
                }
            } else {
                if (notice.classList.contains(notice_type)) {
                    notice.classList.remove(notice_type);
                }
            }
        }
        notice.hidden = false;
    }



    /**
     * Load file.
     *
     * @param object event
     *   Event data.
     */
    function editorBoxLoadFile(dir, filename)
    {
        this.setStatus('Loading', 'doing');
        let url_obj = requestUrlObject(
            this._form.action, {file_path: filePathJoin(dir, filename)}
        );
        fetch(url_obj, {method: 'GET'})
        .then(response => response.json())
        .then(data => {
            CodeArea.filename = filename;
            this.setVal('fields[directory]', dir);
            this.setVal('fields[filename]', filename);
            this.setVal('fields[contents]', data.text);
            this.setStatus('File loaded', 'doing');
            //CodeArea.enabled = true;
        })
        .catch(function (error) {
            console.log(error);
            //alert("Err: " + error.name + ', ' + error.message);
        })
    }

    function editorBoxClickHandler(event)
    {
        if (event.target instanceof HTMLButtonElement) {
            let button = event.target;
            if (button.name == 'close') {
                this.close();
            }
        }
    }

    function editorFormOnSubmit(event)
    {
        event.preventDefault();
        let form_data = new FormData(this);
        form_data.set('fields[contents]', this['fields[contents]'].value);
        form_data.set('action[save]', 'yes');
        EditorBox.setStatus('Saving');
        this['fields[contents]'].focus();
        fetch(this.action, {
            method: 'POST',
            body: form_data
        })
        .then(response => response.json())
        .then(data => {
            EditorBox.setStatus('File saved');
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
    };


    function editorFormSaveEvent()
    {
        this.dispatchEvent(new Event('submit'));
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


    function getValue(name)
    {
        return this._form[name].value;
    }

    function setValue(name, value)
    {
        this._form[name].value = value;
    }

})(window.jQuery, window.Symphony);
