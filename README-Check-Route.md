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
````


