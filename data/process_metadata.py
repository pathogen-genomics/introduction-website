# This script takes one or more metadata files and filters out samples that don't
#   match geographic names specified in a lexicon of place names. Use the lexicon
#   to store alternate spellings or capitalizatons of place names.
#   Arguments:
#       conversion: array of alternate_name and preferred_name pairs, produced by read_lexicon in master_backend.py
#       metadata: comma-delimited list of metadata file names (preceded by the path if necessary)
#   Processing steps:
#         -ensure required field names exist
#         -remove non-US samples from public metadata
#         -remove California samples from public metadata since county is unknown
#         -For California metadata file, remove samples w/o a valid county name
#         -Handle cases where county matches a state name (e.g., "Nevada")
#         -remove samples without a valid date (YYYY-MM-DD)
#         -merge public and California-specific metadata files, adding/renaming fields as necessary
#         -create file to store sample name/region association

import re

def process_metadata(conversion, metadata):
    #list of U.S. counties witht the same name as a state
    county_state = {"Washington","Delaware","Wyoming","Ohio","Nevada","Mississippi","Texas","Iowa","Oklahoma","Utah","Indiana","Colorado","Arkansas","Idaho","Oregon","Hawaii","New York"}

    mfiles = metadata.split(",") #get names of metadata files
    metadata = open("metadata_merged.tsv","w+") #output file for merged metadata
    badsamples = open("unlabeled_samples.txt","w+") # file for rejected sample names
    region_assoc = open("sample_regions.tsv","w+") # file to store associations between sample ID and region name
    date_pattern = '[0-9]{4}-[0-9]{2}-[0-9]{2}'
    #write metadata header
    print("strain\tname\tpangolin_lineage\tnextclade_clade\tgisaid_accession\tcounty\tdate\tpaui\tsequencing_lab\tgenbank_accession\tcountry", file = metadata)
    for f in mfiles:
        with open(f) as inf:
            fields = inf.readline().strip().split("\t")
            # check which format the metadata is in based on header field names
            if fields[0] == "usherID":
                # CA metadata header: usherID,name,pango_lineage,nextclade_clade,gisaid_accession,county,collection_date,paui,sequencing_lab
                for entry in inf:
                    fields = entry.strip().split("\t")
                    # check for valid California county names
                    county = fields[5]
                    if county != "":
                        #check if county is in lexicon
                        if county.upper() in (c.upper() for c in conversion): # convert all names to uppercase to avoid differences in case
                            #check for valid date
                            if re.search(date_pattern, fields[6]):
                                #add item to merged metadata file
                                fields.append("")
                                fields.append("USA")
                                print("\t".join(fields), file = metadata)
                                #add sample ID and county name to sample regions file
                                if county in county_state: #handle cases where county name matches state name
                                    print(fields[0] + "\t" + county + " County", file = region_assoc)
                                else:
                                    print(fields[0] + "\t" + conversion[county], file = region_assoc)
                            else:
                                print(fields[0], file = badsamples) #does not have a valid date
                        else:
                            print(fields[0], file = badsamples) #not a valid CA county
                    else:
                        print(fields[0], file = badsamples) #sample does not have county
            else:
                # public metadata header: strain,genbank_accession,date,country,host,completeness,length,Nextstrain_clade,pangolin_lineage,Nextstrain_clade_usher,pango_lineage_usher
                for entry in inf:
                    fields = entry.strip().split("\t")
                    country = fields[0].split("/")[0]
                    # check for US samples
                    if country == "USA":
                        state = fields[0].split("/")[1].split("-")[0]
                        if state in conversion:
                            #TO DO - assign California samples a county via naming scheme
                            if state == "CA":
                                #sample is from California; reject
                                print(fields[0], file = badsamples)
                            else: 
                                #check for valid date
                                if re.search(date_pattern, fields[2]):
                                    #add item to merged metadata file
                                    newfields = []
                                    newfields.append(fields[0]) #sample name
                                    newfields.append("") #CDPH name
                                    newfields.append(fields[8]) #pangolin_lineage
                                    newfields.append(fields[7]) #nextclade_clade = Nextstrain_clade
                                    newfields.append("") #gisaid_accession
                                    newfields.append("") #county name
                                    newfields.append(fields[2]) #date
                                    newfields.append("") #paui
                                    newfields.append("") #sequencing_lab
                                    newfields.append(fields[1]) #genbank_accession
                                    newfields.append("USA") #country
                                    print("\t".join(newfields), file = metadata)
                                    #add sample ID and state name to sample regions file
                                    print(fields[0] + "\t" + conversion[state.upper()], file = region_assoc)
                                else:
                                    print(fields[0], file = badsamples) #does not have a valid date
                        else:
                            #can't parse state
                            print(fields[0], file = badsamples)
                    elif entry.startswith("CDPH"): 
                        #sample is from California; reject
                        print(fields[0], file = badsamples)
                    else:
                        #non-US sample
                        print(fields[0], file = badsamples)

    metadata.close()
    badsamples.close()
    region_assoc.close()

lexicon = {"Alameda":"Alameda County","Alpine":"Alpine County","Amador":"Amador County","Butte":"Butte County",
    "Calaveras":"Calaveras County","Colusa":"Colusa County","Contra Costa":"Contra Costa County","Del Norte":"Del Norte County",
    "El Dorado":"El Dorado County","Fresno":"Fresno County","Glenn":"Glenn County","Humboldt":"Humboldt County",
    "Imperial":"Imperial County","Inyo":"Inyo County","Kern":"Kern County","Kings":"Kings County","Lake":"Lake County",
    "Lassen":"Lassen County","Los Angeles":"Los Angeles County","Madera":"Madera County","Marin":"Marin County",
    "Mariposa":"Mariposa County","Mendocino":"Mendocino County","Merced":"Merced County","Modoc":"Modoc County",
    "Mono":"Mono County","Monterey":"Monterey County","Napa":"Napa County","Nevada":"Nevada County","Orange":"Orange County",
    "Placer":"Placer County","Plumas":"Plumas County","Riverside":"Riverside County","Sacramento":"Sacramento County",
    "San Benito":"San Benito County","San Bernardino":"San Bernardino County","San Diego":"San Diego County",
    "San Francisco":"San Francisco County","San Joaquin":"San Joaquin County","San Luis Obispo":"San Luis Obispo County",
    "San Mateo":"San Mateo County","Santa Barbara":"Santa Barbara County","Santa Clara":"Santa Clara County",
    "Santa Cruz":"Santa Cruz County","Shasta":"Shasta County","Sierra":"Sierra County","Siskiyou":"Siskiyou County",
    "Solano":"Solano County","Sonoma":"Sonoma County","Stanislaus":"Stanislaus County","Sutter":"Sutter County",
    "Tehama":"Tehama County","Trinity":"Trinity County","Tulare":"Tulare County","Tuolumne":"Tuolumne County",
    "Ventura":"Ventura County","Yolo":"Yolo County","Yuba":"Yuba County",
    "ALAMEDA":"Alameda County","ALPINE":"Alpine County","AMADOR":"Amador County","BUTTE":"Butte County",
    "CALAVERAS":"Calaveras County","COLUSA":"Colusa County","CONTRA COSTA":"Contra Costa County","DEL NORTE":"Del Norte County",
    "EL DORADO":"El Dorado County","FRESNO":"Fresno County","GLENN":"Glenn County","HUMBOLDT":"Humboldt County",
    "IMPERIAL":"Imperial County","INYO":"Inyo County","KERN":"Kern County","KINGS":"Kings County","LAKE":"Lake County",
    "LASSEN":"Lassen County","LOS ANGELES":"Los Angeles County","MADERA":"Madera County","MARIN":"Marin County",
    "MARIPOSA":"Mariposa County","MENDOCINO":"Mendocino County","MERCED":"Merced County","MODOC":"Modoc County",
    "MONO":"Mono County","MONTEREY":"Monterey County","NAPA":"Napa County","NEVADA":"Nevada County","ORANGE":"Orange County",
    "PLACER":"Placer County","PLUMAS":"Plumas County","RIVERSIDE":"Riverside County","SACRAMENTO":"Sacramento County",
    "SAN BENITO":"San Benito County","SAN BERNARDINO":"San Bernardino County","SAN DIEGO":"San Diego County",
    "SAN FRANCISCO":"San Francisco County","SAN JOAQUIN":"San Joaquin County","SAN LUIS OBISPO":"San Luis Obispo County",
    "SAN MATEO":"San Mateo County","SANTA BARBARA":"Santa Barbara County","SANTA CLARA":"Santa Clara County",
    "SANTA CRUZ":"Santa Cruz County","SHASTA":"Shasta County","SIERRA":"Sierra County","SISKIYOU":"Siskiyou County",
    "SOLANO":"Solano County","SONOMA":"Sonoma County","STANISLAUS":"Stanislaus County","SUTTER":"Sutter County",
    "TEHAMA":"Tehama County","TRINITY":"Trinity County","TULARE":"Tulare County","TUOLUMNE":"Tuolumne County",
    "VENTURA":"Ventura County","YOLO":"Yolo County","YUBA":"Yuba County",
    "AL":"Alabama","AK":"Alaska","AR":"Arkansas","AZ":"Arizona","CO":"Colorado",
    "CT":"Connecticut","DE":"Delaware","DC":"District of Columbia","FL":"Florida","GA":"Georgia","HI":"Hawaii",
    "ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine",
    "MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana",
    "NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina",
    "ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island",
    "SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia",
    "WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","PR":"Puerto Rico"}
if __name__ == "__main__":
    process_metadata(lexicon, metadata = "samplemeta.tsv,public.plusGisaid.latest.metadata.tsv")