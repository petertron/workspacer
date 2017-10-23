<?php

namespace Workspacer;

function define_here($name, $value)
{
    define("Workspacer\\$name", $value);
}

define_here('ID', 'workspacer');
define_here('EXTENSION', \EXTENSIONS . '/' . ID);
define_here('ASSETS_URL', \URL . '/extensions/' . ID . '/assets');
