# Changelog

## 1.2.2

🆕 New features:
- Ability to run roles per role and per workspace, for example:

| CLI Input                                                           | Behavior                                                  |
|---------------------------------------------------------------------|-----------------------------------------------------------|
| `node configurator.js roles`                                        | Runs all roles for all workspaces                         |
| `node configurator.js roles Tenant-Release-User`                    | Runs `Tenant-Release-User` role for all workspaces        |
| `node configurator.js roles Tenant-Release-User wpb-eu-cem-onboarding-dev-ship` | Runs `Tenant-Release-User` role for `wpb-eu-cem-onboarding-dev-ship` workspace |
| _All existing commands_                                             | Continue to behave as before                              |


## 1.2.1

🆕 New features:
- Ability to add workspace scoped RBAC user with token as UUID.

## 0.0.1

💥 Breaking changes:

🆕 New features:

🔧 Fixes:

## 0.0.3

💥 Breaking changes: workspaces.yaml is no longer valid

🆕 New features: Complete redesign

🔧 Fixes: none.

## 1.2.0



🆕 New features: 
    Multi workspace custom role creation against default workspace.
    Admin users added with RBAC token disabled.

