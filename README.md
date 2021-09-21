**workspace-config-apply-nodejs**

A node js module for mangaing RBAC, Users and Global plugins in Workspace

**Status**
Inital Stage - frequent commits, no tests for now will add soon

**Prerequisites**
This module uses the Admin API for updating Kong workspace config.

A Kong instance up and running with Admin API.


**Setup**  

Add a .env file. You can pass enviroment variables either using .env file or passing as export using command prompt.

For example `` export BASE64_UID_PWD="dsdsdsdsdsds"  ``

There are two ways to authenticate Kong Admin API via this tool.  

*Option 1. Use RBAC Token* 
    Add ADMIN_TOKEN .  This is the RBAC token which will be used to authorize the admin API calls.  
	Add AUTH_METHOD=RBAC  

*Option 2. Use client credentials or password*   
	Add ADMIN_USER . This is the username or service account registered in Kong manager.
	Add AUTH_METHOD=PASSWORD  	
    Add BASE64_UID_PWD . This is the base64 encoded username:password for the user/service account. One can use sites like https://www.base64encode.org/ to encode username:password

Other optional parametres to add in .env  

CA ( default null)  
CONFIG_DIR (default ./config/)   
KONG_ADDR ( default http://localhost:8001)   
SSL_VERIFY ( default true)  
LOG_LIB= node-color-log (logging lib)  
FEATURE_DELETE_EXISTING_USERS=false (if true, will remove admin users from workspace that are not present in users.yaml)  
PROXY=Any forwward proxy to set for the tool to access the Admin API. Example: http://proxyhost:port. Default NOT SET.


In ./config folder, you will need to have a folder that corresponds to a new or existing workspace you would like to configure. Each workspace folder structure will be like this below.  

./config.  
	root-workspace ( default workspace config. ).   
	**- workspace1 ( directory. This will be the workspace name).**     
			- users.yaml ( all user configs).   
			-workspace.yaml ( all workspace, role and plugin configuration. If exists, will overwrite root config).  
	**- workspace2 ( directory. This will be the workspace name).**
			- users.yaml ( all user configs).    
			-workspace.yaml ( all workspace, role and plugin configuration.  If exists, will overwrite root config).   

**Run**
`npm install`
``node configurator.js [optional: argument] [optional: workspacename]``
*Command line argument 
 0 Default (Add all). 
 1 Add Workspace + plugin. 
 2 Add Users only.
 3 Add Groups only.  

If no workspace is provided, then the script will run for all workspaces in the /config folder.

**Examples**

node configurator.js 1 demo1 (create workspace for demo1).    
node configurator.js 1       (create workspace configs for all workspaces).   
node configurator.js 2 demo1 ( add/remove users for demo1).   
node configurator.js 2       ( add/remove users for all).   
node configurator.js 3  	 ( add groups).   


