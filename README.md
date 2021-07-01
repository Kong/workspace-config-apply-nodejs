# workspace-config-apply-nodejs

A node js module for mangaing RBAC, Users and Global plugins in Workspace

## Status
Inital Stage - frequent commits, no tests for now will add soon

### Prerequisites

This module uses the Admin API for updating Kong workspace config.
* A Kong instance up and running with Admin API.
* .env file for environment variables KONG_ADDR="http://api.kong.lan:8001" ADMIN_TOKEN="password"
* Script by default uses workspaces.yaml file inside the config folder. Make sure the configurtaion details are correct inside worksapces.yaml file

## Setup

add a .env file.

add ADMIN_TOKEN=<token-here>
Other optional parametres to add in .env
    CA ( default null)
    CONFIG_DIR (default ./config/) Defunct in this version.
    KONG_ADDR ( default http://localhost:8001)
    SSL_VERIFY ( default true)

In ./config folder, you will need to have a folder that corresponds to a new or existing workspace 
you would like to configure. Each workspace folder structure will be like this below.

./config
    - workspace1 ( directory. This will be the workspace name)
        - users.yaml ( all user configs)
        -workspace.yaml ( all workspace, role and plugin configuration)
    - workspace2 ( directory. This will be the workspace name)
        - users.yaml ( all user configs)
        -workspace.yaml ( all workspace, role and plugin configuration)



### Run

``` bash
npm install

node configurator.js 
Command line argument 
 0 Default (Add all). 
 1 Add Workspace + plugin. 
 2 Add Users only.

```
