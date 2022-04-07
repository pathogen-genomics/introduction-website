#!/bin/sh

#This script makes a backup of the current static
#CDPH training web site and data.

#create the backup folder
DT=$(date '+%Y-%m-%d')
DIRNAME="training_site_backup_${DT}"
mkdir $DIRNAME
cd $DIRNAME

# copy data from GCP bucket and store in "data" folder
mkdir "data"
cd data
mkdir "display_tables"
gsutil -m cp "gs://ucsc-gi-cdph-bigtree/display_tables/training/*" display_tables/
tar -czf display_tables.tar.gz display_tables/
echo "data files copied from ucsc-gi-cdph-bigtree/display_tables/training/"

#copy website files
cd ..
cp -r ../../../training/* .
echo "website files copied"

echo "Backup complete. Move $DIRNAME to the backups folder."
