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
* PROXY=Any forwward proxy to set for the tool to access the Admin API. Example: http://proxyhost:port. Default NOT SET.


In ./config folder, you will need to have a folder that corresponds to a new or existing workspace you would like to configure. Each workspace folder structure will be like this below.  

```
       config
       ├── workspace1 ( directory. This will be the workspace name )
       │   ├── users.yaml  ( all user configs )
       │   └── workspace.yaml ( OPTIONAL: all workspace, role and plugin configuration. If exists, will overwrite root config )
       ├── workspace2
       │   ├── users.yaml
       │   └── workspace.yaml
       ├── workspace3
       │   ├── users.yaml
       │   └── workspace.yaml
       ├── groups-and-roles.yaml ( groups and roles for all workspaces - cant be overwritten in workspace directory )
       └── root-workspace.yaml ( default workspace config )
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

