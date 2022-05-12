var data;
// Set Leaflet map properties before hiding div
  var map = L.map('map', {'tap':false}).setView([36.77, -119.418], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar', 
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.esri.basemapLayer('Gray').addTo(map);

// colors TO DO - get better palette with more options
colors = ["#4e95dc","#ffb14e","#82b173","#c82727","#0000ff","#46b846","#9d02d7","#fa8775","#cd34b5","#ffd700","#ea5f94","#45d9c7"];

// region latitude and longitudes
const regionLL = [
  {name:"Colusa_County", long:-122.23755503, lat:39.17712713},
  {name:"Glenn_County", long:-122.39090239, lat:39.59823808},
  {name:"Kings_County", long:-119.8154673, lat:36.07536089},
  {name:"Mariposa_County", long:-119.91100337, lat:37.57736279},
  {name:"Modoc_County", long:-120.72479099, lat:41.58974607},
  {name:"Sacramento_County", long:-121.34483587, lat:38.44874079},
  {name:"San_Bernardino_County", long:-116.17867795, lat:34.84178101},
  {name:"Santa_Barbara_County", long:-120.01663183, lat:34.67363398},
  {name:"Shasta_County", long:-122.03922234, lat:40.7636356},
  {name:"Tulare_County", long:-118.80122381, lat:36.22061355},
  {name:"Alameda_County", long:-121.88931961, lat:37.64555146},
  {name:"Alpine_County", long:-119.82073794, lat:38.59716187},
  {name:"Marin_County", long:-122.72380417, lat:38.07388192},
  {name:"Mendocino_County", long:-123.39141328, lat:39.4403536},
  {name:"Merced_County", long:-120.71755572, lat:37.19191313},
  {name:"Mono_County", long:-118.88754778, lat:37.93923384},
  {name:"Monterey_County", long:-121.2393212, lat:36.2163699},
  {name:"Napa_County", long:-122.33146338, lat:38.50726702},
  {name:"Nevada_County", long:-120.76860561, lat:39.30115251},
  {name:"Orange_County", long:-117.76074773, lat:33.70297626},
  {name:"Placer_County", long:-120.7171223, lat:39.06343603},
  {name:"Plumas_County", long:-120.83764691, lat:40.00402792},
  {name:"Riverside_County", long:-115.99385489, lat:33.74363564},
  {name:"San_Benito_County", long:-121.07555418, lat:36.60399254},
  {name:"San_Diego_County", long:-116.73537933, lat:33.03401355},
  {name:"San_Francisco_County", long:-122.43939217, lat:37.7599936},
  {name:"San_Joaquin_County", long:-121.27180651, lat:37.93484195},
  {name:"Amador_County", long:-120.64974552, lat:38.44628731},
  {name:"Butte_County", long:-121.59958867, lat:39.6668772},
  {name:"Calaveras_County", long:-120.55399004, lat:38.20431662},
  {name:"Contra_Costa_County", long:-121.92782688, lat:37.9191606},
  {name:"Del_Norte_County", long:-123.89874428, lat:41.74313953},
  {name:"El_Dorado_County", long:-120.52511798, lat:38.77927687},
  {name:"Fresno_County", long:-119.65105769, lat:36.75819212},
  {name:"Humboldt_County", long:-123.87574998, lat:40.69920788},
  {name:"Imperial_County", long:-115.3652644, lat:33.03953701},
  {name:"Inyo_County", long:-117.41152684, lat:36.51151322},
  {name:"Kern_County", long:-118.73006597, lat:35.34295136},
  {name:"Lake_County", long:-122.75410693, lat:39.09956568},
  {name:"Lassen_County", long:-120.59432936, lat:40.67344398},
  {name:"Los_Angeles_County", long:-118.22469158, lat:34.32114132},
  {name:"Madera_County", long:-119.76274865, lat:37.2182163},
  {name:"San_Luis_Obispo_County", long:-120.40484343, lat:35.38726286},
  {name:"San_Mateo_County", long:-122.3273639, lat:37.42322963},
  {name:"Santa_Clara_County", long:-121.69614446, lat:37.23263642},
  {name:"Santa_Cruz_County", long:-122.00100736, lat:37.05611959},
  {name:"Sierra_County", long:-120.51608633, lat:39.58014384},
  {name:"Siskiyou_County", long:-122.53905158, lat:41.59425183},
  {name:"Solano_County", long:-121.93207326, lat:38.27061843},
  {name:"Sonoma_County", long:-122.88763752, lat:38.52854401},
  {name:"Stanislaus_County", long:-120.99795398, lat:37.55913651},
  {name:"Tehama_County", long:-122.23372879, lat:40.12516798},
  {name:"Trinity_County", long:-123.11577706, lat:40.64977624},
  {name:"Tuolumne_County", long:-119.95244458, lat:38.02628123},
  {name:"Ventura_County", long:-119.08357066, lat:34.45676388},
  {name:"Yolo_County", long:-121.90185205, lat:38.68651609},
  {name:"Yuba_County", long:-121.35054146, lat:39.26964082},
  {name:"Sutter_County", long:-121.6945535, lat:39.03443385}
]; 


// show transmission network vis
function showNetwork(data){
  var nodes = new vis.DataSet(data.nodes);
      var edges = new vis.DataSet(data.edges);

      // create a network
      var container = document.getElementById("mynetwork");
      var data = {
        nodes: nodes,
        edges: edges,
      };
      var options = {
        nodes:{shape:"dot"},
        physics:{solver:"repulsion"},
        edges:{arrows:{to:{enabled:true, scaleFactor:0.75}}}
      };
      var network = new vis.Network(container, data, options).selectNodes([nodes.id=5]);
}

// layer style for county/state boundaries
function mapStyle(feature) {
    return {
        fill: false,
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3'
    };
}

// show transmission map
function addMapData(data){
  //adds region polygon
  L.geoJSON(regions, {
      style: mapStyle
  }).bindPopup(function (layer) {
      return layer.feature.properties.name;
  }).addTo(map);

   // convert network data into transmission network arrows
  var lines =[];
  for (var i = 0, len = data.edges.length; i < len; i++) {
      var fromIndex = data.edges[i].from;
      var toIndex = data.edges[i].to;
      var fromLabel = data.nodes.find(x => x.id === fromIndex).label;
      var toLabel = data.nodes.find(x => x.id === toIndex).label;
      var fromLat = regionLL.find(x => x.name.includes(fromLabel)).lat;
      var fromLong = regionLL.find(x => x.name.includes(fromLabel)).long;
      var fromLL = [fromLat, fromLong];
      var toLat =  regionLL.find(x => x.name.includes(toLabel)).lat;
      var toLong = regionLL.find(x => x.name.includes(toLabel)).long;
      var toLL = [toLat, toLong];
      let item = {
        "fromID": fromIndex,
        "fromLabel": fromLabel,
        "fromLL": fromLL,
        "toID": toIndex,
        "toLabel": toLabel,
        "toLL": toLL,
        "color": colors[i]
      };
      lines.push(item);
  }

  function addLineToMap(item, index) {
      new L.swoopyArrow(item.fromLL, item.toLL, {
        label: item.fromLabel,
        color: item.color, 
        factor: 0.7, 
        weight: 2, 
        hideArrowHead: false, 
        arrowFilled: true,
        labelFontSize: 12,
        iconAnchor: [20, 10],
        iconSize: [20, 16]
      }).addTo(map);
  }
  lines.forEach(addLineToMap);
}



function showVis(type) {
  if (type=="net") {
        document.getElementById('network').style.display = "block";
        el = document.getElementById('sh-map');
        el.style.display = "none";
        document.getElementById('btn_map').style.display = "inline";
        document.getElementById('btn_net').style.display = "none";
    } else if (type=="map") {
        document.getElementById('network').style.display = "none";
        el = document.getElementById('sh-map');
        el.style.display = "inline";
        document.getElementById('btn_map').style.display = "none";
        document.getElementById('btn_net').style.display = "inline";
        // redraws map after changing map size on hide
        map.invalidateSize();
    }
}
function init(type) {
    showVis(type);
    // title
    document.getElementById('net-title').innerHTML = "Transmission Network for " + CTnode;
    document.getElementById('map-title').innerHTML = "Network Map for " + CTnode;
    // download links
    url = "'https://storage.googleapis.com/ucsc-gi-cdph-bigtree/display_tables/strainhub/";
    link = "<a href=" + url;
    endlink = "";
    var dlRds = link + CTnode + ".nwk_StrainHub_network.RDS'>RDS</a>";
    //var dlNet = link + CTnode + ".html'>HTML</a>";
    var dlMap = link + CTnode + "_map.html'>HTML</a>";
    document.getElementById('dl-rds').innerHTML = dlRds;
    //document.getElementById('dl-net').innerHTML = dlNet;
    document.getElementById('dl-map').innerHTML = dlMap;
} 


// Get JSON network data
var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        var status = xhr.status;
        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
    };
    xhr.send();
};
if (CTnode!=null) {
    jfile = "https://storage.googleapis.com/ucsc-gi-cdph-bigtree/display_tables/strainhub/" + CTnode + "_network.json";

    console.log("getting data from XMLHttpRequest"); //DEBUG

    getJSON(jfile, function(err, text) {
      if (err != null) {
          console.error(err);
      } else {
          data = text;
          //data = JSON.parse(text);

          //initialize vis elemeents before hiding divs
          showNetwork(data);
          // add transmission network data to map
          addMapData(data);

          //initialze UI elements after getting data and initializing visualization windows
          init(type);
      }
    });

}
