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
* roles     - Add Roles only.  

If no workspace is provided, then the script will run for all workspaces in the /config folder.

## Examples

```
node configurator.js workspace demo1 (create workspace for demo1).    
node configurator.js workspace       (create workspace configs for all workspaces).   
node configurator.js users demo1     ( add/remove users for demo1).   
node configurator.js users           ( add/remove users for all).   
node configurator.js groups  	     ( add groups).   
node configurator.js groups demo1    ( add groups and apply roles only for workspace demo1). This feature is only available in configurator.js with anchors
node configurator.js roles  	     ( add roles).   
node configurator.js roles demo1     ( add roles only for workspace demo1).
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

## Known issues

1. when running `node configurator.js groups`, you may get error

    `{workspace} not found. Please verify config. Processing exiting. Checking for group {group}`

    for e.g.

    `workspsce wpb-gb-aditi_group_test_12-dev-ship not found. Please verify config. Processing exiting. Checking for group Infodir-KONG-368705664953-SHP-SHIP-Tenant-Release-User`

	Explanation:

    This error occurs when the workspace specified in the groups command is not found in the configuration. 


	Solution:  Pick either of the steps 1 or 2 dependeing on you need missing workspace or not. 

	1. If you think the missing workspace you need it;
        2.1 create a folder with name such as `workspsce wpb-gb-aditi_group_test_12-dev-ship` under the logical environment for e.g. eu -> dev -> default -> workspsce wpb-gb-aditi_group_test_12-dev-ship and create workspace.yaml file under this folder with necessary configurations.
        2.2 run `node configurator.js workspace wpb-gb-aditi_group_test_12-dev-ship`
        2.3 Now run `node configurator.js groups` again.
	2. If you think the missing workspace is not needed;
        2.1 Open file `groups-and-roles.yaml` and find the corresponding workspace, make sure that the corresponding workspace and exist. Once you ensure that the workspace exist or remove the mapping from , re-run the script
    before running the scripts. 

2. Errors Related to Duplicate Permissions in `tenant-release-user.yaml`

	If you encounter errors like the following, it could be due to duplicate permissions in the `tenant-release-user.yaml` file:

	```javascript
	[ERROR] Error: Request failed with status code 400
		at createError (/kong-infra-common-workspace-creation-master/node_modules/axios/lib/core/createError.js:16:15)
		at settle (/kong-infra-common-workspace-creation-master/node_modules/axios/lib/core/settle.js:17:12)
		at IncomingMessage.handleStreamEnd (/kong-infra-common-workspace-creation-master/node_modules/axios/lib/adapters/http.js:269:11)
		at IncomingMessage.emit (node:events:524:35)
		at endReadableNT (node:internal/streams/readable:1359:12)
		at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	```
	Solution: Ensure that there are no duplicate sets of permissions in the tenant-release-user.yaml file. Check the file for any duplicates and remove them. If you encounter any other issues, it's recommended to check the Kong CP logs for further details on the cause of the issue.