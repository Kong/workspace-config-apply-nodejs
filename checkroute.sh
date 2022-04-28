#!/bin/bash


KONG_ADMIN_API=${1:-http://127.0.0.1:8001}
export KONG_ADDR=$KONG_ADMIN_API

TOKEN=${2:-password}
export ADMIN_TOKEN=$TOKEN



FILE=${3:-kong.yaml}

WK=${4:-''}


export AUTH_METHOD=RBAC

now=$(date)
echo "Route validation starting: $now"
# v=$(node configurator.js validate-route config/sample_kong_conf_path_match)
# # v=$(node configurator.js validate-route config/sample_kong_conf_no_match)
v=$(node configurator.js validate-route $FILE $WK)
echo "$v"
then=$(date)
echo "Route validation finished: $then"
successcode="retuncode:no-conflict"
if [[ "$v" == *"$successcode"* ]]; then
  echo "no route conflict. do stuff"
fi