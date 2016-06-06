<?php

require EXTENSIONS . '/workspacer/lib/class.helpers.php';

use workspacer\ws;

Class extension_Workspacer extends Extension
{
    const ID = 'workspacer';

    public function __construct()
    {
        parent::__construct();
        $this->settings = (object)Symphony::Configuration()->get(self::ID);
    }

    public function install()
    {
        $this->config();
    }

    public function update($previous_version = false)
    {
        $this->config();
    }

    public function uninstall()
    {
        Symphony::Configuration()->remove(self::ID);
        Symphony::Configuration()->write();
    }

    function config()
    {
        Symphony::Configuration()->setArray(
            array(
                self::ID => array(
                    'font_family' => 'Monaco',
                    'font_size' => '8.4pt',
                    'line_height' => '148%',
                    'indentation_method' => 'tabs',
                    'indentation_width' => '4'
                )
            ), true
        );
        Symphony::Configuration()->write();
    }

    /*
     * Set naviagtion
     */
    public function fetchNavigation()
    {
        $children = array(
            array(
                'relative' => false,
                'link' => 'workspace/manager/',
                'name' => 'Home',
                'visible' => 'yes'
            )
        );
        $entries = scandir(WORKSPACE);
        foreach ($entries as $entry) {
            if ($entry == '.' or $entry == '..') continue;
            if (is_dir(WORKSPACE . '/' . $entry)) {
                array_push($children,
                    array(
                        'relative' => false,
                        'link' => '/workspace/manager/' . $entry . '/',
                        'name' => ws\capitalizeWords($entry),
                        'visible' => 'yes'
                    )
                );
            }
        }
        return array(
            array(
                'name' => 'Workspace',
                'type' => 'structure',
                'index' => '250',
                'children' => $children
            )
        );
    }


// Delegates ***************************

    public function getSubscribedDelegates()
    {
        return array(
            array(
                'page' => '/all/',
                'delegate' => 'ModifySymphonyLauncher',
                'callback' => 'modifyLauncher'
            ),
            array(
                'page' => '/backend/',
                'delegate' => 'AdminPagePreGenerate',
                'callback' => 'adminPagePreGenerate'
            ),
            array(
                'page' => '/system/preferences/',
                'delegate' => 'AddCustomPreferenceFieldsets',
                'callback' => 'appendPreferences'
            )/*,
            array(
                'page' => '/system/preferences/',
                'delegate' => 'Save',
                'callback' => 'savePreferences'
            )*/
        );
    }

    public function modifyLauncher()
    {
        if (!isset($_GET['symphony-page'])) return;
        $page = trim($_GET['symphony-page'], '/');

        if (is_string($path_remainder = $this->startsWith($page, 'blueprints/pages/template'))) {
            $new_page = 'view/template' . $path_remainder;
        } elseif (is_string($path_remainder = $this->startsWith($page, 'workspace/editorframe'))) {
            $new_page = 'editorframe';
            $_GET['path'] = $path_remainder;
        } elseif (is_string($path_remainder = $this->startsWith($page, 'workspace/manager'))) {
            $new_page = (isset($_POST['ajax']) ? 'ajax/' : 'view/') . 'manager' . $path_remainder;
        } elseif (is_string($path_remainder = $this->startsWith($page, 'workspace/editor'))) {
            $new_page = (isset($_POST['ajax']) ? 'ajax/' : 'view/') . 'editor' . $path_remainder;
        } else {
            return;
        }

        $_GET['symphony-page'] = '/extension/workspacer/' . $new_page . '/';
    }

    function startsWith($string1, $string2)
    {
        $length = strlen($string2);
        if (substr($string1, 0, $length) == $string2) {
            $remainder = substr($string1, $length);
            if (!$remainder) $remainder = '';
            return $remainder;
        } else {
            return false;
        }
    }

    /**
    * Modify admin pages.
    */
    public function adminPagePreGenerate($context)
    {
        $page = $context['oPage'];
        $callback = Symphony::Engine()->getPageCallback();
        $driver = $callback['driver'];
        if ($driver == "blueprintspages") {
            //echo var_dump($callback['context']); die;
            $context = $callback['context'];
            $action = isset($context['action']) ? $context['action'] : $context[0];
            if ($action == 'edit') {
                $id = isset($context['id']) ? $context['id'] : $context[1];
                $template = PageManager::fetchPageByID($id);//context['id']);
                //echo var_dump($template); die;
                $ul = $page->Context->getChildByName('ul', 0);
                $ul->prependChild(
                    new XMLElement(
                        'li',
                        Widget::Anchor(
                            __('Edit Page Template'),
                            SYMPHONY_URL . '/blueprints/pages/template/'
                            . $template['handle'] . '/',
                            'Edit Page Template',
                            'button'
                        )
                    )
                );
            } elseif ($table = $page->Form->getChildByName('table', 0)) {
                $tbody = $table->getChildByName('tbody', 0);
                foreach ($tbody->getChildren() as $tr) {
                    $td = $tr->getChild(1);
                    if ($td) {
                        $value = $td->getValue();
                        $td->replaceValue(
                            Widget::Anchor(
                                __($value),
                                SYMPHONY_URL . '/blueprints/pages/template/' . pathinfo($value, PATHINFO_FILENAME) . '/'
                            )
                        );
                    }
                }
            }
        }
    }

    public function appendPreferences($context)
    {
        $mode = strtolower($this->settings->mode);

        $fieldset = new XMLElement(
            'fieldset',
            new XMLElement('legend', 'Workspacer'),
            array('class' => 'settings')
        );

        $two_columns = new XMLElement('div', null, array('class' => 'two columns'));
        $two_columns->appendChild(
            Widget::Label(
                __('Font Family'),
                Widget::Input(
                    'settings[' . self::ID . '][font_family]', $this->settings->font_family
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Font Size'),
                Widget::Input(
                    'settings[' . self::ID . '][font_size]', $this->settings->font_size
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($two_columns);

        $one_column = new XMLElement('div', null, array('class' => 'column'));
        $one_column->appendChild(
            Widget::Label(
                __('Line Height'),
                Widget::Input(
                    'settings[' . self::ID . '][line_height]', $this->settings->line_height
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($one_column);

        $two_columns = new XMLElement('div', null, array('class' => 'two columns'));
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation Method'),
                Widget::Select(
                    'settings[' . self::ID . '][indentation_method]',
                    array(
                        array('spaces', $this->settings->indentation_method == 'spaces', 'Spaces'),
                        array('tabs', $this->settings->indentation_method == 'tabs', 'Tabs')
                    )
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $two_columns->appendChild(
            Widget::Label(
                __('Indentation/Tab Width'),
                Widget::Input(
                    'settings[' . self::ID . '][indentation_width]',
                    $this->settings->indentation_width,
                    'number',
                    array('min' => '1')
                ),
                null, null,
                array('class' => 'column')
            )
        );
        $fieldset->appendChild($two_columns);
        $context['wrapper']->appendChild($fieldset);
    }
}