//Checks a JSON file to determine whether or not the data in the
// Google storage bucket is in the process of being updated.
// status should either be "ok" or "updating".

let statusMsgSeen = false; //indicates whether or not user has encountered the "update in progress" message
let status = "ok";

function hideMsg() {
  document.getElementById("status_msg").classList.add("hide");
}

function showAllClear() {
  let msg = '<div class="status_head">Data Update Complete</div>' +
            '<div class="msg">The data update process is complete.<br>' +
            '<button class="status_btn" onclick="hideMsg()">OK</button></div>';
  let el = document.getElementById("status_msg");
  el.innerHTML = msg;
  el.classList.remove("warning");
  el.classList.add("notice");
  el.classList.remove("hide");
  statusMsgSeen = false;
}

async function readStatus() {
  const ver = Date.now();
  const requestURL = 'https://storage.googleapis.com/ucsc-gi-cdph-bigtree/display_tables/training/status.json?v=' + ver;
  const request = new Request(requestURL);

  const response = await fetch(request);
  const myObj = await response.json();

  status = myObj['status'];
  if (status != "ok" && !statusMsgSeen) {
    let msg = '<div class="status_head">Data Update in Progress</div>' +
            '<div class="msg">Cluster information may be out of sync while update is in progress. ' +
            'This may take up to an hour.<br>' +
            '<button class="status_btn" onclick="hideMsg()">OK</button></div>';
    let el = document.getElementById("status_msg");
    el.innerHTML = msg;
    el.classList.remove("notice");
    el.classList.add("warning");
    el.classList.remove("hide");
    statusMsgSeen = true;
  } else if (status == "ok") {
    if (statusMsgSeen) {
      showAllClear();
    } else {
      document.getElementById("status_msg").classList.add("hide");
    }
  }
}