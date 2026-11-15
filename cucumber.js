// cucumber.js
// Configuration de Cucumber.js : où sont les scénarios, le code des étapes, et les rapports.
const configuration = {
  paths: ["features/**/*.feature"],
  import: ["features/support/**/*.js", "features/step_definitions/**/*.js"],
  format: ["progress-bar", "summary", "html:rapports/cucumber.html"],
  formatOptions: { snippetInterface: "async-await" },
};

export default configuration;
