// var https = require('https');
// var fs = require('fs');
// 
// const next = require('next')
// const port = 5000
// const dev = process.env.NODE_ENV !== 'production'
// const app = next({ dev, dir: __dirname })
// const handle = app.getRequestHandler()
// 
// 
// var options = {
//     key: fs.readFileSync('keys/localhost.key'),
//     cert: fs.readFileSync('keys/localhost.crt'),
//     ca: [fs.readFileSync('keys/localhost.crs')]
// };
// 
// app.prepare().then(() => {
//     https.createServer(options, (req, res) => {
//         handle ....
//     }).listen(port, err => {
//         if (err) throw err
//         console.log(`> Ready on localhost:${port}`)
//     })
// })


const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const httpsOptions = {
  key: fs.readFileSync("./keys/192.168.254.252.key"),
  cert: fs.readFileSync("./keys/192.168.254.252.crt"),
};
app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(5000, (err) => {
    if (err) throw err;
    console.log("> Server started on https://localhost:5000");
  });
});
