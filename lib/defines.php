<?php

define('WORKSPACER_ID', 'workspacer');
define('WORKSPACER', EXTENSIONS . '/' . WORKSPACER_ID);
define('WORKSPACER_ASSETS_URL', \URL . '/extensions/' . WORKSPACER_ID . '/assets');
define('WORKSPACER_LIB', WORKSPACER . '/lib');
/*
function workspace_rel_path(string $file_path_abs)
{
    $cut_point = strlen(WORKSPACE);
    if (substr($file_path_abs, 0, $cut_point) == WORKSPACE) {
        return substr($file_path_abs, $cut_point);
    } else {
        return false;
    }
}*/