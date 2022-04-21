#!/bin/bash
export ADMIN_TOKEN=admin

export KONG_ADDR=http://admin.example.com:8001

export AUTH_METHOD=RBAC

now=$(date)
echo "Route validation starting: $now"
v=$(node configurator.js validate-route config/sample_kong_conf_no_match)
echo "$v"
then=$(date)
echo "Route validation finished: $then"
successcode="retuncode:no-conflict"
if [[ "$v" == *"$successcode"* ]]; then
  echo "no route conflict. do stuff"
fi