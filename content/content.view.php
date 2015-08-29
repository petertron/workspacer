<?php

require_once TOOLKIT . '/class.administrationpage.php';
require_once EXTENSIONS . '/workspacer/lib/class.path_object.php';

use workspacer\Helpers as Helpers;
use workspacer\PathObject as PathObject;

class contentExtensionWorkspacerView extends AdministrationPage
{
    const ID = 'workspacer';

    static $assets_base_url;
    public $content_base_url;
    public $extension_base_url;
    public $_errors = array();
    public $_existing_file;

    public function __construct()
    {
        self::$assets_base_url = URL . '/extensions/workspacer/assets/';
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(self::ID);
    }

    public function view()
    {
        $this->addScriptToHead(self::$assets_base_url . 'jquery.tmpl.js');
        parent::view();
    }

    public function __viewManager()
    {
        $path = $this->getPath();
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
            $path_obj = new PathObject($path);
        } else {
            $path_abs = WORKSPACE;
        }
        $this->path_abs = $path_abs;
        //if(!file_exists($path_abs)) Administration::instance()->errorPageNotFound();
        if (!is_dir($path_abs)) Administration::instance()->errorPageNotFound();
        //self::$assets_base_url = URL . '/extensions/workspacer/assets/';
        $this->addStylesheetToHead(self::$assets_base_url . 'workspace.css');
        $this->addScriptToHead(self::$assets_base_url . 'workspace.js');
        $this->setTitle(__('%1$s &ndash; %2$s', array(__('Workspace'), __('Symphony'))));
        $this->setPageType('table');
        $workspace_url = SYMPHONY_URL . '/workspace/manager/';
        $editor_url = SYMPHONY_URL . '/workspace/editor/';

        if (isset($path_obj)) {
            $path_encoded = $path_obj->getPathEncoded();
            $workspace_url .= $path_encoded . '/';
            $editor_url .= $path_encoded . '/';
            $path_parts = $path_obj->getPathParts();
            $subheading = Helpers::capitalizeWords(array_pop($path_parts));
            $path_string = SYMPHONY_URL . '/workspace/manager/';
            $breadcrumbs = array(Widget::Anchor(__('Workspace'), $path_string));
            $parts_encoded = $path_obj->getPathPartsEncoded();
            foreach ($path_parts as $path_part) {
                $path_string .= current($parts_encoded) . '/';
                array_push($breadcrumbs, Widget::Anchor(__(Helpers::capitalizeWords($path_part)), $path_string));
                next($parts_encoded);
            }
        } else {
            $subheading = 'Workspace';
        }

        $this->workspace_url = $workspace_url;
        $this->editor_url = $editor_url;

        $this->appendSubheading(__($subheading));
        $this->insertAction(
            new XMLElement('button', __('Show Create/Upload'), array('type' => 'button', 'name' => 'show.create_upload'))
        );
        $this->insertAction(
            Widget::Anchor(__('Create New File'), $editor_url, __('Create a new text file'), 'create button')
        );
        if ($breadcrumbs) $this->insertBreadcrumbs($breadcrumbs);

        $create_upload = new XMLElement('div', NULL, array('id' => 'create-upload'));
        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'create-dirs'));
        $fieldset->appendChild(new XMLElement('legend', __('Create Directories'), array()));
        $div = new XMLElement('div');
        $div->appendChild(new XMLElement('label', __('Enter directory names on separate lines')));
        $div->appendChild(
            new XMLElement('textarea', null, array('name' => 'directory_names'))
        );
        $div->appendChild(
            new XMLElement('button', __('Create'), array('type' => 'button', 'name' => 'create.directories', 'disabled' => 'disabled'))
        );
        $div->appendChild(
            new XMLElement('button', __('Clear'), array('type' => 'button', 'name' => 'clear.directories', 'disabled' => 'disabled'))
        );
        $fieldset->appendChild($div);
        $create_upload->appendChild($fieldset);

        // File uploads fieldset.

        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'table upload-queue'));
        $fieldset->appendChild(new XMLElement('legend', __('Upload Files')));
        $fieldset->appendChild(
            Widget::Table(
                Widget::TableHead(
                    array(
                        array(__('Name'), 'col'),
                        array(__('Size (Bytes)'), 'col'),
                        array(__('Status'), 'col')
                    )
                ),
                NULL,
                new XMLElement(
                    'tbody',
                    NULL,
                    array('data-tmpl' => 'tmpl-uploads', 'data-data' => 'uploads')
                ),
                'selectable',
                NULL,
                array('data-interactive' => 'data-interactive')
            )
        );
        $buttons = new XMLElement('div', NULL, array('class' => 'upload-queue-buttons'));
        $buttons->appendChild(
            new XMLElement('button', __('Add Files'), array('type' => 'button', 'name' => 'add_files.uploads'))
        );
        $shim = new XMLElement('div', NULL, array('id' => 'aftb'));
        $shim->appendChild(
            Widget::Input('add-files-true-button', '', 'file', array('multiple' => 'multiple'))
        );
        $buttons->appendChild($shim);

        $buttons->appendChild(
            new XMLElement('button', __('Upload'), array('type' => 'button', 'name' => 'upload.uploads', 'disabled' => 'disabled'))
        );
        $buttons->appendChild(
            new XMLElement('button', __('Cancel'), array('type' => 'button', 'name' => 'cancel.uploads', 'disabled' => 'disabled'))
        );
        $fieldset->appendChild($buttons);
        $create_upload->appendChild($fieldset);
        $this->Form->appendChild($create_upload);

        // Files fieldset.

        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'table'));
        $fieldset->appendChild(
            Widget::Table(
                Widget::TableHead(
                    array(
                        array(__('Name'), 'col'),
                        array(__('Type'), 'col'),
                        array(__('Size (Bytes)'), 'col'),
                        array(__('Last Modified'), 'col'),
                    )
                ),
                NULL,
                Widget::TableBody($this->getFileTableRows(), null, 'files'),
                'selectable',
                null,
                array('data-interactive' => 'data-interactive')
            )
        );
        $this->Form->appendChild($fieldset);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Apply(
                    array(
                        array(NULL, false, __('With Selected...')),
                        array('delete', false, __('Delete'), 'confirm', NULL, array('data-message' => "Are you sure you want to delete the selected files?")),
                        array('download', false, __('Download'))
                    )
                ),
                array('class' => 'actions')
            )
        );

        // jQuery templates.

        ob_start();
        include EXTENSIONS . '/workspacer/content/tmpl.indexview.uploads.php';
        $this->Contents->appendChild(
            new XMLElement(
                'script',
                __(PHP_EOL . ob_get_contents() . PHP_EOL),
                array('id' => 'tmpl-uploads', 'type' => 'text/x-jquery-tmpl')
            )
        );
        ob_end_clean();
    }

    public function __actionManager()
    {
        $path = $this->getPath();
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
        } else {
            $path_abs = WORKSPACE;
        }
        //if(!is_dir($path_abs)) Administration::instance()->errorPageNotFound();

        $checked = (is_array($_POST['items'])) ? array_keys($_POST['items']) : null;
        if (is_array($checked) && !empty($checked)) {
            if ($_POST['with-selected'] == 'download') {
                $name = $checked[0];
                $file = $path_abs . '/' . $name;
                if (is_file($file)) {
                    header('Content-Description: File Transfer');
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename=' . $name);
                    header('Content-Transfer-Encoding: binary');
                    header('Expires: 0');
                    header('Cache-Control: must-revalidate');
                    header('Pragma: public');
                    header('Content-Length: ' . filesize($file));
                    ob_clean();
                    flush();
                    readfile($file);
                    exit;
                }
            }
        }
    }
/*
    public function __ajaxIndex()
    {
        $context = $this->_context;
        $path_abs = WORKSPACE;
        if (isset($context[1])){
            $path_abs .= '/' . $context[1];
        }
        if (isset($_FILES['uploaded_file'])) {
            move_uploaded_file($_FILES['uploaded_file']['tmp_name'], 'workspace/' . $context[1] . '/' . $_FILES['uploaded_file']['name']);
        } elseif (isset($_POST['action'])) {
            $fields = $_POST['fields'];
            switch ($_POST['action']) {
                case 'create-dir':
                    foreach ($fields['names'] as $name) {
                        if ($name != '') @mkdir($path_abs . '/' . $name);
                    }
                    break;
            }
        } elseif (isset($_POST['with-selected'])) {
            $checked = (is_array($_POST['items'])) ? array_keys($_POST['items']) : null;
            if (is_array($checked) && !empty($checked)) {
                switch ($_POST['with-selected']) {
                    case 'delete':
                        //$canProceed = true;
                        foreach ($checked as $name) {
                            $file = $path_abs . '/' . $name;
                            if (is_dir($file)) @rmdir($file);
                            if (is_file($file)) @unlink($file);
/*                              if(preg_match('/\/$/', $name) == 1){
                                $name = trim($name, '/');
                                try {
                                    rmdir($dir_abs . '/' . $name);
                                }
                                catch(Exception $ex) {
                                    $this->pageAlert(
                                        __('Failed to delete %s.', array('<code>' . $name . '</code>'))
                                        . ' ' . __('Directory %s not empty or permissions are wrong.', array('<code>' . $name . '</code>'))
                                        , Alert::ERROR
                                    );
                                    $canProceed = false;
                                }
                            }
                            elseif(!General::deleteFile($dir_abs . '/'. $name)) {
                                $this->pageAlert(
                                    __('Failed to delete %s.', array('<code>' . $name . '</code>'))
                                    . ' ' . __('Please check permissions on %s.', array('<code>/workspace/' . $this->_context['target_d'] . '/' . $name . '</code>'))
                                    , Alert::ERROR
                                );
                                $canProceed = false;
                            }
                        }

                        //if ($canProceed) redirect(Administration::instance()->getCurrentPageURL());
                        break;
                }
            }
        }
    }*/

    /*
    * File page view.
    */
    public function __viewEditor()
    {
        //echo var_dump($this->_context); die;
        //$this->_context[2] = 'single';
        $this->addStylesheetToHead(self::$assets_base_url . 'editor.css');
        //$this->addScriptToHead(self::$assets_base_url . 'editor.js');
        $this->addScriptToHead(SYMPHONY_URL . '/extension/workspacer/editor_js/');
        /*$script = new XMLElement('script');
        $script->setSelfClosingTag(false);
        $script->setAttributeArray(array('type' => 'text/javascript', 'src' => self::$assets_base_url . 'require.js', 'data-main' => self::$assets_base_url . 'editor.js'));
        $this->addElementToHead($script); //, $position);*/

        $filepath = EXTENSIONS . '/workspacer/assets/highlighters/';
        $entries = scandir($filepath);
        foreach ($entries as $entry) {
            if (is_file($filepath . $entry)) {
                $info = pathinfo($filepath . $entry);
                if ($info['extension'] == 'css' && $info['filename'] != '') {
                    $this->addStylesheetToHead(self::$assets_base_url . 'highlighters/' . $info['basename'], 'screen');
                } elseif ($info['extension'] == 'js' && $info['filename'] != '') {
                    Administration::instance()->Page->addScriptToHead(self::$assets_base_url . 'highlighters/' . $info['basename']);
                }
            }
        }

        //$path = $this->_context[1];
        $path_parts = $this->_context;
        array_shift($path_parts);
        $path = implode('/', $path_parts);
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
            if (is_file($path_abs)) {
                $filename = basename($path);
                $this->_existing_file = $filename;
                $title = $filename;
                if (dirname($path_abs) !== WORKSPACE) {
                    $path_obj = new PathObject(dirname($path));
                }
            } else {
                $path_obj = new PathObject($path);
            }
        } else {
            $path_abs = WORKSPACE;
        }

        if (!$filename) {
            $title = 'Untitled';
        }

        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Workspace'), __('Symphony'))));

        //$this->setPageType('table');
        $this->Body->setAttribute('spellcheck', 'false');
        $this->Body->setAttribute('class', 'page-single');
        $this->appendSubheading($title);

        $workspace_url = SYMPHONY_URL . '/workspace/manager/';
        $editor_url = SYMPHONY_URL . '/workspace/editor/';

        $path_string = SYMPHONY_URL . '/workspace/manager/';
        $breadcrumbs = array(Widget::Anchor(__('Workspace'), $path_string));
        if (isset($path_obj)) {
            $dir_path = $path_obj->getPath() . '/';
            $dir_path_encoded = $path_obj->getPathEncoded() . '/';
            $workspace_url .= $dir_path_encoded;
            $editor_url .= $dir_path_encoded;
            //$this->workspace_url = $workspace_url;
            //$this->editor_url = $editor_url;
            $path_parts = $path_obj->getPathParts();
            $parts_encoded = $path_obj->getPathPartsEncoded();
            foreach ($path_parts as $path_part) {
                $path_string .= current($parts_encoded) . '/';
                array_push($breadcrumbs, Widget::Anchor(__(Helpers::capitalizeWords($path_part)), $path_string));
                next($parts_encoded);
            }
        }
        $this->insertBreadcrumbs($breadcrumbs);

        $this->Form->setAttribute('class', 'two columns');
        $this->Form->setAttribute('action', $editor_url . $path_encoded . (isset($filename) ? rawurlencode($filename) . '/' : ''));

        $fieldset = new XMLElement('fieldset');
        //$fieldset->setAttribute('class', 'primary column');
        $fieldset->appendChild(
            Widget::Input('fields[existing_file]', $filename, 'hidden', array('id' => 'existing_file'))
        );
        $fieldset->appendChild(
            Widget::Input('fields[dir_path]', $dir_path, 'hidden', array('id' => 'dir_path'))
        );
        $fieldset->appendChild(
            Widget::Input('fields[dir_path_encoded]', $dir_path_encoded, 'hidden', array('id' => 'dir_path_encoded'))
        );

        $label = Widget::Label(__('Name'));
        $label->appendChild(Widget::Input('fields[name]', $filename));
        $fieldset->appendChild($label);
        //$fieldset->appendChild((isset($this->_errors['name']) ? Widget::Error($label, $this->_errors['name']) : $label));
        //$this->editorXML($fieldset, $filename ? htmlentities(file_get_contents($path_abs), ENT_COMPAT, 'UTF-8') : '');
        $this->editorXML($fieldset, $filename ? file_get_contents($path_abs) : '');
/*
        $fieldset->appendChild(
            Widget::Textarea(
                'fields[body]',
                30,
                100,
                //$this->_existing_file ? @file_get_contents($path_abs, ENT_COMPAT, 'UTF-8') : '',
                $filename ? htmlentities(file_get_contents($path_abs), ENT_COMPAT, 'UTF-8') : '',
                array('id' => 'text-area', 'class' => 'code hidden')
            )
        );*/
        //$fieldset->appendChild((isset($this->_errors['body']) ? Widget::Error($label, $this->_errors['body']) : $label));

        $this->Form->appendChild($fieldset);

        if (!$this->_existing_file) {
            $actions = new XMLElement('div', NULL, array('class' => 'actions'));
            // Add 'create' button
            $actions->appendChild(
                Widget::Input(
                    'action[save]',
                    __('Create File'),
                    'submit',
                    array('class' =>'button', 'accesskey' => 's')
                )
            );
            $this->Form->appendChild($actions);
        }

        $actions = new XMLElement('div', NULL, array('class' => 'actions'));
        if (!$this->_existing_file) {
            $actions->setAttribute('data-replacement-actions', '1');
        }

        $actions->appendChild(
            Widget::Input(
                'action[save]',
                __('Save Changes'),
                'submit',
                array('class' => 'button', 'accesskey' => 's')
            )
        );
        $actions->appendChild(
            new XMLELement(
                'button',
                __('Delete'),
                array(
                    'name' => 'action[delete]',
                    'type' => 'submit',
                    'class' => 'button confirm delete',
                    'title' => 'Delete this file',
                    'accesskey' => 'd',
                    'data-message' => 'Are you sure you want to delete this file?'
                )
            )
        );

        $this->Form->appendChild($actions);

        $text = new XMLElement('p', __('Saving'));
        $this->Form->appendChild(new XMLElement('div', $text, array('id' => 'saving-popup')));
    }

    public function __actionEditor()
    {
        if (isset($_POST['action']['delete']) and isset($_POST['fields'])) {
            $fields = $_POST['fields'];
            @unlink(WORKSPACE . '/' . $fields['dir_path'] . $fields['existing_file']);
            redirect(SYMPHONY_URL . '/workspace/manager/' . $fields['dir_path_encoded']);
        }
    }

    /*
    * View for page template editor.
    */
    public function __viewTemplate()
    {
        $this->addStylesheetToHead(self::$assets_base_url . 'editor.css');
        $this->addScriptToHead(SYMPHONY_URL . '/extension/workspacer/editor_js/');
        $this->addScriptToHead(self::$assets_base_url . 'highlighters/highlight-xsl.js');
        $name = $this->_context[1];
        $filename = $name . '.xsl';
        $title = $filename;
        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Pages'), __('Symphony'))));
        //$this->setPageType('table');
        $this->Body->setAttribute('spellcheck', 'false');
        $this->Body->setAttribute('class', 'page-single');
        $this->appendSubheading($title);
        $breadcrumbs = array(
            Widget::Anchor(__('Pages'), SYMPHONY_URL . '/blueprints/pages/'),
            new XMLElement('span', __(Helpers::capitalizeWords($name)))
        );
        $this->insertBreadcrumbs($breadcrumbs);

        $this->insertAction(
            Widget::Anchor(
                __('Edit Page'),
                SYMPHONY_URL . '/blueprints/pages/edit/' . PageManager::fetchIDFromHandle($name) . '/',
                __('Edit Page Configuration'),
                'button'
            )
        );

        $this->Form->setAttribute('class', 'columns');
        $this->Form->setAttribute('action', SYMPHONY_URL . '/blueprints/pages/' . $name . '/');

        $fieldset = new XMLElement('fieldset');
        $fieldset->appendChild(Widget::Input('fields[name]', $filename, 'hidden'));
        //$fieldset->appendChild((isset($this->_errors['name']) ? Widget::Error($label, $this->_errors['name']) : $label));

        $this->editorXML($fieldset, $filename ? file_get_contents(WORKSPACE . '/pages/' . $filename) : '');
        //$this->editorXML($fieldset, $filename ? htmlentities(file_get_contents(WORKSPACE . '/pages/' . $filename), ENT_COMPAT, 'UTF-8') : '');

        //$fieldset->appendChild((isset($this->_errors['body']) ? Widget::Error($label, $this->_errors['body']) : $label));

        $this->Form->appendChild($fieldset);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                new XMLElement('p', __('Saving')),
                array('id' => 'saving-popup')
            )
        );
        //$this->_context = array('edit', 'pages', 'single');
        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Input(
                    'action[save]',
                    __('Save Changes'),
                    'submit',
                    array('class' => 'button', 'accesskey' => 's')
                ),
                array('class' => 'actions')
            )
        );
    }

    function getPath()
    {
        $path_parts = $this->_context;
        array_shift($path_parts);
        return implode('/', $path_parts);
    }

    function editorXML(&$fieldset, $text)
    {
        $fieldset->appendChild(new XMLElement('p', __('Body'), array('id' => 'editor-label', 'class' => 'label')));
        //$fieldset->appendChild(new XMLElement('label', __('Body'), array('for' => 'editor')));
        $font_size = $this->settings->font_size ? $this->settings->font_size : '8.2pt';
        $font_family = $this->settings->font_family ? $this->settings->font_family . ', monospace' : 'monospace';
        $line_height = $this->settings->line_height ? $this->settings->line_height : '148%';
        $editor = new XMLElement('div', null, array('id' => 'editor', 'tabindex' => '0'));
        $editor->appendChild(
            new XMLElement(
                'div', null,
                array(
                    'id' => 'editor-line-numbers',
                    'style' => "font-family: $font_family;font-size: $font_size;line-height: $line_height;"
                )
            )
        );
        $editor->appendChild(new XMLElement('iframe', null, array('id' => 'editor-main', 'src' => SYMPHONY_URL . '/workspace/editorframe/')));
        //$menu = new XMLElement('div', null, array('id' => 'editor-menu', 'tabindex' => '0'));
        //$editor->appendChild($menu);

        $fieldset->appendChild($editor);

        $fieldset->appendChild(new XMLElement('div', null, array('id' => 'editor-resize-handle')));

        //$fieldset->appendChild((isset($this->_errors['body']) ? Widget::Error($label, $this->_errors['body']) : $label));
        $fieldset->appendChild(new XMLElement('script', $text, array('id' => 'text', 'type' => 'text')));
    }

    function getFileTableRows()
    {
        $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
        $finfo = class_exists(finfo) ? new finfo() : null;
        $table_rows = array();

        foreach (new DirectoryIterator($this->path_abs) as $file_obj) {
            if ($file_obj->isDot()) continue;

            if ($file_obj->isDir()) {
                $href = $this->workspace_url;
            } else {
                $href = $this->editor_url;
            }
            $name = $file_obj->getFilename();
            $col1 = new XMLElement('td');
            $col1->appendChild(Widget::Anchor($name, $href . $name . '/', $name));
            $col1->appendChild(new XMLElement(
                'label',
                __('Select File ' . $name),
                array('class' => 'accessible', 'for' => $name)
            ));
            $col1->appendChild(Widget::Input(
                "items[$name]", 'on', 'checkbox'//, 'page-1'
            ));
            //$table_columns = array($col1);

            if (!$file_obj->isLink()) {
                if ($finfo) {
                    //print_r($file_obj->getPath()); die;
                    $type = $finfo->file($file_obj->getPathname());
                    $comma_pos = strpos($type, ',');
                    if ($comma_pos) {
                        $type = substr($type, 0, $comma_pos);
                    }
                } else {
                    $type = 'file';
                }
                $table_columns = array(
                    $col1,
                    Widget::TableData($type),
                    Widget::TableData($file_obj->getSize()),
                    Widget::TableData(date($format, $file_obj->getMTime()))
                );
            } else {
                $table_columns = array(
                    $col1,
                    Widget::TableData('symlink'),
                    Widget::TableData('-'),
                    Widget::TableData('-')
                );
            }

            $table_rows[$name] = Widget::TableRow($table_columns);
        }

        if (count($table_rows) > 0) {
            ksort ($table_rows);
            return array_values($table_rows);
        } else {
            return array(Widget::TableRow(
                array(Widget::TableData(__('None found.'), 'inactive', null, 4))
            ));
        }
    }
}