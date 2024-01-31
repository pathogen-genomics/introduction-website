# Calfornia Big Tree Cluster-Tracker Development and Testing Notes

This subdirectory contains the code to used to create the California Big Tree Cluster Tracker, which will display SARS-CoV-2 introductions between California counties and U.S. states. 

The California Big Tree Cluster Tracker uses Google Cloud for storage, deployment, and testing. In addition to Python 3, UShER, and TaxoniumTools, as noted in the main [README](../README.md), you will want to [install the Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and [initialize](https://cloud.google.com/sdk/docs/initializing) it for use on your local machine.

**Overview of the data pipeline:** Sequences from California state and global public sequences are combined in Terra to create a phylogenetic tree, the California Big Tree. The Python scripts in [data](data) are tranformed into WDL workflows to create input into matUtils introduce, which calculates the introductions, and then into files for the web app. See the "Python to WDL Workflow Inputs/Outputs" Google doc (CDPH Genomics > Big Tree Cluster Tracker) for detailed information on file inputs and outputs. The files needed for the Cluster Tracker app are then copied to our Google Cloud Storage bucket.

**Overview of web app components:** Files for the Cluster Tracker web app are located in the [www](www) directory. It is currently a single-page app, so [index.html](www/index.html) is the only HTML file. The app currently uses several JavaScript libraries (located in [www/lib](www/lib)): Leaflet to display the map, slickgrid for the data table, and bootstrap, jquery, jquery-ui, filter-multi-select, sortable.js, and leaflet-gesture-handling for widgets and styling. The [scripts](www/scripts) directory contains the Javascript that loads the data into the data table ([datagrid.js](www/scripts/datagrid.js)) and into the leaflet map ([main.js](www/scripts/main.js)). [ui_interactions.js](www/scripts/ui_interactions.js) handles some basic user interactions before jQuery is loaded. Since it takes a while to copy files from Terra to the GCP storage bucket, a small text file ([status.json](data/status.json)), indicating the status of the copy procedure, is copied to the storage bucket at the start of the copy procedure (status="updating") and then overwritten at the end (status="ok"). [check_status.js](www/scripts/check_status.js) fetches and reads this file and displayes a warning message to the user if the file copy process is still underway. And finally one style sheet controls the styles and popup for the data grid ([gridstyles.css](www/css/gridstyles.css)) and another ([css/custom.css](www/css/custom.css)) controls the rest of the web page styling. 

## Quickstart

1. Clone this repository into your workspace of choice. (Note that "cdph" is the default branch for this repository; "main" is reserved for J. McBroome's original Cluster Tracker.)

2. Navigate to "cdph/www" and start the Python server:

```
cd cdph/www
python3 server.py
```

The website should be available for testing at http://localhost:8080/ 

## Development and Testing of the Python Data Processing Scripts

The Python scripts for data processing have been modularized so they can be translated into WDL tasks in Terra. This makes development and testing a little easier as each python script can be run on its own. All subtasks -- except for running matUtils introduce -- can be run locally to test code changes. 

It is recommended to run matUtils introduce on a Virtual Machine with enough memory (ideally, more than 200 GB). The VM "matutils-cluster-tracker-1" has been set up as a "[n2-highmem-48](https://cloud.google.com/compute/docs/general-purpose-machines#n2-high-mem)" machine type (48 vCPUs, 384 GB memory, 32 Gbps bandwidth).

Before running matUtils, either locally or on a VM, you will want to make sure UShER is updated to the latest version. Installation instructions for UShER can be found on the [UShER wiki](https://usher-wiki.readthedocs.io/en/latest/Installation.html).

Instructions for running each processing step, including detailed descriptions of each input file and output file, can be found in the "Python to WDL Workflow Inputs/Outputs" Google doc (CDPH Genomics > Big Tree Cluster Tracker). Below is a brief summary:

**Step 1. Preparing Metadata and Other Input Files to matUtils Introduce** 
```
python3 process_metadata.py -m public.plusGisaid.latest.metadata.tsv -mx samplemeta.tsv -l state_and_county_lexicon.txt
```
**Step 2a. Running matUtils introduce to Calculate County-Level Introductions**
```
matUtils introduce -i new_tree.pb -s sample_regions.tsv -M sample_dates.tsv -r 0 -u hardcoded_clusters.tsv
```
**Step 2b. Running matUtils introduce to Calculate State-Level Introductions**
```
matUtils introduce -i new_tree.pb -s sample_regions_us.tsv -M sample_dates_us.tsv -r 0 -u hardcoded_clusters_us.tsv
```
**Step 3: Generating the Leaflet GeoJSON Files**
```
python3 update_js.py -j us-states_ca-counties.geo.json us-states.geo.json -l state_and_county_lexicon.txt -e "_us"
```
**Step 4: Generating Cluster Metric Data Table Files and Investigator Cluster-Specimen ID JSON Files**
```
python3 generate_display_tables.py -e "_us"
```
**Step 5: Getting the Metadata Ready for Taxonium**
```
python3 prepare_taxonium.py -s sample_regions.tsv -m metadata_merged.tsv -e "_us"
```
**Step 6: Generating the Taxonium JSONL File**
```
usher_to_taxonium -i new_tree.pb -o cview.jsonl.gz -g hu1.gb -m clusterswapped.tsv -c cluster,cluster2,genbank_accession,gisaid_accession,country,county,region,region2,date,name,pango_lineage,nextstrain_clade,specimen_id,specimen_accession_number -t "California Big Tree"
```

To test a new set of output files:
1. Copy the primary set of output files (cluster_data.json.gz, sample_data.json.gz, cview.jsonl.gz, and regions.js) to a convient location in our Google Cloud bucket. The "dev" subfolder within the "ucsc-gi-cdph-bigtree/display_tables" folder can be used for this purpose if desired.
2. Change the following items in cdph/www/index.html:
  * In the header, change the URL of the "dataHost" variable.
  * You probably won't be able to test the links to Taxonium without also creating a new backend for testing, so you can leave the "taxoniumHost" variable as is.
  * At the bottom of the file, change the URL of the "regions.js" file.
3. The "cview.jsonl.gz" file is likely to be too large for using taxonium.org's default backend, so you can test this file manually by downloading the [desktop version of Taxonium](https://docs.taxonium.org/en/latest/app.html).
4. Navigate to the "www" folder. Then deploy the app to Google Cloud App Engine using the "--no-promote" and "--verson" flags.
```
cd cdph/www
gcloud app deploy --no-promote --version dev
```
5. The "app deploy" command will give you the URL to use to access the app.

## Deploying the Web Site to Production 

To deploy California Big Tree Cluster Tracker to Google Cloud App Engine, first navigate to the "cdph/www" folder and then use the deploy command:
```
cd cdph/www
gcloud app deploy
```
