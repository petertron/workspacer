<?php

require_once TOOLKIT . '/class.administrationpage.php';
require_once EXTENSIONS . '/workspacer/lib/class.path_object.php';

use workspacer\Helpers as Helpers;
use workspacer\PathObject as PathObject;

class contentExtensionWorkspacerEditorframe extends HTMLPage
{
    const ID = 'workspacer';
    static $assets_base_url;
    public $content_base_url;
    public $extension_base_url;
    public $_errors = array();
    public $_existing_file;

    public function __construct()
    {
        self::$assets_base_url = URL . '/extensions/workspacer/assets/';
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(self::ID);
    }

    public function build(array $context = array())
    {
        $this->_context = $context;

        /*if (!$this->canAccessPage()) {
            Administration::instance()->throwCustomError(
                __('You are not authorised to access this page.'),
                __('Access Denied'),
                Page::HTTP_STATUS_UNAUTHORIZED
            );
        }*/

        $this->Html->setDTD('<!DOCTYPE html>');
        $this->Html->setAttribute('lang', Lang::get());
        $this->addElementToHead(new XMLElement('meta', null, array('charset' => 'UTF-8')), 0);
        $this->addStylesheetToHead(self::$assets_base_url . 'editorframe.css');
        //$this->addStylesheetToHead(self::$assets_base_url . 'highlighters/highlight-xsl.css');

        $style = new XMLElement('style', null, array('id' => 'highlighter-styles'));
        $style->setSelfClosingTag(false);
        $this->Head->appendChild($style);
/*        $filepath = EXTENSIONS . '/workspacer/assets/highlighters/';
        $entries = scandir($filepath);
        foreach ($entries as $entry) {
            if (is_file($filepath . $entry)) {
                $info = pathinfo($filepath . $entry);
                if ($info['extension'] == 'css' and $info['filename'] != '') {
                    $this->addStylesheetToHead(self::$assets_base_url . 'highlighters/' . $info['basename'], 'screen');
                } elseif ($info['extension'] == 'js' and $info['filename'] != '') {
                    Administration::instance()->Page->addScriptToHead(self::$assets_base_url . 'highlighters/' . $info['basename']);
                }
            }
        }
*/
        $path_parts = $this->_context;
        array_shift($path_parts);
        $path = implode('/', $path_parts);
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
            if (is_file($path_abs)) {
                $filename = basename($path);
                $this->_existing_file = $filename;
                $title = $filename;
                if (dirname($path_abs) !== WORKSPACE) {
                    $path_obj = new PathObject(dirname($path));
                }
            } else {
                $path_obj = new PathObject($path);
            }
        } else {
            $path_abs = WORKSPACE;
        }

        if (!$filename) {
            $title = 'Untitled';
        }

        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Workspace'), __('Symphony'))));

        $this->Body->setAttribute('spellcheck', 'false');
/*
        $workspace_url = SYMPHONY_URL . '/workspace/manager/';
        $editor_url = SYMPHONY_URL . '/workspace/editor/';

        $path_string = SYMPHONY_URL . '/workspace/manager/';
        if (isset($path_obj)) {
            $dir_path = $path_obj->getPath() . '/';
            $dir_path_encoded = $path_obj->getPathEncoded() . '/';
            $workspace_url .= $dir_path_encoded;
            $editor_url .= $dir_path_encoded;
            $path_parts = $path_obj->getPathParts();
            $parts_encoded = $path_obj->getPathPartsEncoded();
        }

        //$this->editorXML($fieldset, $filename ? htmlentities(file_get_contents($path_abs), ENT_COMPAT, 'UTF-8') : '');
        //$this->editorXML($fieldset, $filename ? file_get_contents($path_abs) : '');

                //$this->_existing_file ? @file_get_contents($path_abs, ENT_COMPAT, 'UTF-8') : '',
                $filename ? htmlentities(file_get_contents($path_abs), ENT_COMPAT, 'UTF-8') : '',
                array('id' => 'text-area', 'class' => 'code hidden')
        );*/

        $name = $this->_context[1];
        $title = $filename;
        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Pages'), __('Symphony'))));
        $this->Body->setAttribute('spellcheck', 'false');
        $font_size = $this->settings->font_size ? $this->settings->font_size : '8.2pt';
        $font_family = $this->settings->font_family ? $this->settings->font_family . ', monospace' : 'monospace';
        $line_height = $this->settings->line_height ? $this->settings->line_height : '148%';
        $pre = new XMLElement(
            'pre',
            null,
            array(
                'contentEditable' => 'true',
                'style' => 'font-family: ' . $font_family . ';font-size: ' . $font_size . ';line-height:' . $this->settings->line_height
            )
        );
        $pre->setSelfClosingTag(false);
        $this->Body->appendChild($pre);

        $script = new XMLElement(
            'script',
            'parent.$(parent.document).trigger("editor-main-ready");'
            //"var event = top.document.createEvent('Event');\n" .
            //'event.initEvent("editor-main-ready", true, true);' .
            //'top.document.dispatchEvent(event)'
        );
        $script->setSelfClosingTag(false);
        $this->Body->appendChild($script);
    }
}
?>