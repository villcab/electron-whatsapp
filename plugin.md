# Create Plugin

+ Create folder in `$HOME/.whatsdesk/<plugin name>` (for snap instalation `$HOME/snap/whatsdesk/current/.whatsdesk/<plugin name>`)
+ Create file config.json
    - `title` : this is a title of plugin
    - `description`: this a description of plugin
    - `version`: this a version of plugin
    - `main`: this a name of function for call plugin in the js
    - `load`: the option is 
        - `beforeload`: this is call when open the windows
        - `afterload`: this is call when is load and login in the app 
+ Create folder "js" all the files in this folder will be imported into the javascript of the app

## remember to create inside the js folder a file or function with the same name of the `main` so that it can be called

# Instalation 

+ Go to folder `$HOME/.whatsdesk/` OR `$HOME/snap/whatsdesk/current/.whatsdesk/` (if snap instalation)
+ copy plugin folder here OR clone if a git repository 
+ reset whatsdesk
+ ready


## [Example (dark theme)](https://gitlab.com/zerkc/dark-theme-whatsdesk "Dark theme")

## post-data: not support css