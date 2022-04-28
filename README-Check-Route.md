# How to check route conflicts on the pipeline if you have a large nuber of routes, and for performance reasons wants to switch off smart route validator.



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



## Run

1. Checkout this repository
2. Set env vars ( you can use checkroute.sh to set them)
3. From within the root folder you need to first install the node dependencies:

```
npm install
````

4. Then once these are installed you can use the utility as follows

```
./checkroute.sh {kong-admin-api-base-url:8001} {token} {kong-config-path} [current-workspace]
Optional {current-workspace} will be skipped for route conflict check. 

--Success 

Route validation starting: Thu 28 Apr 2022 19:29:22 BST
2022-04-28T18:29:23.080Z [INFO] Command line argument 
 all - Default (Add all). 
 workspace - Add Workspace + plugin. 
 users - Add Users only ( For non OIDC Kong Instances only). 
 groups - Add Groups only.  
 wipe workspace, optional force delete. 
 validate-route - against the kong conf
2022-04-28T18:29:23.084Z [INFO] Argument: 5
2022-04-28T18:29:23.084Z [INFO] Selected Workspace: config/sample_kong_conf_no_match
2022-04-28T18:29:23.085Z [INFO] RBAC method of authentication selected
2022-04-28T18:29:23.085Z [INFO] this will check all existing routes acorss all workspaces and compare them with inso config to ensure that will not be any conflicting route.
2022-04-28T18:29:23.085Z [INFO] Kong conf file path set to /Users/aviksengupta/codes/workspace-config-apply/workspace-config-apply-nodejs/config/sample_kong_conf_no_match
2022-04-28T18:29:29.085Z [INFO] All routes checked (4584 ), no conflict found!
retuncode:no-conflict
Route validation finished: Thu 28 Apr 2022 19:29:29 BST
no route conflict. do stuff
if [[ "$v" == *"$successcode"* ]]; then
  echo "no route conflict. do stuff"
fi

--Conflict
2022-04-28T18:34:32.381Z [ERROR] Route conflict: 
 Config route: {"tags":["OAS3_import"],"name":"Airport_info-Airport2","paths":["/133test"],"strip_path":false}
 conflcited with  
{"https_redirect_status_code":426,"headers":null,"service":{"id":"24c6582f-948d-4410-a16a-68329304c6a4"},"paths":["/133test"],"methods":null,"sources":null,"destinations":null,"strip_path":true,"name":"1-route-33","protocols":["http","https"],"path_handling":"v0","snis":null,"created_at":1650626561,"id":"05d911b0-9775-45b8-8261-1bb3a75acfe2","tags":null,"request_buffering":true,"response_buffering":true,"hosts":null,"preserve_host":false,"regex_priority":0,"updated_at":1650626561}
 in workspace workspace1

````


