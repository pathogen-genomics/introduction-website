#!/bin/sh

cd ..

# Copy latest version of web site files to the "training" subdirectory
cp ../index.html .
cp -R ../css/* css
cp -R ../scripts/* scripts
cp -R ../lib/* lib

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