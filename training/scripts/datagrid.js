// == global variables ==
let grid; // variable for SlickGrid object
let dataView; // data manipulation variable for SlickGrid object
let data = []; //  variable to store data for grid
let resizer; // variable to reference SlickGrid resizer component
let basicDataLoaded = false; // basic cluster data are/not loaded into the grid
let sampleDataLoaded = false; // samples are/not loaded into the grid
// web worker script
const workerScript = `  
  importScripts("https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako_inflate.min.js");
    self.onmessage = async (evt) => {
      const file = evt.data;
      const buf = await file.arrayBuffer();
      const decompressed = pako.inflate(buf);
      self.postMessage(decompressed, [decompressed.buffer]);
    };
  `;
let sortcol = ''; // default column to sort on
let sortdir = -1; // default sort direction (descending)
let searchString = ''; // string used to search and sort grid
let regionString = ''; // string to filter grid by region
let searchBool = 'and'; // boolean search operator ('and' or 'or')


// == functions for attaching data to grid ==
function blankSampleObj() {
  el = {
    'samples': '',
    'samplecol': '...loading data...',
    'pauis': '',
    'pauicol': '...loading data...',
  };
  return el;
}
function blankClusterObj() {
  el = {
    'cid': '...loading data...',
    'region': '...',
    'sampcount': '...',
    'earliest': '...',
    'latest': '...',
    'clade': '...',
    'lineage': '...',
    'origin': '...',
    'confidence': '...',
    'growth': '...',
    'taxlink': '...',
    'investigator': '...',
  };
  return el;
}
// File name extension for CDPH County vs State visualization
function getFNameExtn() {
  let ext = '';
  // eslint-disable-next-line camelcase
  if (map_layer == 1) {
    ext = '_us';
  }
  return ext;
}
function getTaxoniumLink(taxoniumURL, cluster, ext = '') {
  let link = '<a href="https://taxonium.org/?backend=' + taxoniumURL;
  link += '&configUrl=https%3A%2F%2Fstorage.googleapis.com%2Fucsc-gi-cdph-bigtree%2Fdisplay_tables%2Ftaxonium-config.json';
  link += '&xType=x_dist&color=%7B%22field%22:%22meta_region%22%7D';
  link += '&srch=%5B%7B%22key%22:%22aa1%22,%22type%22:%22meta_cluster%22,%22method%22:%22text_exact%22,%22text%22:%22';
  link += cluster;
  link += '%22,%22gene%22:%22S%22,%22position%22:484,%22new_residue%22:%22any%22,%22min_tips%22:0,%22controls%22:true%7D%5D';
  link += '&zoomToSearch=0" target="_blank">View Cluster</a>';
  return link;
}
function getInvetigatorLink(cluster, nPauis, ext = '') {
  let link = '<a href="https://investigator.big-tree.ucsc.edu?';
  link += 'file=cluster_pids' + getFNameExtn() + '.json';
  link += '&cid=' + cluster;
  link += '" target="_blank">View ' + nPauis + ' Samples</a>';
  return link;
}
function clusterObjs(items, taxoniumURL, ext = '') {
  if (items[10] === 0) {
    items[10] = 'No identifiable samples';
  } else {
    items[10] = getInvetigatorLink(items[0].toString(), items[10].toString(), ext);
  }
  el = {
    'cid': items[0],
    'region': items[1].replace(/_/g, ' '),
    'sampcount': items[2].toString(),
    'earliest': items[3],
    'latest': items[4],
    'clade': items[5],
    'lineage': items[6],
    'origin': items[7].replace(/_/g, ' '),
    'confidence': items[8].toString(),
    'growth': items[9],
    'taxlink': getTaxoniumLink(taxoniumURL, items[0], ext),
    'investigator': items[10],
  };
  return el;
}
function sampleObjs(items) {
  // full values for searching
  const s = items[0];
  const p = items[1];
  // truncated values for display
  let st = '';
  let pt = '';
  if (s !== '') {
    const n = s.length <= 50 ? s.length - 1 : 50;
    st = s.slice(0, n) + '...';
  }
  if (p !== '') {
    const n = p.length <= 50 ? p.length - 1 : 50;
    pt = p.slice(0, n) + '...';
  }
  el = {
    'samples': s,
    'pauis': p,
    'samplecol': st,
    'pauicol': pt,
  };
  return el;
}
function initData(items, type, taxoniumURL = '') {
  const cl = items.length;
  data = Array(cl);
  if (type === 'clusters') {
    for (let i = 0; i < cl; i++) {
      const d = (data[i] = {});
      d.id = i;
      Object.assign(d, clusterObjs(items[i], taxoniumURL));
      Object.assign(d, blankSampleObj());
    }
  } else if (type === 'samples') {
    for (let i = 0; i < cl; i++) {
      const d = (data[i] = {});
      d.id = i;
      Object.assign(d, blankClusterObj());
      Object.assign(d, sampleObjs(items[i]));
    }
  }
}
function appendData(items, type, taxoniumURL = '') {
  const sl = items.length;
  if (type === 'samples') {
    for (let i = 0; i < sl; i++) {
      const newData = sampleObjs(items[i]);
      data[i].samples = newData.samples;
      data[i].pauis = newData.pauis;
      data[i].samplecol = newData.samplecol;
      data[i].pauicol = newData.pauicol;
    }
  } else if (type === 'clusters') {
    const newData = clusterObjs(items[i], taxoniumURL);
    data[i].cid = newData.cid;
    data[i].region = newData.region;
    data[i].sampcount = newData.sampcount;
    data[i].earliest = newData.earliest;
    data[i].latest = newData.latest;
    data[i].clade= newData.clade;
    data[i].lineage = newData.lineage;
    data[i].origin = newData.origin;
    data[i].confidence = newData.confidence;
    data[i].growth = newData.growth;
    data[i].taxlink = newData.taxlink;
    data[i].investigator = newData.investigator;
  }
}
// function to load the data and wire functions to table
function loadData(dataArr, type, taxoniumURL = '') {
  if (type === 'clusters') {
    if (!sampleDataLoaded) {
      initData(dataArr, type, taxoniumURL);
    } else if (!basicDataLoaded) {
      // call update function
      appendData(dataArr, type, taxoniumURL);
      updateData();
    }
    basicDataLoaded = true;
  } else if (type === 'samples') {
    if (basicDataLoaded) {
      // call update function
      appendData(dataArr, type);
      updateData();
    } else {
      initData(dataArr, type);
    }
    sampleDataLoaded = true;
  }
  setGridView();
} // end of loadData function
async function loadBasicData(dataHost, taxoniumURL, file) {
  const workerBlob = new Blob([workerScript], {type: 'application/javascript'});
  const workerUrl = URL.createObjectURL(workerBlob);

  const worker = new Worker(workerUrl);

  const compressedBlob1 = await fetch(dataHost + file + '?v=' + new Date().getTime())
      .then((r) => r.blob());

  worker.onmessage = ({data}) => {
    const clusters = JSON.parse(new TextDecoder().decode(data));
    loadData(clusters, 'clusters', taxoniumURL);
  };
  worker.postMessage(compressedBlob1);
}

async function loadSampleData(dataHost, file) {
  const workerBlob = new Blob([workerScript], {type: 'application/javascript'});
  const workerUrl = URL.createObjectURL(workerBlob);
  const worker = new Worker(workerUrl);

  const compressedBlob2 = await fetch(dataHost + file + '?v=' + new Date().getTime())
      .then((r) => r.blob());

  worker.onmessage = ({data}) => {
    const samples = JSON.parse(new TextDecoder().decode(data));
    loadData(samples, 'samples');
  };
  worker.postMessage(compressedBlob2);
}

// == sets up Slick Grid object properties ==
// slickgrid grid options
function gridOpts() {
  const opt = {
    enableCellNavigation: true,
    multiColumnSort: true,
    enableColumnReorder: false,
    enableAutoSizeColumns: true,
  };
  return opt;
}
// sets the number of columns and their parameters
function setCols() {
  const cols = [
    {id: 'cid', name: `<span title='${tooltipText[0]}'>Cluster ID</span>`, field: 'cid', minWidth: 150, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'region', name: `<span title='${tooltipText[1]}'>Region</span>`, field: 'region', minWidth: 100, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'sampcount', name: `<span title='${tooltipText[2]}'>Sample Count</span>`, field: 'sampcount', minWidth: 50, sortable: true, sorter: sorterNumeric, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'earliest', name: `<span title='${tooltipText[3]}'>Earliest Date</span>`, field: 'earliest', minWidth: 70, sortable: true, sorter: sorterDates, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'latest', name: `<span title='${tooltipText[4]}'>Latest Date</span>`, field: 'latest', minWidth: 70, sortable: true, sorter: sorterDates, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'clade', name: `<span title='${tooltipText[5]}'>Clade</span>`, field: 'clade', minWidth: 80, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'lineage', name: `<span title='${tooltipText[6]}'>Lineage</span>`, field: 'lineage', minWidth: 80, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'origin', name: `<span title='${tooltipText[7]}'>Best Potential Origins</span>`, field: 'origin', minWidth: 100, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'confidence', name: `<span title='${tooltipText[8]}'>Best Origin Regional Indices</span>`, field: 'confidence', minWidth: 60, sortable: true, sorter: sorterNumeric, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'growth', name: `<span title='${tooltipText[9]}'>Growth Score</span>`, field: 'growth', minWidth: 70, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'taxlink', name: `<span title='${tooltipText[10]}'>View in Taxonium</span>`, field: 'taxlink', minWidth: 70, formatter: linkFormatter, sortable: true, sorter: sorterStringCompare},
    {id: 'investigator', name: `<span title='${tooltipText[11]}'>View in Big Tree Investigator</span>`, field: 'investigator', minWidth: 120, formatter: linkFormatter, sortable: true, sorter: sorterStringCompare},
    {id: 'samplecol', name: `<span title='${tooltipText[12]}'>Samples</span>`, field: 'samplecol', minWidth: 100, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
    {id: 'pauicol', name: `<span title='${tooltipText[13]}'>Specimen IDs</span>`, field: 'pauicol', minWidth: 100, sortable: true, sorter: sorterStringCompare, customTooltip: {useRegularTooltip: true}, formatter: tooltipFormatter},
  ];
  return cols;
}
// initalizes grid with blank data except for first row which shows "loading data"
function tempData() {
  const item = [{id: 'id_0'}];
  Object.assign(item[0], blankClusterObj());
  Object.assign(item[0], blankSampleObj());
  return item;
};

// == grid formatting functions ==

// function to add link formatting to cells
function linkFormatter(row, cell, value, columnDef, dataContext) {
  return value;
}
// function to add tool tip text
const tooltipText = [
  'The identifier of the internal node inferred to be the ancestral introduction. Can be used with the public protobuf and matUtils.',
  'Region of this cluster.',
  'Number of samples in this cluster.',
  'Date of the earliest sample from this cluster.',
  'Date of the latest sample from this cluster.',
  'Nextstrain clade of the ancestral introduction.',
  'Pangolin lineage of the ancestral introduction.',
  'The origin region with the greatest index value. May not be the true origin, especially if the corresponding index value is below 0.5.',
  'Regional index for the origin; 1 is maximal, 0 is minimal.',
  'Importance estimate based on cluster size and age. Not directly comparable between regions with varying sequencing levels.',
  'Click to View in Taxonium',
  'Click to View in California Big Tree Investigator',
  'Double click cell to view all samples in this cluster',
  'Double click cell to view all CDPH Specimen IDs or Accession Numbers for this cluster',
];
function tooltipFormatter(row, cell, value, column, dataContext) {
  let val = '';
  if (value) {
    val = value;
  }

  // set tool tip text to same as header for most non-header cells
  const tttxt = tooltipText[cell];

  return `<span title='${tttxt}'>${val}</span>`;
}
function registerResizer(grid) {
  // function to add automatic column resizing to fill width of grid
  resizer = new Slick.Plugins.Resizer({
    container: '#grdContainer',
    bottomPadding: 10,
  },
  {height: 570},
  );
  grid.registerPlugin(resizer);
}

// == grid filtering and sorting ==
function clearFilter() {
  document.getElementById('txtSearch').value = '';
  searchString = '';
  if (basicDataLoaded && sampleDataLoaded) {
    updateFilter();
  }
}
// triggers simple search on button click
function doSimpleSearch() {
  searchString = document.getElementById('txtSearch').value;
  // get boolean search criteria from radio buttons
  const radios = document.getElementsByName('bool');
  for (let i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      searchBool = radios[i].value;
      break;
    }
  }
  if (basicDataLoaded && sampleDataLoaded) {
    updateFilter();
  }
}
// sets which data to search on
function searchFilter(item, args) {
  // show items if no region and no search string
  if (args.searchString === '' && args.regionString === '') {
    return true;
  }

  // handle filtering by region before tackling search items
  // filter out items not in the region
  if (args.regionString !== '' && item.region.indexOf(regionString) === -1) {
    return false;
  }

  // now, check for search items
  if (args.searchString !== '') {
    // split search string into values, and make case independent
    const sStrings = args.searchString.toLowerCase().split(',');
    let foundItemAny = false;
    let foundItemAll = true;

    for (let i of Object.keys(sStrings)) {
      // for text searching, fields in the table to search
      const searchFields = item.cid.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.region.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.sampcount.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.earliest.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.latest.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.clade.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.lineage.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.origin.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.confidence.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.growth.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.taxlink.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.investigator.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.samples.toLowerCase().indexOf(sStrings[i]) !== -1 ||
           item.pauis.toLowerCase().indexOf(sStrings[i]) !== -1;
      if (searchFields) {
        foundItemAny = true;
        if (searchBool == 'or') {break;}
      } else {
        foundItemAll = false;
        if (searchBool == 'and') {break;}
      }
    }
    if ((searchBool == 'or') && foundItemAny) {
      return true;
    } else if ((searchBool == 'and') && foundItemAll) {
      return true;
    } else {
      return false;
    }
  } else {
    // passes all filters; show item
    return true;
  }
}
function updateFilter() {
  dataView.setFilterArgs({
    regionString,
    searchString,
  });
  dataView.refresh();
}
// function to show/hide data by region
function showRegion(region) {
  if (region === 'default') {
    regionString = '';
  } else {
    regionString = region;
  }
  if (basicDataLoaded) {
    updateFilter();
  } else {
    console.log('basic data not loaded yet');
  }
}
// sort fucntion for strings
function sorterStringCompare(a, b) {
  const x = a[sortcol];
  const y = b[sortcol];
  return sortdir * (x === y ? 0 : (x > y ? 1 : -1));
}
// sort function for cluster earliest/lates dates
function sorterDates(a, b) {
  const x = a[sortcol];
  const y = b[sortcol];
  let retVal = 0;
  if (x !== y) {
    if (x == 'no-valid-date') {
      retVal = 1; // put 'no-valid-dates' after dates
    } else if (y == 'no-valid-date') {
      retVal = -1; // put dates before 'no-valid-dates'
    } else { 
      // comparing two date strings
      retVal = sortdir * (x > y ? 1 : -1);
    }
  }
  return retVal;
}
// sort function for numeric data
function sorterNumeric(a, b) {
  const x = (isNaN(a[sortcol]) || a[sortcol] === '' || a[sortcol] === null) ? -99e+10 : parseFloat(a[sortcol]);
  const y = (isNaN(b[sortcol]) || b[sortcol] === '' || b[sortcol] === null) ? -99e+10 : parseFloat(b[sortcol]);
  return sortdir * (x === y ? 0 : (x > y ? 1 : -1));
}


// refreshes grid to show any new data added to data variable
function updateData() {
  dataView.beginUpdate();
  dataView.setItems(data);
  dataView.endUpdate();
  grid.setData(dataView);
  grid.render();
}

function setGridView() {
  // creates data and grid objects
  dataView = new Slick.Data.DataView({inlineFilters: true});
  grid = new Slick.Grid('#myGrid', dataView, setCols(), gridOpts());


  // adds pagination
  let pager = new Slick.Controls.Pager(dataView, grid, $('#pager'));
  // sets # of items to display by default
  dataView.setPagingOptions({pageSize: 20});

  // adds column resizing to fill width of grid
  registerResizer(grid);

  // set column sort default column; put this before grid.onsort since the data is already sorted
  // grid.setSortColumn('growth', false); // columnId, descending sort order


  // adds sorting functionaility
  grid.onSort.subscribe(function(e, args) {
    const cols = args.sortCols;

    dataView.sort(function(dataRow1, dataRow2) {
      const cl = cols.length;
      for (let i = 0; i < cl; i++) {
        sortdir = cols[i].sortAsc ? 1 : -1;
        sortcol = cols[i].sortCol.field;

        const result = cols[i].sortCol.sorter(dataRow1, dataRow2);
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    });
    args.grid.invalidateAllRows();
    args.grid.render();
  });

  // add ability to copy text
  grid.setSelectionModel(new Slick.CellSelectionModel());
  grid.registerPlugin(new Slick.CellExternalCopyManager({
    readOnlyMode: true,
    includeHeaderWhenCopying: false,
  }));

  // wire up model events to drive the grid
  // !! both dataView.onRowCountChanged and dataView.onRowsChanged MUST be wired to correctly update the grid
  // see Issue#91
  dataView.onRowCountChanged.subscribe(function(e, args) {
    grid.updateRowCount();
    grid.render();
  });
  dataView.onRowsChanged.subscribe(function(e, args) {
    grid.invalidateRows(args.rows);
    grid.render();
  });


  // set up double click event to trigger popup
  grid.onDblClick.subscribe((e, p) => {
    // p.row, p.cell
    if (p.cell === 12 || p.cell === 13) {
      let txt = '';
      let ttl = '';
      if (p.cell === 12) {
        // get sample names from data
        txt = grid.getDataItem(p.row).samples;
        ttl = 'Samples';
      } else if (p.cell === 13) {
        txt = grid.getDataItem(p.row).pauis;
        ttl = 'Specimen IDs';
      }
      $('<div id="sample-popup"></div>').dialog({
        title: ttl,
        open: function() {
          txt = txt.replace(/,/g, ',<br/>');
          $(this).html(txt);
          $(this).dblclick(function() {
            $(this).dialog('close');
          });
        },
        close: function() {
          // deselect item
          grid.getSelectionModel().setSelectedRanges([]);
          grid.resetActiveCell();
        },
        height: 300,
      }); // end dialog
    }
  });

  // clear selected items on KeyDown of Esc key
  grid.onKeyDown.subscribe(function(e) {
    if (e.which === 27) {
      // deselect item
      grid.getSelectionModel().setSelectedRanges([]);
      grid.resetActiveCell();
    }
  });

  // wire up the search textbox to apply the filter to the model
  $('#txtSearch').keyup(function(e) {
    // clear on Esc
    if (e.which === 27) {
      this.value = '';
    }
    searchString = this.value;
  });

  // initialize the model after all the events have been hooked up
  dataView.beginUpdate();
  dataView.setItems(data);
  dataView.setFilterArgs({
    regionString,
    searchString,
    searchBool,
  });
  dataView.setFilter(searchFilter);
  dataView.endUpdate();
} // end of setGridView

// eslint-disable-next-line no-unused-vars
function initCTGrid(dataHost, taxoniumHost, clusterfile, samplefile) {
  // clear everything
  basicDataLoaded = false;
  sampleDataLoaded = false;
  data = [];
  sortcol = '';
  sortdir = -1;
  searchString = '';
  regionString = '';
  document.getElementById('txtSearch').value = '';
  // create basic grid object while waiting for data to load
  grid = new Slick.Grid('#myGrid', tempData(), setCols(), gridOpts());
  // attach resizer so column widths stay consistent as data is read and loaded
  registerResizer(grid);

  let taxoniumURL = taxoniumHost[0];
  const extn = getFNameExtn();
  if (extn != '') {
    taxoniumURL = taxoniumHost[1];
  }
  loadBasicData(dataHost, taxoniumURL, clusterfile);
  loadSampleData(dataHost, samplefile);
}
