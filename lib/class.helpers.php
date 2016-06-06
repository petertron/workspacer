<?php

namespace workspacer\ws;

function capitalizeWords($string)
{
    return ucwords(str_replace('-', ' ', $string));
}

function readableSize($size)
{
    if ($size >= 1073741824) {
        return strval(round($size / 1073741824, 2)) . ' GiB';
    } elseif ($size >= 1048576) {
        return strval(round($size / 1048576, 2)) . ' MiB';
    } elseif ($size >= 1024) {
        return strval(round($size / 1024, 2)) . ' KiB';
    } else {
        return strval($size) . ' B';
    }
}