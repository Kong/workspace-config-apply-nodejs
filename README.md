# workspace-config-apply-nodejs

A node js module for managing RBAC, Users and Global plugins in Workspace in Kong

## Status
Inital Stage - frequent commits, no tests for now will add soon

## Prerequisites
This module uses the Admin API for updating Kong workspace config.

A Kong instance up and running with Admin API.


## Setup

Add a .env file. You can pass enviroment variables either using .env file or passing as export using command prompt.

For example `` export BASE64_UID_PWD="dsdsdsdsdsds"  ``

There are two ways to authenticate Kong Admin API via this tool:

### Use RBAC Token
1. Add the admin token: This is the RBAC token which will be used to authorize the admin API calls.
   For example
```
export ADMIN_TOKEN=<token>
```
2. Add Authentication method as RBAC
```
export AUTH_METHOD=RBAC
```

### Use client credentials or password

* Add admin username: This is the username or service account registered in Kong manager.
```
export ADMIN_USER=<username>
```
* Add Authentication method as PASSWORD
```
export AUTH_METHOD=PASSWORD
```
* Add base64 encoded username and password: This is the base64 encoded username:password for the user/service account. One can use sites like https://www.base64encode.org/ to encode username:password
```
export BASE64_UID_PWD=<base64 password>
```

### Other optional parametres to add in .env  

* CA ( default null)  
* CONFIG_DIR (default ./config/)   
* KONG_ADDR ( default http://localhost:8001)   
* SSL_VERIFY ( default true)  
* LOG_LIB= node-color-log (logging lib)  
* FEATURE_DELETE_EXISTING_USERS=false (if true, will remove admin users from workspace that are not present in users.yaml)  
* FEATURE_DELETE_EXISTING_ROLES=false ( if true, will remove existing roles from workspace that are not present in workspace.yaml. setting it true will not be allowed for running aginst default workspace that will cause Kong to work incorrectly. )
* PROXY=Any forwward proxy to set for the tool to access the Admin API. Example: http://proxyhost:port. Default NOT SET.


In ./config folder, you will need to have a folder that corresponds to a new or existing workspace you would like to configure. Each workspace folder structure will be like this below.  

```
./config.  
	root-workspace ( default workspace config. ).   
	**- workspace1 ( directory. This will be the workspace name).**     
			- users.yaml ( all user configs).   
			-workspace.yaml ( all workspace, role and plugin configuration. If exists, will overwrite root config).  
	**- workspace2 ( directory. This will be the workspace name).**
			- users.yaml ( all user configs).    
			-workspace.yaml ( all workspace, role and plugin configuration.  If exists, will overwrite root config).   
```
It is possible to externalize permissions of a role to a separate file. Like in the example below, one role has embedded permissions, and other has permissions externalized in a file.
```
    rbac:
    - role: readonlyrole
      permissions: 
      - endpoint: "*"
        negative: false
        actions: "read"
    - role: admin
      permissions: ./config/sample-admin-role-list.yaml
```

## Run

1. Checkout this repository
2. Set env vars
3. From within the root folder you need to first install the node dependencies:

```
npm install
````

4. Then once these are installed you can use the utility as follows

```
node configurator.js [optional: command] [optional: workspacename]
````
**Commands**

* all       - Default (Add all). 
* workspace - Add Workspace + plugin. 
* userrs    - Add Users only.
* groups    - Add Groups only.  

If no workspace is provided, then the script will run for all workspaces in the /config folder.

## Examples

```
node configurator.js workspace demo1 (create workspace for demo1).    
node configurator.js workspace       (create workspace configs for all workspaces).   
node configurator.js users demo1     ( add/remove users for demo1).   
node configurator.js users           ( add/remove users for all).   
node configurator.js groups  	     ( add groups).   
```
To use it to add custom roles in default workspace.

1. Use the workspace.yaml under rename-this-to-default folder to add custom roles that will apply the role for all workspaces. Use this with care.
2. Ensure only custom roles you want to add are in the default->workspace.yaml file.
3. If you want to redefine a custom role, then remove it using manager UI, or admin API and rerun. 
4. MUST:Set FEATURE_DELETE_EXISTING_ROLES and FEATURE_DELETE_EXISTING_USERS to false when you run this against 'default' workspace. This is to avoid deleting default users and roles by accident in default. Kong recommendation is to minimize the use of this application on default workspace.
5. To add users to the custom roles. Use rename-this-to-default -> users.yaml as sample.  
6. Rename rename-this-to-default to default.
7. Run node configurator.js default all.

## Delete workspace.
Today, once an workspace is created, you can't delete it without deleting all entities within it, which in development phase slows down the process.
Also this includes the defaul dev portal files which within Kong can only be deleted using portal CLI which does not support session cookie based authentciation at this point.
To delete an workspace using this tool: -

``` node configurator.js wipe demo1 ``` This will delete workspace demo1 if it's empty, except default files generated by dev portal enablement.
``` node configurator.js wipe demo1 true``` This will force delete workspace demo1 if it's not empty, after giving users an warning and 8 second pause to terminate.
For force delete to work, enviroment variable FEATURE_FORCE_WIPE_WORKSPACE will need to be set to true

