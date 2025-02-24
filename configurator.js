const yaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const https = require("https");
const path= require('path');
const { v4: uuidv4 } = require('uuid');


const workspaceEndpoint = '/workspaces';
const rbacEndpoint = '/rbac';
const userEndpoint='/users';
const rolesEndpoint = '/roles';
const permissionsEndpoint = '/endpoints';
const adminEndpoint = '/admins';
const pluginsEndpoint = '/plugins';
const groupEndpoint = "/groups";
const authEndpoint = "/auth"
const fileEndpoint = "/files"
const metaEndpoint ="/meta"
const routeEndpoint ="/routes"

const workSpaceConfigName = "workspace.yaml";
const pluginConfigName = "plugins.yaml";
const userNameConfigName = "users.yaml";
const workSpaceRBACUsersConfigName = "workspace-rbac-user.yaml";
const rootWorkSpaceConfig = "root-workspace.yaml";
const groupConfig = "groups-and-roles.yaml"
const cookier_header_name = "admin_session"
const log_lib = require( process.env.LOG_LIB? process.env.LOG_LIB :"node-color-log");
const commands = ['all','workspace','users','groups','wipe','validate-route'];
(async () => {
  try {
    var workspacename;
    var rolename;
    var workspaceConfig;
    
    /*
    Command line argument
    0 Default (Add all).
    1 Add Workspace + plugin.
    2 Add Users only. ( For non OIDC Kong Instances only)
    3 Add groups. ( Should run after adding the workspaces first)
    4 Wipe workspace, optional force delete.
    5.Check Route Conflict against the kong conf
    */
   // With Node Js first command is node and second is the app file name. Any additional command is index position 2.

    logInfo("Command line argument \n all - Default (Add all). \n workspace - Add Workspace + plugin. \n users - Add Users only ( For non OIDC Kong Instances only). \n groups - Add Groups only.  \n wipe workspace, optional force delete. \n validate-route - against the kong conf");
  
    //get the command index from the defined commands array	  
    let command = commands.indexOf(process.argv[2]?process.argv[2]:1);

    //if command does not exist in the array then default to 1	  
    if (command == -1) {
      logError("Command not found please select one of the valid options above");
      process.exit("0");
    }
	  
    logInfo('Argument: ' + command );
    if(! ["0","1","2","3", "4", "5"].includes(command.toString())){
      logError("Invalid argument passed.")
      process.exit("0");
    }

    // if workspace name is passed as second argument, then it will run Configurations for that workspace only. If not, for all workspaces found under config folder.

    let selectedWorkspace = process.argv[3]?process.argv[3]:"all";
    logInfo('Selected Workspace: ' + selectedWorkspace );
    //config  directory is either hard coded to ./config or passed in env variable.
      let configDir = './config/';
    if (process.env.CONFIG_DIR) {
      configDir = process.env.CONFIG_DIR;
    }

    
    
    //check auth method . Session cookie(COOKIE) or rbac token ( RBAC)
    if (!process.env.AUTH_METHOD){
      logError("Env variable AUTH_METHOD must be set");
      process.exit("1");
    }
    var headers = {};
    if(process.env.AUTH_METHOD == 'RBAC'){
      logInfo("RBAC method of authentication selected");
      // admin token passed in env variable
      headers = {
        headers: {
          'Kong-Admin-Token': process.env.ADMIN_TOKEN,
          'validateStatus': false
        }
      };
    }else if (process.env.AUTH_METHOD == 'PASSWORD'){
      logInfo("PASSWORD method of authentication selected.");
      if(!process.env.ADMIN_USER || !process.env.BASE64_UID_PWD){
        logError("Env variable ADMIN_USER and BASE64_UID_PWD must be set when AUTH_METHOD is set to PASSWORD. BASE64_UID_PWD should be base64(username:password");
        process.exit("1");
      }

      headers = {
        headers: {
          'Kong-Admin-User': process.env.ADMIN_USER,
          'Authorization': " Basic " + process.env.BASE64_UID_PWD,
          'validateStatus': false
        }
      };

    }
    else{
      logError("Please check process.env.AUTH_METHOD");
    }
    // Set Proxy if needed.
    if (process.env.PROXY){
      headers.proxy = await parseProxyNoAuth(process.env.PROXY);
    }



    //Kong admin api  is either hard coded or passed in env variable.
    var kongaddr = 'http://localhost:8001'
    if (process.env.KONG_ADDR) {
      kongaddr = process.env.KONG_ADDR;
    }
    // For Https, a CA bundle can be passed and SSL verify option can be tweaked.
    if (process.env.CA) {
      axios.defaults.httpsAgent = new https.Agent({
      ca: fs.readFileSync(process.env.CA),
      rejectUnauthorized: process.env.SSL_VERIFY?process.env.sslVerify:true
      });
    }

    axios.defaults.httpsAgent = new https.Agent({rejectUnauthorized : false});
    if (process.env.AUTH_METHOD == 'PASSWORD'){
        // get auth cookie
        logInfo("Calling auth endpoint..");
        try{
          var auth = await axios.get(kongaddr + authEndpoint, headers);
          //ICAgLy8gLy8gZGVidWcgbW9kZQogICAgICAgICAgLy8gZm9yKGggaW4gYXV0aC5oZWFkZXJzWydzZXQtY29va2llJ10pewogICAgICAgICAgLy8gICBsb2dXYXJuKCJwcmludGluZyBjb29raWUgZm9yIGRlYnVnIG9ubHk6ICIgKyBhdXRoLmhlYWRlcnNbJ3NldC1jb29raWUnXVtoXSk7CiAgICAgICAgICAvLyB9
          headers.headers.Cookie=auth.headers['set-cookie'];
          //dont need the auth header anymore now that we have the cookie
          delete headers.headers["Authorization"];
        }catch(e){
          logError("Auth method failed. Please check credential passed in BASE64_UID_PWD or your connectivity to admin api");
          process.exit(1);
        }
    }
    
    if(command==5){
      var allRoutesChecked = false;
      var count=0;
      var pageSize=process.env.ROUTE_CHECK_PAGESIZE?process.env.ROUTE_CHECK_PAGESIZE:900;
    

      checkRouteConflictOnline( kongaddr, headers, count, pageSize);

      // await long time as process will exit as part of checkRouteConflictOnline when either a conflict is found or all routes checked.
      // the lines below is only circuit breaker, should not be hit.
      await new Promise(resolve => setTimeout(resolve, 1200000));
      logWarn("process exiting, not all routes checked. Routes checked : " + count);
      process.exit(0);
    }

    // test connectivity to admin API
    try
    {
        var ping = await axios.get(kongaddr + "/status", headers);
        logInfo('Kong Status: ' +  JSON.stringify(ping.data));
    }catch(e){
      logError('Ping to Admin API failed. Please check setting for your admin API or proxy. ' + e);
      process.exit(2);
    }

    // delete existing users?
    let delete_existing_users = true;
    if (process.env.FEATURE_DELETE_EXISTING_USERS) {
      delete_existing_users = process.env.FEATURE_DELETE_EXISTING_USERS === 'true'
      
    }
    // delete existing roles?
    let delete_existing_roles = true;
    if (process.env.FEATURE_DELETE_EXISTING_ROLES) {
      delete_existing_roles= process.env.FEATURE_DELETE_EXISTING_ROLES === 'true'
      
    }
    // create RBAC users?
    let createRBACUsers = process.env.FEATURE_CREATE_RBAC_USERS === "true";

    // delete existing RBAC users?
    let deleteExistingRBACUsers = true;
    if (process.env.FEATURE_DELETE_EXISTING_RBAC_USERS) {
      deleteExistingRBACUsers =
        process.env.FEATURE_DELETE_EXISTING_RBAC_USERS === "true";
    }
    // FEATURE_FORCE_WIPE_WORKSPACE true will wipe an worksapce even if there are entities present. USE WITH CAUTION.
    let featureForceWipeWorkspace = false;
    if (process.env.FEATURE_FORCE_WIPE_WORKSPACE) {
      featureForceWipeWorkspace= process.env.FEATURE_FORCE_WIPE_WORKSPACE === 'true'
     }

    // none of the below is needed if it's workspace wipe
    if(command==4){
      await wipeWorkspace(featureForceWipeWorkspace, kongaddr, headers);
      process.exit(0);
    }

   

    // get all top level dirs of config. Each subfolder will denote configs of one workspace
    
    const getDirectories = source =>fs.readdirSync(source, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
    var dirs=getDirectories(path.resolve(__dirname,configDir));

    for(dir in dirs)  // looping through folders
    {
      if(selectedWorkspace == "all" || selectedWorkspace.trim() == dirs[dir]){
        
        var workSpaceFilePath =  fs.existsSync(path.resolve(configDir,dirs[dir],workSpaceConfigName))? 
                                  path.resolve(configDir,dirs[dir],workSpaceConfigName): 
                                  path.resolve(configDir,rootWorkSpaceConfig);
        logInfo(' Workspace config for workspace ' + dirs[dir] + ' has been set to ' + workSpaceFilePath );
        var workSpaceConfig = yaml.load(fs.readFileSync( workSpaceFilePath), 'utf8');
        var userNameConfig = yaml.load(fs.readFileSync(path.resolve(configDir,dirs[dir],userNameConfigName), 'utf8'));
        var workspacedata = {'name': dirs[dir],'config': workSpaceConfig.config}
        var workSpaceRBACUsersConfig;
        var workspaceRBACUsersData;
        if (createRBACUsers) {
          workSpaceRBACUsersConfig =  yaml.load(fs.readFileSync(path.resolve(configDir,dirs[dir],workSpaceRBACUsersConfigName), 'utf8'));
          workspaceRBACUsersData = { name: dirs[dir], config: workSpaceRBACUsersConfig };
        }
        var res = '';

          try {
            res = await axios.get(kongaddr + workspaceEndpoint + '/' + workspacedata.name, headers);
            if (res.status == 200) {
              if(command==0 || command==1){
                // all or workspace + pluggin
                logWarn('Workspace ' + workspacedata.name + ' exists. Reapplying config ')
                res = await axios.patch(kongaddr + workspaceEndpoint + '/' + workspacedata.name, workspacedata, headers);
                logInfo('Workspace ' + workspacedata.name + ' config reapplied.');
                res= await applyRbac(res, kongaddr, headers, workspacedata.name, workSpaceConfig.rbac,delete_existing_roles, false);
                /**
                 * Onboard workspace scoped rbac users, only if createRBACUsers is set to true
                 */
                if (createRBACUsers) {
                  logWarn(
                    "FEATURE_CREATE_RBAC_USERS is set to true. This will create RBAC users in the workspace - " + workspacedata.name
                  );
                  res = await applyWorkspaceRBACUsers(
                  workspacedata.name,
                  workspaceRBACUsersData.config,
                  kongaddr,
                  headers,
                  deleteExistingRBACUsers
                  );
                }
                res= await applyPlugins(res, kongaddr,workspacedata.name,workSpaceConfig.plugins,headers, false );
              }
              if(command == 0 || command == 2) // users
               res = await applyUsers(res,kongaddr,workspacedata.name,headers,userNameConfig,false, delete_existing_users )
                
            }
    
          } catch (e) {
            if (e.response.status == 404) {
              if(command==0 || command==1){
                logInfo('Workspace ' + workspacedata.name + ' does not exist. Creating .... ')
                logInfo(kongaddr + workspaceEndpoint);
                try
                {
                  res = await axios.post(kongaddr + workspaceEndpoint, workspacedata, headers);
                  logInfo('Workspace ' + workspacedata.name + ' created.')
                  res= await applyRbac(res, kongaddr, headers, workspacedata.name, workSpaceConfig.rbac, delete_existing_roles);
                  /**
                   * Onboard workspace scoped rbac users, only if createRBACUsers is set to true
                   */
                  if (createRBACUsers) {
                    res = await applyWorkspaceRBACUsers(
                    workspacedata.name,
                    workspaceRBACUsersData.config,
                    kongaddr,
                    headers,
                    deleteExistingRBACUsers
                    );
                  }
                  res= await applyPlugins(res, kongaddr,workspacedata.name,workSpaceConfig.plugins,headers );
                }catch(e){
                   logError(e);
                }
              if(command == 0 || command == 2) // users
                res = await applyUsers(res,kongaddr,workspacedata.name,headers,userNameConfig, true,delete_existing_users )
              }
            } else {
              logError(e.stack);
            }
          }
        }
        else{ logWarn('Skipping workspace ' + dirs[dir])}
      }

      // Add groups. These are cross workspaces and roles.
      if( command == 3){
            
        res= await applyGroups(configDir, path, kongaddr, headers, res);

          }

  // log out
  if (process.env.AUTH_METHOD == 'PASSWORD'){
    // get auth cookie
    logInfo("Calling auth endpoint to logout in 5 seconds...");
    try{
      await new Promise(resolve => setTimeout(resolve, 5000));
      var logOut = await axios.delete(kongaddr + authEndpoint + "?session_logout=true", headers);
      logInfo( " Logout complete. System exiting..") ;
     
    }catch(e){
      logError("Logout failed. It's likely that user wasn't fully logged in at this point" + e);
      process.exit(1);
    }
}
  
  } catch (e) {
    logError(e.stack);
  }
   
})();

/**
 * Creates and manages RBAC users in a specified Kong workspace.
 *
 * @param {string} workspaceName - The name of the workspace where RBAC users will be managed.
 * @param {Array<Object>} usersConfig - An array of user configuration objects, each containing a `name` and `roles`.
 * @param {string} kongaddr - The base address of the Kong Admin API.
 * @param {Object} headers - The headers to be used for the API requests, typically containing authentication tokens.
 * @param {boolean} deleteExistingRBACUsers - A flag indicating whether to delete existing users not present in the configuration.
 *
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 *
 * @throws {Error} - Throws an error if there is an issue processing the workspace RBAC users.
 *
 * @example
 * const workspaceName = 'exampleWorkspace';
 * const usersConfig = [
 *   { name: 'user1', roles: ['role1', 'role2'] },
 *   { name: 'user2', roles: ['role3'] }
 * ];
 * const kongaddr = 'http://localhost:8001';
 * const headers = { Authorization: 'Bearer token' };
 * const deleteExistingRBACUsers = true;
 *
 * applyWorkspaceRBACUsers(workspaceName, usersConfig, kongaddr, headers, deleteExistingRBACUsers)
 *   .then(() => console.log('RBAC users managed successfully'))
 *   .catch((error) => console.error('Error managing RBAC users:', error));
 */
async function applyWorkspaceRBACUsers(workspaceName, usersConfig, kongaddr, headers, deleteExistingRBACUsers) {  
  try {
    let currentUsers = [];
    try {
      const response = await axios.get(`${kongaddr}/${workspaceName}/rbac/users`, headers);
      currentUsers = response.data.data.map((user) => user.name);
    } catch (err) {
      logError(`Failed to fetch existing users in workspace '${workspaceName}':`, err.response?.data || err.message);
      return;
    }
    const configUserNames = usersConfig.map((user) => user.name);
    logInfo(`Current RBAC users in workspace '${workspaceName}': ${currentUsers.join(", ")}`);
    // Iterate over each user in the configuration
    for (const user of usersConfig) {
      const userEndpoint = `${kongaddr}/${workspaceName}/rbac/users/${user.name}`;
      let userExists;
      // Check if the user already exists
      try {
        userExists = await axios.get(userEndpoint, headers);
      } catch (err) {
        userExists = null;
      }
      if (!userExists || userExists.status !== 200) {
        try {
          const userToken = uuidv4(); // Generate a new UUID for the user_token          
          await axios.post(
            `${kongaddr}/${workspaceName}/rbac/users`,
            { name: user.name, user_token: userToken },
            headers
          );
          logInfo(`RBAC user '${user.name}' created in workspace '${workspaceName}'.`);          
        } catch (error) {
          logError(
            `Failed to create RBAC user '${user.name}' in workspace '${workspaceName}':`,
            error.response?.data || error.message
          );
          continue; // Skip to the next user if creation fails
        }
      } else {
        logWarn(`RBAC user '${user.name}' already exists in workspace '${workspaceName}'.`);
      }
      // Assign roles to the user
      for (const role of user.roles) {
        try {
          await axios.post(
            `${kongaddr}/${workspaceName}/rbac/users/${user.name}/roles`,
            { roles: role },
            headers
          );
          logInfo(`Role '${role}' assigned to user '${user.name}' in workspace '${workspaceName}'.`);
        } catch (error) {
          logError(
            `Failed to assign role '${role}' to RBAC user '${user.name}' in workspace '${workspaceName}':`,
            error.response?.data || error.message
          );
        }
      }
    }
    // Delete users not in the configuration if deleteExistingRBACUsers is true
    if (deleteExistingRBACUsers) {
      if (workspaceName === "default") {
        logError(
          "Deleting RBAC users in the 'default' workspace is strongly discouraged. Use the admin API or UI for manual deletion."
        );
        return;
      }
      const usersToDelete = currentUsers.filter((user) => !configUserNames.includes(user));
      for (const user of usersToDelete) {
        try {
          await axios.delete(`${kongaddr}/${workspaceName}/rbac/users/${user}`, headers);
          logWarn(`RBAC user '${user}' deleted from workspace '${workspaceName}' as it is not in the configuration.`);
        } catch (error) {
          logError(
            `Failed to delete RBAC user '${user}' from workspace '${workspaceName}':`,
            error.response?.data || error.message
          );
        }
      }
    }    
  } catch (error) {
    logError("Error processing workspace RBAC users:", error.message);
  }
}

async function applyRbac(res, kongaddr, headers, workspacename, rbac,  delete_existing_roles, isNew=true,) {

  
  logInfo("Applying roles now for workspace " + workspacename);
  
  if(!isNew && delete_existing_roles) // existing workspace but not default.. delete the current role. 
  {
    
    
    logWarn("Deleting current roles. If you do not want this set FEATURE_DELETE_EXISTING_ROLES to false and run again. Execution will pause for few seconds to allow stop. Kong strongly recommends not to delete existing roles in 'default' workspace using this tool");
    await new Promise(resolve => setTimeout(resolve, 8000));
    if (workspacename == "default"){
      logError("Kong strongly recommends not to delete existing roles in 'default' using this tool");
      process.exit(2);
    }
    var currentRoles = await axios.get(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint, headers);
    for (var oldRole of currentRoles.data.data) {
      res = await axios.delete(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint + '/' + oldRole.name, headers);
    }
  }

    try{
    for (var roleDetail of rbac) {
      var roledata = {
        'name': roleDetail.role
      };
      res = await axios.post(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint, roledata, headers);
      for (var permission of roleDetail.permissions) {
        res = await axios.post(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint + '/' + roleDetail.role + permissionsEndpoint, permission, headers);
        logInfo( "Permission " + JSON.stringify(permission) + ' added for role ' + roleDetail.role + ' in workspace '  + workspacename);
      }
    }
    logInfo('all roles and permissions successfully applied for the workspace ' + workspacename );
    }catch(e){
      if (e.response.status == 409) {
        logError("role or permission exists. Applying roles failed.  if FEATURE_DELETE_EXISTING_ROLES set to false then only keep new roles in the config. If needed, delete existing roles from UI or using admin API. " + e.response.data.message);

      }else{
          logError(e.stack);
        }

    }
}




async function applyPlugins(res, kongaddr, workspacename, plugins, headers, isNew=true) {
  try {

   if(!isNew){ // existing workspace.
   
    var currentPlugins = await axios.get(kongaddr + '/' + workspacename + pluginsEndpoint, headers);
      for (var oldPlugin of currentPlugins.data.data) {
        if (oldPlugin.route == null && oldPlugin.service == null) {
          res = await axios.delete(kongaddr + '/' + workspacename + pluginsEndpoint + '/' + oldPlugin.id, headers);
        }else{
          logError('plugin ' + oldPlugin.name + ' has service or route associated with it. can not be deleted');
        }
      }
   
   }

    
    if (plugins) {
      for (var plugin of plugins) {
        res = await axios.post(kongaddr + '/' + workspacename + pluginsEndpoint, plugin, headers);
      }
  }

  logInfo('plugins has been successfully applied for the workspace ' + workspacename );
    
  } catch (e) {
    logError('plugin deployment failed: ' + e.stack);
  }
  return res;
}



async function applyUsers(res, kongaddr, workspacename,  headers, users, isnew, delete_existing_users) {
  //logWarn('DO NOT USE THIS IF YOUR KONG INSTANCE IS OIDC ENABLED. WAITING 7 seconds for admin user to stope the execution...');
  //wait new Promise(resolve => setTimeout(resolve, 7000));
  logInfo('starting to add users in the workspace ' + workspacename)
  for (var user of users) {
    var userdata = {"username": user.name, "email" : user.email, "rbac_token_enabled": false};
   
    try {
      res = await axios.get(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name, headers);
      if (res.status == 200) {//user exists
        logWarn(' User ' + user.name + ' exists in ' +  workspacename)
        res = await axios.patch(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name, user, headers);
        logInfo(' For user ' + user.name + ' config reapplied in ' + workspacename);
 
      }
    } catch (e) {
      if (e.response.status == 404) {
        // add new user
        try{
          res = await axios.post(kongaddr + '/' + workspacename + adminEndpoint , userdata, headers);
        }catch(e){
          if(e.response.status == 409){
            logWarn(' User ' + user.name + ' exists in another workspace' )
          }else{ logError(e.stack + " Unable to add users. Please check config.");}
        }
        logInfo(' User ' + user.name + ' added in ' + workspacename);
      } else {
        logError(e.stack + " Unable to add users. Please check config.");
      }
    }
    
      // add new roles
      for (var role of user.roles) {
        try{
          res = await axios.post(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name + rolesEndpoint, {"roles" : role}, headers);
          logInfo(' Role ' + role + ' added for user ' + user.name  + ' in ' + workspacename);
          
        }catch(e){
          if(e.response.data.code == 3) { //role exists
            logWarn(' Role ' + role + ' already present for user ' + user.name + ' in ' + workspacename);
          }else if(e.response.data.message)
            logError(e.response.data.message);
          else{ logError(e);}
        }
      }



    
  }
    if(delete_existing_users){
      //in the end remove users not on the config
      //all admins in the workspace
      try
      {
        if (workspacename == "default"){
          logError("Kong strongly recommends not to delete existing users in 'default' using this tool. Please use admin API or manager UI to delete users if needed in default workspace");
          process.exit(2);
        }
        logWarn('FEATURE_DELETE_EXISTING_USERS is set to true, so checking for users that are in manager but not in users list. Set this to false if you do not want it to happen.');
        var currentAdminUsers = await axios.get(kongaddr + '/' + workspacename + adminEndpoint , headers)
        var currentAdmins= currentAdminUsers.data.data.map(m => m.username);
        //check if any not in list
        var userNames = users.map(m => m.name);
        var adminsNotInList = currentAdmins.filter(u =>! userNames.includes(u));

        for (var admin of adminsNotInList) {
          res = await axios.delete(kongaddr + '/' + workspacename + adminEndpoint + '/' + admin , headers);
          logWarn(' User ' + admin + ' does not exist in users.yaml so is being deleted in workspace ' + workspacename)
        }
      }catch(e){
        logError(' Deletetion of old roles failed. ' + e )
      }
    }
  
  return res;
}

async function applyGroups(configDir, path, kongaddr, headers, res){
  logInfo( " Adding groups in manager. It's important that you have created the workspaces and associated roles already, otherwise this will not work");
  var groupConf = yaml.load(fs.readFileSync(path.resolve(configDir,groupConfig), 'utf8'));
 
    for(var groupInfo of groupConf){
      let groupId;
      try{
        var groupData = { "name" : groupInfo.group_name, "comment": groupInfo.group_comment };
        res = await axios.post(kongaddr + groupEndpoint, groupData, headers);
        logInfo('Group ' + groupInfo.group_name + " created")
        }catch(e){
            if(e.response.status == 409){
              try{
                logWarn('Group ' + groupInfo.group_name + " already exists")
                groupId  = (await axios.get(kongaddr + groupEndpoint + "/" + groupInfo.group_name, headers)).data.id;
                // delete current roles from group
                var groupRoles = await axios.get(kongaddr + groupEndpoint + "/" +  groupInfo.group_name +  rolesEndpoint , headers);
                for(var role of groupRoles.data.data){
                  logInfo("role " + role.rbac_role.name + " exists for workspace with id : " +  role.workspace.id );
                }
              }catch(ex){logError(ex)};

            }else{logError(e)}
        }
        // now add new roles
        

          
          // get group id. By this time, the group shall exist.
          if(!groupId)   
            groupId = (await axios.get(kongaddr + groupEndpoint + "/" + groupInfo.group_name, headers)).data.id;
          for(var role of groupInfo.roles){
            try{
              // get workspace that matches with the name in yaml groups.roles.workspace.
                var wkId = null;
                try{
                  var wk = await axios.get(kongaddr + workspaceEndpoint  + "/" + role.workspace, headers);
                  wkId = wk.data.id;
                }catch{
                  if(e.response.status == 404)
                  {
                    logError("workspsce " + role.workspace + " in group " + groupInfo.group_name + " not found." );
                  }
                  logError(e.stack);
                  process.exit(1);
                }


                // var wk = workspaces.data.data.filter( f => f.name == role.workspace)[0];
                // get role that matches with the name in yaml groups.roles.role.
                var wkRoles = await axios.get(kongaddr  + "/" + role.workspace + rbacEndpoint + rolesEndpoint , headers);
                var roleId = wkRoles.data.data.filter( r => r.name == role.role)[0].id;
                // create role data
                var roleData = { "workspace_id": wkId , "rbac_role_id" : roleId}
                res = await axios.post( kongaddr + groupEndpoint + "/" + groupId + rolesEndpoint, roleData , headers);
                logInfo (' Role created in group ' + groupInfo.group_name + " mapping workspace " + role.workspace + " and role " + role.role  );
              }catch(e){
                // Awareness. Group-roles post throws a 400 bad request instead of 409 conflict when records exists.
                if(e.response.data.message)
                {
                  if (!e.response.data.message.includes("primary key violation on key"))
                      logError(e.response.data.message);
                  else {
                    //Safe to ignore. Just that the role/worksapce combination exists
                    //logError(e.response.data.message);
                    }
                  
                }
                else
                  logError(e);
            
            }
          }
        

 }
}

async function  getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isDirectory();
  });
}

// logger wrapper. 
async function  logInfo  (logtext){
    if (logtext){
      try{
        //var lib = require(log_lib);
        log_lib.info(logtext);
        }
      catch(e){
          console.info(logtext)
      }

    }
  }
  async function  logWarn  (logtext){
    if (logtext){
      try{
            //var lib = require(log_lib);
            log_lib.warn(logtext);
        }
      catch(e){
          console.warn(logtext)
      }

    }
  }
  async function  logError (logtext){
    if (logtext){
      try{
            //var lib = require(log_lib);
            log_lib.error(logtext);
        }
      catch(e){
          console.error(logtext)
      }

    }
  }

  async function parseProxyNoAuth(proxyString){

    try
    {
      //example: http://proxyhost:port
      let proxyParts = proxyString.split("//");
      let protocol = proxyParts[0];
      let hostParts = proxyParts[1].split(":");
      let host =hostParts[0];
      let port =hostParts[1];
      var proxy =  { "protocol" : protocol, "host": host, "port" : port };
      return proxy
    }catch(e){
      logError("possible malformed proxy setting. " + e );
    }


  }

  async function wipeWorkspace(featureForceWipeWorkspace, kongaddr, headers){

    let wipeWorkspaceName = process.argv[3]?process.argv[3]:"default";
    if(wipeWorkspaceName=="default"){
      logError("please pass a non default workspace name");
      process.exit(0);
    }
    let useForce = process.argv[4]?process.argv[4]=='true'?true:false:false;
    if(!useForce){
      logWarn("This will delete the workspace, if it's empty, barring dev portal files. This program will halt for some time to allow manual termination");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }else{
      if (!featureForceWipeWorkspace){
        logError("FEATURE_FORCE_WIPE_WORKSPACE must be set to true for this to be allowed");
        process.exit(0);
      }else{
        logWarn("This will delete the workspace, even if it's not empty. Proceeding with extreme caution. This program will halt for some time to allow manual termination");
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }
    var nothingDeleted = false;
    //if something was successfully deleted in the last loop, loop again and continue the deletion process
    //if nothing was deleted during a run, we give up all hope and halt the program
    while (nothingDeleted == false) {
      nothingDeleted = true;
      try{
        // checking what's in the workspace
        var meta = await axios.get(kongaddr + workspaceEndpoint  + "/" + wipeWorkspaceName + metaEndpoint , headers);
        let cancelWipe = false;
  
        logWarn('current values : ---' + JSON.stringify(meta.data.counts));
        for (const [key, value] of Object.entries(meta.data.counts)) {
          if((key != 'files') && (value != 0)  && (!useForce)){
            logError('entity ' + key + ' are not empty');
            cancelWipe = true;
          }
        }
        if(cancelWipe){
          logError( " Workspace " + wipeWorkspaceName + " can't be deleted as it's not empty");
          process.exit(0);
        }
  
        for (const [key, value] of Object.entries(meta.data.counts)) {
          // start deleting entities now
          if(value != 0){
            var set = key;
            if(set=="basicauth_credentials") set = "basic-auths";
            let nextUrl = kongaddr   + "/" + wipeWorkspaceName + "/" + set.replace("_", "/");
            
            while (nextUrl){
              logInfo("NEXT-URL: " + nextUrl);
              var entities = await axios.get(nextUrl , headers);
              logInfo(set + " COUNT " + entities.data.data.length);
              for(var e in entities.data.data){
                logInfo("trying to delete " + set + " with id " +  entities.data.data[e].id)
                try {
                  await axios.delete(kongaddr   + "/" + wipeWorkspaceName + "/" + set.replace("_", "/") + "/" + entities.data.data[e].id , headers);
                  logWarn(set + " with id " +  entities.data.data[e].id + " deleted")
                  nothingDeleted = false;
                } catch(error) {
                  logError(set + " with id " +  entities.data.data[e].id + " not deleted")
                }
              }
              nextUrl=entities.data.next?kongaddr   + entities.data.next:null;
          }
            logWarn("All " + set + " deleted");
          }
        }
        var metaEnd = await axios.get(kongaddr + workspaceEndpoint  + "/" + wipeWorkspaceName + metaEndpoint , headers);
        logWarn('just before delete values : ---' + JSON.stringify(metaEnd.data.counts));
        logWarn("Workspace is empty now. Ready for deletion");
        await axios.delete(kongaddr + workspaceEndpoint  + "/" + wipeWorkspaceName , headers);
        logWarn("Workspace " + wipeWorkspaceName + " wiped" );
        //if we reached this point, the workspace was removed completely, and we can escape the while loop
        break;
      }catch(e){
        logError("error wiping workspace. " + e.stack );
      }
    }
  }

  async function checkRouteConflictOnline(kongaddr,headers, count, pageSize)
  {
    try{
      logInfo( "this will check all existing routes acorss all workspaces and compare them with inso config to ensure that will not be any conflicting route.");
      //var count = 0;
      if(!process.argv[3]){
        logError("Kong Conf file path not supplied");
        process.exit(1);
      }

      var workspaceNameToSkip = process.argv[4]?process.argv[4]:""; 
      var specFilePath = path.resolve(process.argv[3]);
      logInfo("Kong conf file path set to " + specFilePath);
      var conf = yaml.load(fs.readFileSync(specFilePath, "utf8"));
    }catch(e){            
      logError(e.stack);
      process.stdout.write("0");
      process.exit(1);
    }
   // get all worksapces
   try{
      var totalRoutes=0;
      logInfo("workspace Name To Skip = " + workspaceNameToSkip);
      var all =  (await axios.get(kongaddr + workspaceEndpoint , headers)).data.data;
      for(var wk of all){
      // var allDone = new Promise((resolve, reject) => {
      // all.forEach(async(wk, i, a)=>{
        try{
          // logInfo("workspace name = " + wk.name)
          if(wk.name != workspaceNameToSkip){
            // logInfo("workspace Name " + wk.name);
            let meta = await axios.get(kongaddr + workspaceEndpoint  + "/" + wk.name + metaEndpoint , headers);
            logInfo('Total number of routes in: ' + wk.name + ' = ' +   meta.data.counts.routes );
            totalRoutes = totalRoutes + meta.data.counts.routes;

            // current workspace route check will be skipped, as that will allow devs to update current route. 
            //Deck Sync will take care of the update.
            let nextUrl = kongaddr + "/" + wk.name +  routeEndpoint + "?size=" + pageSize;
            // logInfo(nextUrl);
            while(nextUrl){
              // logInfo("just before call to " + nextUrl);
              var routes = (await axios.get(nextUrl, headers)).data;
              // logInfo("routes count for url: " + nextUrl + " : " + routes.data.length );
              // routes.data.forEach(async(r,index,array)=>{
                routes.data.forEach((r)=>{
                // conf.services[0].routes.forEach( async(cr) => {
                conf.services[0].routes.forEach( (cr) => {
              
                      if((isMatch(r.paths, cr.paths)) &&
                        (isMatch(r.hosts, cr.hosts)) &&
                        (isMatch(r.methods, cr.methods )) &&
                        (isMatch(r.headers, cr.headers))) {
                  
                      
                        logError( "Route conflict: \n Config route: " + JSON.stringify(cr) + "\n conflcited with  \n" + JSON.stringify(r) + "\n in workspace " + wk.name) ;
                        process.stdout.write("0");
                        process.exit(1);
                      }
                      else{
                        ///
                      }
                  // logInfo("route checked " + r.name + " workspace " + wk.name);
                  
                })
                // logInfo("route number checked " + ++count);
                // logInfo('count ' + ++count);
                ++count

              });
              // logInfo(nextUrl);
              nextUrl=routes.next?kongaddr +  "/" + wk.name + routes.next  + "&size=" + pageSize:null;
              
            }
          }
          
          }catch(e){
            logError(e.stack);
            process.stdout.write("0");
            process.exit(1);
          }
          // await new Promise(resolve => setTimeout(resolve, 7000));
          // if (totalRoutes == count) {

          //   logInfo("Number of total workspaces: " + a.length + ". Number of total routes: " + totalRoutes);
            
          //   resolve();
          // }
 
 
 
   }
  // });
  //     });

      // allDone.then(() => {
        logInfo('All routes checked (' +  count + ' ), no conflict found!');
        // logInfo('All routes checked. no conflict found!');
        process.stdout.write("retuncode:no-conflict");
        process.exit(0);
    // });
  }catch(e){
    logError(e.stack);
    process.stdout.write("0");
    process.exit(1);

  }
}


 function isMatch(superset,subset){

  // both sets are either empty or null. so match
  if((!Array.isArray(superset) || superset.length==0) && (!Array.isArray(subset) || subset.length==0)) 
    return true;
  //one of them is empty or null . but not both
  else if((!Array.isArray(superset) || superset.length==0) || (!Array.isArray(subset) || subset.length==0))
    return false;
  // true if at least one element match (safer option), false if none matches
    return superset.some( p => subset.includes(p))
}



   
   
    
   
  
