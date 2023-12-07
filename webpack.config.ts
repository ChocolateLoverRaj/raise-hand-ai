import { join } from 'path'
import { Configuration, ProvidePlugin } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import 'webpack-dev-server'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import CopyPlugin from "copy-webpack-plugin"

const mode: Configuration['mode'] = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const config: Configuration = {
  mode,
  entry: join(__dirname, './src/index'),
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'babel-loader',
      options: {
        plugins: [
          'react-require',
          ...mode === 'development'
            ? [/* require.resolve('react-refresh/babel') */]
            : []
        ],
        presets: ['@babel/preset-react', '@babel/preset-typescript']
      }
    }, {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.svg$/i,
      type: 'asset'
    }]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      assert: require.resolve('assert-browserify')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new ProvidePlugin({
      process: 'process/browser'
    }),
    new CopyPlugin({
      patterns: [{
        from: "node_modules/@mediapipe/pose",
        to: "_node_modules/@mediapipe/pose"
      }]
    }),
    ...mode === 'development'
      ? [/* new ReactRefreshWebpackPlugin() */]
      : []
  ],
  devServer: {
    client: {
      progress: true
    },
    hot: true
  }
}

export default config
