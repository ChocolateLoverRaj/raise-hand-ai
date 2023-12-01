const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')

const dist = path.resolve(__dirname, "dist");

module.exports = {
  mode: process.env.NODE_ENV = 'production' ? 'production' : 'development',
  experiments: {
    asyncWebAssembly: true,
  },
  entry: {
    index: "./js/index",
  },
  output: {
    path: dist,
    filename: "[name].js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html"
    }),
    new WasmPackPlugin({
      crateDirectory: __dirname,
    }),
    new CopyPlugin({
      patterns: [{
        from: "node_modules/@mediapipe/pose",
        to: "_node_modules/@mediapipe/pose"
      }]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.?jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
    ]
  },
};
