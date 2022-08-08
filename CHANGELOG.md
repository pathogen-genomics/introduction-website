# Changelog

## v0.5.0 (2022-07-21):
   - Updates to use new Taxonium v.2 viewer
   - Data processing: updates utils.py to better handle complex file names
## v0.4.3 (2022-07-12):
   - move/reformat version history to changelog
   - upgraded datatables.net from 1.10.25 to 1.11.3 to resolve security vulnerabilities
## v0.4.2 (2022-06-22):
   - Data processing: incorporates new specimen_accession_number field for CDPH metadata
## v0.4.1 (2022-04-07):
   - updates UI to download uncompressed version of hardcoded_clusters.tsv
## v0.4.0 (2022-03-22):
  - Data processing: adds new California state-wide introductions data
  - UI changes: adds new button to show/hide California state region introductions and rearranges other buttons
  - Data processing: handles new specimen_id field in metadata (replaces paui/link_id)
## v0.3.1 (2022-03-02):
  - UI changges: adds an "Update in progress message" when data transfer is in progress.
  - UI changes: turns the raw cluster count vs. log-fold enrichment drop-down into a toggle button.
  - uses cache busting to prevent caching of JS and data files
  - loads local copy of jquery if can't connect to CDN
## v0.3 (2022-02-02):
  - UI changes: adds option to show introductions by raw numbers
  - UI changes: displays the number of CDPH samples for viewing in Investigator in the data table
  - Data processing: fixes metadata processng errors when splitting and stripping lines with missing metadata fields
  - Data processing: accomodates new CDC sequence file naming convention
## v0.2.3 (2022-01-20): 
  - UI changes: add links in data display table to CA Big Tree Investigator
  - update text in intro paragraph
## v0.2.2 (2022-01-04): 
  - refine input to matUtils introduce to optimize processing
  - UI update to differentiate download links
## v0.2.1 (2021-12-22): 
  - fixed issue with missing or incorrect cluster dates 
  - added clade information to Taxonium protobuf
  - use more stable jquery CDN
## v0.2.0 (2021-12-17): 
  - UI changes: removed links in data display table to CA Big Tree Investigator