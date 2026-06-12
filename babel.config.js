module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Required for path aliases (@/ → src/)
        [
          'module-resolver',
          {
            root:   ['./'],
            alias:  { '@': './src' },
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
          },
        ],
        // Reanimated MUST be last
        'react-native-reanimated/plugin',
      ],
    };
  };