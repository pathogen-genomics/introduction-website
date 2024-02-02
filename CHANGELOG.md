# Changelog

## v.0.9.4 (2024-1-31):
   - Display loader until all data is loaded.
   - Modify server configuration to turn off caching.
   - Added retry mechanism with exponential backoff for network requests.
## v.0.9.3 (2024-1-9):
   - Display date the dataset was last updated.
## v.0.9.2 (2023-12-4):
   - Added DataDog Real User Monitoring. 
## v.0.9.1 (2023-04-26):
   - Update example with latest UI styles.
   - Simplify GitHub project structure.
   - Clean up python scripts.
   - Revise readme files.
## v.0.9.0 (2023-04-13):
   - UI Changes: New Material Design-inspired style and UCSC-inspired color palette.
   - UI Changes: Adds Google Maps gesture handling (disables zooming in/out on scroll).
   - UI Changes: Adds help documentation.
## v.0.8.0 (2023-03-09):
   - UI changes: Adds ability to search on selected columns and/or filter by date range, cluster size, or growth score.
## v.0.7.0 (2023-03-09):
   - Data processing: uses a single Taxonium JSONL file for multi-geographic-level analyses.
   - UI changes: updates download link to Taxonium, links to Taxonium in the data grid, updates Taxonium config file, and uses new Taxonium backend URL.
## v.0.6.9 (2023-01-20):
   - Data processing: fixes bug in reading metadata file when there are blank metadata elements at the end of the line.
## v.0.6.8 (2023-01-10):
   - added maximum lat/long boundaries and minumim zoom level to Leaflet map
   - updated JS libraries
## v.0.6.7 (2022-12-15):
   - UI changes: adds options menu with function to change Google login account
   - UI changes: show pagination options by default
   - Data processing: add ability to show all calculated potential cluster origins
   - UI changes: shows new list of potential origins and their indices in a popup when double-clicking the table cell
## v.0.6.6 (2022-11-10):
   - UI changes: adds ability to search using multiple search terms separated by a comma and to use boolean and/or.
## v.0.6.5 (2022-10-25):
   - Data processing: add asterisk to growth values for small clusters (5 or fewer samples), and for clusters with no valid dates
   - UI changes: add interpretive note regarding growth values
   - UI changes: adjust sort functions for cluster date columns and growth value column
   - Updates example to match current version.
   - Data processing: fix bug that caused update_js.py to fail with new indeterminate cluster origins verbosity in matUtils introduce.
## v.0.6.4 (2022-09-29):
   - Backend: replace public Taxonium backend with local backend.
   - Data processing: merge Covidnet and public clade/lineage metadata fields.
   - Data processing: pare down metadata fields for Taxonium JSONL file.
   - UI changes: fix typo in data table header.
## v.0.6.3 (2022-09-23):
   - Data processing: fixed a bug that did not output airport dates to the sample_dates.tsv file correctly, and added metadata from airports CSV file to merged metadata file if it was missing from the CovidNet metadata.
   - UI changes: added auto resizing of grid columns, and misc. padding adjustments.
   - UI changes: added GISAID disclaimer and styling.
## v.0.6.2 (2022-09-16):
   - UI changes: streamlines loading and appending data to grid.
   - Data processing: adds a new set of samples collected at selected airports to CDPH data processing, and adds these as non-geocoded "regions" to calculate introductions from airports into other regions.
   - Documentation: finishes adding new grid tool to documentation, example and src code, and cleans up project folder structure.
## v.0.6.1 (2022-08-23):
   - UI changes: fixed a bug that did not clear the Search box when loading new data
   - UI changes: adds "loading" message to grid cells when loading sample/specimen IDs
   - Data processing: adds all available sample metadata (including for international samples) to Taxonium JSONL
   - Data processing: adds title to Taxonium JSONL
   - Data processing: removes need for multiple instances of merged metadata file for multi-region analysis
## v0.6.0 (2022-08-17):
   - UI changes: Imlments a new data display table via SlickGrid library; allows for filtering via Search box, sort column by ascending/descending order, mulitple column sort, highlight and copy a range of cells, column width adjustment, user-adjustable pagination options, and popups to display truncated cell text
   - UI changes: Data for data display table is supplied by two JSON files that represent the full data set
   - UI changes: Adds cluster sample names and CDPH specimen_IDs to the data table
   - UI changes: Users can search the data table for sample names/CDPH specimen_IDs in addition to cluster information
   - UI changes: Modification to table header and hover text to clarify inferred origin and inferred origin confidence
   - Data processing: Removes filtering of protobuf to US-only samples
   - Data processing: Replaces "top_clusters" files with a set of two JSON files, one for the basic cluster information, and one for sample names and CDPH specimen_IDs
   - Data processing: New JSON data format for links to CA Big Tree Investigator
   - Data processing: Adds flag in python scripts to indicate when data processing is via WDL Task or command line
   - Data processing: Adds flag in python script to better handle custom CA Big Tree data processing requirements
   - Data processing: moves the host URL variable to the index.html file
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
