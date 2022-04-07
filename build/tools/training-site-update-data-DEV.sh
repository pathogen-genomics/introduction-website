#!/bin/sh

#This script copies the latest data files and prepares them
#for the DEVELOPMENT "training" web site.

#copy display_tables.tsv files to local directory for editing
mkdir display_tables-tmp
gsutil -m cp "gs://ucsc-gi-cdph-bigtree/display_tables/*.tsv" display_tables-tmp/


#replace path to data files
cd display_tables-tmp
search="display_tables\/"
replace="display_tables\/training_dev\/"
sed -i '.bak' "s/$search/$replace/g" *

search="file="
replace="file=training\/"
sed -i '.bak' "s/$search/$replace/g" *

rm *.bak


#copy updated files to "training_dev"
gsutil -m cp *.tsv "gs://ucsc-gi-cdph-bigtree/display_tables/training_dev/"

#copy remaining files from main Gcloud directory to "trainng_dev" directory
gsutil -m cp "gs://ucsc-gi-cdph-bigtree/display_tables/*.gz" "gs://ucsc-gi-cdph-bigtree/display_tables/training_dev/"
gsutil cp "gs://ucsc-gi-cdph-bigtree/display_tables/regions.js" "gs://ucsc-gi-cdph-bigtree/display_tables/training_dev/"

echo "Process complete. You can now delete the 'display_tables-tmp' folder"