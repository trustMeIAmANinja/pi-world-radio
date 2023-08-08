
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

const fastify = require('fastify')({logger: true})
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const fastifyStatic = require('@fastify/static')
const sqlite3 = require("sqlite3").verbose();
const Gpio = require('onoff').Gpio;

// GPIO Pin used to trigger the relay
const trigger = new Gpio(6, 'high');

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

fastify.get("/channels/:locationId", function (request, reply) {
  var locationId = request.params.locationId;
  var url = `https://radio.garden/api/ara/content/page/${locationId}/channels`;
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      //console.log("hello");
      let channelIds = [];
      json.data.content[0].items.forEach(function (item) {
        channelIds.push(item.href.split("/").splice(-1)[0]);
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
            let channelId = item.href.split("/").splice(-1)[0]
            if (channelIdLookup.has(channelId)) {
              item.is_favorite = 1;
            } else {
              item.is_favorite = 0;
            }
          })
          reply.send(json);
        }
      });
    });
});

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
        reply.send({ message: "error!" });
      } else {
        reply.send({ message: "success" });
      }
    }
  );

});

fastify.get("/favorites", function (request, reply) {
  db.all("SELECT * from Favorites", (err, rows) => {
    reply.send(JSON.stringify(rows));
  });
});

fastify.get("/favorite/:channelId", function (request, reply) {
  db.all(
    "SELECT * from Favorites where channelId=?",
    request.params.channelId,
    (err, rows) => {
      reply.send(JSON.stringify(rows));
    }
  );
});


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

fastify.post("/displayToggle", function (request, reply) {
  trigger.writeSync(trigger.readSync() ^ 1);
  reply.send({ message: "success" });
});


// Run the server and report out to the logs
fastify.listen({port: 3000, host: "0.0.0.0"}, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`App is listening on ${address}`);
});
