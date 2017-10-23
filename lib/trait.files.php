<?php

use Workspacer as WS;

trait Files
{
    function getDirectoryEntries($dir_path = null)
    {
        $cwd = getcwd();
        chdir(WORKSPACE);
        $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
        $finfo = new finfo();
        $names = $this->scanDirectory($dir_path);
        $output = array();
        if ($names) {
            foreach ($names as $name) {
                $item_out = array('name' => $name);
                $file_path = $dir_path ? $dir_path . '/' . $name : $name;
                if (is_link($file_path)) {
                    $real_file_path = readlink($file_path);
                    if (substr($real_file_path, 0, 1) == '/') {
                        $real_file_path = substr($real_file_path, strlen(WORKSPACE) + 1);
                    }
                    $real_file_path = trim($real_file_path, '/');
                    if (is_dir($real_file_path)) {
                        $item_out['class'] = 'link dir';
                        $item_out['href'] = $real_file_path;
                        $item_out['title'] = 'Symlink. View real directory \'' . $real_file_path . '\'';
                        $item_out['size'] = $this->getNumFilesInDirectory($real_file_path);
                    } else {
                        $item_out['class'] = 'link file';
                        $item_out['href'] = $real_file_path;
                        $item_out['title'] = 'Symlink. Edit real file \'' . $real_file_path . '\'';
                        $item_out['size'] = General::formatFilesize(filesize($real_file_path));
                    }
                } else {
                    if (is_dir($file_path)) {
                        $item_out['class'] = 'dir';
                        $item_out['href'] = basename($file_path);
                        $item_out['title'] = 'View directory \'' . $file_path . '\'';
                        $item_out['size'] = $this->getNumFilesInDirectory($file_path);
                    } else {
                        $item_out['class'] = 'file';
                        $item_out['href'] = basename($file_path);
                        $item_out['title'] = 'Edit file \'' . $file_path . '\'';
                        $item_out['size'] = General::formatFilesize(filesize($file_path));

                    }
                }
                $description = $finfo->file($file_path);
                $comma_pos = strpos($description, ',');
                if ($comma_pos) {
                    $description = substr($description, 0, $comma_pos);
                }
                $item_out['description'] = $description;
                $item_out['mtime'] = date($format, filemtime($file_path));
                $output[] = $item_out;
            }
        }
        chdir($cwd);
        return $output;
    }
    
    function scanDirectory($dir_path = '')
    {
        $files = scandir($dir_path == '' ? '.' : $dir_path);
        if ($files) {
            return array_diff($files, array('.', '..'));
        } else {
            return false;
        }
    }
    
    function getRecursiveDirList()
    {
        $dir_list = General::listDirStructure(WORKSPACE, null, true, WORKSPACE);
        $output = array(array('path' => '', 'title' => __('Workspace root')));
        foreach ($dir_list as $dir_path) {
            $output[] = array('path' => trim($dir_path, '/'));
        }
        return $output;
        //return array_map(function($value) {return trim($value, '/');}, $dir_list);
    }
    
    function getNumFilesInDirectory($file_path)
    {
        $child_names = $this->scanDirectory($file_path);
        $count = ($child_names !== false) ? count($child_names) : 0;
        return strval($count) . ' ' . (($count == 1) ? __('item') : __('items'));
    }
}
