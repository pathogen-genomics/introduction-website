Deployment Readme

1. To update the data files, copy the following files from ucsc-gi-cdph-bigtree/display_tables to ucsc-gi-cdph-bigtree/display_tables/training:
cluster_data.json.gz
cluster_data_us.json.gz
cluster_pids.json
cluster_pids_us.json
cview.jsonl.gz
cview_us.jsonl.gz
hardcoded_clusters.tsv
hardcoded_clusters_us.tsv
regions.js
regions_us.js
sample_data.json.gz
sample_data_us.json.gz

2. Make sure the "training" branch is checked out. Verify that app.yaml exists in the introduction-website root directory and that the service is set to "cluster-tracker-training"

3. In the command line, navigate to the introduction-website root directory and run:
gcloud app deploy