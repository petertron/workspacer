# Workspacer version 0.7.0 for Symphony CMS version 2.5+

Workspacer allows files in the Workspace folder to be managed and edited. It also restores the ability, pre Symphony 2.4, to edit Page XSL templates from the Pages page.

## Requirements

Symphony CMS version 2.5 or higher, PHP 5.4 or higher.

## Installation

The folder needs to be named "workspacer". Install in the usual way for a Symphony extension.

## Usage

To access the file manager select 'Workspace' from the Blueprints menu.

To edit a file, click on the file name. Files can be saved by typing `Ctrl + s` or `Cmd + s` when the browser's focus is on the editing area. The 'Esc' key can be used to close the editor.

## Settings

On Symphony's Preferences page there are options to change some of the editor's properties.

## Browser Compatibility.

Version 0.7.x requires Chrome/Chromium or one of its derivatives at the moment. This is due to the use of some recently added features in JavaScript.

## Changes

### Version 0.7.0

Some redesigning has been done for this release.
* Split-view mode is gone.
* A file uploader has been added.
* File renaming has been added at last.

### Version 0.6.2

* Prevent crashing when a symbolic link cannot be resolved.

### Version 0.6.1

* Tab key works again.

### Version 0.6.0

* Added editor context menu.
* Added language translation to editor.

### Version 0.5.1

Bug-fix.

### Version 0.5.0

This is a major rewrite.

* The file manager now has easier navigation and has a split view mode where files can be moved or copied between directories.

* The file editor now uses a modal box.

* File uploading has been removed (for now) and will be provided by a separate extension.

### Version 0.4.0

This is a bug-fix release.

### Version 0.3.0

* The filename box has been removed. When saving a new file the editor will prompt you for a name.
* There is a new save-as button.
