const yaml = require('js-yaml');
const fs = require('fs');
// require('dotenv').config();
const path= require('path');
const { Console } = require('console');



let command = process.argv[3]?process.argv[3]:'';
let spec = process.argv[2]?process.argv[2]:'';

if(spec==''){
    console.log('Must pass the Kong config as first argument');
    process.exit(1);
}

if(command==''){
    console.log('Must pass the command as second argument');
    process.exit(1);
}

var specPath = path.resolve("./",spec); 
console.log('Kong conf yaml path ' + specPath);

try
{
    var conf = yaml.load(fs.readFileSync(specPath, "utf8"));

    switch(command)
    {
        case 'remove-upstream':
            removeUpstream(conf);
            break;
        case 'add-route-header':
            addRouteHeader(conf);
            break;
        case 'add-route-host':
                addRouteHost(conf);
                break;
        default:
            console.log("No valid option is selected. Valid options are one of '\n' remove-upstream '\n' add-route-header '\n' add-route-host '\n' check-route-conflict");
            process.exit(1);
    } 
}catch(e)
{
    console.error(e);
    process.exit(1);
}

 

//console.log(yaml.dump(conf));
// console.log(path.resolve("./", 'insoplus_' +spec));
var fileName = path.resolve(path.dirname(specPath),'altered_' +path.basename(specPath));
fs.writeFileSync(fileName, yaml.dump(conf));
console.log("new config file is written in " + fileName );


function removeUpstream(conf)
 {
    
    console.log( "this will remove all upstream and associated targets and replace service.host with the first target. Only use this if you have a load balancer pointing to the target");
    if(!conf.upstreams){
        console.log( "No upstreams present");
        process.exit(1);

    } 
    if(conf.upstreams.length==0){
        console.log( "No upstreams present")
        process.exit(1);
    }

    if(conf.upstreams[0].targets.length==0){
        console.log( "No target present in top upstream")
        process.exit(1);
    }

    var firstTarget = conf.upstreams[0].targets[0].target;
    console.log("first target " + firstTarget);
    //take out port if any
    conf.services[0].host = firstTarget.split(":")[0];
    delete conf.upstreams;


 
}

function addRouteHeader(conf){

    var header = process.argv[4]?process.argv[4]:'';

    if(header==''){
    console.log("expecting header name and value as 3rd argument, separated by colon");
    process.exit(1);
    }
    var headerValues = header.split(":");
    if(headerValues.length!=2){
    console.log("expecting header name and value as 3rd argument, separated by colon. For example x-service-name:myservice");
    process.exit(1);
    }

    var routeName = process.argv[5]?process.argv[5]:'';
    if(routeName!=''){
    console.log("Route Name supplied. New header " + header + " will only be added for route " + routeName);
    
    }else{
    console.log("No route Name supplied. New header " + header + " will be added for all routes for first service");
    }




    conf.services[0].routes.map(x=>addHeaders(x, headerValues[0], headerValues[1], routeName));

    function addHeaders(route, headerName, headerValue, routeName) {
        if(routeName ==  '' || routeName == route.name){
            route.headers = { [headerName]: [headerValue]} ;
        }
        return route;
    }
}

function addRouteHost(conf){
    var route_host = process.argv[4]?process.argv[4]:'';
 
    if(route_host==''){
     console.log("expecting route host name as 3rd argument");
     process.exit(1);
    }

 
    var routeName = process.argv[5]?process.argv[5]:'';
    if(routeName!=''){
     console.log("Route Name supplied. New host " + route_host + " will only be added for route " + routeName);
     
    }else{
     console.log("No route Name supplied. New host " + route_host + " will be added for all routes for first service");
    }
 
     conf.services[0].routes.map(x=>addHost(x, route_host, routeName));
 
     function addHost(route, route_host, routeName) {
         if(routeName == '' || routeName == route.name){
             route.host = route_host ;
         }
         return route;
   }
}




console.log("program exiting now."); process.exit(1);

    


 
