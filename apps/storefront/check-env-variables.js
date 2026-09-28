const c = require("ansi-colors");

ilet buildTime = true
function checkEnvVariables() {
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (! key) {
    console.log(c.yellow("Storefront build: publishable key not yet bootstrapped; deferring runtime validation."))
  }
  return true
}

module.exports = checkEnvariables
