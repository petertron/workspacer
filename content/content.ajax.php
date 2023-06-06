<?php

require_once WORKSPACER_LIB . '/trait.files.php';

class contentExtensionWorkspacerAjax
{
    use Files;

    private $_context;
    private $_output;
    public $_errors;
    private $error_occurred;

    public function __construct()
    {
        $this->_output = ['alert' => []];
        $this->error_occurred = false;
    }

    public function build(array $context = [])
    {
        $this->_context = $context;
        $function = '__ajax' . ucfirst($context[0]);
        if (method_exists($this, $function)) {
            $this->$function();
        }
    }

    function alert($message, $type) {
        $this->_output['alert'] = ['message' => $message, 'type' => $type];
    }

    public function __ajaxManage()
    {
        if (!isset($_POST['action'])) return;
        if ($_POST['action'] == 'apply' && is_array($_POST['items'])) {
            $source_dir = $_POST['source-dir'];
            $dest_dir = $_POST['dest-dir'];
            $source_dir_abs = $this->filePathJoin(WORKSPACE, $source_dir);
            $dest_dir_abs = $this->filePathJoin(WORKSPACE, $dest_dir);
            $operation = $_POST['with-selected'];
            $checked = array_keys($_POST['items']);
            $results = array(
                'source_dir' => $source_dir,
                'dest_dir' => $dest_dir,
                'action' => $operation,
                'files' => array()
            );
            switch ($operation) {
                case 'delete':
                    foreach ($checked as $filename) {
                        $file_path_abs = $source_dir_abs . '/' . $filename;
                        $success = true;
                        if (is_dir($file_path_abs)) {
                            try {
                                rmdir($file_path_abs);
                            } catch (Exception $ex) {
                                $file_path = $this->getWorkspaceRelativePath($file_path_abs);
                                $this->pageAlert(
                                    __('Failed to delete %s.', ['<code>' . $file_path . '</code>'])
                                    . ' ' . __('Directory %s is not empty or permissions are wrong.', ['<code>' . $file_path . '</code>']), Alert::ERROR
                                );
                                $success = false;
                            }
                        } elseif (!General::deleteFile($file_path_abs)) {
                            $file_path = $this->getWorkspaceRelativePath($file_path_abs);
                            $this->pageAlert(
                                __('Failed to delete %s.', ['<code>' . $file_path . '</code>'])
                                . ' ' . __('Please check permissions on %s.', ['<code>/workspace/' . '' . '/' . $file_path . '</code>'])
                                , Alert::ERROR
                            );
                            $success = false;
                        }
                        $results['files'][$filename] = $success;
                    }
                    break;
                case 'move':
                    foreach ($checked as $filename) {
                        $source_path_abs = $source_dir_abs . '/' . $filename;
                        $dest_path_abs = $dest_dir_abs . '/' . $filename;
                        $success = false;
                        if ($dest_path_abs != $source_path_abs) {
                            if (file_exists($source_path_abs) && !file_exists($dest_path_abs)) {
                                $success = rename($source_path_abs, $dest_path_abs);
                            }
                        }
                        $results['files'][$filename] = $success;
                    }
                    break;
                case 'copy':
                    foreach ($checked as $filename) {
                        $source_path_abs = $source_dir_abs . '/' . $filename;
                        $dest_path_abs = $dest_dir_abs . '/' . $filename;
                        $success = false;
                        if ($dest_path_abs != $source_path_abs) {
                            if (file_exists($source_path_abs) && !file_exists($dest_path_abs)) {
                                $success = copy($source_path_abs, $dest_path_abs);
                            }
                        }
                        $results['files'][$filename] = $success;
                    }
                    break;
                case 'rename':
                    $filename_new = $_POST['fields']['filename-new'];
                    $multi = (count($checked) > 1);
                    foreach ($checked as $n => $filename) {
                        //Symphony::Log()->writeToLog('FN: '.$filename_new);
                        $filename_new_1 = $filename_new;
                        if ($multi) {
                            $ext = null;
                            $dot_pos = strrpos($filename_new_1, '.');
                            if ($dot_pos !== false) {
                                $ext = substr($filename_new_1, $dot_pos);
                                $filename_new_1 = substr($filename_new_1, 0, $dot_pos);
                            }
                            $filename_new_1 .= '-' . strval($n + 1) . $ext;
                        }
                        $source_path_abs = $source_dir_abs . '/' . $filename;
                        $dest_path_abs = $source_dir_abs . '/' . $filename_new_1;
                        $success = false;
                        if ($dest_path_abs != $source_path_abs) {
                            if (file_exists($source_path_abs) && !file_exists($dest_path_abs)) {
                                $success = rename($source_path_abs, $dest_path_abs);
                            }
                        }
                        $results['files'][$filename] = $filename_new_1;
                    }
                    break;
            }
            $this->_output = $results;
        }
    }


    public function __ajaxDirectories()
    {
        if (!isset($_POST['items'])) return;
        $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
        $this->_output['created'] = array();
        $dest_dir = $_POST['dest_dir'];
        $this->_output['dest_dir'] = $dest_dir;
        //$dest_dir_abs = getWorkspaceFullPath($dest_dir);
        $dest_dir_abs = WORKSPACE . ($dest_dir ? '/' . $dest_dir : null);
        foreach ($_POST['items'] as $dir_name) {
            $dir_name = trim($dir_name, '/');
            $dir_name_abs = $dest_dir_abs . '/' . $dir_name;
            if (mkdir($dest_dir_abs . '/' . $dir_name, 0777, false)) {
                $mtime = filemtime($dir_name_abs);
                $results = array(
                    'name' => $dir_name,
                    'what' => '+',
                    'type' => mime_content_type($dir_name_abs),
                    'size' => '-',
                    'perms' => substr(sprintf('%o', fileperms($dir_name_abs)), -4),
                    'mtime' => $mtime,
                    'mdate' => date($format, $mtime),
                );
                $this->_output['created'][] = $results;
            }
        }
    }


    public function __ajaxUpload()
    {
        if (isset($_FILES['uploaded_file'])) {
            $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
            $uploaded_file = $_FILES['uploaded_file'];
            $dest_dir = $_POST['dest_dir'];
            $file_path = ($dest_dir ? $dest_dir . '/' : null) . $uploaded_file['name'];
            //Symphony::Log()->writeToLog('File: '.$_FILES['uploaded_file']['name']);
            move_uploaded_file($uploaded_file['tmp_name'], 'workspace/' . $file_path);
            $file_path_abs = WORKSPACE . '/' . $file_path;
            $mtime = filemtime($file_path_abs);
            $this->_output = array(
                'dir' => $dest_dir, 'name' => $uploaded_file['name'],
                'what' => '=', 'type' => mime_content_type($file_path_abs),
                'size' => $this->formatFilesize(filesize($file_path_abs)),
                'perms' => sprintf('%o', fileperms($file_path_abs), -4),
                'mtime' => $mtime, 'mdate' => date($format, $mtime)
            );
        }
    }


    public function __ajaxEditor()
    {
        if (isset($_GET['file_path'])) {
            $text = file_get_contents(WORKSPACE . '/' . $_GET['file_path']);
            $this->_output['text'] = $text;
        } elseif (isset($_POST['action'])) {
            $action = array_keys($_POST['action'])[0];
            $fields = $_POST['fields'];
            $file_path_abs = WORKSPACE . '/' . $this->filePathJoin($fields['directory'], $fields['filename']);
            $save_file = true;
            if ($action == 'save-as') {
                if (file_exists($file_path_abs)) {
                    $this->alert('File already exists.', 'error');
                    $save_file = false;
                }
            }
            if ($save_file) {
                if (General::writeFile($file_path_abs, $fields['contents'])) {
                    $this->alert(__('File saved at ') . Widget::Time()->generate(), 'success');
                } else {
                    $this->alert(__('File could not be saved.'), 'error');
                }
            }
            $info = $this->getDirectoryEntry(new SPLFileInfo($file_path_abs));
            $this->_output['file'] = $info;
        }
    }

    public function generate($page = NULL)
    {
        header('Content-Type: text/json');
        echo json_encode($this->_output);
        exit();
    }

    function getWorkspaceFullPath($path)
    {
        return WORKSPACE . ($path ? '/' . $path : '');
    }

    function filePathJoin($part1, $part2)
    {
        if ($part1) {
            if ($part2) {
                return $part1 . '/' . $part2;
            } else {
                return $part1;
            }
        } elseif ($part2) {
            return $part2;
        } else {
            return null;
        }
    }

    function getWorkspaceRelativePath($path_abs) {
        return substr($path_abs, strlen(WORKSPACE) + 1);
    }

    function outputFileList()
    {
        $this->_output['files'] = [
            'dir_path' => '',
            'list' => $this->getDirectoryEntries()
        ];
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
}
