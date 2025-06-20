# This script generates the input files needed for calculating introductions. It takes
# two metadata files, a lexicon file, and two metadata files from the CDPH Airports
# project. (The two airports metadata files are hardwired into the code and stored locally 
# in the Terra workflow to ensure maximum confidentiality. The lexicon is used to store 
# alternate spellings, abbreviations, or mispellings of place names that may be present
# in any of the metadata files.
#
#   Arguments:
#      -lexiconfile: name of file with lexicon of place names
#      -mfile: primary metadata file (e.g., the public tree metadata)
#      -mfile_merge: secondary metadata file (e.g., the metadata from CovidNet)
#      -extension: a python list of file extension designators. Optional. if using 
#        more than one geojson file use this argument to specify how to differentiate
#        each set of analyses. Specify only the file name extensions to use with the
#        2nd (and 3rd, 4th, ..., etc.) set of files. For the CDPH data set, the 
#        default is set to ["_us"].
#      -isWDL: defalut is False. Set to true only if the script will be run 
#        as a WDL task in Terra.
#   Output files:
#      -metadata_merged.tsv: combined metadata file for both CDPH and public samples
#      -sample_regions.tsv: list of sample names and corresponding regions for the county analysis
#      -sample_regions_us.tsv: list of sample names and corresponding regions for the state analysis
#      -sample_dates.tsv: list of sample names and corresponding dates for the county analysis
#      -sample_dates_us.tsv: list of sample names and corresponding dates for the state analysis
#      -pids.tsv: list of sample names and corresponding sample IDs/PAUIs
#
# Example command line usage:
#   python3 process_metadata.py -m public.plusGisaid.latest.metadata.tsv -mx samplemeta.tsv -l state_and_county_lexicon.txt
#-------------------------------------------------------------

import pandas as pd
import numpy as np
from standardize_locations import standardize_locations

def process_tb_metadata(input_file):
    tb_metadata = pd.read_csv(input_file, sep='\t')
    # if there is no region, use the country
    tb_metadata['region'] = tb_metadata['region'].fillna(tb_metadata['country'])
    all_regions = list(set(tb_metadata['region'].to_list()))
    standardized_regions = standardize_locations(all_regions)
    # save standardized regions to file for future re-use
    standardized_regions.to_csv('standardized_regions.csv', index=False)
    # add standardized regions to tb_metadata
    tb_metadata = tb_metadata.merge(standardized_regions, left_on='region', right_on='original', how='left')
    # if the country is the United States, use the state_province as the region, otherwise is the country
    tb_metadata['standardized_region'] = np.where(
        tb_metadata['country_y'] == 'United States', tb_metadata['state_province'], tb_metadata['country_y'])
    # Drop the original region and strain columns, rename the standardized region, strain, country, and date columns
    tb_metadata = tb_metadata.drop(['region','strain'], axis=1).rename(columns={
        'standardized_region': 'region',
        'sample_index': 'strain',
        'country_y': 'country',
        'date_collected': 'date',
        'host_scienname': 'host'}, inplace=False)
    # select only the columns we want in the final metadata output
    tb_metadata = tb_metadata[['strain', 'region', 'country', 'lineage', 'tbprof_sublin', 'tbprofiler_lineage_usher','date', 'tbprof_drtype', 'organism', 'host' ]]
    # save the metadata to a file
    tb_metadata.to_csv('metadata_merged.tsv', index=False, sep='\t')

    # output a sample region file, dropping any missing regions
    regions = tb_metadata[['strain', 'region']].dropna(how='any')
    # also filter out "Not available" and "Not found" responses from geo.py
    regions = regions[(regions['region'] != 'Not available') & (regions['region'] != 'Not found')]
    regions.to_csv('sample_regions.tsv', index=False, sep='\t', header=False)

    # output a sample dates file, dropping any missing dates
    sample_dates = tb_metadata.rename(columns={'strain': 'sample_id'})[['sample_id', 'date']].dropna(how='any')
    # dates are mostly in year, but formatted as 2015.0 so we need to remove that trailing .0 to convert to datetime
    sample_dates['date'] = sample_dates['date'].astype(str).str.replace(r'\.0$', '', regex=True)
    # and we have mixted types here some are year some are year-month
    sample_dates['date'] = pd.to_datetime(sample_dates['date'], format='mixed')
    sample_dates.to_csv('sample_dates.tsv', index=False, sep='\t')
    return


if __name__ == "__main__":
    from master_backend import parse_setup
    args = parse_setup()
    # if args.region_extension is None:
    #     extension = ["_us"]
    # else:
    #     extension = args.region_extension
    process_tb_metadata(args.metadata)