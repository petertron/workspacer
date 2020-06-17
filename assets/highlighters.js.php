<?php

header('Content-Type: application/javascript');
//console.log("Barty");
echo 'var highlighters = [];' . PHP_EOL;
require 'TextSplitter.js';
require 'highlighters/highlight-xsl.js';
//include 'highlighters/highlight-css.js';
//include 'highlighters/highlight-js.js';
//include 'highlighters/highlight-general.js';
