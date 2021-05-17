# workspace-config-apply-nodejs

A node js module for mangaing RBAC, Users and Global plugins in Workspace

## Status
Inital Stage - frequent commits, no tests for now will add soon

### Prerequisites

This module uses the Admin API for updating Kong workspace config.
* A Kong instance up and running with Admin API.
* .env file for environment variables KONG_ADDR="http://api.kong.lan:8001" ADMIN_TOKEN="password"
* Script by default uses workspaces.yaml file inside the config folder. Make sure the configurtaion details are correct inside worksapces.yaml file


## Testing

### Run

``` bash
node app.js
```
