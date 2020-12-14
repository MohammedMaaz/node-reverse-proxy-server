const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");
const url = require("url");
const proxy = httpProxy.createServer();
const PORT = 3000;

function startProxyServer(port) {
  console.log("starting proxy server....");
  let server;
  try {
    server = http
      .createServer(function (req, res) {
        console.log("Receiving reverse proxy request for:" + req.url);
        const parsedUrl = url.parse(req.url);
        const target = parsedUrl.protocol + "//" + parsedUrl.hostname;
        proxy.web(req, res, { target, secure: false });
      })
      .listen(port);

    server.on("connect", function (req, socket) {
      console.log("Receiving reverse proxy request for:" + req.url);
      const serverUrl = url.parse("https://" + req.url);
      const srvSocket = net.connect(
        serverUrl.port,
        serverUrl.hostname,
        function () {
          socket.write(
            "HTTP/1.1 200 Connection Established\r\n" +
              "Proxy-agent: Node-Proxy\r\n" +
              "\r\n"
          );
          srvSocket.on("error", (e) => {
            console.error("On Socket Error:", e);
          });
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        }
      );
      srvSocket.on("close", () => {
        console.log("Closing unexpectedly!\nAttempting to restart....");
        onError("error");
      });
    });

    server.on("error", (e) => {
      console.error("On Server Error:", e);
    });
    server.on("close", () => {
      console.error("On Server Close.");
    });

    function onError(e) {
      setTimeout(() => startProxyServer(port), 5000);
    }
  } catch (e) {
    onError(e);
  }
}

startProxyServer(PORT);
