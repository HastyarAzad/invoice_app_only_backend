
// const i18next = require("i18next");
// const middleware = require("i18next-http-middleware");

// // the code for webpack

// // Create a context for the 'locales' directory
// const localesContext = require.context('/locales', true, /.json$/);

// // Load the localization resources from the context
// const resources = localesContext.keys().reduce((resources, key) => {
//   // Remove the './' and '.json' parts of the key
//   const pathParts = key.slice(2, -5).split('/');
//   const lng = pathParts[0];
//   const ns = pathParts[1];

//   // Load the resource file
//   const resource = localesContext(key);

//   // Add the resource to the resources object
//   resources[lng] = { ...resources[lng], [ns]: resource };

//   return resources;
// }, {});

// i18next
//   .use(middleware.LanguageDetector)
//   .init({
//     detection: {
//       order: ["header"],
//       lookupHeader: "accept-language",
//     },
//     resources,
//     fallbackLng: "en",
//     preload: ["en", "ar","ku"],
//     supportedLngs: ["en", "ar","ku"],
//     lowerCaseLng: true,
//     cleanCode: true,
//   });

// module.exports = middleware.handle(i18next);

// the code for local file system

const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    detection: {
      order: ["header"],
      lookupHeader: "accept-language",
    },
    backend: {
      loadPath: "./locales/{{lng}}/translation.json",
    },
    // debug: true,
    fallbackLng: "en",
    preload: ["en", "ar","ku"],
    supportedLngs: ["en", "ar","ku"],
    lowerCaseLng: true,
    cleanCode: true,
  });

module.exports = middleware.handle(i18next);
