
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

const fastify = require('fastify')({logger: true})
const path = require("path");
const exec = require('child_process').exec;
const fetch = require("node-fetch");
const fs = require("fs");
const fastifyStatic = require('@fastify/static')
const os = require('os');
const osUtils = require('os-utils');
const { measureCPU } = require('rpi_measure_temp')
const spawn = require('child_process').spawn;
const sqlite3 = require("sqlite3").verbose();
const Gpio = require('onoff').Gpio;

// GPIO Pin used to trigger the relay
const trigger = new Gpio(14, 'low');

// init sqlite db
const dbFile = "./data/sqlite.db";
const exists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

// Create Table SQL
const createTableSql = `CREATE TABLE IF NOT EXISTS Favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelId TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  UNIQUE (channelId));`;

// if ./data/sqlite.db does not exist, create it
db.serialize(() => {
  if (!exists) {
    db.run(createTableSql);
    console.log("New table Dreams created!");
  } else {
    console.log('Database "Favorites" ready to go!');
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function (string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Setup our static files
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// GET: Get the list of channels for given location
//      Also query the favorites table and mark any channels in the 
//      the list that are alo in favorites
fastify.get("/channels/:locationId", function (request, reply) {
  var locationId = request.params.locationId;
  // var url = `https://radio.garden/api/ara/content/page/${locationId}/channels`;
  var url = `https://radio.garden/api/ara/content/secure/page/${locationId}/channels`
  headers = {
  'Referer': 'https://radio.garden',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  }
  fetch(url, {headers: headers})
    .then((res) => res.json())
    .then((json) => {
      let channelIds = [];
      json.data.content[0].items.forEach(function (item) {
        channelIds.push(item.page.url.split("/").splice(-1)[0]);
      });
      let dbRows = [];

      const sql = `
        SELECT channelId FROM Favorites
        WHERE
        channelId IN (${new Array(channelIds.length).fill('?').join(',')})`;

      db.all(sql, channelIds, (error, rows) => {
        if (error) {
          console.log("DB Select Failed");
          console.log(error);
        } else {
          // console.log(rows);
          let channelIdLookup = new Set();
          rows.forEach(function (row) { channelIdLookup.add(row.channelId)});

          json.data.content[0].items.forEach(function (item) {
            let channelId = item.page.url.split("/").splice(-1)[0]
            if (channelIdLookup.has(channelId)) {
              item.page.is_favorite = 1;
            } else {
              item.page.is_favorite = 0;
            }
          })
          reply.send(json);
        }
      });
    });
});

// POST: Add a channel to favorites
fastify.post("/addfavorite", function (request, reply) {
  //console.log(request.body);
  var data = request.body;
  var channelId = cleanseString(data.channelId);
  var title = cleanseString(data.title);
  var location = cleanseString(data.location);
  var lat = data.lat;
  var lng = data.lng;

  db.run(
    `INSERT INTO Favorites (channelId, title, location, lng, lat) VALUES (?, ?, ?, ?, ?)`,
    channelId,
    title,
    location,
    lng,
    lat,
    (error) => {
      if (error) {
        console.log(error);
        reply.send({ message: "error!" });
      } else {
        reply.send({ message: "success" });
      }
    }
  );

});

// GET: Get the list of favorite channels
fastify.get("/favorites", function (request, reply) {
  db.all("SELECT * from Favorites", (err, rows) => {
    reply.send(JSON.stringify(rows));
  });
});

// GET: Get the details for the favorite channel
fastify.get("/favorite/:channelId", function (request, reply) {
  db.all(
    "SELECT * from Favorites where channelId=?",
    request.params.channelId,
    (err, rows) => {
      reply.send(JSON.stringify(rows));
    }
  );
});

// DELETE: Delete channelId from favorites list
fastify.delete("/favorite/:channelId", function (request, reply) {
  db.run(
    `DELETE from Favorites where channelId=?`,
    request.params.channelId,
    (error) => {
      if (error) {
        reply.send({ message: "error!" });
      } else {
        reply.send({ message: "success" });
      }
    }
  );
});

// GET: Return HTTP 200 if the external URL is reachable else return 500
fastify.get("/checkOnline", function (request, reply) { 
  var url = `http://gstatic.com/generate_204`;
  fetch(url).then(res => {
      reply.code(res.status);
      reply.send();
    }).catch(error => {
      console.log("Fetch Error");
      console.log(error);
      reply.code(500);
      reply.send();
    });
});

// POST: Toggle the state of the GPIO pin for the relay
fastify.post("/displayToggle", function (request, reply) {
  trigger.writeSync(trigger.readSync() ^ 1);
  reply.send({ message: "success", displayState: trigger.readSync() ^ 1});
});

// POST: Set the GPIO pin for the relay to LOW
fastify.post("/displayOn", function (request, reply) {
  trigger.writeSync(0);
  reply.send({ message: "success", displayState: trigger.readSync() ^ 1});
});

// POST: Set the GPIO pin for the relay to HIGH
fastify.post("/displayOff", function (request, reply) {
  trigger.writeSync(1);
  reply.send({ message: "success", displayState: trigger.readSync() ^ 1});
});

// POST: Restart host
fastify.post("/restart", function (request, reply) {
  exec('/bin/sudo /sbin/shutdown -r now', function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
});

// POST: shutdown host
fastify.post("/shutdown", function (request, reply) {
  exec('/bin/sudo /sbin/shutdown now', function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
});

// GET: System Info
fastify.get("/systemInfo", function (request, reply) {
  const nets = os.networkInterfaces();
  const results = Object.create(null);
  const netInfo = Object.create(null);
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
        if (!netInfo[name]) {
           netInfo[name] = "";
        }
        netInfo[name] = net.address;
      }
    }
  }
  results['netInfo'] = netInfo
  // collect system info
  const sysInfo = Object.create(null);
  results['sysInfo'] = sysInfo
  sysInfo['CPU Load'] = osUtils.loadavg(1);

  (async () => {
    data =  await measureCPU();
    sysInfo['CPU Temp'] = `${Math.round(data['celsius'])} &deg;C`;
    reply.send(JSON.stringify(results));
  })();
});

// Run the server and report out to the logs
fastify.listen({port: 8001, host: "0.0.0.0"}, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`App is listening on ${address}`);
});
