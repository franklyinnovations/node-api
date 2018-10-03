let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
let device = require('express-device');
let fs = require('fs');

let app = express();

app.use('/public', express.static('public'));

global.pateast_app = app;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());

global.image_url = 'http://192.168.100.179:6016/';

app.locals.site = {
  page: 10
};

require('express-load-routes')(app);

app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  // console.log(err, req.url, req.body);
  if (err.status === 404) {
    res.send({status:false, error: true, error_description: 'Not found', url: true});
  } else {
    res.send({status:false, error: true, error_description: 'Internal Error', url: true});
  }
});

tmpDir = '/tmp/pateast-virender/';

try {
  fs.accessSync('public/uploads');
} catch(err) {
  fs.mkdirSync('public/uploads');
}

try {
  fs.accessSync(tmpDir);
} catch(err) {
  fs.mkdirSync(tmpDir);
}

module.exports = app;
