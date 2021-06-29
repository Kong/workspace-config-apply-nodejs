
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

## Workspace YAML syntax

Workspaces are stored in a YAML file (default: workspaces.yaml)

Each workspace to be added is a child of the main "workspaces" array object:

### Config object

Determines whether a portal should be enabled for this workspace:

``` yaml
- name: demoone
  config:
	  portal: false
```

#### Attribute table

| Attribute |Description  |
|--|--|
| portal | True if a dev portal should be enabled on this workspace, false if not |

### RBAC object

This configures any custom roles that need to be created (as well as the permissions for this custom role) and then what users should be added to the role in the workspace. Multiple custom roles can be created, each permission must follow the permission system of Kong, which is built around the RESTful admin API.

**Note**: The users will have to accept their invite sent to them via email if SMTP is enabled, or use the registration link API if SMTP is not configured to set their own password.

``` yaml
rbac:
- role: readonlyrole
permissions:
- endpoint: "*"
  negative: false
  actions: "read"
users:
- username: "Test User"
  email: "testuser@testcompany.com"
```

#### Attribute table

| Attribute |Description  |
|--|--|
| Role | The name of the role to create |
| Permissions | The permissions object array that this role will have created |
| Endpoint | The resource in the admin API affected by this role (Supports wildcard operator) |
| Negative | false if not wanting to do negative entitlements, true if doing negative entitlements |
| Actions | Comma seperated strings of the actions the entitlement has on the endpoint. Supported actions are CRUD based: "create", "read", "update", "delete" |
| Users | The user array is the list of users that the tool will create in the workspace with the specified role |
| username | The username for the user- must be unique |
| email | The email address for this user |

### Kong OOTB roles

When a workspace is created via the the admin API, under the hook there are API calls made by the UI to create 4 "default" roles for each workspace. When creating workspaces via the admin APIs, one must manually create these roles. For simplicities sake please find the Kong OOTB roles and their entitlements documented below:

#### Readonly role

Allows a user to have read only access to the entire workspace

``` yaml
 permissions:
 - endpoint: "*"
   negative: false
   actions: "read"
```

#### Superadmin role

Allows a user complete administration access to the workspace, including modifying the RBAC permissions and adding new users

``` yaml
permissions:
 - endpoint: "*"
   negative: false
   actions: "create,update,read,delete"
```

#### Admin role

Allows a user read/write access to all entities in the workspace, with the exception of modifying RBAC permissions and users

``` yaml
 permissions:
 - endpoint: "*"
   negative: false
   actions: "create,update,read,delete"
 - endpoint: "/rbac/*"
   negative: true
   actions: "create,update,read,delete"
 - endpoint: "/rbac/*/*"
   negative: true
   actions: "create,update,read,delete"
 - endpoint: "/rbac/*/*/*"
   negative: true
   actions: "create,update,read,delete"
 - endpoint: "/rbac/*/*/*/*"
   negative: true
   actions: "create,update,read,delete"
 - endpoint: "/rbac/*/*/*/*/*"
   negative: true
   actions: "create,update,read,delete"
```
