**workspace-config-apply-nodejs**

A node js module for mangaing RBAC, Users and Global plugins in Workspace

Status
Inital Stage - frequent commits, no tests for now will add soon

Prerequisites
This module uses the Admin API for updating Kong workspace config.

A Kong instance up and running with Admin API.


**Setup**
add a .env file.

Add ADMIN_TOKEN= This is the RBAC token which will be used to authorize the admin API calls.

Other optional parametres to add in .env 
CA ( default null) 
CONFIG_DIR (default ./config/) 
KONG_ADDR ( default http://localhost:8001) 
SSL_VERIFY ( default true)

In ./config folder, you will need to have a folder that corresponds to a new or existing workspace you would like to configure. Each workspace folder structure will be like this below.

./config 
	- workspace1 ( directory. This will be the workspace name) 
		- users.yaml ( all user configs) 
		-workspace.yaml ( all workspace, role and plugin configuration) 
	- workspace2 ( directory. This will be the workspace name) 
        - users.yaml ( all user configs)
        -workspace.yaml ( all workspace, role and plugin configuration)

Run
`npm install
``node configurator.js [argument] [optional: workspacename]``
*Command line argument 
 0 Default (Add all). 
 1 Add Workspace + plugin. 
 2 Add Users only.``*

If no workspace is provided, then the script will run for all workspaces in the /config folder.


