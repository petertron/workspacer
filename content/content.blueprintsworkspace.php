<?php

require_once WORKSPACER_LIB . '/trait.files.php';

class contentBlueprintsWorkspace extends AdministrationPage
{
    use Files;

    public $_errors = [];

    public function __construct()
    {
        parent::__construct();
        $this->settings = Symphony::Configuration()->get(WORKSPACER_ID);
    }

    public function __viewIndex()
    {
        $this->addStylesheetToHead(WORKSPACER_ASSETS_URL . '/workspace.css');
        /*foreach (glob(WORKSPACER . '/assets/highlighters/highlight-*.js') as $file) {
            $filename = pathinfo($file, PATHINFO_FILENAME);
            $this->addElementToHead(
                new XMLElement(
                    'link',
                    null,
                    [
                        'rel' => 'prefetch',
                        'href' => WORKSPACER_ASSETS_URL . '/highlighters/' . basename($file),
                        'as' => 'script',
                        'data-highlighter' => substr($filename, strpos($filename, '-') + 1)
                    ]
                )
            );
        }*/

        $this->addScriptToHead(WORKSPACER_ASSETS_URL . '/codearea.js');
        $this->addScriptToHead(WORKSPACER_ASSETS_URL . '/workspace.js');
        $this->addScriptToHead(WORKSPACER_ASSETS_URL . '/highlighters/highlight-xsl.js');
        $this->addScriptToHead(WORKSPACER_ASSETS_URL . '/highlighters/highlight-css.js');
        $entries = $this->getDirectoryEntries();
        $this->addElementToHead(
            new XMLElement('script', json_encode($entries), ['id' => 'workspaceFiles'])
        );
        $this->setTitle(__('%1$s &ndash; %2$s', [__('Workspace'), __('Symphony')]));
        $this->setPageType('index');

        $this->appendSubheading(__('Workspace'));

        $this->Form->setAttribute('id', 'mainForm');

        $this->insertAction(
            self::directorySelector('source-dir', 'directorySelector', 'mainForm')
        );
        $this->insertAction(
            new XMLElement('button', '↑', ['name' => 'parent-directory', 'type' => 'button', 'title' => __('Go to parent directory')])
        );
        /*$this->insertAction(
            new XMLElement('button', '←', ['name' => 'history-backwards', 'type' => 'button'])
        );
        $this->insertAction(
            new XMLElement('button', '→', ['name' => 'history-forwards', 'type' => 'button'])
        );*/

        $this->insertAction(
            new XMLElement(
                'button',
                __('New File'),
                [
                    'class' => 'button',
                    'name' => 'newFile',
                    'title' => __('Create new file')
                ]
            )
        );

        $this->insertAction(
            new XMLElement(
                'button',
                __('New Folders'),
                [
                    'class' => 'button',
                    'name' => 'newDirectories',
                    'title' => __('Create new folders')
                ]
            )
        );

        $this->insertAction(
            new XMLElement(
                'button',
                __('Upload'),
                [
                    'class' => 'button',
                    'name' => 'upload',
                    'title' => __('Upload files'),
                ]
            )
        );

        $table = new XMLElement(
            'table',
            null,
            ['id' => 'directory', 'class' => 'selectable', 'role' => 'directory', 'aria-labelledby' => 'symphony-subheading', 'data-interactive' => 'data-interactive']
        );

        $table->appendChild(
            Widget::TableHead([
                [__('Name'), 'col'],
                [__('Type'), 'col'],
                [__('Size'), 'col'],
                [__('Permissions'), 'col'],
                [__('Last Modified'), 'col']
            ])
        );

        $tbody = new XMLElement('tbody');
        $tbody->appendChild(new XMLElement('tr', '<td class="inactive" colspan="4">' . __('None found.') . '</td>'));

        $table->appendChild($tbody);
        $this->Form->appendChild($table);

        $version = new XMLElement('p', 'Symphony ' . Symphony::Configuration()->get('version', 'symphony'), ['id' => 'version']);
        $this->Form->appendChild($version);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Apply(
                    [
                        ['', true, __('With Selected...')],
                        ['move', false, __('Move to directory')],
                        ['copy', false, __('Copy to directory')],
                        ['rename', false, __('Rename')],
                        ['delete', false, __('Delete')]/*,
                        ['perms', false, __('Set permissions')],
                        ['download', false, __('Download')]*/
                    ]
                ),
                ['class' => 'actions']
            )
        );

        $view = null;
        if (isset($_COOKIE['workspacer-view'])) {
            $view = $_COOKIE['workspacer-view'];
            unset($_COOKIE['workspacer-view']);
        }
    }

    function appendElementsToBody()
    {
        // New directories dialog box.

        $dialog = new XMLElement('dialog', null, ['id' => 'NewDirectoriesBox']);
        $header = new XMLElement('header', null, array('class' => 'context'));
        $header->appendChild(new XMLElement('h1', __('Create Folders')));
        $header->appendChild(
            new XMLElement(
                'button', __('Close'), array('type' => 'button', 'name' => 'close')
            )
        );
        $dialog->appendChild($header);
        $form = new XMLElement('form', null, ['method' => 'post']);
        $form->appendChild(XSRF::formToken());
        $input = Widget::Input('items[0]', null, 'text', array('autofocus' => 'autofocus'));
        $form->appendChild(Widget::Label(__('Folder Name'), $input));
        $form->appendChild(new XMLElement('div', null, ['class' => 'extra-directories']));
        $template = new XMLElement('template');
        $input = Widget::Input('items[1]', null, null);
        $template->appendChild(Widget::Label(__('Folder Name') . '<i><a class="remove">Remove</a></i>', $input));
        $form->appendChild($template);

        $footer = new XMLElement('footer');
        $footer->appendChild(
            new XMLElement('button', __('Create Folders'), array('name' => 'create', 'type' => 'submit', 'class' => 'float-right'))
        );
        $footer->appendChild(
            new XMLElement('button', '+', array('name' => 'add', 'type' => 'button', 'class' => 'float-right'))
        );
        $form->appendChild($footer);
        $dialog->appendChild($form);
        $this->Body->appendChild($dialog);


        // Move/copy/delete dialog box.

        $dialog = new XMLElement(
            'dialog',
            null, [
                'id' => 'MoveCopyDeleteBox',
                'data-move' => __('Move'),
                'data-copy' => __('Copy'),
                'data-delete' => __('Delete')
            ]
        );
        $dialog->appendChild(
            new XMLElement(
                'header',
                new XMLElement('h1', '<span></span> ' . __('Selected Files'))
            )
        );
        /*$div = new XMLElement('div', null, ['class' => 'selector-box']);
        $div->appendChild(new XMLElement('p', __('Destination:'), ['class' => 'label']));
        $div->appendChild(
            self::directorySelector('dest-dir', 'directorySelector2', 'mainForm')
        );
        $dialog->appendChild($div);*/

        $div = new XMLElement('div', null, ['class' => 'selector-box']);
        $selector = self::directorySelector('dest-dir', 'directorySelector2', 'mainForm');
        $label = Widget::Label(__('Destination:'), $selector);
        $dialog->appendChild(new XMLElement('fieldset', $label, array('form' => 'mainForm')));

        $div = new XMLElement('div');
        $div->appendChild(
            new XMLElement(
                'button',
                __('Apply'), [
                    'name' => 'action[apply]',
                    'type' => 'submit',
                    'value' => 'apply',
                    'form' => 'mainForm',
                    'class' => 'float-right'
                ]
            )
        );
        $div->appendChild(new XMLElement('button', __('Cancel'), ['type' => 'button', 'value' => 'cancel', 'class' => 'leftmost']));
        $dialog->appendChild($div);
        $this->Body->appendChild($dialog);


        // Rename dialog box.

        $dialog = new XMLElement(
            'dialog',
            null, [
                'id' => 'RenameBox',
            ]
        );
        $dialog->appendChild(
            new XMLElement(
                'header',
                new XMLElement('h1', __('Rename Selected File'))
            )
        );
        $input = Widget::Input('fields[filename-new]', null, 'text', array('form' => 'mainForm'));
        $label = Widget::Label(__('New filename'), $input);
        $dialog->appendChild(new XMLElement('fieldset', $label, array('form' => 'mainForm')));

        $form = self::DialogForm();
        $form->appendChild(
            new XMLElement(
                'button',
                __('Apply'), [
                    'name' => 'action[apply]',
                    'type' => 'submit',
                    'value' => 'apply',
                    'form' => 'mainForm',
                    'class' => 'float-right'
                ]
            )
        );
        $form->appendChild(new XMLElement('button', __('Cancel'), ['type' => 'submit', 'value' => 'cancel', 'class' => 'leftmost']));
        $dialog->appendChild($form);
        $this->Body->appendChild($dialog);


        // Editor dialog box.

        $dialog = new XMLElement('dialog', null, ['id' => 'EditorBox']);
        $header = new XMLElement('header');
        $form = Widget::Form(SYMPHONY_URL . '/extension/workspacer/ajax/editor/', 'post');
        $form->setAttribute('id', 'EditorForm');
        $form->appendChild(XSRF::formToken());
        $form->appendChild(Widget::Input('fields[directory-last]', null, 'hidden'));
        $form->appendChild(Widget::Input('fields[filename-last]', null, 'hidden'));
        $header->appendChild(new XMLElement('h1'));
        $header->appendChild(
            new XMLElement(
                'button', __('Close'), array('type' => 'button', 'name' => 'close')
            )
        );
        $header->appendChild(new XMLElement('div', null, ['class' => 'status-line']));
        $form->appendChild($header);
        $dialog->appendChild($form);

        $fieldset = new XMLElement(
            'fieldset',
            null,
            [
                'name' => 'fs_editor',
                'class' => 'editor'
            ]
        );

        $fieldset->appendChild(new XMLElement(
            'code-area',
            null,
            [
                'name' => 'fields[contents]',
                'lang' => Symphony::Configuration()->get('lang', 'symphony'),
                'font-family' => $this->settings['font_family'],
                'font-size' => $this->settings['font_size'],
                'line-height' => $this->settings['line_height'],
                'indentation-method' => $this->settings['indentation_method'],
                'indentation-width' => $this->settings['indentation_width'],
                'autofocus' => 'autofocus'
            ]
        ));
        $form->appendChild($fieldset);

        $fieldset = new XMLElement(
            'fieldset',
            null,
            array(
                'name' => 'fs_bottomButtonsNew',
                'class' => 'bottom-actions new'
            )
        );
        $fieldset->appendChild(
            new XMLElement(
                'button',
                __('Create File'),
                [
                    'class' => 'float-right',
                    'type' => 'button',
                    'name' => 'pre-action[create]',
                    'accesskey' => 's'
                ]
            )
        );
        $form->appendChild($fieldset);


        $fieldset = new XMLElement(
            'fieldset',
            null,
            array(
                'name' => 'fs_bottomButtonsEdit',
                'data-hideWhenDisabled' => 'yes',
                'class' => 'bottom-actions edit'
            )
        );

        $fieldset->appendChild(
            new XMLElement(
                'button',
                __('Save File'),
                [
                    'class' => 'float-right',
                    'name' => 'action[save]',
                    'type' => 'submit',
                    'accesskey' => 's'
                ]
            )
        );
        $fieldset->appendChild(
            new XMLElement(
                'button',
                __('Save As'),
                [
                    'class' => 'float-left',
                    'name' => 'pre-action[save-as]',
                    'type' => 'button'
                ]
            )
        );
        $form->appendChild($fieldset);


        // File settings section.

        $fieldset = new XMLElement(
            'fieldset',
            null,
            ['name' => 'fs_saveAs']
        );

        $flex_row = new XMLElement('div', null, ['class' => 'flex-row']);
        $flex_row->appendChild(
            Widget::Label(
                __('Directory'),
                new XMLElement(
                    'select', null, ['name' => 'fields[directory]', 'class' => 'directory-selector']
                ),
                null,
                null,
                ['class' => 'flex-item']
            )
        );

        $flex_row->appendChild(
            Widget::Label(
                __('Filename'),
                Widget::Input('fields[filename]', null, 'text'),
                null,
                null,
                ['class' => 'flex-item']
            )
        );
        $fieldset->appendChild($flex_row);
        $fieldset->appendChild(new XMLElement('div', null, array('class' => 'save-error')));


        $fieldset->appendChild(
            new XMLElement(
                'button',
                __('Save File'),
                [
                    'name' => 'action[save-as]',
                    'type' => 'submit',
                    'class' => 'float-right'
                ]
            )
        );
        $fieldset->appendChild(
            new XMLElement(
                'button',
                __('Cancel'),
                [
                    'name' => 'cancel-action[save-as]',
                    'type' => 'button',
                    'class' => 'float-left'
                ]
            )
        );
        $form->appendChild($fieldset);
        $this->Body->appendChild($dialog);


        // Upload dialog box.

        $dialog = new XMLElement('dialog', null, array('id' => 'UploadBox'));
        $form = Widget::Form(SYMPHONY_URL . '/extension/workspacer/ajax/editor/', 'post');
        $form->setAttribute('id', 'UploadForm');
        $form->appendChild(XSRF::formToken());
        $header = new XMLElement('div', null, ['class' => 'context']);
        $header->appendChild(
            new XMLElement('h1', __('Upload Files'), array('role' => 'heading'))
        );
        $header->appendChild(
            new XMLElement(
                'button',
                __('Close'),
                ['class' => 'float-right', 'type' => 'button', 'name' => 'close']
            )
        );
        $form->appendChild($header);

        $buttons = new XMLElement('div');
        $buttons->appendChild(
            new XMLElement(
                'button',
                __('Add Files'),
                ['type' => 'button', 'name' => 'add', 'class' => 'leftmost', 'data-of' => 'main', 'data-hideWhenDisabled' => 'yes'])
        );
        $buttons->appendChild(
            new XMLElement('input', null, array('type' => 'file', 'style' => 'display: none;', 'multiple' => 'multiple'))
        );
        $buttons->appendChild(
            new XMLElement(
                'button',
                __('Upload All'),
                array('type' => 'button', 'name' => 'uploadAll', 'disabled' => 'disabled')
            )
        );
        $buttons->appendChild(
            new XMLElement(
                'button',
                __('Remove All'),
                array('type' => 'button', 'name' => 'removeAll', 'disabled' => 'disabled')
            )
        );
        $form->appendChild($buttons);

        $table = new XMLElement(
            'table',
            null,
            ['id' => 'directory', 'role' => 'directory', 'aria-labelledby' => 'upload-heading', 'data-interactive' => 'data-interactive']
        );

        $table->appendChild(
            Widget::TableHead([
                [__('Name'), 'col'],
                [__('Type'), 'col'],
                [__('Size'), 'col'],
                array(__('Uploaded') . ' %', 'col'),
                array(__('Actions'), 'col')
            ])
        );

        $tbody = new XMLElement('tbody');
        //$tbody->appendChild(new XMLElement('tr', '<td class="inactive" colspan="4">' . __('None found.') . '</td>'));

        $table->appendChild($tbody);
        $form->appendChild($table);
        $dialog->appendChild($form);
        $this->Contents->appendChild($dialog);

        // HTML Templates

        $tmpl_names = ['table-row', 'table-row-inactive', 'upload-table-row'];
        foreach ($tmpl_names as $tmpl_name) {
            ob_start();
            include 'templates/' . $tmpl_name . '.tpl';
            $content = ob_get_contents();
            ob_end_clean();
            $this->Body->appendChild(new XMLElement('script', $content, ['id' => 'tmpl-' . $tmpl_name, 'type' => 'text/x-template']));
        }
    }

    public function __actionIndex()
    {
        $dir_path_abs = rtrim(WORKSPACE . '/' . $set['dir_path'], '/');
        $checked = is_array($set['items']) ? array_keys($set['items']) : null;
        if (is_array($checked) && !empty($checked)) {
            if ($_POST['with-selected'] == 'download') {
                $name = $checked[0];
                $file_path_abs = $dir_path_abs . '/' . $name;
                if (is_file($file_path_abs)) {
                    header('Content-Description: File Transfer');
                    header('Content-Type: ' . General::getMimeType($file_path_abs));
                    header('Content-Disposition: attachment; filename=' . $name);
                    header('Content-Transfer-Encoding: binary');
                    header('Expires: 0');
                    header('Cache-Control: must-revalidate');
                    header('Pragma: public');
                    header('Content-Length: ' . filesize($file_path_abs));
                    readfile($file_path_abs);
                    exit;
                }
            }
        }
    }

    function getTemplate($file)
    {
        ob_start();
        require $file;
        $contents = ob_get_contents();
        ob_end_clean();
        return $contents;
    }

    function __build()
    {
        $this->__generateHead();
        $this->Html->appendChild($this->Head);
        $this->appendElementsToBody();
        $this->Html->appendChild($this->Body);
    }

    /**
     * Make selector widget.
     *
     * @param string $select_id
     *  ID attribute for 'select' element.
     */
    static function directorySelector(String $name = null, String $select_id, String $form_id = null)
    {
        $apply = new XMLElement('fieldset', null, ['class' => 'apply directory-selector']);
        $div = new XMLElement('div');
        $apply->appendChild($div);
        $div->appendChild(Widget::Label(__('Directory'), null, 'accessible', null, ['for' => $select_id])); //, 'class' => 'apply-label-left']));
        $select = new XMLElement(
            'select',
            null,
            ['class' => 'directory-selector', 'name' => 'fields[dir_path]']
        );
        if ($select_id) {
            $select->setAttribute('id', $select_id);
        }
        if ($form_id) {
            $select->setAttribute('form', $form_id);
            $apply->setAttribute('form', $form_id);
        }
        if ($name) {
            $select->setAttribute('name', $name);
        }
        $div->appendChild($select);

        return $apply;
    }

    static function DialogForm(string $id = null, array $attributes = null)
    {
        $obj = new XMLElement('form', null);
        $obj->setAttribute('method', 'dialog');
        if ($id) {
            $obj->setAttribute('id', $id);
        }
        if ($attributes) {
            $obj->setAttributeArray($attributes);
        }
        return $obj;
    }
}
