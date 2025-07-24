const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    // Explicitly name the output bundle
    'viriato-chatbot': './src/embed.ts',
  },
  output: {
    path: path.resolve(__dirname, 'public/embed'),
    // Use the [name] placeholder to create 'viriato-chatbot.js'
    filename: '[name].js',
    // Clean the output directory before each build
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: './tsconfig.json',
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          configFile: 'tsconfig.json',
          compilerOptions: {
            noEmit: false,
            jsx: 'react-jsx',
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
};
