// const http = require("http");
// const httpProxy = require("http-proxy");

// const proxy = httpProxy.createProxyServer({
//   secure: false,
//   changeOrigin: true,
// });
// const PORT = 3000;

// function startServer(port) {
//   try {
//     http
//       .createServer(function (req, res) {
//         console.log("headers:", req.headers);
//         const url = req.url;
//         console.log("url:", url);
//         proxy.web(
//           req,
//           res,
//           { target: url, autoRewrite: true, followRedirects: true },
//           console.log
//         );
//       })
//       .listen(port);
//     console.log("Starting Proxy Server");
//   } catch (e) {
//     console.log("Error:", e);
//     startServer(port);
//   }
// }

// startServer(PORT);

var http = require("http"),
  net = require("net"),
  httpProxy = require("http-proxy");
(url = require("url")), (util = require("util"));
var proxy = httpProxy.createServer();
var server = http
  .createServer(function (req, res) {
    util.puts("Receiving reverse proxy request for:" + req.url);
    var parsedUrl = url.parse(req.url);
    var target = parsedUrl.protocol + "//" + parsedUrl.hostname;
    proxy.web(req, res, { target: target, secure: false });
  })
  .listen(8213);
server.on("connect", function (req, socket) {
  util.puts("Receiving reverse proxy request for:" + req.url);
  var serverUrl = url.parse("https://" + req.url);
  var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
    socket.write(
      "HTTP/1.1 200 Connection Established\r\n" +
        "Proxy-agent: Node-Proxy\r\n" +
        "\r\n"
    );
    srvSocket.pipe(socket);
    socket.pipe(srvSocket);
  });
});
