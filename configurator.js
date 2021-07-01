const yaml = require('js-yaml');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const https = require("https");
const path= require('path');

const workspaceEndpoint = '/workspaces';
const rbacEndpoint = '/rbac';
const userEndpoint='/users';
const rolesEndpoint = '/roles';
const permissionsEndpoint = '/endpoints';
const adminEndpoint = '/admins';
const pluginsEndpoint = '/plugins';
const workSpaceConfigName = "workspace.yaml";
const pluginConfigName = "plugins.yaml";
const userNameConfigName = "users.yaml";
  

(async () => {
  try {
    var workspacename;
    var rolename;
    var workspaceConfig;
    
    /*
    Command line argument
    0 Default (Add all).
    1 Add Workspace + plugin.
    2 Add Users only.
    */
   // With Node Js first command is node and second is the app file name. Any additional command is index position 2.

    console.log(    "Command line argument \n 0 Default (Add all). \n 1 Add Workspace + plugin. \n 2 Add Users only.");
    let command = process.argv[2]?process.argv[2]:0;
    console.log('Argument: ' + command );
    
    //config  directory is either hard coded to ./config or passed in env variable.
      let configDir = './config/';
    if (process.env.CONFIG_DIR) {
      configDir = process.env.CONFIG_DIR;
    }
    // admin token passed in env variable
    var headers = {
      headers: {
        'Kong-Admin-Token': process.env.ADMIN_TOKEN,
        'validateStatus': false
      }
    };

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

    // get all top level dirs of config. Each subfolder will denote configs of one workspace
    
    const getDirectories = source =>fs.readdirSync(source, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
    var dirs=getDirectories(path.resolve(__dirname,configDir));

    for(dir in dirs)
    {
      // looping through folders
      var workSpaceConfig = yaml.load(fs.readFileSync(path.resolve(configDir,dirs[dir],workSpaceConfigName), 'utf8'));
      var userNameConfig = yaml.load(fs.readFileSync(path.resolve(configDir,dirs[dir],userNameConfigName), 'utf8'));
      
      var workspacedata = {'name': dirs[dir],'config': workSpaceConfig.config}
      var res = '';

        try {
          res = await axios.get(kongaddr + workspaceEndpoint + '/' + workspacedata.name, headers);
          if (res.status == 200) {
            if(command==0 || command==1){
              // all or workspace + pluggin
              console.log('Workspace ' + workspacedata.name + ' exists. Reapplying config ')
              res = await axios.patch(kongaddr + workspaceEndpoint + '/' + workspacedata.name, workspacedata, headers);
              console.log('Workspace ' + workspacedata.name + ' config reapplied.');
              res= await applyRbac(res, kongaddr, headers, workspacedata.name, workSpaceConfig.rbac,false);
              res= await applyPlugins(res, kongaddr,workspacedata.name,workSpaceConfig.plugins,headers, false );
            }
            if(command == 0 || command == 2) // users
              applyUsers(res,kongaddr,workspacedata.name,headers,userNameConfig,false )
              
          }
  
        } catch (e) {
          if (e.response.status == 404) {
            if(command==0 || command==1){
              console.log('Workspace ' + workspacedata.name + ' does not exist. Creating .... ')
              res = await axios.post(kongaddr + workspaceEndpoint, workspacedata, headers);
              console.log('Workspace ' + workspacedata.name + ' created.')
              res= await applyRbac(res, kongaddr, headers, workspacedata.name, workSpaceConfig.rbac);
              res= await applyPlugins(res, kongaddr,workspacedata.name,workSpaceConfig.plugins,headers );
            if(command == 0 || command == 2) // users
              applyUsers(res,kongaddr,workspacedata.name,headers,userNameConfig )
            }
          } else {
            console.log(e.stack);
          }
        }

      }
      


    
  
  
  } catch (e) {
    console.log(e.stack);
  }
  
})();

async function applyRbac(res, kongaddr, headers, workspacename, rbac, isNew=true) {

  

  if(!isNew) // existing workspace.
  {
    var currentRoles = await axios.get(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint, headers);
    for (var oldRole of currentRoles.data.data) {
      res = await axios.delete(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint + '/' + oldRole.name, headers);
    }
  }

  
    for (var roleDetail of rbac) {
      var roledata = {
        'name': roleDetail.role
      };
      res = await axios.post(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint, roledata, headers);
      for (var permission of roleDetail.permissions) {
        res = await axios.post(kongaddr + '/' + workspacename + rbacEndpoint + rolesEndpoint + '/' + roleDetail.role + permissionsEndpoint, permission, headers);
      }
    }
    console.log('all roles and permissions successfully applied for the workspace ' + workspacename );

}




async function applyPlugins(res, kongaddr, workspacename, plugins, headers, isNew=true) {
  try {

   if(!isNew){ // existing workspace.
   
    var currentPlugins = await axios.get(kongaddr + '/' + workspacename + pluginsEndpoint, headers);
      for (var oldPlugin of currentPlugins.data.data) {
        if (oldPlugin.route == null && oldPlugin.service == null) {
          res = await axios.delete(kongaddr + '/' + workspacename + pluginsEndpoint + '/' + oldPlugin.id, headers);
        }else{
          console.log('plugin ' + oldPlugin.name + ' has service or route associated with it. can not be deleted');
        }
      }
   
   }

    
    if (plugins) {
      for (var plugin of plugins) {
        res = await axios.post(kongaddr + '/' + workspacename + pluginsEndpoint, plugin, headers);
      }
  }

  console.log('plugins has been successfully applied for the workspace ' + workspacename );
    
  } catch (e) {
    console.log('plugin deployment failed: ' + e.stack);
  }
  return res;
}



async function applyUsers(res, kongaddr, workspacename,  headers, users) {
  console.log('starting to add users in the workspace ' + workspacename)
  for (var user of users) {
    var userdata = {"username": user.name, "email" : user.email};
   
    try {
      res = await axios.get(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name, headers);
      if (res.status == 200) {//user exists
        console.log(' User ' + user.name + ' exists in' +  workspacename)
        res = await axios.patch(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name, user, headers);
        console.log(' For user ' + user.name + ' config reapplied in ' + workspacename);
 
      }
    } catch (e) {
      if (e.response.status == 404) {
        // add new user
        res = await axios.post(kongaddr + '/' + workspacename + adminEndpoint , userdata, headers);
        console.log(' User ' + user.name + ' added in' + workspacename);
      } else {
        console.log(e.stack);
      }
    }
    
      // add new roles
      for (var role of user.roles) {
        try{
          res = await axios.post(kongaddr + '/' + workspacename + adminEndpoint + '/' + user.name + rolesEndpoint, {"roles" : role}, headers);
          console.log(' Role ' + role + ' added for user ' + user.name  + ' in ' + workspacename);
          
        }catch(e){
          if(e.response.data.code == 3) { //role exists
            console.log(' Role ' + role + ' already present for user ' + user.name + ' in ' + workspacename);
          }else{ console.log(e);}
        }
      }



    
  }
  
    //in the end remove users not on the config
    //all admins in the workspace
    try
    {
      var currentAdminUsers = await axios.get(kongaddr + '/' + workspacename + adminEndpoint , headers)
      var currentAdmins= currentAdminUsers.data.data.map(m => m.username);
      //check if any not in list
      var userNames = users.map(m => m.name);
      var adminsNotInList = currentAdmins.filter(u =>! userNames.includes(u));

      for (var admin of adminsNotInList) {
        res = await axios.delete(kongaddr + '/' + workspacename + adminEndpoint + '/' + admin , headers);
        console.log(' User ' + admin + ' does not exist in users.yaml so is being deleted in workspace ' + workspacename)
      }
    }catch(e){
      console.log(' Deletetion of old roles failed. ' + e )
    }
  
  return res;
}



async function  getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isDirectory();
  });
}

