#!/bin/sh

#This script prepares the latest version of the user
#interface to be deployed as a static "training" site.

#BE SURE TO MAKE A BACKUP OF THE CURRENT TRAINING SITE
# using the "training-site-create-backup.sh" script
# (will need to check out the "training" branch.)

#This script should be run from the "cdph" branch.

cd ../../
mkdir training
cd training

# Copy latest version of web site files to the "training" subdirectory
cp ../dist/index.html .
mkdir css
cp -R ../dist/css/* css
mkdir scripts
cp -R ../dist/scripts/* scripts
mkdir lib
cp -R ../dist/lib/* lib

# Modify path to data files
filename="index.html"
search="display_tables\/"
replace="display_tables\/training\/"
sed -i '.bak' "s/$search/$replace/g" $filename
rm "index.html.bak"

cd scripts
filename="main.js"
sed -i '.bak' "s/$search/$replace/g" $filename
rm "main.js.bak"