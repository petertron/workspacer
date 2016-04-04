<?php

class contentExtensionWorkspacerAjax
{
    private $_context;
    private $_output;
    public $_errors;
    private $error_occurred;

    public function __construct()
    {
        $this->_output = array();
        $this->error_occurred = false;
    }

    public function build(array $context = array())
    {
        $this->_context = $context;
        $function = '__ajax' . ucfirst($context[0]);
        if (method_exists($this, $function)) {
            $this->$function();
        }
    }

    public function __ajaxManager()
    {
        $path_parts = $this->_context;
        array_shift($path_parts);
        $path = implode('/', $path_parts);

        $path_abs = WORKSPACE;
        if (isset($path)){
            $path_abs .= '/' . $path;
        }
        $this->path_abs = $path_abs;
        if (isset($_FILES['uploaded_file'])) {
            //echo file_get_contents($_FILES['uploaded_file']['tmp_name']); die;

            move_uploaded_file($_FILES['uploaded_file']['tmp_name'], 'workspace/' . $context[1] . '/' . $_FILES['uploaded_file']['name']);
            //move_uploaded_file($_FILES['uploaded_file']['tmp_name'], WORKSPACE . '/' . $context[1] . '/' . $_FILES['uploaded_file']['name']);
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
/*							if(preg_match('/\/$/', $name) == 1){
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
                            }*/
                        }

                        //if ($canProceed) redirect(Administration::instance()->getCurrentPageURL());
                        break;
                }
            }
        }

        $this->workspace_url = SYMPHONY_URL . '/workspace/manager/' . $this->_context[1] . '/';
        $this->editor_url = SYMPHONY_URL . '/workspace/editor/' . $this->_context[1] . '/';

        $html = '';
        foreach ($this->getFileTableRows() as $table_row) {
            $html .= $table_row->generate();
        }
        $this->_output['html'] = $html;
    }

    /*
    * Editor Page.
    */
    public function __ajaxEditor()
    {
        $context = $this->_context;
        $path_parts = $this->_context;
        array_shift($path_parts);
        $path = implode('/', $path_parts);

        if (isset($_POST['action']['save']) and isset($_POST['fields'])){
            $fields = $_POST['fields'];
            $current_filename = $fields['current_filename'];
            $new_filename = $fields['new_filename'];
            $dir_abs = WORKSPACE . '/' . $fields['dir_path'];
            //$create_file = ($specified_file !== $existing_file);

            if ($current_filename && $new_filename) {
                if ($new_filename == $current_filename) {
                    $new_filename = null;
                } else {
                    $current_filename = null;
                }
            }
            // Create file if there is no current file
            if ($new_filename) {
                if (is_file($dir_abs . $new_filename)) {
                    $this->_output['alert_type'] = 'error';
                    $this->_output['alert_msg'] = __('A file with that name already exists. Please choose another.');
                    $this->error_occurred = true;
                } else {
                    $filename = $new_filename;
                }
            } else {
                $filename = $current_filename;
            }

            if (!($this->error_occurred)) {
                if ($create_file){
                    /**
                    * Just before the file has been created
                    *
                    * @delegate UtilityPreCreate
                    * @since Symphony 2.2
                    * @param string $context
                    * '/blueprints/css/'
                    * @param string $file
                    *  The path to the Utility file
                    * @param string $contents
                    *  The contents of the `$fields['body']`, passed by reference
                    */
                    //Symphony::ExtensionManager()->notifyMembers('FilePreCreate', '/assets/' . $this->category . '/', array('file' => $file, 'contents' => &$fields['body']));
                } else {
                    /**
                    * Just before the file has been updated
                    *
                    * @delegate UtilityPreEdit
                    * @since Symphony 2.2
                    * @param string $context
                    * '/blueprints/css/'
                    * @param string $file
                    *  The path to the Utility file
                    * @param string $contents
                    *  The contents of the `$fields['body']`, passed by reference
                    */
                    //Symphony::ExtensionManager()->notifyMembers('FilePreEdit', '/assets/' . $this->category . '/', array('file' => $file, 'contents' => &$fields['body']));
                }

                // Write the file
                if (!$write = General::writeFile($dir_abs . $filename, $fields['body'], Symphony::Configuration()->get('write_mode', 'file'))) {
                    $this->_output['alert_type'] = 'error';
                    $this->_output['alert_msg'] = __('File could not be written to disk. Please check permissions.');
                    /*$this->_output['alert_msg'] = __('File could not be written to disk.')
                        . ' ' . __('Please check permissions on %s.', array('<code>/workspace/' . '' . '</code>'));*/
                } else {
                // Write Successful
                    $path_encoded = $fields['dir_path_encoded'];
                    $this->_output['alert_type'] = 'success';
                    $workspace_url = SYMPHONY_URL . '/workspace/manager/' . $path_encoded;
                    $editor_url = SYMPHONY_URL . '/workspace/editor/' . $path_encoded;
                    $time = Widget::Time();
                    // Remove any existing file if the filename has changed
                    if ($new_filename) {
                        /*if ($existing_file) {
                            General::deleteFile($dir_abs . $existing_file);
                        }*/

                        $this->_output['new_filename'] = $new_filename;
                        $this->_output['new_filename_encoded'] = rawurlencode($new_filename);
                        $this->_output['new_path_encoded'] = $path_encoded . rawurlencode($new_filename) . '/';

                        $this->_output['alert_msg'] =
                            __('File created at %s.', array($time->generate()))
                            . ' <a href="' . $editor_url . '" accesskey="c">'
                            . __('Create another?')
                            . '</a> <a href="' . $workspace_url . '" accesskey="a">'
                            . __('View current directory')
                            . '</a>';
                    } else {
                        $this->_output['alert_msg'] =
                            __('File updated at %s.', array($time->generate()))
                            . ' <a href="' . $editor_url . '" accesskey="c">'
                            . __('Create another?')
                            . '</a> <a href="' . $workspace_url . '" accesskey="a">'
                            . __('View current directory')
                            . '</a>';
                    }
                }
            }
        }
    }

    public function __ajaxTemplate()
    {
        $fields = $_POST['fields'];
        if (!$write = General::writeFile(WORKSPACE . '/pages/' . $fields['name'], $fields['body'], Symphony::Configuration()->get('write_mode', 'file'))){
            $this->_output['alert_type'] = 'error';
            $this->_output['alert_msg'] = __('File could not be written to disk. Please check permissions.');
        } else {
            $time = Widget::Time();
            $this->_output['alert_type'] = 'success';
            $this->_output['alert_msg'] =
                __('Page updated at %s.', array($time->generate()))
                . ' <a href="' . SYMPHONY_URL . '/blueprints/pages/new/" accesskey="c">'
                . __('Create another?')
                . '</a><a href="' . SYMPHONY_URL . '/blueprints/pages/" accesskey="a">'
                . __('View all Pages')
                . '</a>';
        }

    }

    public function generate($page = NULL)
    {
        header('Content-Type: text/javascript');
        echo json_encode($this->_output);
        exit();
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