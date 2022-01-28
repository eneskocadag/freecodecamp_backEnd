require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const validUrl = require('valid-url');
app.use(express.urlencoded({ extended: true }));
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret);
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
//Mongo Side
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
});
const Site = mongoose.model("Site", urlSchema);
let id = 1;
//Server Side
//Get Post
app.post("/api/shorturl", (req, res) => {
  let yuerel = req.body.url;
  if(!validUrl.isWebUri(yuerel)){
    res.json({error: 'invalid url'});
  }else{
  Site.findOne({ original_url: yuerel }).exec((err, data) => {
    if (!err && data != undefined) res.json(data);
    else {
      let yeni = Site({
        original_url:yuerel,
        short_url:id,
      })
      id++;
      yeni.save((error,savedData)=>{
          if(!error && savedData != undefined) res.json(savedData);
          else res.send("Kayıt yapılamadı")
      })
    }
  })
  }
});
//Get Side
app.get("/api/shorturl/:number", (req, response) => {
  let deger = req.params.number;
  Site.findOne({ short_url: deger }).exec((err, data) => {
    if (!err && data != undefined) {
      response.redirect(data.original_url);
    }
    else { response.send("URL Not Found!") };
  })
})

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
