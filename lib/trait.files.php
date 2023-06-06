<?php

trait Files
{
    /**
     * Recursively fetch file information.
     */
    function getDirectoryEntries(string $dir_path = null, array $excludes = null)
    {
        $dir_path_abs = WORKSPACE . ($dir_path ? '/' . $dir_path : null);
        $rdi = new RecursiveDirectoryIterator(
            $dir_path_abs,  RecursiveDirectoryIterator::SKIP_DOTS
        );
        $iterator = new RecursiveIteratorIterator(
            $rdi, RecursiveIteratorIterator::SELF_FIRST
        );
        $return = [];
        foreach ($iterator as $file_info) {
            $entry = $this->getDirectoryEntry($file_info, $excludes);
            if (!is_null($entry)) {
                $return[] = $entry;
            }
        }

        return $return;
    }

    function getDirectoryEntry($file_info, array $excludes = null)
    {
        if (is_array($excludes) && $file_info->isDir()) {
            $ws_local_path = substr($file_info->getPathName(), strlen(WORKSPACE) + 1);
            if (in_array($ws_local_path, $excludes)) return;
        }
        $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
        $item_out = [
            'name' => $file_info->getFilename(),
            'type' => '-',
            'size' => '-',
            'mdate' => '-'
        ];
        $target_file_info = null;
        if ($file_info->isLink()) {
            $target_file_path = $file_info->getRealPath();
            if ($target_file_path === false) {
                $item_out['link_target'] = '';
            } else {
                $target_file_info = new SplFileInfo($target_file_path);
                if (strpos($target_file_path, WORKSPACE) !== 0) {
                    $item_out['link_target'] = $target_file_path;
                } else {
                    $item_out['link_target'] = substr($target_file_path, strlen(WORKSPACE) + 1);
                }
            }
        } else {
            $target_file_info = $file_info;
        }
        if (isset($target_file_info)) {
            $mime_type = mime_content_type($target_file_info->getPathName());
            $comma_pos = strpos($mime_type, ',');
            if ($comma_pos) {
                $mime_type = substr($mime_type, 0, $comma_pos);
            }
            if ($target_file_info->isDir()) {
                $what = '+';
                $count = 0;
                /*foreach ($rdi->getChildren() as $child) {
                    $count++;
                }*/
                $item_out['size'] = '-';//"$count item" . ($count !== 1 ? 's' : null);
            } else {
                $item_out['size'] = self::formatFilesize($target_file_info->getSize());
                $what = (bool)preg_match('/^text\/|^application\//', $mime_type) ? '=' : '-';
            }
            $item_out['what'] = $what;
            $item_out['type'] = $mime_type;
            $item_out['mtime'] = $target_file_info->getMTime();
            $item_out['mdate'] = date($format, $item_out['mtime']);

            $perms = fileperms($target_file_info->getPathName());
            $item_out['perms'] = substr(sprintf('%o', $perms), -4);
            //$item_out['dir'] = trim(substr($target_file_info->getPath(), strlen(WORKSPACE) + 1), '/');
            $item_out['dir'] = trim(substr($file_info->getPath(), strlen(WORKSPACE) + 1), '/');
        }
        return $item_out;
    }


    function scanDirectory(String $dir_path = '')
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
        $output = [
            ['path' => '', 'title' => __('Workspace root')]
        ];
        foreach ($dir_list as $dir_path) {
            $output[] = ['path' => trim($dir_path, '/')];
        }
        return $output;
    }


    function getFileInfoArray($file_path_abs)
    {
        $format = Symphony::Configuration()->get('date_format', 'region') .
            ' ' . Symphony::Configuration()->get('time_format', 'region');
        $file_info = new SplFileInfo($file_path_abs);
        $item_out = [
            'name' => $file_info->getFilename(),
            'type' => '-',
            'size' => '-',
            'mdate' => '-'
        ];
        $target_file_info = null;
        if ($file_info->isLink()) {
            $target_file_path = $file_info->getRealPath();
            if ($target_file_path === false) {
                $item_out['link_target'] = '';
            } else {
                $target_file_info = new SplFileInfo($target_file_path);
                if (strpos($target_file_path, WORKSPACE) !== 0) {
                    $item_out['link_target'] = $target_file_path;
                } else {
                    $item_out['link_target'] = substr($target_file_path, strlen(WORKSPACE) + 1);
                }
            }
        } else {
            $target_file_info = $file_info;
        }
        if (isset($target_file_info)) {
            $mime_type = mime_content_type($target_file_info->getPathName());
            $comma_pos = strpos($mime_type, ',');
            if ($comma_pos) {
                $mime_type = substr($mime_type, 0, $comma_pos);
            }
            if ($target_file_info->isDir()) {
                $what = '+';
                $count = 0;
                /*foreach ($rdi->getChildren() as $child) {
                    $count++;
                }*/
                $item_out['size'] = '-';//"$count item" . ($count !== 1 ? 's' : null);
            } else {
                $item_out['size'] = self::formatFilesize($target_file_info->getSize());
                $what = (bool)preg_match('/^text\/|^application\//', $mime_type) ? '=' : '-';
            }
            $item_out['what'] = $what;
            $item_out['type'] = $mime_type;
            $item_out['mtime'] = $target_file_info->getMTime();
            $item_out['mdate'] = date($format, $item_out['mtime']);

            $perms = fileperms($target_file_info->getPathName());
            $item_out['perms'] = substr(sprintf('%o', $perms), -4);
            $item_out['dir'] = trim(substr($target_file_info->getPath(), strlen(WORKSPACE)), '/');
        }
        return $item_out;
    }


    function getNumFilesInDirectory(String $file_path)
    {
        $child_names = $this->scanDirectory($file_path);
        $count = ($child_names !== false) ? count($child_names) : 0;
        return strval($count) . ' ' . (($count == 1) ? __('item') : __('items'));
    }

    static function formatFilesize(Int $size)
    {
        $levels = ['GiB' => 1024 * 1024 * 1024, 'MiB' => 1024 * 1024, 'KiB' => 1024];
        foreach ($levels as $suffix => $threshold) {
            if ($size >= $threshold) {
                return strval(number_format($size / $threshold, 1)) . ' ' . $suffix;
            }
        }
        return $size . ' bytes';
    }
}
