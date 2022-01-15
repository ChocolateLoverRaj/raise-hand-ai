import { join } from 'path'
import { Configuration, ProvidePlugin } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import 'webpack-dev-server'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'

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
            ? [require.resolve('react-refresh/babel')]
            : []
        ],
        presets: ['@babel/preset-react', '@babel/preset-typescript']
      }
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
    ...mode === 'development'
      ? [new ReactRefreshWebpackPlugin()]
      : []
  ],
  devServer: {
    client: {
      progress: true
    },
    hot: true
  }
}

export = config
