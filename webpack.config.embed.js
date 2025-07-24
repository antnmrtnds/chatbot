const path = require('path');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

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
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              "noEmit": false,
              "module": "esnext",
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
  plugins: [
    new WebpackManifestPlugin({
      fileName: 'manifest.json',
      publicPath: '/embed/',
    }),
  ],
}; 