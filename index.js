// const http = require("http");
// const net = require("net");
// const httpProxy = require("http-proxy");
// const url = require("url");
// const proxy = httpProxy.createServer();
// const PORT = 3000;

function isValidURL(url) {
  return /(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,63}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?/g.test(
    url
  );
}

// function waitForFreePort(port) {
//   return new Promise(function (res) {
//     const server = net.createServer(function (socket) {
//       socket.pipe(socket);
//     });

//     server.listen(port, "127.0.0.1");
//     server.on("error", function (e) {
//       console.log("in use...");
//     });
//     server.on("listening", function (e) {
//       server.close();
//       res(true);
//     });
//   });
// }

// function startProxyServer(port) {
//   console.log("starting proxy server....");
//   let server;
//   try {
//     server = http
//       .createServer(function (req, res) {
//         console.log("Receiving reverse proxy request for:" + req.url);
//         if (!isValidURL(req.url)) {
//           console.log("invalid url");
//           res.end();
//           return;
//         }
//         const parsedUrl = url.parse(req.url);
//         const target = parsedUrl.protocol + "//" + parsedUrl.hostname;
//         proxy.web(req, res, { target, secure: false });
//       })
//       .listen(port);

//     server.on("connect", function (req, socket) {
//       console.log("Receiving reverse proxy request for:" + req.url);
//       if (!isValidURL(req.url)) {
//         console.log("invalid url");
//         return;
//       }
//       const serverUrl = url.parse("https://" + req.url);
//       const srvSocket = net.connect(
//         serverUrl.port,
//         serverUrl.hostname,
//         function () {
//           socket.write(
//             "HTTP/1.1 200 Connection Established\r\n" +
//               "Proxy-agent: Node-Proxy\r\n" +
//               "\r\n"
//           );
//           srvSocket.on("error", (e) => {
//             console.error("On Socket Error:", e);
//           });
//           srvSocket.pipe(socket);
//           socket.pipe(srvSocket);
//         }
//       );
//       srvSocket.on("close", () => {
//         console.log("Closing unexpectedly!\nAttempting to restart....");
//         onError("error");
//       });
//     });

//     server.on("error", (e) => {
//       console.error("On Server Error:", e);
//     });
//     server.on("close", () => {
//       console.error("On Server Close.");
//     });

//     async function onError(e) {
//       server.close();
//       await waitForFreePort(port);
//       console.log("port gets free!");
//       startProxyServer(port);
//     }
//   } catch (e) {
//     onError(e);
//   }
// }

// startProxyServer(PORT);

const http = require("http");
const net = require("net");
const { URL } = require("url");

function startProxyServer(port, host) {
  const proxy = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("okay");
  });

  proxy.on("connect", (req, clientSocket, head) => {
    // Connect to an origin server
    const url = `http://${req.url}`;
    console.log("Connecting To:", url);
    if (!isValidURL(url)) {
      console.log("invalid URL, returning...");
      return;
    }
    const { port, hostname } = new URL(url);
    const serverSocket = net.connect(port || 80, hostname, () => {
      clientSocket.write(
        "HTTP/1.1 200 Connection Established\r\n" +
          "Proxy-agent: Node.js-Proxy\r\n" +
          "\r\n"
      );
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });
  });

  proxy.listen(port, host, function () {
    console.log(`Starting Proxy server on ${host}:${port}`);
  });
}

startProxyServer(3000);
