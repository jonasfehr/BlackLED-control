let ArtNet = require('artnet')
let controller = ArtNet.createController()

let network = require('network')

let $ = require('jquery')

let fs = require('fs')
let filename = './nodeList.json'
if (fs.existsSync('BlackLED.log')) {
  fs.unlinkSync('BlackLED.log')
}

let winston = require('winston')
let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: 'info' }),
    new (winston.transports.File)({
      filename: 'BlackLED.log',
      level: 'info'
    })
  ]
})

// let n = 0
let mode = 'live'
let showSubNodes = []

var node = []

var abc = ['A', 'B', 'C', 'D']

$('#update-table').on('click', () => {
  logger.verbose(JSON.stringify({button: 'update-table'}))
  updateTable()
  drawTable()
})

$('#clear-all').on('lclick', () => {
  logger.verbose(JSON.stringify({button: 'clear-all'}))
  node = undefined
  drawTable()
})

$('#mode-live').on('click', () => {
  logger.verbose(JSON.stringify({button: 'mode-live'}))
  document.getElementById('mode-live').className = 'btn btn-primary active'
  document.getElementById('mode-setup').className = 'btn btn-default'
  document.getElementById('clear-all').setAttribute('disabled', 'disabled')
  document.getElementById('clear-offline').setAttribute('disabled', 'disabled')
  mode = 'live'
  updateTable()
})

$('#mode-setup').on('click', () => {
  logger.verbose(JSON.stringify({button: 'mode-setup'}))
  document.getElementById('mode-setup').className = 'btn btn-primary active'
  document.getElementById('mode-live').className = 'btn btn-default'
  document.getElementById('clear-all').removeAttribute('disabled')
  document.getElementById('clear-offline').removeAttribute('disabled')
  mode = 'setup'
  drawTable()
})

network.get_interfaces_list(function (err, interfaceList) {
  if (err) {
    logger.error(err)
  } else {
    logger.verbose(interfaceList)
  }
})

function loadTable () {
  logger.verbose('loading table')
  if (fs.existsSync(filename)) {
    logger.verbose('from file: ' + filename)
    node = JSON.parse(fs.readFileSync(filename, 'utf8'))
    logger.verbose(JSON.parse(fs.readFileSync(filename, 'utf8')))
  } else {
    logger.warn('File Doesn\'t Exist. Creating new file.')
    fs.writeFile('./nodeList.json', '', (err) => {
      if (err) {
        logger.error(err)
      }
    })
  }
  updateTable()
}

function updateTable () {
  for (let i = 0; i < node.length; i++) {
    node[i].status = 'Offline'
  }
  for (let i = 0; i < controller.nodes.length; i++) {
    logger.verbose(controller.nodes[i])
    var newNode = true
    if (node.length > 0) {
      for (let j = 0; j < node.length; j++) {
        if (controller.nodes[i].mac === node[j].mac) {
          newNode = false
          var report = controller.nodes[i].report.split(';')
          for (let r = 0; r < report.length; r++) {
            switch (report[r]) {
              case 'numOuts':
                var numOuts = report[r + 1]
                break
              case 'temp':
                var temp = report[r + 1]
                break
              case 'fps':
                var fps = report[r + 1]
                break
              case 'uUniPF':
                var uUniPF = report[r + 1]
                break
              default:
            }
          }
          node[j].uniUpdate = uUniPF
          node[j].Fps = fps
          node[j].temperature = temp
          node[j].status = 'Online'
        }
      }
    }
    if (newNode === true) {
      let tmp = controller.nodes[i].net << 8 + controller.nodes[i].subnet << 4
      // for (int i = )
      // let
      let portOutput = []
      for (let g = 0; g < controller.nodes[i].numOutputs; g++) {
        portOutput[g] = tmp + controller.nodes[i].universesOutput[g]
      }
      let report = controller.nodes[i].report.split(';')
      for (let r = 0; r < report.length; r++) {
        switch (report[r]) {
          case 'temp':
            var temp = report[r + 1]
            break
          case 'fps':
            var fps = report[r + 1]
            break
          default:
        }
      }
      let obj = {Fps: fps, uniUpdate: uUniPF, mac: controller.nodes[i].mac, name: controller.nodes[i].name, status: 'Online', version: controller.nodes[i].version, univers: portOutput, temperature: temp}
      node.push(obj)
    }
  }
  if (node.length <= 0) {
    logger.log('warn', JSON.stringify({numNodes: 0}))
  } else {
    logger.log('info', JSON.stringify({numNodes: node.length}))
    for (let i = 0; i < node.length; i++) {
      if (node[i].status === 'Offline') {
        logger.log('warn', JSON.stringify({offlineNodes: node[i].name}))
      }
    }
  }
  let jsonObj = JSON.stringify(node, null, '\t')
  fs.writeFile('./nodeList.json', jsonObj, (err) => {
    if (err) {
      logger.error(err)
    }
  })

  if (mode === 'live') {
    setTimeout(updateTable, 4050)

    drawTable()
  }
}

function drawTable () {
  var table = document.getElementById('node-table-content')
  table.innerHTML = ''
  if (node.length > 0) {
    for (var i = 0; i < node.length; i++) {
      if (node[i].mac !== undefined) {
        // let rowCount = table.rows.length
        let row = table.insertRow(-1)
        let j = 0
        if (node[i].status === 'Online') {
          row.insertCell(j++).innerHTML = '<span class="label label-primary col-md-1">' + node[i].status + '</span>'
        } else if (node[i].status === 'Offline') {
          row.insertCell(j++).innerHTML = '<span class="label label-danger col-md-1">' + node[i].status + '</span>'
        }
        row.insertCell(j++).innerHTML = node[i].name
        row.insertCell(j++).innerHTML = node[i].mac
        row.insertCell(j++).innerHTML = node[i].net << 8 + node[i].sub
        row.insertCell(j++).innerHTML = node[i].Fps
        row.insertCell(j++).innerHTML = node[i].uniUpdate
        row.insertCell(j++).innerHTML = node[i].temperature + ' C°'
        row.insertCell(j++).innerHTML = node[i].version

        if (mode === 'live') {
          row.insertCell(j++).innerHTML = '<button type="button" class="btn btn-default btn-xs" id="' + i + '" aria-label="Settings" > <span class="glyphicon glyphicon-cog" aria-hidden="true"> </span> </button>'
        }
      }
    }
  }
}
loadTable()
updateTable()
controller.refreshClients()
