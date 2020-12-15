const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");
const url = require("url");
const proxy = httpProxy.createServer();
const PORT = 3000;

function isValidURL(url) {
  return /(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,63}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?/g.test(
    url
  );
}

function isPortFree(port) {
  return new Promise(function (res) {
    const server = net.createServer(function (socket) {
      socket.pipe(socket);
    });

    server.listen(port, "127.0.0.1");
    server.on("error", function (e) {
      res(false);
    });
    server.on("listening", function (e) {
      server.close();
      res(true);
    });
  });
}

function startProxyServer(port) {
  try {
    console.log("starting proxy server....");

    process.on("uncaughtException", function (err) {
      onError(err);
    });
    process.on("unhandledRejection", function (err) {
      onError(err);
    });

    let server = http
      .createServer(function (req, res) {
        console.log("Receiving reverse proxy request for:" + req.url);
        if (!isValidURL(req.url)) {
          console.log("invalid url");
          res.end();
          return;
        }
        const parsedUrl = url.parse(req.url);
        const target = parsedUrl.protocol + "//" + parsedUrl.hostname;
        proxy.web(req, res, { target, secure: false });
      })
      .listen(port);

    server.on("error", (e) => {
      onError(e);
    });

    server.on("connect", function (req, socket) {
      console.log("Receiving reverse proxy request for:" + req.url);
      if (!isValidURL(req.url)) {
        console.log("invalid url");
        return;
      }

      const serverUrl = url.parse("https://" + req.url);
      const srvSocket = net.connect(
        serverUrl.port,
        serverUrl.hostname,
        function () {
          srvSocket.on("error", (e) => {
            onError(e);
          });
          socket.on("error", function (e) {
            onError(e);
          });
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

    server.on("close", () => {
      onError("server closed");
    });

    async function onError(e) {
      console.log("On Error:", e);
      const isFree = await isPortFree(port);
      if (isFree) {
        console.log("Server closed unexpectedly!\nAttempting to restart....");
        server.close();
        startProxyServer(port);
      }
    }
  } catch (e) {
    onError(e);
  }
}

startProxyServer(PORT);
