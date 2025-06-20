#  Python "backend" code to generate JSON files to display cluster data in
#    the table below the map on the web page. 
#  This script can either be called from "master_backend.py" script, OR can be
#    run separately from the command line.
#
# Arguments:
#   -extension: if using more than one geojson file this is list of file
#     name extensions to differentiate each set of files. Specify only the
#     file name extensions to use with the 2nd, 3rd, ..., set of files.
#   -isWDL: defalut is False. Set to true only if the script will be run 
#     as a WDL task in Terra.
# Outputs:
#  - "cluster-data.json.gz" #gzipped JSON file with basic cluster information (no sample names)
#  - "sample-data.json.gz" #gzipped JSON file with sample names for each cluster
#  - "cluster_pids.json" #for CDPH Investigator tool, links cluster ID and PAUI's/specimen IDs
#  (if using the extension argument, will produce another set of three files using the 
#  selected extension)
#
# Example command line if following the GitHub example in the "example" directory:
# python3 generate_display_tables.py
# 
# Example command line usage for CDPH:
# python3 generate_display_tables.py -e "_us"
#-------------------------------------------------------------
# CDPH WDL INPUTS:
#  File clusters_counties # "hardcoded_clusters.tsv", cluster file from CA county introductions
#  File clusters_state # "hardcoded_clusters_us.tsv", cluster file from CA state introductions
#  File pids #"pids.tsv", file linking sample name and PAUI/Specimen ID
# CDPH WDL OUTPUTS:
#  "cluster-data.json.gz" and "cluster_data_us.json.gz" #gzipped JSON file with basic cluster information (no sample names)
#  "sample-data.json.gz" and "sample_data_us.json.gz" #gzipped JSON file with sample names for each cluster
#  "cluster_pids.json" and "cluster_pids_us.json" #for CDPH Investigator tool, links cluster ID and PAUI's/specimen IDs
#-------------------------------------------------------------

import json, gzip

def generate_display_tables(extension = [''], isWDL = False):
    #== for WDL ===
    # isWDL = True
    #===

    #For CDPH data, returns an array containing the unique sample ID's for
    #each sample in a cluster
    def get_sample_pauis(items,pid_assoc):
        pids_arr = []
        samples = items.split(",")
        for s in samples:
            #get PAUI's from sample names
            if s in pid_assoc:
                pids_arr.append(pid_assoc[s])
        return pids_arr

    #function to evaluate whether to add custom CDPH data fields to output cluster files
    def is_custom_data():
        if len(extension) > 1:
            return True
        else:
            return False
    #set flag to identify whether to add custom fields to output cluster files
    is_custom =  is_custom_data()


    if isWDL:
        extension = ['', '_us']
        #input file names
        cluster_file = ['~{clusters_counties}', '~{clusters_state}']
        pid_file = '~{pids}'
    else:
        #input file names
        cluster_file = ["hardcoded_clusters" + extension[i] + ".tsv" for i in range(len(extension))]
        if is_custom:
            pid_file = "pids.tsv"

    # function to add quotes around a variable for JSON formatting
    def addq(item):
        return "\"" + item + "\""

    def fix_month(datestr):
        monthswap = {"Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06","Jul":"07","Aug":"08","Sep":"09","Oct":"10","Nov":"11","Dec":"12"}
        splitr = datestr.split("-")
        return splitr[0] + "-" + monthswap.get(splitr[1],splitr[1]) + "-" + splitr[2]
    
    # get sample name/PAUI associations
    if is_custom:
        pid_assoc = {} # links sample ID with unique CDPH ID (e.g, PAUI, specimen_id)
        with open(pid_file) as inf:
            for entry in inf:
                spent = entry.strip().split("\t")
                pid_assoc[spent[0]] = spent[1]

    for i, ext in enumerate(extension):
        if is_custom:
           sample_pids = {} # stores association between cluster ID and PAUIs
        
        # # get clusters data and put into array
        cluster_data = []
        bad_date_data = [] #store clusters with no-valid-date
        with open(cluster_file[i]) as inf:
            for entry in inf:
                spent = entry.strip().split("\t")
                if spent[0] == "cluster_id":
                    # set dict keys based on header row
                    keys = spent
                    continue
                # set temporary dictionary from row
                spent_dict = {keys[i]:spent[i] for i in range(len(keys))}
                if is_custom:
                    #add California sample PAUIs
                    ids = ""
                    pids_arr = get_sample_pauis(spent_dict['samples'],pid_assoc)
                    if pids_arr:
                        sample_pids[spent_dict['cluster_id']] = pids_arr
                        ids = ",".join(pids_arr)
                    spent_dict['PAUI'] = ids
                #put potential origins and indices in descending order
                if "," in spent_dict['inferred_origin']:
                    #check if all confidences are equal
                    reorder = False
                    confidences = spent_dict['inferred_origin_confidence'].split(",")
                    firsti = confidences[0]
                    for i in range(1, len(confidences)):
                        if confidences[i] != firsti:
                            reorder = True
                            break
                    if reorder:
                        origins = spent_dict['inferred_origin'].split(",")
                        spent_dict['inferred_origin'] = ",".join(origins[::-1])
                        spent_dict['inferred_origin_confidence'] = ",".join(confidences[::-1])
                #add additional field to handle asterisked growth values
                spent_dict['asterisk'] = spent_dict['growth_score']
                #check for cluster with no-valid-dates
                if spent_dict['earliest_date'] == "no-valid-date" and spent_dict['latest_date'] == "no-valid-date":
                    # add asterisk on growth values and put into separate array
                    spent_dict['asterisk'] = spent_dict['asterisk'] + "*"
                    bad_date_data.append(spent_dict)
                else:
                    #fix date format
                    spent_dict['earliest_date'] = fix_month(spent_dict['earliest_date'])
                    spent_dict['latest_date'] = fix_month(spent_dict['latest_date'])
                    if int(spent_dict['sample_count']) <= 5:
                        # add asterisk on growth value
                        spent_dict['asterisk'] = spent_dict['asterisk'] + "*"
                    cluster_data.append(spent_dict)
        
        # now, sort by growth score
        cluster_data = sorted(cluster_data, key=lambda d: d['growth_score'], reverse=True)
        # sort clusters with no-valid-date by growth score and append to cluster_data at the end
        bad_date_data = sorted(bad_date_data, key=lambda d: d['growth_score'], reverse=True)

        cluster_data.extend(bad_date_data)
        #output data to be compatible with parse.JSON
        # -create as compact a string as possible,
        # -only add quotes to items that are strings to save space
        txt_data = "["
        txt_samples = "["
        for i, d in enumerate(cluster_data):
            outline_data = [addq(d['cluster_id']), addq(d['region']), d['sample_count'], addq(d['earliest_date']), addq(d['latest_date']), addq(d['annotation_1']), addq(d['inferred_origin']), addq(d['inferred_origin_confidence']), addq(d['asterisk'])]
            outline_samples = [addq(d['samples'])]
            if is_custom:
                # get the number of PAUIS
                npids = "0"
                if d['PAUI'] != "":
                    npids = str(d['PAUI'].count(',') + 1)
                outline_data.append(npids)
                outline_samples.append(addq(d['PAUI']))
            txt_data += "[" + ",".join(outline_data) + "]"
            txt_samples += "[" + ",".join(outline_samples) + "]"
            if i == len(cluster_data)-1:
                txt_data += "]"
                txt_samples += "]"
            else:
                txt_data += ","
                txt_samples += ","
           
        #now write data to file, and gzip for quicker loading into browser
        #basic cluster data (no samples) 
        with gzip.open("cluster_data" + ext + ".json.gz", "wb") as f:
            f.write(txt_data.encode())
        #sample names for each cluster
        with gzip.open("sample_data" + ext + ".json.gz", "wb") as f:
            f.write(txt_samples.encode())


        # write cluster id and specimen ids for Investigator
        if is_custom:
            with open("cluster_pids" + ext + ".json","w+") as outf:
                print(json.dumps(sample_pids).replace(" ", ""), file = outf)

if __name__ == "__main__":
    from master_backend import parse_setup
    args = parse_setup()
    extension = args.region_extension
    if extension is None:
        extension = ['']
    else:
        extension.insert(0,'')
    generate_display_tables(extension)
