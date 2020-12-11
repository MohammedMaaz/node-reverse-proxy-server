const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");
const url = require("url");
const proxy = httpProxy.createServer();
const PORT = 3000;

function startProxyServer(port) {
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
            onError(e);
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
      console.error("On Error:", e);
      onError(e);
    });
    server.on("close", () => {
      console.error("On Close:");
      onError("error");
    });

    function onError(e) {
      console.error("Unhandled Error:", e);
      console.log("Restarting server...");
      setTimeout(() => startProxyServer(port), 8000);
    }
  } catch (e) {
    onError(e);
  }
}

startProxyServer(PORT);
