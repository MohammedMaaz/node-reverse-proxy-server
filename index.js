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
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        }
      );
    });

    server.on("error", console.error);
    server.on("close", () => console.log("Closing server...."));
  } catch (e) {
    console.error("Unhandled Error:", e);
    console.log("Restarting server...");
    try {
      server && server.close();
    } catch (error) {
      console.error("Unable to close server! Restarting anyway...");
    }
    startProxyServer(port);
  }
}

startProxyServer(PORT);
