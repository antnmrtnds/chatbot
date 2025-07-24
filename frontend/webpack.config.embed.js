const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/embed.ts',
  output: {
    path: path.resolve(__dirname, 'public/embed'),
    filename: 'viriato-chatbot.js',
    library: 'ViriatoChatbot',
    libraryTarget: 'umd',
    publicPath: '/embed/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            compilerOptions: {
              "noEmit": false,
              "jsx": "react-jsx"
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [],
};
