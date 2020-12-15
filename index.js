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

function waitForPortFree(port) {
  return new Promise(function (res) {
    const server = net.createServer(function (socket) {
      socket.pipe(socket);
    });

    server.listen(port, "127.0.0.1");
    server.on("error", function (e) {
      console.log("port in use...");
    });
    server.on("listening", function (e) {
      server.close();
      res(true);
    });
  });
}

function startProxyServer(port) {
  console.log("starting proxy server....");
  let server;
  try {
    server = http
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
          socket.write(
            "HTTP/1.1 200 Connection Established\r\n" +
              "Proxy-agent: Node-Proxy\r\n" +
              "\r\n"
          );
          srvSocket.on("error", (e) => {
            console.error("On Socket Error:", e);
          });
          // srvSocket.on("close", function () {
          //   onError();
          // });
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        }
      );
    });

    server.on("error", (e) => {
      console.error("On Server Error:", e);
    });
    server.on("close", () => {
      console.error("On Server Close.");
      onError();
    });

    async function onError(e) {
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
