<?php

use Workspacer as WS;

require_once WS\EXTENSION . '/lib/trait.files.php';

class contentExtensionWorkspacerAjax
{
    use Files;

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

    function pageAlert($msg, $type) {
        if (!isset($this->_output['alert_msg'])) {
            $this->_output['alert_msg'] = $msg;
            $this->_output['alert_type'] = $type;
        }
    }

    public function __ajaxManage()
    {
        $path_abs = WORKSPACE;

        $this->path_abs = $path_abs;
        if (isset($_GET['action'])) {
            //$this->dir_paths = $_GET['dir_paths'];
            //$this->current_dir_num = $_GET['current_dir_num'];
            //$this->current_dir_path = $this->dir_paths[$this->current_dir_num];
            switch ($_GET['action']) {
                case 'directory-data':
                    $this->_output['files'] = $this->getDirectoryEntries($_GET['dir_path']);
                    break;
                case 'load':
                    $text = file_get_contents(WORKSPACE . '/' . $_GET['file_path']);
                    $this->_output['text'] = $text;
                    break;
            }
        } elseif (isset($_POST['action']) || isset($_POST['with-selected'])) {
            if (isset($_POST['action'])) {
                $fields = $_POST['fields'];
                switch ($_POST['action']) {
                    case 'create':
                        $file_path_abs = $this->getWorkspaceFullPath($_POST['file_path']);
                        if (file_exists($file_path_abs)) {
                            $this->alert('File already exists.');
                        } else {
                            General::writeFile($file_path_abs, $_POST['text']);
                            $this->outputFileLists2();
                        }
                        break;
                    case 'save':
                        $file_path_abs = $this->getWorkspaceFullPath($_POST['file_path']);
                        General::writeFile($file_path_abs, $_POST['text']);
                        if ($_POST['body_id'] != 'blueprints-pages') {
                            $this->outputFileLists2();
                        }
                        break;
                    case 'create_dirs':
                        $items = $_POST['items'];
                        $dir_path_abs = $this->getWorkspaceFullPath($_POST['dir_path']);
                        if (is_array($items) && !empty($items)) {
                            foreach ($items as $new_dir_name) {
                                if ($new_dir_name) {
                                    $file_path_abs = $dir_path_abs . '/' . $new_dir_name;
                                    General::realiseDirectory($file_path_abs);
                                }
                            }
                            $this->outputDirList();
                            $this->outputFileLists2();
                        }
                        break;
                }
            } elseif (isset($_POST['with-selected'])) {
                //$checked = is_array($_POST['items']) ? array_keys($_POST['items']) : null;
                $dir_path_abs_current = $this->getWorkspaceFullPath($_POST['sets'][0]['dir_path']);
                $dir_path_abs_other = $this->getWorkspaceFullPath($_POST['sets'][1]['dir_path']);
                foreach ($_POST['sets'] as $set) {
                    $checked = is_array($set['items']) ? $set['items'] : null;
                    if (is_array($checked) && !empty($checked)) {
                        switch ($_POST['with-selected']) {
                            case 'delete':
                                //$canProceed = true;
                                foreach ($checked as $filename => $v) {
                                    $file_path_abs = $dir_path_abs_current . '/' . $filename;
                                    if (is_dir($file_path_abs)) {
                                        try {
                                            rmdir($file_path_abs);
                                        } catch (Exception $ex) {
                                            $file_path = $this->getWorkspaceRelativePath($file_path_abs);
                                            $this->pageAlert(
                                                __('Failed to delete %s.', array('<code>' . $file_path . '</code>'))
                                                . ' ' . __('Directory %s is not empty or permissions are wrong.', array('<code>' . $file_path . '</code>'))
                                                , Alert::ERROR
                                            );
                                            //$canProceed = false;
                                        }
                                    #} elseif (!General::deleteFile($file_path_abs)) {
                                    } elseif (!@unlink($file_path_abs)) {
                                        $file_path = $this->getWorkspaceRelativePath($file_path_abs);
                                        $this->pageAlert(
                                            __('Failed to delete %s.', array('<code>' . $file_path . '</code>'))
                                            . ' ' . __('Please check permissions on %s.', array('<code>/workspace/' . '' . '/' . $file_path . '</code>'))
                                            , Alert::ERROR
                                        );
                                        //$canProceed = false;
                                    }
                                }
                                //if ($canProceed) redirect(Administration::instance()->getCurrentPageURL());
                                $this->outputDirList();
                                $this->outputFileLists();
                                break;
                            case 'move':
                                foreach ($checked as $filename => $v) {
                                    $source = $dir_path_abs_current . '/' . $filename;
                                    $destination = $dir_path_abs_other . '/' . $filename;
                                    if ($destination != $source) {
                                        if (file_exists($source) && !file_exists($destination)) {
                                            rename($source, $destination);
                                        }
                                    }
                                }
                                $this->outputDirList();
                                $this->outputFileLists();
                                break;
                            case 'copy':
                                foreach ($checked as $filename => $v) {
                                    $source = $dir_path_abs_current . '/' . $filename;
                                    $destination = $dir_path_abs_other . '/' . $filename;
                                    if ($destination != $source) {
                                        if (file_exists($source) && !file_exists($destination)) {
                                            copy($source, $destination);
                                        }
                                    }
                                }
                                $this->outputDirList();
                                $this->outputFileLists();
                                break;
                        }
                    }
                    list($dir_path_abs_current, $dir_path_abs_other) = array($dir_path_abs_other, $dir_path_abs_current);
                }
            }
            /*if ($_POST['body_id'] == 'blueprints-workspace') {
                //$this->outputTableBodiesHTML();
            }*/
        }
    }

    public function generate($page = NULL)
    {
        header('Content-Type: text/javascript');
        echo json_encode($this->_output);
        exit();
    }

    function getWorkspaceFullPath($path)
    {
        return WORKSPACE . ($path ? '/' . $path : '');
    }

    function getWorkspaceRelativePath($path_abs) {
        return substr($path_abs, strlen(WORKSPACE) + 1);
    }

    function outputFileLists()
    {
        $this->_output['files'] = array();
        foreach ($_POST['sets'] as $set_num => $set) {
            $this->_output['files'][$set_num] = $this->getDirectoryEntries($set['dir_path']);
        }
    }

    function outputFileLists2()
    {
        if ($_POST['body_id'] == 'blueprints-workspace') {
            if (is_array($_POST['dir_paths']) && !empty($_POST['dir_paths'])) {
                $this->_output['files'] = array();
                foreach ($_POST['dir_paths'] as $index => $dir_path) {
                    $this->_output['files'][$index] = $this->getDirectoryEntries($dir_path);
                }
            }
        }
    }

    function outputDirList() {
        $this->_output['directories'] = $this->getRecursiveDirList();
    }

    function alert($content)
    {
        $this->_output['alert'] = $content;
    }
}
