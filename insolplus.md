**insoplus**

A node js module for for add on functions on top of inso.

What the helper function can do.

1. Remove upstreams when they are not needed.
2. Add Route heders for either specific or for all routes.
3. Add Route host for either specific or for all routes. 
4. Check conflicting routes

**Install**  
Save this localally and either add this file in the API repository or call using the full path.
Before first use, need to call npm install that will install the libraries/node modules.

N.B. InsoPlus will only work if there's one service on the kong.yaml.

**Usage**

To add/remove elements from Kong conf

**Step 1:** Run inso generate config . This will generate the output file, normally named as kong.yaml.

**Step 2:** Now run insoplus for additional configuration. This will generate a new yaml named insoplus_kong.yaml

<span style="color:blue">

<i>

node insoplus.js sample_kong_conf remove-upstream ( this will remove upstream object and replace service.host with the first target found in upstream)  

node insoplus.js sample_kong_conf add-route-header x-service-name:myservice ( this will add a route header called x-service-name with value of myservice for all routes found in service)  

node insoplus.js sample_kong_conf add-route-header x-service-name:myservice route-name  ( this will add a route header for the route named route-name)  

node insoplus.js sample_kong_conf add-route-host host-name ( this will add a route host for all routes found in service)  

node insoplus.js sample_kong_conf add-route-host host-name route-name ( this will add a route host for the route named route-name)  

</i>

</span>

**Step 3**: Run Deck Sync to upload the new config insoplus_kong.yaml to Kong Manager.






