require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const dns = require("dns");
const { URL } = require("url");

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("urlshortener");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/public", express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: true }));
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(new URL(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url: req.body.url,
        short_url: urlCount,
      };
      const result = await urls.insertOne(urlDoc);
      res.json({ original_url: req.body.url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:input", async (req, res) => {
  let input = req.params.input;
  const urlDoc = await urls.findOne({ short_url: +input });
  res.redirect(urlDoc.url);
});
