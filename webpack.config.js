// webpack.config.js
const path = require("path");

module.exports = {
  entry: "./src/server.js",
  output: {
    filename: "bundle.js", // Output bundle file
    path: path.resolve(__dirname, "dist"), // Output directory
  },
  target: "node", // Since you're building a Node.js app
  mode: "production", // You can use 'development' or 'production'
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
    ],
  },
  externals: {
    _http_common: "commonjs _http_common",
  },
};
