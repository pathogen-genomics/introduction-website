// create an array with nodes
var nodes = new vis.DataSet([
  {"id":1,"label":"Imperial_County_node_402626", "value":2, "group":2},
  {"id":2,"label":"Kern_County_node_37568", "value":2, "group":2},
  {"id":3,"label":"Riverside_County_node_398329", "value":2, "group":2},
  {"id":4,"label":"San_Bernardino_County_node_398328", "value":4, "group":4},
  {"id":5,"label":"San_Diego_County_node_400134", "value":1, "group":1},
  {"id":6,"label":"San_Luis_Obispo_County_node_326903", "value":3, "group":3},
  {"id":7,"label":"San_Luis_Obispo_County_node_89526", "value":1, "group":1},
  {"id":8,"label":"Ventura_County_node_290374", "value":1, "group":1}
]);

// create an array with edges
var edges = new vis.DataSet([
  {"from":1, "to":2, "value":1},
  {"from":1, "to":4, "value":1},
  {"from":2, "to":6, "value":1},
  {"from":3, "to":4, "value":2},
  {"from":4, "to":3, "value":29},
  {"from":4, "to":5, "value":67},
  {"from":6, "to":7, "value":1},
  {"from":6, "to":8, "value":1}
]);


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
