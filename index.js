const http = require("http");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer({});
const PORT = 3000;

function startServer(port) {
  try {
    http
      .createServer(function (req, res) {
        console.log("headers:", req.headers);
        console.log("url:", req.url);
        proxy.web(req, res, { target: req.url });
      })
      .listen(port);
  } catch (e) {
    console.log("Error:", e);
    startServer(port);
  }
}

startServer(PORT);
