#!/bin/sh

#copy display_tables.tsv files to local directory for editing
gsutil -m cp "gs://ucsc-gi-cdph-bigtree/display_tables/*.tsv" display_tables/


#replace path to data files
cd display_tables
search="display_tables\/"
replace="display_tables\/training\/"
sed -i '.bak' "s/$search/$replace/g" *

search="file="
replace="file=training\/"
sed -i '.bak' "s/$search/$replace/g" *

rm *.bak


#copy updated files to "training"
gsutil -m cp *.tsv "gs://ucsc-gi-cdph-bigtree/display_tables/training/"

#copy remaining files from main Gcloud directory to "trainng" directory
gsutil -m cp "gs://ucsc-gi-cdph-bigtree/display_tables/*.gz" "gs://ucsc-gi-cdph-bigtree/display_tables/training"
gsutil cp "gs://ucsc-gi-cdph-bigtree/display_tables/regions.js" "gs://ucsc-gi-cdph-bigtree/display_tables/training"

