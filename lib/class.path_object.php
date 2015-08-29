<?php

namespace workspacer;

class PathObject
{
    protected $path;
    private $path_encoded;
    private $path_parts;
    private $path_parts_encoded;

    public function __construct($path = '')
    {
        $this->setPath($path);
    }

    public function getPath()
    {
        return $this->path;
    }

    public function getPathEncoded()
    {
        return $this->path_encoded;
    }

    public function getPathParts()
    {
        return $this->path_parts;
    }

    public function getPathPartsEncoded()
    {
        return $this->path_parts_encoded;
    }

    public function setPath($path = '')
    {
        $this->path = trim($path, '/');
        $this->processPath();
    }

    function processPath()
    {
        $this->path_parts = explode('/', $this->path);
        $this->path_parts_encoded = $this->path_parts;
        array_walk(
            $this->path_parts_encoded,
            function(&$part)
            {
                $part = rawurlencode($part);
            }
        );
        $this->path_encoded = implode('/', $this->path_parts_encoded);
    }
}
